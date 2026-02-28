# Standalone Web App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Run Pixel Agents in a browser via a local Next.js server with WebSocket, replacing the VS Code extension.

**Architecture:** Custom Next.js server (`server.ts`) attaches both Next.js and `ws` WebSocket to the same HTTP server on port 3000. Server-side modules (adapted from `src/`) manage Claude terminals via `node-pty`, watch JSONL files, and broadcast messages over WebSocket. Client reuses the existing `webview-ui/src/office/` engine with a thin WebSocket adapter replacing `vscode.postMessage`.

**Tech Stack:** Next.js 15, React 19, ws, node-pty, pngjs, TypeScript

---

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `standalone/package.json`
- Create: `standalone/tsconfig.json`
- Create: `standalone/next.config.ts`

**Step 1: Create package.json**

```json
{
  "name": "pixel-agents-standalone",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx server.ts",
    "build": "next build",
    "start": "NODE_ENV=production tsx server.ts"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "ws": "^8.18.0",
    "node-pty": "^1.0.0",
    "pngjs": "^7.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/ws": "^8.5.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/pngjs": "^6.0.5",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 3: Create next.config.ts**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // node-pty and pngjs are native — keep them server-only
  serverExternalPackages: ['node-pty', 'pngjs'],
}

export default nextConfig
```

**Step 4: Install dependencies**

Run: `cd standalone && npm install`

**Step 5: Commit**

```bash
git add standalone/package.json standalone/tsconfig.json standalone/next.config.ts
git commit -m "feat: scaffold standalone Next.js project"
```

---

### Task 2: Server-Side Constants and Types

Port `src/constants.ts` and `src/types.ts`, removing all VS Code dependencies.

**Files:**
- Create: `standalone/src/lib/constants.ts`
- Create: `standalone/src/lib/types.ts`

**Step 1: Create constants.ts**

Copy from `src/constants.ts` but remove VS Code identifiers (`VIEW_ID`, `COMMAND_*`, `WORKSPACE_KEY_*`, `TERMINAL_NAME_PREFIX`). Add WebSocket-specific constants.

```typescript
// ── Timing (ms) ──────────────────────────────────────────────
export const JSONL_POLL_INTERVAL_MS = 1000
export const FILE_WATCHER_POLL_INTERVAL_MS = 2000
export const PROJECT_SCAN_INTERVAL_MS = 1000
export const TOOL_DONE_DELAY_MS = 300
export const PERMISSION_TIMER_DELAY_MS = 7000
export const TEXT_IDLE_DELAY_MS = 5000

// ── Display Truncation ──────────────────────────────────────
export const BASH_COMMAND_DISPLAY_MAX_LENGTH = 30
export const TASK_DESCRIPTION_DISPLAY_MAX_LENGTH = 40

// ── PNG / Asset Parsing ─────────────────────────────────────
export const PNG_ALPHA_THRESHOLD = 128
export const WALL_PIECE_WIDTH = 16
export const WALL_PIECE_HEIGHT = 32
export const WALL_GRID_COLS = 4
export const WALL_BITMASK_COUNT = 16
export const FLOOR_PATTERN_COUNT = 7
export const FLOOR_TILE_SIZE = 16
export const CHARACTER_DIRECTIONS = ['down', 'up', 'right'] as const
export const CHAR_FRAME_W = 16
export const CHAR_FRAME_H = 32
export const CHAR_FRAMES_PER_ROW = 7
export const CHAR_COUNT = 6

// ── User-Level Layout Persistence ─────────────────────────────
export const LAYOUT_FILE_DIR = '.pixel-agents'
export const LAYOUT_FILE_NAME = 'layout.json'
export const LAYOUT_FILE_POLL_INTERVAL_MS = 2000

// ── Server ─────────────────────────────────────────────────
export const DEFAULT_PORT = 3000
export const TERMINAL_NAME_PREFIX = 'Claude Code'
```

**Step 2: Create types.ts**

Replace `vscode.Terminal` with a `node-pty` IPty reference.

