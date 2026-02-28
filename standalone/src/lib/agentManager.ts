import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { randomUUID } from 'crypto'
import { execSync } from 'child_process'
import type { AgentState } from './types'
import { broadcast } from './wsManager'
import { cancelWaitingTimer, cancelPermissionTimer } from './timerManager'
import { startFileWatching, readNewLines, ensureProjectScan } from './fileWatcher'
import { JSONL_POLL_INTERVAL_MS } from './constants'
import { createPtySession, killPty } from './ptyManager'
import type { PtyLaunchOptions } from './ptyManager'

// ── Module-level shared state ───────────────────────────────────────────

export const agents = new Map<number, AgentState>()
export const knownJsonlFiles = new Set<string>()
export const fileWatchers = new Map<number, fs.FSWatcher>()
export const pollingTimers = new Map<number, ReturnType<typeof setInterval>>()
export const waitingTimers = new Map<number, ReturnType<typeof setTimeout>>()
export const permissionTimers = new Map<number, ReturnType<typeof setTimeout>>()
export const jsonlPollTimers = new Map<number, ReturnType<typeof setInterval>>()

export const nextAgentIdRef: { current: number } = { current: 1 }
export const nextTerminalIndexRef: { current: number } = { current: 1 }
export const activeAgentIdRef: { current: number | null } = { current: null }
export const projectScanTimerRef: { current: ReturnType<typeof setInterval> | null } = { current: null }

/** Agent metadata (palette, hueShift, seatId) — keyed by agentId as string */
export const agentMeta = new Map<string, { palette?: number; hueShift?: number; seatId?: string }>()

// ── Helpers ─────────────────────────────────────────────────────────────

export function getProjectDirPath(cwd: string): string | null {
  if (!cwd) return null
  const dirName = cwd.replace(/[:\\/]/g, '-')
  return path.join(os.homedir(), '.claude', 'projects', dirName)
}

function persistAgents(): void {
  // No-op in standalone (agents are transient, no workspaceState)
}

// ── Agent lifecycle ─────────────────────────────────────────────────────

export interface LaunchOptions {
  cwd?: string
  continueSession?: boolean
}

function findMostRecentJsonl(projectDir: string, excludeFiles: Set<string>): { filePath: string; size: number } | null {
  try {
    const files = fs.readdirSync(projectDir)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => {
        const fp = path.join(projectDir, f)
        const stat = fs.statSync(fp)
        return { filePath: fp, mtime: stat.mtimeMs, size: stat.size }
      })
      .filter(f => !excludeFiles.has(f.filePath))
      .sort((a, b) => b.mtime - a.mtime)
    return files[0] ?? null
  } catch {
    return null
  }
}

export function launchNewAgent(defaultCwd: string, options?: LaunchOptions): void {
  const idx = nextTerminalIndexRef.current++
  const cwd = options?.cwd || defaultCwd

  const projectDir = getProjectDirPath(cwd)
  if (!projectDir) {
    console.log('[Pixel Agents] No project dir, cannot track agent')
    return
  }

  // Collect already-tracked JSONL files so --continue doesn't pick one in use
  const trackedFiles = new Set<string>()
  for (const a of agents.values()) trackedFiles.add(a.jsonlFile)

  let expectedFile: string
  let initialOffset = 0
  let sessionId: string
  let ptyOpts: PtyLaunchOptions | undefined

  if (options?.continueSession) {
    const recent = findMostRecentJsonl(projectDir, trackedFiles)
    if (recent) {
      // Continue the most recent session — watch from end of existing file
      sessionId = path.basename(recent.filePath, '.jsonl')
      expectedFile = recent.filePath
      initialOffset = recent.size
      ptyOpts = { continueSession: true }
      console.log(`[Pixel Agents] Continuing session ${sessionId} (offset=${initialOffset})`)
    } else {
      // Nothing to continue — fall back to new session
      sessionId = randomUUID()
      expectedFile = path.join(projectDir, `${sessionId}.jsonl`)
      console.log(`[Pixel Agents] No existing session to continue, starting new: ${sessionId}`)
    }
  } else {
    sessionId = randomUUID()
    expectedFile = path.join(projectDir, `${sessionId}.jsonl`)
  }

  // Pre-register expected JSONL file so project scan won't treat it as a /clear file
  knownJsonlFiles.add(expectedFile)

  // Create agent immediately (before JSONL file exists)
  const id = nextAgentIdRef.current++

  // Spawn Claude in a PTY for interactive browser terminal
  const ptyResult = createPtySession(id, cwd, sessionId, ptyOpts)

  const agent: AgentState = {
    id,
    proc: null,
    projectDir,
    cwd,
    jsonlFile: expectedFile,
    fileOffset: initialOffset,
    lineBuffer: '',
    activeToolIds: new Set(),
    activeToolStatuses: new Map(),
    activeToolNames: new Map(),
    activeSubagentToolIds: new Map(),
    activeSubagentToolNames: new Map(),
    isWaiting: false,
    permissionSent: false,
    hadToolsInTurn: false,
    lastAssistantText: '',
    hasPty: ptyResult !== null,
  }

  agents.set(id, agent)
  activeAgentIdRef.current = id
  console.log(`[Pixel Agents] Agent ${id}: created (terminal #${idx}, session=${sessionId}, continue=${!!options?.continueSession})`)
  broadcast({ type: 'agentCreated', id, hasPty: ptyResult !== null })

  ensureProjectScan(
    projectDir, knownJsonlFiles, projectScanTimerRef, activeAgentIdRef,
    nextAgentIdRef, agents, fileWatchers, pollingTimers, waitingTimers, permissionTimers,
    persistAgents,
  )

  // For --continue with an existing file, start watching immediately
  if (options?.continueSession && fs.existsSync(expectedFile)) {
    startFileWatching(id, expectedFile, agents, fileWatchers, pollingTimers, waitingTimers, permissionTimers)
  } else {
    // Poll for the specific JSONL file to appear
    const pollTimer = setInterval(() => {
      try {
        if (fs.existsSync(agent.jsonlFile)) {
          console.log(`[Pixel Agents] Agent ${id}: found JSONL file ${path.basename(agent.jsonlFile)}`)
          clearInterval(pollTimer)
          jsonlPollTimers.delete(id)
          startFileWatching(id, agent.jsonlFile, agents, fileWatchers, pollingTimers, waitingTimers, permissionTimers)
          readNewLines(id, agents, waitingTimers, permissionTimers)
        }
      } catch { /* file may not exist yet */ }
    }, JSONL_POLL_INTERVAL_MS)
    jsonlPollTimers.set(id, pollTimer)
  }
}

