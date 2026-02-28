import { createServer } from 'http'
import type { IncomingMessage, ServerResponse } from 'http'
import { createRequire } from 'module'
import { parse } from 'url'

const require = createRequire(import.meta.url)

interface NextApp {
  getRequestHandler(): (req: IncomingMessage, res: ServerResponse, parsedUrl?: ReturnType<typeof parse>) => Promise<void>
  prepare(): Promise<void>
}

const createNextApp = require('next') as (opts: { dev?: boolean; hostname?: string; port?: number }) => NextApp

import { initWebSocketServer, setMessageHandler, broadcast } from './src/lib/wsManager'
import {
  loadFurnitureAssets,
  loadFloorTiles,
  loadWallTiles,
  loadCharacterSprites,
  loadDefaultLayout,
  sendAssets,
  sendFloorTiles,
  sendWallTiles,
  sendCharacterSprites,
} from './src/lib/assetLoader'
import type {
  LoadedAssets,
  LoadedFloorTiles,
  LoadedWallTiles,
  LoadedCharacterSprites,
} from './src/lib/assetLoader'
import {
  loadLayout,
  writeLayoutToFile,
  watchLayoutFile,
} from './src/lib/layoutPersistence'
import type { LayoutWatcher } from './src/lib/layoutPersistence'
import {
  launchNewAgent,
  closeAgent,
  focusAgent,
  sendExistingAgents,
  saveAgentSeats,
  disposeAll,
  adoptExternalSessions,
  agents,
} from './src/lib/agentManager'
import { readTranscript } from './src/lib/transcriptReader'
import { setOnPtyData, writeToPty, resizePty, hasPtySession, getPtyBuffer } from './src/lib/ptyManager'
import { DEFAULT_PORT } from './src/lib/constants'
import {
  fetchSchedules,
  fetchPipelinesForSchedule,
  fetchPipelineJobs,
  fetchJobLog,
  hasGitlabToken,
} from './src/lib/gitlabPipelines'

// ── Configuration ───────────────────────────────────────────────────────

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = parseInt(process.env.PORT || String(DEFAULT_PORT), 10)
const agentCwd = process.env.PIXEL_AGENTS_CWD || process.cwd()

// Assets root: the standalone project directory (where assets/ lives)
// When running via `tsx server.ts`, __dirname isn't available in ESM,
// so we use the repo root which should be the cwd when starting the server.
// The assets/ folder is expected at <standalone-root>/assets/
const assetsRoot = new URL('./public', import.meta.url).pathname

// ── Pre-loaded assets (populated at startup) ────────────────────────────

let furnitureAssets: LoadedAssets | null = null
let floorTiles: LoadedFloorTiles | null = null
let wallTiles: LoadedWallTiles | null = null
let characterSprites: LoadedCharacterSprites | null = null
let layout: Record<string, unknown> | null = null
let layoutWatcher: LayoutWatcher | null = null

// ── Settings (persisted in-memory for standalone) ───────────────────────

let soundEnabled = true

// ── Asset loading ───────────────────────────────────────────────────────

async function preloadAssets(): Promise<void> {
  console.log(`[Server] Pre-loading assets from: ${assetsRoot}`)

  // Load all assets in parallel
  const [chars, floors, walls, furniture] = await Promise.all([
    loadCharacterSprites(assetsRoot),
    loadFloorTiles(assetsRoot),
    loadWallTiles(assetsRoot),
    loadFurnitureAssets(assetsRoot),
  ])

  characterSprites = chars
  floorTiles = floors
  wallTiles = walls
  furnitureAssets = furniture

  // Load layout (from file or bundled default)
  const defaultLayout = loadDefaultLayout(assetsRoot)
  layout = loadLayout(defaultLayout)

  console.log('[Server] Assets pre-loaded:')
  console.log(`  Characters: ${characterSprites ? 'loaded' : 'missing'}`)
  console.log(`  Floor tiles: ${floorTiles ? `${floorTiles.sprites.length} patterns` : 'missing'}`)
  console.log(`  Wall tiles: ${wallTiles ? `${wallTiles.sprites.length} pieces` : 'missing'}`)
  console.log(`  Furniture: ${furnitureAssets ? `${furnitureAssets.catalog.length} items` : 'missing'}`)
  console.log(`  Layout: ${layout ? 'loaded' : 'using default'}`)
}

let adoptedOnce = false

function sendAllAssetsToClient(): void {
  // Send settings first
  broadcast({
    type: 'settingsLoaded',
    soundEnabled,
    agentCwd,
  })

  // Send assets in correct order: characters -> floors -> walls -> furniture -> layout
  if (characterSprites) {
    sendCharacterSprites(characterSprites)
  }
  if (floorTiles) {
    sendFloorTiles(floorTiles)
  }
  if (wallTiles) {
    sendWallTiles(wallTiles)
  }
  if (furnitureAssets) {
    sendAssets(furnitureAssets)
  }
  if (layout) {
    broadcast({
      type: 'layoutLoaded',
      layout,
    })
  }

  // Adopt external Claude sessions only once (on first client connect)
  if (!adoptedOnce) {
    adoptExternalSessions()
    adoptedOnce = true
  }

  sendExistingAgents()
}

// ── Message handling ────────────────────────────────────────────────────