```typescript
import type { IPty } from 'node-pty'

export interface AgentState {
  id: number
  pty: IPty
  projectDir: string
  jsonlFile: string
  fileOffset: number
  lineBuffer: string
  activeToolIds: Set<string>
  activeToolStatuses: Map<string, string>
  activeToolNames: Map<string, string>
  activeSubagentToolIds: Map<string, Set<string>>
  activeSubagentToolNames: Map<string, Map<string, string>>
  isWaiting: boolean
  permissionSent: boolean
  hadToolsInTurn: boolean
}

export interface PersistedAgent {
  id: number
  sessionId: string
  jsonlFile: string
  projectDir: string
}
```

**Step 3: Commit**

```bash
git add standalone/src/lib/constants.ts standalone/src/lib/types.ts
git commit -m "feat: add server-side constants and types"
```

---

### Task 3: WebSocket Manager

New module — manages connected WebSocket clients, broadcasts messages (replaces `webview.postMessage`).

**Files:**
- Create: `standalone/src/lib/wsManager.ts`

**Step 1: Write wsManager.ts**

```typescript
import { WebSocket, WebSocketServer } from 'ws'
import type { IncomingMessage } from 'http'
import type { Server } from 'http'

export type BroadcastMessage = Record<string, unknown> & { type: string }

let wss: WebSocketServer | null = null
const clients = new Set<WebSocket>()
let onClientMessage: ((msg: Record<string, unknown>) => void) | null = null

export function initWebSocketServer(server: Server): void {
  wss = new WebSocketServer({ server })

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
    clients.add(ws)
    console.log(`[WS] Client connected (total: ${clients.size})`)

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString()) as Record<string, unknown>
        onClientMessage?.(msg)
      } catch {
        console.warn('[WS] Invalid message received')
      }
    })

    ws.on('close', () => {
      clients.delete(ws)
      console.log(`[WS] Client disconnected (total: ${clients.size})`)
    })

    // Notify server that a new client connected (triggers asset/layout send)
    onClientMessage?.({ type: 'webviewReady' })
  })
}

export function setMessageHandler(handler: (msg: Record<string, unknown>) => void): void {
  onClientMessage = handler
}

export function broadcast(msg: BroadcastMessage): void {
  const data = JSON.stringify(msg)
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  }
}
```

**Step 2: Commit**

```bash
git add standalone/src/lib/wsManager.ts
git commit -m "feat: add WebSocket manager"
```

---

### Task 4: Asset Loader (Server-Side)

Port `src/assetLoader.ts` — remove all `vscode` imports, replace `webview.postMessage` with `broadcast()`. The loading functions stay identical; only the send functions change.

**Files:**
- Create: `standalone/src/lib/assetLoader.ts`

**Step 1: Write assetLoader.ts**

Copy the loading functions (`loadFurnitureAssets`, `loadFloorTiles`, `loadWallTiles`, `loadCharacterSprites`, `loadDefaultLayout`, `pngToSpriteData`) verbatim from `src/assetLoader.ts`.

Replace the send functions to use `broadcast()`:

```typescript
// Change all sendXxxToWebview functions from:
//   export function sendAssetsToWebview(webview: vscode.Webview, assets: LoadedAssets): void {
//     webview.postMessage({ type: 'furnitureAssetsLoaded', ... })
//   }
// To:
//   export function sendAssets(assets: LoadedAssets): void {
//     broadcast({ type: 'furnitureAssetsLoaded', ... })
//   }
```

The key changes:
- Remove all `import * as vscode from 'vscode'`
- Remove `webview: vscode.Webview` parameters from all send functions
- Replace `webview.postMessage(...)` with `broadcast(...)` from `./wsManager.js`
- Keep all PNG parsing logic identical
- Keep all interfaces (`FurnitureAsset`, `LoadedAssets`, `CharacterDirectionSprites`, etc.)

The `assetsRoot` parameter should point to the parent project's asset directory. At startup, resolve from `process.cwd()` or the repo root (where `webview-ui/public/assets/` lives). Copy assets into `standalone/public/assets/` for the server to load.

**Step 2: Commit**

```bash
git add standalone/src/lib/assetLoader.ts
git commit -m "feat: port asset loader to standalone"
```

---

### Task 5: Layout Persistence (Server-Side)

Port `src/layoutPersistence.ts` — remove `ExtensionContext`, simplify migration (no workspace state).

**Files:**
- Create: `standalone/src/lib/layoutPersistence.ts`

**Step 1: Write layoutPersistence.ts**