export function removeAgent(agentId: number): void {
  const agent = agents.get(agentId)
  if (!agent) return

  // Stop JSONL poll timer
  const jpTimer = jsonlPollTimers.get(agentId)
  if (jpTimer) { clearInterval(jpTimer) }
  jsonlPollTimers.delete(agentId)

  // Stop file watching
  fileWatchers.get(agentId)?.close()
  fileWatchers.delete(agentId)
  const pt = pollingTimers.get(agentId)
  if (pt) { clearInterval(pt) }
  pollingTimers.delete(agentId)

  // Cancel timers
  cancelWaitingTimer(agentId, waitingTimers)
  cancelPermissionTimer(agentId, permissionTimers)

  // Remove from maps
  agents.delete(agentId)

  // Update active agent if needed
  if (activeAgentIdRef.current === agentId) {
    activeAgentIdRef.current = null
  }
}

export function closeAgent(agentId: number): void {
  const agent = agents.get(agentId)
  if (!agent) return

  // Kill PTY if this agent has one
  if (agent.hasPty) {
    killPty(agentId)
  }

  removeAgent(agentId)
  broadcast({ type: 'agentClosed', id: agentId })
}

// ── Broadcasting ────────────────────────────────────────────────────────

export function sendExistingAgents(): void {
  const agentIds: number[] = []
  for (const id of agents.keys()) {
    agentIds.push(id)
  }
  agentIds.sort((a, b) => a - b)

  // Convert agentMeta Map to plain object for JSON serialization
  const metaObj: Record<string, { palette?: number; hueShift?: number; seatId?: string }> = {}
  for (const [key, value] of agentMeta) {
    metaObj[key] = value
  }

  console.log(`[Pixel Agents] sendExistingAgents: agents=${JSON.stringify(agentIds)}, meta=${JSON.stringify(metaObj)}`)

  broadcast({
    type: 'existingAgents',
    agents: agentIds,
    agentMeta: metaObj,
  })

  sendCurrentAgentStatuses()
}

export function sendCurrentAgentStatuses(): void {
  for (const [agentId, agent] of agents) {
    // Re-send active tools
    for (const [toolId, status] of agent.activeToolStatuses) {
      broadcast({
        type: 'agentToolStart',
        id: agentId,
        toolId,
        status,
      })
    }
    // Re-send waiting status
    if (agent.isWaiting) {
      broadcast({
        type: 'agentStatus',
        id: agentId,
        status: 'waiting',
      })
    }
  }
}

export function focusAgent(agentId: number): void {
  if (agents.has(agentId)) {
    activeAgentIdRef.current = agentId
  }
}

export function saveAgentSeats(
  seatData: Record<string, { palette?: number; hueShift?: number; seatId?: string }>,
): void {
  for (const [key, value] of Object.entries(seatData)) {
    agentMeta.set(key, value)
  }
}

// ── Cleanup ─────────────────────────────────────────────────────────────

// ── Adopt external Claude sessions ──────────────────────────────────

function getClaudePids(): number[] {
  try {
    const output = execSync('ps -eo pid,args', { encoding: 'utf-8', timeout: 5000 })
    const pids: number[] = []
    for (const line of output.split('\n')) {
      const m = line.match(/^\s*(\d+)\s+claude(\s|$)/)
      if (m) pids.push(parseInt(m[1]))
    }
    return pids
  } catch {
    return []
  }
}

