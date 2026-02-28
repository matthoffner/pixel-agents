type MessageHandler = (msg: Record<string, unknown>) => void

// Use window-level storage to survive HMR module re-evaluation in Next.js dev
interface WsGlobal {
  __pixelAgentsWs?: WebSocket | null
  __pixelAgentsHandler?: MessageHandler | null
  __pixelAgentsSecondaryHandlers?: Set<MessageHandler>
  __pixelAgentsReconnect?: ReturnType<typeof setTimeout> | null
}

function getGlobal(): WsGlobal {
  return (typeof window !== 'undefined' ? window : {}) as WsGlobal
}

export function connectWebSocket(): void {
  const g = getGlobal()

  // Guard: don't create a new connection if one is already open or connecting
  const existing = g.__pixelAgentsWs
  if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
    return
  }

  if (g.__pixelAgentsReconnect) {
    clearTimeout(g.__pixelAgentsReconnect)
    g.__pixelAgentsReconnect = null
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const url = `${protocol}//${window.location.host}/ws`

  const socket = new WebSocket(url)
  g.__pixelAgentsWs = socket

  socket.onopen = () => {
    console.log('[WS] Connected')
  }

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data as string) as Record<string, unknown>
      g.__pixelAgentsHandler?.(msg)
      if (g.__pixelAgentsSecondaryHandlers) {
        for (const h of g.__pixelAgentsSecondaryHandlers) h(msg)
      }
    } catch {
      console.warn('[WS] Invalid message')
    }
  }

  socket.onclose = () => {
    console.log('[WS] Disconnected, reconnecting...')
    if (g.__pixelAgentsWs === socket) {
      g.__pixelAgentsWs = null
    }
    if (g.__pixelAgentsReconnect) clearTimeout(g.__pixelAgentsReconnect)
    g.__pixelAgentsReconnect = setTimeout(connectWebSocket, 2000)
  }

  socket.onerror = () => {
    socket.close()
  }
}

export function setOnMessage(handler: MessageHandler | null): void {
  getGlobal().__pixelAgentsHandler = handler
}

export function addSecondaryHandler(handler: MessageHandler): () => void {
  const g = getGlobal()
  if (!g.__pixelAgentsSecondaryHandlers) {
    g.__pixelAgentsSecondaryHandlers = new Set()
  }
  g.__pixelAgentsSecondaryHandlers.add(handler)
  return () => { g.__pixelAgentsSecondaryHandlers?.delete(handler) }
}

export function sendMessage(msg: Record<string, unknown>): void {
  const ws = getGlobal().__pixelAgentsWs
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}