Keep: `readLayoutFromFile()`, `writeLayoutToFile()`, `watchLayoutFile()` — these are pure `fs` operations with no VS Code dependency.

Simplify `migrateAndLoadLayout()` to remove the workspace state migration path:

```typescript
export function loadLayout(
  defaultLayout?: Record<string, unknown> | null,
): Record<string, unknown> | null {
  const fromFile = readLayoutFromFile()
  if (fromFile) return fromFile

  if (defaultLayout) {
    writeLayoutToFile(defaultLayout)
    return defaultLayout
  }

  return null
}
```

Everything else (`readLayoutFromFile`, `writeLayoutToFile`, `watchLayoutFile`, `LayoutWatcher`) stays the same — they only use `fs`, `path`, `os`.

**Step 2: Commit**

```bash
git add standalone/src/lib/layoutPersistence.ts
git commit -m "feat: port layout persistence to standalone"
```

---

### Task 6: Timer Manager (Server-Side)

Port `src/timerManager.ts` — replace `vscode.Webview` parameter with `broadcast()`.

**Files:**
- Create: `standalone/src/lib/timerManager.ts`

**Step 1: Write timerManager.ts**

Replace all `webview?: vscode.Webview` params and `webview?.postMessage(...)` calls:

```typescript
// Before:
//   webview?.postMessage({ type: 'agentStatus', id: agentId, status: 'waiting' })
// After:
//   broadcast({ type: 'agentStatus', id: agentId, status: 'waiting' })
```

Functions to port: `clearAgentActivity`, `cancelWaitingTimer`, `startWaitingTimer`, `cancelPermissionTimer`, `startPermissionTimer`.

All timer logic stays identical. Only the message dispatch changes.

**Step 2: Commit**

```bash
git add standalone/src/lib/timerManager.ts
git commit -m "feat: port timer manager to standalone"
```

---

### Task 7: Transcript Parser (Server-Side)

Port `src/transcriptParser.ts` — same pattern as timer manager.

**Files:**
- Create: `standalone/src/lib/transcriptParser.ts`

**Step 1: Write transcriptParser.ts**

Copy `formatToolStatus()` verbatim (no VS Code deps).

Port `processTranscriptLine()` and `processProgressRecord()`:
- Replace `webview?: vscode.Webview` with nothing (use `broadcast()` directly)
- Replace all `webview?.postMessage(...)` with `broadcast(...)`
- All parsing logic and agent state updates stay identical

**Step 2: Commit**

```bash
git add standalone/src/lib/transcriptParser.ts
git commit -m "feat: port transcript parser to standalone"
```

---

### Task 8: File Watcher (Server-Side)

Port `src/fileWatcher.ts` — replace VS Code dependencies.

**Files:**
- Create: `standalone/src/lib/fileWatcher.ts`

**Step 1: Write fileWatcher.ts**

Port `startFileWatching()`, `readNewLines()`, `ensureProjectScan()`, `reassignAgentToFile()`:
- Replace `webview: vscode.Webview | undefined` with nothing (use `broadcast()`)
- Replace `webview?.postMessage(...)` with `broadcast(...)`
- Remove `adoptTerminalForFile()` (no concept of "active VS Code terminal" — skip terminal adoption)
- In `scanForNewJsonlFiles()`, handle `/clear` by reassigning the active agent to the new file. Remove the `vscode.window.activeTerminal` branch.

All file I/O (`fs.watch`, `fs.statSync`, `fs.readSync`, `fs.openSync`, `fs.closeSync`, `fs.readdirSync`, `fs.existsSync`) stays identical.

**Step 2: Commit**

```bash
git add standalone/src/lib/fileWatcher.ts
git commit -m "feat: port file watcher to standalone"
```

---

### Task 9: Agent Manager (Server-Side)

The biggest change — replace `vscode.window.createTerminal()` with `node-pty`.

**Files:**
- Create: `standalone/src/lib/agentManager.ts`

**Step 1: Write agentManager.ts**

