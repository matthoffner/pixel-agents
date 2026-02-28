# Pixel Agents Standalone — Next.js Web App Design

## Goal

Run Pixel Agents in a web browser instead of VS Code. A local Node.js server (Next.js custom server) spawns Claude CLI processes, watches JSONL files, and pushes real-time updates to the browser via WebSocket.

## Architecture

Single process: custom `server.ts` starts HTTP server with Next.js (pages/static) + `ws` (WebSocket) on the same port.

```
Browser (localhost:3000)
  <-> WebSocket (ws://)
Custom Server (server.ts)
  |-- Next.js (pages, static assets)
  |-- ws (real-time agent/tool messages)
  |-- node-pty (Claude CLI terminals)
  +-- fs.watch + polling (JSONL files)
```

## Server-side Components

### server.ts
Creates HTTP server, attaches Next.js request handler + ws WebSocket server. Listens on port 3000.

### wsManager.ts
Tracks connected clients. Broadcasts messages. Maps incoming WebSocket messages to actions. Same message types as current postMessage protocol.

### agentManager.ts
Spawns `claude --session-id <uuid>` via node-pty. Tracks terminals, handles close/remove. Detects project dir from cwd.

### fileWatcher.ts
Lifted from extension. fs.watch + 2s polling. Reads JSONL, buffers partial lines, dispatches tool/status messages via wsManager.

### transcriptParser.ts
Reused from extension almost verbatim.

### assetLoader.ts
PNG parsing at startup. Sends parsed sprite data to clients on WebSocket connect (characterSpritesLoaded, furnitureAssetsLoaded, etc.).

### layoutPersistence.ts
Same ~/.pixel-agents/layout.json file I/O. Atomic writes. File watching for external changes.

## Client-side Components

### page.tsx
Single 'use client' page. Renders office canvas, toolbars, modals — same composition as current App.tsx.

### useWebSocket.ts
Replaces useExtensionMessages.ts. Connects to ws://localhost:3000, receives/sends the exact same message types. Auto-reconnect on disconnect.

### office/
Entire webview-ui/src/office/ directory with minimal changes. Canvas rendering, game loop, editor, sprites — all client-only.

### components/
BottomToolbar, SettingsModal, ZoomControls, DebugView — adapted to use WebSocket instead of vscode.postMessage.

## Communication Protocol

Same message types as current extension<->webview protocol:

### Server -> Client
- agentCreated, agentClosed, existingAgents, agentSelected
- agentToolStart, agentToolDone, agentToolsClear, agentToolPermission, agentToolPermissionClear
- subagentToolStart, subagentToolDone, subagentClear, subagentToolPermission
- agentStatus (active/waiting)
- characterSpritesLoaded, floorTilesLoaded, wallTilesLoaded, furnitureAssetsLoaded
- layoutLoaded, settingsLoaded

### Client -> Server
- openClaude, focusAgent, closeAgent
- saveAgentSeats, saveLayout, setSoundEnabled
- exportLayout, importLayout

## Key Differences from VS Code Extension

| VS Code | Standalone |
|---------|-----------|
| vscode.postMessage() | ws.send(JSON.stringify()) |
| window.addEventListener('message') | ws.onmessage |
| vscode.getState()/setState() | localStorage |
| Assets from dist/assets/ | Assets in public/assets/ or sent over WS |
| Terminal via VS Code API | Terminal via node-pty |
| Layout save dialog | Browser download / file input |

## Terminal Management

node-pty spawns a PTY for each agent. No terminal UI in the browser — users interact with Claude in their own terminal. "Focus agent" highlights/follows the character in the office view.

## Startup Flow

1. Server starts, loads assets (PNGs -> sprite data), reads layout
2. Browser opens localhost:3000, Next.js serves the page
3. WebSocket connects
4. Server sends: settingsLoaded -> characterSpritesLoaded -> floorTilesLoaded -> wallTilesLoaded -> furnitureAssetsLoaded -> layoutLoaded
5. Client renders office. "+ Agent" click -> WS -> server spawns Claude PTY -> JSONL watching -> agentCreated

## Persistence

- Layout: ~/.pixel-agents/layout.json (server)
- Agent seats/palette: localStorage (browser)
- Settings (sound): localStorage
- Export/Import: Browser File API

## Out of Scope

- Embedded terminal UI (xterm.js)
- Multi-user / remote access
- Authentication
- Docker/deployment
