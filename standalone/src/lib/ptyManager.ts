import * as pty from 'node-pty'
import * as fs from 'fs'
import { PTY_BUFFER_MAX_BYTES } from './constants'

export interface PtySession {
  pty: pty.IPty
  agentId: number
  outputBuffer: string[]
  outputBufferSize: number
}

const sessions = new Map<number, PtySession>()

// Callback for streaming PTY output to WebSocket clients
let onData: ((agentId: number, data: string) => void) | null = null

export function setOnPtyData(handler: (agentId: number, data: string) => void): void {
  onData = handler
}

export interface PtyLaunchOptions {
  continueSession?: boolean
  resumeSession?: boolean
}

export function createPtySession(agentId: number, cwd: string, sessionId: string, options?: PtyLaunchOptions): pty.IPty | null {
  const shell = process.env.SHELL || '/bin/zsh'
  const env = { ...process.env } as Record<string, string>
  delete env.CLAUDECODE

  // Validate cwd exists
  const safeCwd = fs.existsSync(cwd) ? cwd : process.cwd()

  let claudeCmd: string
  if (options?.continueSession) {
    claudeCmd = 'claude --continue'
  } else if (options?.resumeSession) {
    claudeCmd = `claude --resume ${sessionId}`
  } else {
    claudeCmd = `claude --session-id ${sessionId}`
  }

  try {
    const term = pty.spawn(shell, ['-l', '-c', claudeCmd], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: safeCwd,
      env,
    })

    const session: PtySession = { pty: term, agentId, outputBuffer: [], outputBufferSize: 0 }
    sessions.set(agentId, session)

    term.onData((data: string) => {
      // Buffer output for replay when switching agents
      session.outputBuffer.push(data)
      session.outputBufferSize += data.length
      // Trim buffer if it exceeds max size (drop oldest chunks)
      while (session.outputBufferSize > PTY_BUFFER_MAX_BYTES && session.outputBuffer.length > 1) {
        const removed = session.outputBuffer.shift()!
        session.outputBufferSize -= removed.length
      }
      onData?.(agentId, data)
    })

    term.onExit(() => {
      sessions.delete(agentId)
    })

    console.log(`[PTY] Created session for agent ${agentId} (pid: ${term.pid}, cwd: ${safeCwd})`)
    return term
  } catch (err) {
    console.error(`[PTY] Failed to create session for agent ${agentId}:`, err)
    return null
  }
}

export function writeToPty(agentId: number, data: string): void {
  const session = sessions.get(agentId)
  if (session) {
    session.pty.write(data)
  }
}

export function resizePty(agentId: number, cols: number, rows: number): void {
  const session = sessions.get(agentId)
  if (session) {
    session.pty.resize(cols, rows)
  }
}

export function killPty(agentId: number): void {
  const session = sessions.get(agentId)
  if (session) {
    session.pty.kill()
    sessions.delete(agentId)
  }
}

export function hasPtySession(agentId: number): boolean {
  return sessions.has(agentId)
}

export function getPtyBuffer(agentId: number): string {
  const session = sessions.get(agentId)
  if (!session) return ''
  return session.outputBuffer.join('')
}

export function disposeAllPty(): void {
  for (const [, session] of sessions) {
    session.pty.kill()
  }
  sessions.clear()
}