```typescript
import * as pty from 'node-pty'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import type { AgentState } from './types.js'
import { broadcast } from './wsManager.js'
import { startFileWatching, readNewLines, ensureProjectScan } from './fileWatcher.js'
import { cancelWaitingTimer, cancelPermissionTimer } from './timerManager.js'
import { JSONL_POLL_INTERVAL_MS } from './constants.js'
import { randomUUID } from 'crypto'

// Shared state
export const agents = new Map<number, AgentState>()
export const knownJsonlFiles = new Set<string>()
export const fileWatchers = new Map<number, fs.FSWatcher>()
export const pollingTimers = new Map<number, ReturnType<typeof setInterval>>()
export const waitingTimers = new Map<number, ReturnType<typeof setTimeout>>()
export const permissionTimers = new Map<number, ReturnType<typeof setTimeout>>()
export const jsonlPollTimers = new Map<number, ReturnType<typeof setInterval>>()
export const projectScanTimerRef = { current: null as ReturnType<typeof setInterval> | null }
export const activeAgentIdRef = { current: null as number | null }
export const nextAgentIdRef = { current: 1 }
export const nextTerminalIndexRef = { current: 1 }
// Agent seat/palette metadata (persisted client-side via localStorage,
// but server keeps a copy for existingAgents messages)
export const agentMeta = new Map<number, { palette?: number; hueShift?: number; seatId?: string }>()

export function getProjectDirPath(cwd: string): string {
  const dirName = cwd.replace(/[:\\/]/g, '-')
  return path.join(os.homedir(), '.claude', 'projects', dirName)
}

export function launchNewAgent(cwd: string): void {
  const sessionId = randomUUID()
  const projectDir = getProjectDirPath(cwd)

  // Ensure project dir exists
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true })
  }

  const expectedFile = path.join(projectDir, `${sessionId}.jsonl`)
  knownJsonlFiles.add(expectedFile)

  const shell = process.platform === 'win32' ? 'cmd.exe' : process.env.SHELL || '/bin/zsh'
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 120,
    rows: 30,
    cwd,
    env: process.env as Record<string, string>,
  })

  // Send the claude command
  ptyProcess.write(`claude --session-id ${sessionId}\r`)

  const id = nextAgentIdRef.current++
  const agent: AgentState = {
    id,
    pty: ptyProcess,
    projectDir,
    jsonlFile: expectedFile,
    fileOffset: 0,
    lineBuffer: '',
    activeToolIds: new Set(),
    activeToolStatuses: new Map(),
    activeToolNames: new Map(),
    activeSubagentToolIds: new Map(),
    activeSubagentToolNames: new Map(),
    isWaiting: false,
    permissionSent: false,
    hadToolsInTurn: false,
  }

  agents.set(id, agent)
  activeAgentIdRef.current = id

  // Handle PTY close
  ptyProcess.onExit(() => {
    console.log(`[Agent ${id}] PTY exited`)
    removeAgent(id)
    broadcast({ type: 'agentClosed', id })
  })

  broadcast({ type: 'agentCreated', id })

  ensureProjectScan(
    projectDir, knownJsonlFiles, projectScanTimerRef, activeAgentIdRef,
    nextAgentIdRef, agents, fileWatchers, pollingTimers, waitingTimers,
    permissionTimers,
  )

  // Poll for JSONL file to appear
  const pollTimer = setInterval(() => {
    try {
      if (fs.existsSync(agent.jsonlFile)) {
        console.log(`[Agent ${id}] Found JSONL file`)
        clearInterval(pollTimer)
        jsonlPollTimers.delete(id)
        startFileWatching(id, agent.jsonlFile, agents, fileWatchers, pollingTimers, waitingTimers, permissionTimers)
        readNewLines(id, agents, waitingTimers, permissionTimers)
      }
    } catch { /* file may not exist yet */ }
  }, JSONL_POLL_INTERVAL_MS)
  jsonlPollTimers.set(id, pollTimer)
}

export function removeAgent(agentId: number): void {
  const agent = agents.get(agentId)
  if (!agent) return

  const jpTimer = jsonlPollTimers.get(agentId)
  if (jpTimer) clearInterval(jpTimer)
  jsonlPollTimers.delete(agentId)

  fileWatchers.get(agentId)?.close()
  fileWatchers.delete(agentId)
  const pt = pollingTimers.get(agentId)
  if (pt) clearInterval(pt)
  pollingTimers.delete(agentId)

  cancelWaitingTimer(agentId, waitingTimers)
  cancelPermissionTimer(agentId, permissionTimers)

  agents.delete(agentId)
  agentMeta.delete(agentId)
}

export function closeAgent(agentId: number): void {
  const agent = agents.get(agentId)
  if (!agent) return
  agent.pty.kill()
  // onExit handler will call removeAgent + broadcast agentClosed
}

export function sendExistingAgents(): void {
  const agentIds = [...agents.keys()].sort((a, b) => a - b)
  const meta: Record<number, { palette?: number; hueShift?: number; seatId?: string }> = {}
  for (const [id, m] of agentMeta) {
    meta[id] = m
  }
  broadcast({ type: 'existingAgents', agents: agentIds, agentMeta: meta })
  sendCurrentAgentStatuses()
}

export function sendCurrentAgentStatuses(): void {
  for (const [agentId, agent] of agents) {
    for (const [toolId, status] of agent.activeToolStatuses) {
      broadcast({ type: 'agentToolStart', id: agentId, toolId, status })
    }
    if (agent.isWaiting) {
      broadcast({ type: 'agentStatus', id: agentId, status: 'waiting' })
    }
  }
}
```