function getProcessCwd(pid: number): string | null {
  try {
    const output = execSync(`lsof -p ${pid} -a -d cwd -Fn 2>/dev/null`, {
      encoding: 'utf-8',
      timeout: 3000,
    })
    const nLine = output.split('\n').find(l => l.startsWith('n'))
    return nLine ? nLine.slice(1) : null
  } catch {
    return null
  }
}

export function adoptExternalSessions(): void {
  if (process.platform === 'win32') return

  const claudePids = getClaudePids()
  if (claudePids.length === 0) return

  // Group PIDs by project dir (computed from each process's cwd)
  // Also track cwd per projectDir so we can spawn PTYs in the right place
  const projectCounts = new Map<string, number>()
  const projectCwds = new Map<string, string>()
  for (const pid of claudePids) {
    const cwd = getProcessCwd(pid)
    if (!cwd) continue
    const dirName = cwd.replace(/[:\\/]/g, '-')
    const projectDir = path.join(os.homedir(), '.claude', 'projects', dirName)
    projectCounts.set(projectDir, (projectCounts.get(projectDir) || 0) + 1)
    projectCwds.set(projectDir, cwd)
  }

  if (projectCounts.size === 0) return

  // Collect already-tracked JSONL files
  const alreadyTracked = new Set<string>()
  for (const a of agents.values()) alreadyTracked.add(a.jsonlFile)

  for (const [projectDir, count] of projectCounts) {
    const cwd = projectCwds.get(projectDir)!

    // List JSONL files sorted by mtime (most recent first)
    let files: Array<{ file: string; mtime: number }>
    try {
      files = fs.readdirSync(projectDir)
        .filter(f => f.endsWith('.jsonl'))
        .map(f => {
          const fp = path.join(projectDir, f)
          const stat = fs.statSync(fp)
          return { file: fp, mtime: stat.mtimeMs }
        })
        .sort((a, b) => b.mtime - a.mtime)
    } catch { continue }

    // Adopt up to `count` untracked files (1 per running Claude process)
    // Skip files that only contain non-conversation records (e.g. file-history-snapshot)
    const untracked = files.filter(f => {
      if (alreadyTracked.has(f.file) || knownJsonlFiles.has(f.file)) return false
      try {
        const content = fs.readFileSync(f.file, 'utf-8')
        const hasConversation = content.split('\n').some(line => {
          if (!line.trim()) return false
          try {
            const rec = JSON.parse(line)
            return rec.type === 'user' || rec.type === 'assistant'
          } catch { return false }
        })
        return hasConversation
      } catch { return false }
    })
    const toAdopt = untracked.slice(0, count)

    for (const { file } of toAdopt) {
      const stat = fs.statSync(file)
      const id = nextAgentIdRef.current++

      // Extract session ID from filename (e.g. "abc123.jsonl" -> "abc123")
      const sessionId = path.basename(file, '.jsonl')

      // Resume the session with a PTY so it's interactive from the browser
      const ptyResult = createPtySession(id, cwd, sessionId, { resumeSession: true })

      const agent: AgentState = {
        id,
        proc: null,
        projectDir,
        cwd,
        jsonlFile: file,
        fileOffset: stat.size,
        lineBuffer: '',
        activeToolIds: new Set(),
        activeToolStatuses: new Map(),
        activeToolNames: new Map(),
        activeSubagentToolIds: new Map(),
        activeSubagentToolNames: new Map(),
        isWaiting: false,
        permissionSent: false,
        hadToolsInTurn: false,
        lastAssistantText: '',
        hasPty: ptyResult !== null,
      }

      agents.set(id, agent)
      knownJsonlFiles.add(file)
      alreadyTracked.add(file)

      console.log(`[Pixel Agents] Agent ${id}: adopted external session ${path.basename(file)} from ${projectDir} (PTY attached)`)

      startFileWatching(id, file, agents, fileWatchers, pollingTimers, waitingTimers, permissionTimers)
    }
  }
}

export function disposeAll(): void {
  for (const [id, agent] of agents) {
    if (agent.hasPty) killPty(id)
    fileWatchers.get(id)?.close()
    const pt = pollingTimers.get(id)
    if (pt) clearInterval(pt)
    const jp = jsonlPollTimers.get(id)
    if (jp) clearInterval(jp)
    cancelWaitingTimer(id, waitingTimers)
    cancelPermissionTimer(id, permissionTimers)
  }
  agents.clear()
  fileWatchers.clear()
  pollingTimers.clear()
  jsonlPollTimers.clear()
  waitingTimers.clear()
  permissionTimers.clear()

  // Stop project scan
  if (projectScanTimerRef.current) {
    clearInterval(projectScanTimerRef.current)
    projectScanTimerRef.current = null
  }
}