function handleClientMessage(msg: Record<string, unknown>): void {
  const msgType = msg.type as string
  switch (msgType) {
    case 'webviewReady': {
      console.log('[Server] Client ready, sending assets')
      sendAllAssetsToClient()
      break
    }

    case 'openClaude': {
      const options = {
        cwd: msg.cwd as string | undefined,
        continueSession: msg.continueSession as boolean | undefined,
      }
      const effectiveCwd = options.cwd || agentCwd
      console.log(`[Server] Opening new Claude agent (cwd: ${effectiveCwd}, continue: ${!!options.continueSession})`)
      launchNewAgent(agentCwd, options)
      break
    }

    case 'focusAgent': {
      const agentId = msg.id as number
      console.log(`[Server] Focusing agent ${agentId}`)
      focusAgent(agentId)
      break
    }

    case 'closeAgent': {
      const agentId = msg.id as number
      console.log(`[Server] Closing agent ${agentId}`)
      closeAgent(agentId)
      break
    }

    case 'saveAgentSeats': {
      const seatData = msg.agentMeta as Record<string, { palette?: number; hueShift?: number; seatId?: string }>
      if (seatData) {
        saveAgentSeats(seatData)
      }
      break
    }

    case 'saveLayout': {
      const layoutData = msg.layout as Record<string, unknown>
      if (layoutData) {
        layout = layoutData
        layoutWatcher?.markOwnWrite()
        writeLayoutToFile(layoutData)
      }
      break
    }

    case 'setSoundEnabled': {
      soundEnabled = msg.enabled as boolean
      console.log(`[Server] Sound notifications ${soundEnabled ? 'enabled' : 'disabled'}`)
      break
    }

    case 'requestTranscript': {
      const agentId = msg.id as number
      const agent = agents.get(agentId)
      if (agent) {
        const entries = readTranscript(agent.jsonlFile)
        const hasPty = hasPtySession(agentId)
        broadcast({
          type: 'transcriptData',
          id: agentId,
          entries,
          jsonlFile: agent.jsonlFile,
          hasPty,
          ptyBuffer: hasPty ? getPtyBuffer(agentId) : undefined,
          cwd: agent.cwd,
        })
      }
      break
    }

    case 'terminalInput': {
      const agentId = msg.id as number
      const data = msg.data as string
      writeToPty(agentId, data)
      break
    }

    case 'terminalResize': {
      const agentId = msg.id as number
      const cols = msg.cols as number
      const rows = msg.rows as number
      resizePty(agentId, cols, rows)
      break
    }

    // ── TV Pipeline Viewer ──────────────────────────────────
    case 'tvRequestSchedules': {
      const projectId = msg.projectId as string | undefined
      if (!hasGitlabToken()) {
        broadcast({ type: 'tvSchedules', error: 'No GitLab token found. Set GITLAB_TOKEN env var with a PAT that has "api" scope, or create ~/.gitlab-token file.' })
        break
      }
      fetchSchedules(projectId)
        .then((schedules) => broadcast({ type: 'tvSchedules', schedules }))
        .catch((err: Error) => broadcast({ type: 'tvSchedules', error: err.message }))
      break
    }

    case 'tvRequestPipelines': {
      const projectId = msg.projectId as string | undefined
      const scheduleId = msg.scheduleId as number | undefined
      fetchPipelinesForSchedule(projectId, scheduleId)
        .then((pipelines) => broadcast({ type: 'tvPipelines', pipelines, scheduleId }))
        .catch((err: Error) => broadcast({ type: 'tvPipelines', error: err.message }))
      break
    }

    case 'tvRequestJobs': {
      const projectId = msg.projectId as string | undefined
      const pipelineId = msg.pipelineId as number
      fetchPipelineJobs(projectId, pipelineId)
        .then((jobs) => broadcast({ type: 'tvJobs', jobs, pipelineId }))
        .catch((err: Error) => broadcast({ type: 'tvJobs', error: err.message }))
      break
    }

    case 'tvRequestJobLog': {
      const projectId = msg.projectId as string | undefined
      const jobId = msg.jobId as number
      fetchJobLog(projectId, jobId)
        .then((log) => broadcast({ type: 'tvJobLog', log, jobId }))
        .catch((err: Error) => broadcast({ type: 'tvJobLog', error: err.message }))
      break
    }

    default: {
      // Unknown message type -- ignore
      break
    }
  }
}

// ── Startup ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`[Server] Pixel Agents standalone server starting...`)
  console.log(`[Server] Agent CWD: ${agentCwd}`)
  console.log(`[Server] Mode: ${dev ? 'development' : 'production'}`)

  // Pre-load all assets
  await preloadAssets()

  // Initialize Next.js
  const app = createNextApp({ dev, hostname, port })
  const handle = app.getRequestHandler()
  await app.prepare()

  // Create HTTP server
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || '', true)
    handle(req, res, parsedUrl)
  })

  // Attach WebSocket server
  initWebSocketServer(server)
  setMessageHandler(handleClientMessage)

  // Stream PTY output to WebSocket clients
  setOnPtyData((agentId, data) => {
    broadcast({ type: 'terminalOutput', id: agentId, data })
  })

  // Watch layout file for external changes (cross-window sync)
  layoutWatcher = watchLayoutFile((externalLayout) => {
    layout = externalLayout
    broadcast({
      type: 'layoutLoaded',
      layout: externalLayout,
    })
  })

  // Graceful shutdown
  const shutdown = (): void => {
    console.log('\n[Server] Shutting down...')
    layoutWatcher?.dispose()
    disposeAll()
    server.close(() => {
      console.log('[Server] HTTP server closed')
      process.exit(0)
    })
    // Force exit after 5s if server doesn't close gracefully
    setTimeout(() => {
      console.log('[Server] Forcing exit')
      process.exit(1)
    }, 5000)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  // Start listening
  server.listen(port, hostname, () => {
    console.log(`[Server] Ready on http://${hostname}:${port}`)
  })
}

main().catch((err) => {
  console.error('[Server] Fatal error:', err)
  process.exit(1)
})