**Step 2: Commit**

```bash
git add standalone/src/lib/agentManager.ts
git commit -m "feat: add agent manager with node-pty"
```

---

### Task 10: Custom Server Entry Point

**Files:**
- Create: `standalone/server.ts`

**Step 1: Write server.ts**

```typescript
import { createServer } from 'http'
import next from 'next'
import { parse } from 'url'
import { initWebSocketServer, setMessageHandler, broadcast } from './src/lib/wsManager.js'
import {
  launchNewAgent, closeAgent, sendExistingAgents, agentMeta, agents,
} from './src/lib/agentManager.js'
import {
  loadFurnitureAssets, loadFloorTiles, loadWallTiles,
  loadCharacterSprites, loadDefaultLayout,
  sendAssets, sendFloorTiles, sendWallTiles, sendCharacterSprites,
} from './src/lib/assetLoader.js'
import { loadLayout, writeLayoutToFile, watchLayoutFile } from './src/lib/layoutPersistence.js'
import { DEFAULT_PORT } from './src/lib/constants.js'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || String(DEFAULT_PORT), 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Pre-load assets at startup
let assetsRoot: string
let cachedCharSprites: Awaited<ReturnType<typeof loadCharacterSprites>> = null
let cachedFloorTiles: Awaited<ReturnType<typeof loadFloorTiles>> = null
let cachedWallTiles: Awaited<ReturnType<typeof loadWallTiles>> = null
let cachedFurniture: Awaited<ReturnType<typeof loadFurnitureAssets>> = null
let cachedDefaultLayout: ReturnType<typeof loadDefaultLayout> = null

async function loadAllAssets(): Promise<void> {
  // Assets live in the parent project's webview-ui/public/ directory
  // or in standalone/public/ if copied there
  assetsRoot = process.cwd()

  cachedCharSprites = await loadCharacterSprites(assetsRoot)
  cachedFloorTiles = await loadFloorTiles(assetsRoot)
  cachedWallTiles = await loadWallTiles(assetsRoot)
  cachedFurniture = await loadFurnitureAssets(assetsRoot)
  cachedDefaultLayout = loadDefaultLayout(assetsRoot)

  console.log('[Server] Assets loaded')
}

function sendAllAssetsToClient(): void {
  // Settings
  broadcast({ type: 'settingsLoaded', soundEnabled: true })

  // Assets in order
  if (cachedCharSprites) sendCharacterSprites(cachedCharSprites)
  if (cachedFloorTiles) sendFloorTiles(cachedFloorTiles)
  if (cachedWallTiles) sendWallTiles(cachedWallTiles)
  if (cachedFurniture) sendAssets(cachedFurniture)

  // Layout
  const layout = loadLayout(cachedDefaultLayout)
  broadcast({ type: 'layoutLoaded', layout })

  // Existing agents (if any)
  if (agents.size > 0) {
    sendExistingAgents()
  }
}

// The working directory for Claude agents
const agentCwd = process.env.PIXEL_AGENTS_CWD || process.cwd()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || '', true)
    handle(req, res, parsedUrl)
  })

  // Attach WebSocket
  initWebSocketServer(server)

  // Handle incoming client messages
  setMessageHandler((msg) => {
    const type = msg.type as string
    switch (type) {
      case 'webviewReady':
        sendAllAssetsToClient()
        break
      case 'openClaude':
        launchNewAgent(agentCwd)
        break
      case 'focusAgent':
        // No terminal to focus in standalone — just update active agent
        break
      case 'closeAgent':
        closeAgent(msg.id as number)
        break
      case 'saveAgentSeats': {
        const seats = msg.seats as Record<string, { palette: number; hueShift: number; seatId: string | null }>
        for (const [idStr, meta] of Object.entries(seats)) {
          agentMeta.set(Number(idStr), meta)
        }
        break
      }
      case 'saveLayout': {
        const layout = msg.layout as Record<string, unknown>
        layoutWatcher.markOwnWrite()
        writeLayoutToFile(layout)
        break
      }
      case 'setSoundEnabled':
        // Stored client-side in localStorage
        break
    }
  })

  // Watch layout for external changes
  const layoutWatcher = watchLayoutFile((layout) => {
    broadcast({ type: 'layoutLoaded', layout })
  })

  // Load assets then start
  loadAllAssets().then(() => {
    server.listen(port, () => {
      console.log(`\n  Pixel Agents running at http://${hostname}:${port}\n`)
    })
  })
})
```

**Step 2: Commit**

```bash
git add standalone/server.ts
git commit -m "feat: add custom Next.js server with WebSocket"
```

---

### Task 11: Copy and Adapt Assets

Copy asset files from the parent project into `standalone/public/assets/`.

**Files:**
- Create: `standalone/public/assets/` (copy from `webview-ui/public/assets/`)

**Step 1: Copy assets**

```bash
mkdir -p standalone/public/assets
cp -r webview-ui/public/assets/* standalone/public/assets/
```

This includes: `characters/`, `furniture/`, `floors.png`, `walls.png`, `default-layout.json`.

**Step 2: Commit**

```bash
git add standalone/public/assets/
git commit -m "feat: copy asset files to standalone"
```

---

### Task 12: Client-Side Message API

Replace `webview-ui/src/vscodeApi.ts` with a WebSocket client.

**Files:**
- Create: `standalone/src/lib/messageApi.ts`

**Step 1: Write messageApi.ts**

```typescript
type MessageHandler = (msg: Record<string, unknown>) => void

let ws: WebSocket | null = null
let messageHandler: MessageHandler | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

export function connectWebSocket(): void {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const url = `${protocol}//${window.location.host}`

  ws = new WebSocket(url)

  ws.onopen = () => {
    console.log('[WS] Connected')
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data as string) as Record<string, unknown>
      messageHandler?.(msg)
    } catch {
      console.warn('[WS] Invalid message')
    }
  }

  ws.onclose = () => {
    console.log('[WS] Disconnected, reconnecting...')
    ws = null
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(connectWebSocket, 2000)
  }

  ws.onerror = () => {
    ws?.close()
  }
}

export function setOnMessage(handler: MessageHandler): void {
  messageHandler = handler
}

export function sendMessage(msg: Record<string, unknown>): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}
```

**Step 2: Commit**

```bash
git add standalone/src/lib/messageApi.ts
git commit -m "feat: add WebSocket client message API"
```

---

### Task 13: Copy Office Engine (Client-Side)

Copy the entire `webview-ui/src/office/` directory into the Next.js project. These files have zero VS Code dependencies — they're pure canvas/game logic.

**Files:**
- Create: `standalone/src/office/` (entire directory tree)

**Step 1: Copy office directory**

```bash
cp -r webview-ui/src/office standalone/src/office
```

This brings in: `types.ts`, `toolUtils.ts`, `colorize.ts`, `floorTiles.ts`, `wallTiles.ts`, `sprites/`, `editor/`, `layout/`, `engine/`, `components/`.

**Step 2: Copy supporting files**

```bash
cp webview-ui/src/constants.ts standalone/src/constants.ts
cp webview-ui/src/notificationSound.ts standalone/src/notificationSound.ts
```

**Step 3: Copy component files**

```bash
mkdir -p standalone/src/components
cp webview-ui/src/components/BottomToolbar.tsx standalone/src/components/BottomToolbar.tsx
cp webview-ui/src/components/ZoomControls.tsx standalone/src/components/ZoomControls.tsx
cp webview-ui/src/components/DebugView.tsx standalone/src/components/DebugView.tsx
cp webview-ui/src/components/SettingsModal.tsx standalone/src/components/SettingsModal.tsx
cp webview-ui/src/components/AgentLabels.tsx standalone/src/components/AgentLabels.tsx
```

**Step 4: Copy fonts and CSS**

```bash
mkdir -p standalone/src/fonts
cp -r webview-ui/src/fonts/* standalone/src/fonts/
cp webview-ui/src/index.css standalone/src/index.css
```

**Step 5: Commit**

```bash
git add standalone/src/office/ standalone/src/constants.ts standalone/src/notificationSound.ts standalone/src/components/ standalone/src/fonts/ standalone/src/index.css
git commit -m "feat: copy office engine and UI components"
```

---

### Task 14: useWebSocket Hook (Client-Side)

Replace `useExtensionMessages.ts` with a WebSocket-based version.

**Files:**
- Create: `standalone/src/hooks/useWebSocket.ts`

**Step 1: Write useWebSocket.ts**

This is a modified copy of `webview-ui/src/hooks/useExtensionMessages.ts`. Changes:
1. Replace `import { vscode } from '../vscodeApi.js'` with `import { sendMessage, setOnMessage, connectWebSocket } from '../lib/messageApi.js'`
2. Replace `window.addEventListener('message', handler)` with `setOnMessage(handler)` where handler takes `msg` directly (not `e.data`)
3. Replace `vscode.postMessage(...)` with `sendMessage(...)`
4. Call `connectWebSocket()` on mount instead of `vscode.postMessage({ type: 'webviewReady' })`

The `saveAgentSeats` function:
```typescript
function saveAgentSeats(os: OfficeState): void {
  const seats: Record<number, { palette: number; hueShift: number; seatId: string | null }> = {}
  for (const ch of os.characters.values()) {
    if (ch.isSubagent) continue
    seats[ch.id] = { palette: ch.palette, hueShift: ch.hueShift, seatId: ch.seatId }
  }
  sendMessage({ type: 'saveAgentSeats', seats })
}
```

The hook's `useEffect` cleanup:
```typescript
return () => {
  // No removeEventListener needed — setOnMessage(null) would clear
}
```

Everything else (state, message handling logic, React state updates) stays identical.

**Step 2: Also copy useEditorActions.ts and useEditorKeyboard.ts**

```bash
mkdir -p standalone/src/hooks
cp webview-ui/src/hooks/useEditorActions.ts standalone/src/hooks/useEditorActions.ts
cp webview-ui/src/hooks/useEditorKeyboard.ts standalone/src/hooks/useEditorKeyboard.ts
```

These have no VS Code dependencies.

**Step 3: Commit**

```bash
git add standalone/src/hooks/
git commit -m "feat: add useWebSocket hook and editor hooks"
```

---

### Task 15: Next.js Page and Layout

**Files:**
- Create: `standalone/src/app/layout.tsx`
- Create: `standalone/src/app/page.tsx`

**Step 1: Write layout.tsx**

```typescript
import type { Metadata } from 'next'
import '../index.css'

export const metadata: Metadata = {
  title: 'Pixel Agents',
  description: 'Pixel art office where your Claude Code agents come to life',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', width: '100vw', height: '100vh', background: '#0a0a14' }}>
        {children}
      </body>
    </html>
  )
}
```

**Step 2: Write page.tsx**

This is the adapted `App.tsx`. Key changes:
- Add `'use client'` directive
- Replace `import { vscode } from './vscodeApi.js'` with `import { sendMessage } from '../lib/messageApi.js'`
- Replace `import { useExtensionMessages } from './hooks/useExtensionMessages.js'` with `import { useWebSocket } from '../hooks/useWebSocket.js'`
- Replace all `vscode.postMessage(...)` calls with `sendMessage(...)`
- Replace VS Code color variables (`--vscode-foreground`) with hardcoded dark theme colors
- Wrap in a component that fills the viewport

```typescript
'use client'

// ... (same as App.tsx but with the import swaps above)
// The hook call changes from:
//   useExtensionMessages(getOfficeState, editor.setLastSavedLayout, isEditDirty)
// To:
//   useWebSocket(getOfficeState, editor.setLastSavedLayout, isEditDirty)

// And all vscode.postMessage calls become sendMessage calls
```

**Step 3: Commit**

```bash
git add standalone/src/app/
git commit -m "feat: add Next.js page and layout"
```

---

### Task 16: Update BottomToolbar and SettingsModal

These components call `vscode.postMessage` — update to use `sendMessage`.

**Files:**
- Modify: `standalone/src/components/BottomToolbar.tsx`
- Modify: `standalone/src/components/SettingsModal.tsx`

**Step 1: Update BottomToolbar.tsx**

Find the `openClaude` handler and replace:
```typescript
// Before:
vscode.postMessage({ type: 'openClaude' })
// After:
sendMessage({ type: 'openClaude' })
```

Add import: `import { sendMessage } from '../lib/messageApi.js'`
Remove import: `import { vscode } from '../vscodeApi.js'`

**Step 2: Update SettingsModal.tsx**

Replace layout export/import to use browser File API instead of VS Code dialogs:

- Export: Create a Blob from the layout JSON and trigger a download
- Import: Use `<input type="file">` to read a JSON file

Replace sound toggle:
```typescript
// Before:
vscode.postMessage({ type: 'setSoundEnabled', enabled })
// After:
sendMessage({ type: 'setSoundEnabled', enabled })
localStorage.setItem('pixel-agents-sound', String(enabled))
```

**Step 3: Commit**

```bash
git add standalone/src/components/BottomToolbar.tsx standalone/src/components/SettingsModal.tsx
git commit -m "feat: update components for standalone mode"
```

---

### Task 17: Update CSS for Browser

**Files:**
- Modify: `standalone/src/index.css`

**Step 1: Replace VS Code CSS variables**

The webview CSS uses `--vscode-*` variables. Replace with hardcoded dark theme values:

```css
/* Before: color: var(--vscode-foreground) */
/* After: color: #cccccc */
```

Relevant replacements:
- `--vscode-foreground` → `#cccccc`
- `--vscode-editor-background` → `#1e1e2e`
- `--vscode-panel-background` → `#181825`

