import { WebSocket, WebSocketServer } from 'ws'
import type { IncomingMessage } from 'http'
import type { Server } from 'http'

export type BroadcastMessage = Record<string, unknown> & { type: string }

let wss: WebSocketServer | null = null
const clients = new Set<WebSocket>()
let onClientMessage: ((msg: Record<string, unknown>) => void) | null = null

export function initWebSocketServer(server: Server): void {
  // Use noServer mode so we can filter upgrade requests by path,
  // avoiding conflicts with Next.js dev HMR WebSocket
  wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (req, socket, head) => {
    const { pathname } = new URL(req.url || '', `http://${req.headers.host}`)
    if (pathname === '/ws') {
      wss!.handleUpgrade(req, socket, head, (ws) => {
        wss!.emit('connection', ws, req)
      })
    }
    // Let Next.js HMR handle other upgrade requests (don't destroy socket)
  })

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
