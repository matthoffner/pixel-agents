import { useEffect, useRef, useState, useCallback } from 'react'
import { sendMessage, addSecondaryHandler } from '../lib/messageApi'
import type { ToolActivity } from '../office/types'

export interface TranscriptEntry {
  role: 'user' | 'assistant' | 'tool' | 'system'
  text: string
  timestamp?: number
  toolName?: string
}

interface TranscriptPanelProps {
  agentId: number
  entries: TranscriptEntry[]
  jsonlFile: string
  hasPty: boolean
  ptyBuffer?: string
  cwd?: string
  onClose: () => void
  onSendReply?: (id: number, text: string) => void
  tools?: ToolActivity[]
  status?: string
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  background: 'var(--pixel-bg)',
  borderBottom: '2px solid var(--pixel-border)',
  flexShrink: 0,
}

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '2px solid var(--pixel-border)',
  borderRadius: 0,
  color: 'var(--pixel-close-text)',
  cursor: 'pointer',
  fontSize: '18px',
  padding: '2px 8px',
  lineHeight: 1,
}

// ── xterm.js terminal (PTY-backed agents) ─────────────────────

function XtermTerminal({ agentId, ptyBuffer, tools, status }: { agentId: number; ptyBuffer?: string; tools?: ToolActivity[]; status?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<import('@xterm/xterm').Terminal | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const dragCounterRef = useRef(0)

  // Animated cursor that reflects agent activity
  const activity = getActivity(tools, status)
  useEffect(() => {
    const term = termRef.current
    if (!term) return

    if (activity === 'idle') {
      // Gentle breathing: slow pulse between dim and soft green
      term.options.cursorBlink = true
      term.options.cursorStyle = 'block'
      term.options.theme = { ...term.options.theme, cursor: '#3a6b52', cursorAccent: '#0d0d1a' }
      return
    }

    if (activity === 'waiting') {
      // Calm steady block — bright green, no blink, ready for you
      term.options.cursorBlink = false
      term.options.cursorStyle = 'block'
      term.options.theme = { ...term.options.theme, cursor: '#5ac88c', cursorAccent: '#0d0d1a' }
      return
    }

    if (activity === 'permission') {
      // Urgent amber blink
      term.options.cursorBlink = true
      term.options.cursorStyle = 'block'
      term.options.theme = { ...term.options.theme, cursor: '#cca700', cursorAccent: '#0d0d1a' }
      return
    }

    // Tool activity — rainbow cycle through colors while working
    term.options.cursorBlink = false
    term.options.cursorStyle = 'bar'
    const palette = ['#5ac88c', '#8cb4ff', '#cc7aff', '#ff7ab8', '#ffb347', '#5ac88c']
    let i = 0
    const interval = setInterval(() => {
      if (!termRef.current) return
      i = (i + 1) % palette.length
      term.options.theme = { ...term.options.theme, cursor: palette[i], cursorAccent: '#0d0d1a' }
    }, 250)
    return () => clearInterval(interval)
  }, [activity])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    dragCounterRef.current = 0

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    setUploading(true)
    try {
      const paths: string[] = []
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (res.ok) {
          const data = await res.json() as { path: string }
          paths.push(data.path)
        }
      }

      // Paste paths into the terminal
      if (paths.length > 0) {
        const text = paths.join(' ')
        sendMessage({ type: 'terminalInput', id: agentId, data: text })
      }
    } finally {
      setUploading(false)
    }
  }, [agentId])

  useEffect(() => {
    let disposed = false
    let removeHandler: (() => void) | null = null
    let resizeObserver: ResizeObserver | null = null

    async function init() {
      const { Terminal } = await import('@xterm/xterm')
      const { FitAddon } = await import('@xterm/addon-fit')
      const { WebLinksAddon } = await import('@xterm/addon-web-links')

      // Also load xterm CSS
      if (!document.querySelector('link[data-xterm-css]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = '/xterm.css'
        link.dataset.xtermCss = '1'
        document.head.appendChild(link)
      }

      if (disposed || !containerRef.current) return

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 15,
        lineHeight: 1.3,
        fontFamily: '"Operator Mono", Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: '#0d0d1a',
          foreground: '#cccccc',
          cursor: '#5ac88c',
          selectionBackground: 'rgba(90, 140, 255, 0.3)',
        },
        scrollback: 5000,
        convertEol: true,
      })

      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)

      const webLinksAddon = new WebLinksAddon((_event, uri) => {
        window.open(uri, '_blank', 'noopener,noreferrer')
      })
      term.loadAddon(webLinksAddon)

      term.open(containerRef.current)
      termRef.current = term

      // Replay buffered PTY output so scrollback is preserved across agent switches
      if (ptyBuffer) {
        term.write(ptyBuffer)
      }

      // Defer fit to next frame so the container has its final layout dimensions.
      // Without this, switching agents can leave the terminal at 0-size until a resize.
      requestAnimationFrame(() => {
        if (disposed) return
        fitAddon.fit()
        // Send resize to server after fit so cols/rows are accurate
        sendMessage({ type: 'terminalResize', id: agentId, cols: term.cols, rows: term.rows })
        // Focus the terminal so it receives keyboard input immediately
        term.focus()
      })

      // Send keystrokes to server
      term.onData((data) => {
        sendMessage({ type: 'terminalInput', id: agentId, data })
      })

      // Listen for terminal output from server via secondary handler
      removeHandler = addSecondaryHandler((msg) => {
        if (msg.type === 'terminalOutput' && msg.id === agentId) {
          term.write(msg.data as string)
        }
      })

      // Handle container resize
      resizeObserver = new ResizeObserver(() => {
        if (!disposed) {
          fitAddon.fit()
          sendMessage({ type: 'terminalResize', id: agentId, cols: term.cols, rows: term.rows })
        }
      })
      resizeObserver.observe(containerRef.current)
    }

    init()

    return () => {
      disposed = true
      resizeObserver?.disconnect()
      removeHandler?.()
      termRef.current?.dispose()
      termRef.current = null
    }
  }, [agentId])

  return (
    <div
      ref={wrapperRef}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
    >
      <div
        ref={containerRef}
        style={{ height: '100%', padding: '4px 0', overflow: 'hidden' }}
      />
      {(isDragOver || uploading) && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(90, 200, 140, 0.15)',
          border: '2px dashed #5ac88c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          pointerEvents: uploading ? 'none' : 'auto',
        }}>
          <span style={{
            color: '#5ac88c',
            fontSize: '16px',
            fontFamily: 'inherit',
            padding: '8px 16px',
            background: '#0d0d1a',
            border: '2px solid #5ac88c',
          }}>
            {uploading ? 'Uploading...' : 'Drop image to paste path'}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Read-only transcript (adopted agents) ─────────────────────

const scrollStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '8px 12px',
  fontFamily: '"Operator Mono", Menlo, Monaco, "Courier New", monospace',
  fontSize: '13px',
  lineHeight: '1.5',
}

const roleColors: Record<string, string> = {
  user: '#5ac88c',
  assistant: '#8cb4ff',
  tool: '#cca700',
  system: '#666',
}

const roleLabels: Record<string, string> = {
  user: 'You',
  assistant: 'Claude',
  tool: 'Tool',
  system: '',
}

function ReadOnlyTranscript({ entries }: { entries: TranscriptEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries])

  return (
    <div ref={scrollRef} style={scrollStyle}>
      {entries.length === 0 ? (
        <div style={{ color: '#666', textAlign: 'center', marginTop: 40 }}>
          No transcript data yet
        </div>
      ) : (
        entries.map((entry, i) => {
          if (entry.role === 'system') {
            return (
              <div key={i} style={{ color: roleColors.system, textAlign: 'center', margin: '4px 0', fontSize: '10px' }}>
                {entry.text}
              </div>
            )
          }

          const color = roleColors[entry.role] || '#aaa'
          const label = roleLabels[entry.role] || entry.role

          return (
            <div key={i} style={{ marginBottom: 8 }}>
              <span style={{ color, fontWeight: 'bold', fontSize: '11px' }}>
                {entry.role === 'tool' ? (
                  <span style={{ color: roleColors.tool }}>
                    {entry.toolName || 'Tool'}
                  </span>
                ) : (
                  label
                )}
              </span>
              {entry.role === 'tool' ? (
                <span style={{ color: '#999', fontSize: '11px', marginLeft: 8, fontStyle: 'italic' }}>
                  {entry.text}
                </span>
              ) : (
                <div style={{
                  color: entry.role === 'user' ? '#ddd' : '#bbb',
                  marginTop: 2,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {entry.text}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

// ── Main panel (simple flex child, no positioning) ───────────

function ReplyInput({ agentId, onSendReply }: { agentId: number; onSendReply: (id: number, text: string) => void }) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [agentId])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (text.trim()) {
          onSendReply(agentId, text)
          setText('')
        }
      }}
      style={{
        display: 'flex',
        padding: '8px 12px',
        borderTop: '2px solid var(--pixel-border)',
        background: '#0d0d1a',
        flexShrink: 0,
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        placeholder="Send a message..."
        style={{
          flex: 1,
          background: '#1a1a2e',
          border: '2px solid var(--pixel-border)',
          borderRadius: 0,
          color: '#cccccc',
          fontSize: '13px',
          padding: '6px 10px',
          outline: 'none',
          fontFamily: '"Operator Mono", Menlo, Monaco, "Courier New", monospace',
        }}
      />
      <button
        type="submit"
        style={{
          background: 'var(--pixel-accent)',
          border: '2px solid var(--pixel-border)',
          borderLeft: 'none',
          borderRadius: 0,
          color: '#fff',
          fontSize: '13px',
          padding: '6px 12px',
          cursor: 'pointer',
          fontFamily: '"Operator Mono", Menlo, Monaco, "Courier New", monospace',
        }}
      >
        Send
      </button>
    </form>
  )
}

// ── Cursor activity detection ───────────────────────────────

type AgentActivity = 'tool' | 'waiting' | 'permission' | 'idle'

function getActivity(tools?: ToolActivity[], status?: string): AgentActivity {
  if (status === 'waiting') return 'waiting'
  if (status === 'permission') return 'permission'
  if (tools && tools.length > 0) {
    const active = tools.find((t) => !t.done)
    if (active) return 'tool'
  }
  return 'idle'
}

export function TranscriptPanel({ agentId, entries, jsonlFile, hasPty, ptyBuffer, cwd, onClose, onSendReply, tools, status }: TranscriptPanelProps) {
  // Show last directory component of cwd, or fall back to "Agent N"
  const displayName = cwd ? cwd.split('/').filter(Boolean).pop() || cwd : `Agent ${agentId}`
  const [showTranscript, setShowTranscript] = useState(false)
  const hasTranscript = entries.length > 0

  return (
    <div className="transcript-panel" style={{
      height: '100%',
      background: '#0d0d1a',
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
    }}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ color: 'var(--pixel-text)', fontSize: '20px' }}>
            {displayName}
            {hasPty && (
              <span style={{ fontSize: '12px', color: 'var(--pixel-green)', marginLeft: 8 }}>
                LIVE
              </span>
            )}
            {!hasPty && (
              <span style={{ fontSize: '12px', color: 'var(--pixel-text-dim)', marginLeft: 8 }}>
                READ-ONLY
              </span>
            )}
          </span>
          {cwd && (
            <span style={{
              color: 'var(--pixel-text-dim)',
              fontSize: '10px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {cwd}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasPty && hasTranscript && (
            <button
              style={{
                ...closeBtnStyle,
                fontSize: '11px',
                padding: '2px 8px',
                color: showTranscript ? 'var(--pixel-accent)' : 'var(--pixel-text-dim)',
              }}
              onClick={() => setShowTranscript(!showTranscript)}
              title={showTranscript ? 'Hide transcript' : 'Show transcript history'}
            >
              {showTranscript ? 'HIDE LOG' : 'LOG'}
            </button>
          )}
          <button style={closeBtnStyle} onClick={onClose} title="Close panel">
            X
          </button>
        </div>
      </div>

      {hasPty && showTranscript && hasTranscript && (
        <div style={{ maxHeight: '30%', flexShrink: 0, borderBottom: '2px solid var(--pixel-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ReadOnlyTranscript entries={entries} />
        </div>
      )}
      {hasPty && (
        <XtermTerminal agentId={agentId} ptyBuffer={ptyBuffer} tools={tools} status={status} />
      )}
      {!hasPty && hasTranscript && (
        <ReadOnlyTranscript entries={entries} />
      )}
      {!hasPty && !hasTranscript && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
          No transcript data
        </div>
      )}

    </div>
  )
}