The pixel theme CSS variables (`--pixel-*`) in `:root` stay as-is — they're self-contained.

**Step 2: Add full-viewport styling**

```css
html, body, #__next {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0a0a14;
}
```

**Step 3: Commit**

```bash
git add standalone/src/index.css
git commit -m "feat: update CSS for browser environment"
```

---

### Task 18: Build and Test

**Step 1: Install dependencies**

```bash
cd standalone && npm install
```

Expected: Clean install, node-pty may need native build tools.

**Step 2: Fix TypeScript errors**

Run: `cd standalone && npx tsc --noEmit`

Expected issues:
- Import path adjustments (`.js` extensions for ESM)
- Missing type imports after removing VS Code types
- Minor interface mismatches

Fix each error. Most will be import path adjustments.

**Step 3: Build Next.js**

Run: `cd standalone && npm run build`

Expected: Clean build with server and client bundles.

**Step 4: Start dev server**

Run: `cd standalone && npm run dev`

Expected: Server starts, prints `Pixel Agents running at http://localhost:3000`

**Step 5: Open in browser**

Open `http://localhost:3000`. Expected:
- Office renders with floor/walls/furniture
- Layout editor works
- Click "+ Agent" → server spawns Claude PTY → agent character appears
- Agent character animates based on Claude activity

**Step 6: Commit**

```bash
git add -A standalone/
git commit -m "feat: standalone Pixel Agents working in browser"
```

---

### Task 19: Add README for Standalone

**Files:**
- Create: `standalone/README.md`

**Step 1: Write README**

```markdown
# Pixel Agents (Standalone)

Run Pixel Agents in your browser — no VS Code required.

## Quick Start

```bash
cd standalone
npm install
npm run dev
```

Open http://localhost:3000

## Environment Variables

- `PORT` — Server port (default: 3000)
- `PIXEL_AGENTS_CWD` — Working directory for Claude agents (default: current directory)

## How It Works

A local Node.js server spawns Claude Code terminals (via node-pty), watches their JSONL transcripts, and pushes real-time updates to your browser over WebSocket. The browser renders the same pixel art office as the VS Code extension.
```

**Step 2: Commit**

```bash
git add standalone/README.md
git commit -m "docs: add standalone README"
```

---

Plan complete and saved to `docs/plans/2026-02-25-standalone-web-app-plan.md`. Two execution options:

**1. Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints

Which approach?
