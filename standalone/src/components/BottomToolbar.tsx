import { useState, useEffect, useCallback } from 'react'
import { SettingsModal } from './SettingsModal'
import { getAgentCwd } from '../hooks/useWebSocket'

interface BottomToolbarProps {
  isEditMode: boolean
  onOpenClaude: (options?: { cwd?: string; continueSession?: boolean }) => void
  onToggleEditMode: () => void
  isDebugMode: boolean
  onToggleDebugMode: () => void
  isTvOpen?: boolean
  onToggleTv?: () => void
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 10,
  left: 10,
  zIndex: 'var(--pixel-controls-z)',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  background: 'var(--pixel-bg)',
  border: '2px solid var(--pixel-border)',
  borderRadius: 0,
  padding: '4px 6px',
  boxShadow: 'var(--pixel-shadow)',
}

const btnBase: React.CSSProperties = {
  padding: '5px 10px',
  fontSize: '24px',
  color: 'var(--pixel-text)',
  background: 'var(--pixel-btn-bg)',
  border: '2px solid transparent',
  borderRadius: 0,
  cursor: 'pointer',
}

const btnActive: React.CSSProperties = {
  ...btnBase,
  background: 'var(--pixel-active-bg)',
  border: '2px solid var(--pixel-accent)',
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '4px 6px',
  fontSize: '20px',
  color: 'var(--pixel-text)',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '2px solid var(--pixel-border)',
  borderRadius: 0,
  outline: 'none',
  fontFamily: 'inherit',
  minWidth: 0,
}

const smallBtnStyle: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: '20px',
  color: 'var(--pixel-text)',
  background: 'var(--pixel-btn-bg)',
  border: '2px solid transparent',
  borderRadius: 0,
  cursor: 'pointer',
}

function AgentCreationModal({
  isOpen,
  onClose,
  onCreateAgent,
}: {
  isOpen: boolean
  onClose: () => void
  onCreateAgent: (options: { cwd?: string; continueSession?: boolean }) => void
}) {
  const [directory, setDirectory] = useState('')
  const [continueSession, setContinueSession] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setDirectory(getAgentCwd())
      setContinueSession(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleCreate = () => {
    const serverCwd = getAgentCwd()
    const options: { cwd?: string; continueSession?: boolean } = {}
    // Only send cwd if different from server default
    if (directory && directory !== serverCwd) {
      options.cwd = directory
    }
    if (continueSession) {
      options.continueSession = true
    }
    onCreateAgent(options)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreate()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.3)',
          zIndex: 49,
        }}
      />
      {/* Modal */}
      <div
        onKeyDown={handleKeyDown}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 50,
          background: 'var(--pixel-bg)',
          border: '2px solid var(--pixel-border)',
          borderRadius: 0,
          padding: '4px',
          boxShadow: 'var(--pixel-shadow)',
          minWidth: 340,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 10px',
            borderBottom: '1px solid var(--pixel-border)',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '24px', color: 'rgba(255, 255, 255, 0.9)' }}>New Agent</span>
          <button
            onClick={onClose}
            onMouseEnter={() => setHovered('close')}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === 'close' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              border: 'none',
              borderRadius: 0,
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
            }}
          >
            X
          </button>
        </div>

        {/* Directory field */}
        <div style={{ padding: '0 10px 8px' }}>
          <label style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '4px' }}>
            Directory
          </label>
          <input
            type="text"
            value={directory}
            onChange={(e) => setDirectory(e.target.value)}
            placeholder="Server default"
            style={inputStyle}
            autoFocus
          />
        </div>

        {/* Continue checkbox */}
        <div style={{ padding: '0 10px 10px' }}>
          <button
            onClick={() => setContinueSession((v) => !v)}
            onMouseEnter={() => setHovered('continue')}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '4px 0',
              fontSize: '20px',
              color: 'rgba(255, 255, 255, 0.8)',
              background: 'transparent',
              border: 'none',
              borderRadius: 0,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                border: '2px solid rgba(255, 255, 255, 0.5)',
                borderRadius: 0,
                background: continueSession ? 'rgba(90, 140, 255, 0.8)' : 'transparent',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                lineHeight: 1,
                color: '#fff',
              }}
            >
              {continueSession ? 'X' : ''}
            </span>
            Continue last session
          </button>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 4,
            padding: '0 10px 8px',
          }}
        >
          <button
            onClick={onClose}
            onMouseEnter={() => setHovered('cancel')}
            onMouseLeave={() => setHovered(null)}
            style={{
              ...smallBtnStyle,
              background: hovered === 'cancel' ? 'rgba(255, 255, 255, 0.12)' : smallBtnStyle.background,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            onMouseEnter={() => setHovered('create')}
            onMouseLeave={() => setHovered(null)}
            style={{
              ...smallBtnStyle,
              background: hovered === 'create' ? 'var(--pixel-agent-hover-bg)' : 'var(--pixel-agent-bg)',
              border: '2px solid var(--pixel-agent-border)',
              color: 'var(--pixel-agent-text)',
            }}
          >
            Create
          </button>
        </div>
      </div>
    </>
  )
}


export function BottomToolbar({
  isEditMode,
  onOpenClaude,
  onToggleEditMode,
  isDebugMode,
  onToggleDebugMode,
  isTvOpen,
  onToggleTv,
}: BottomToolbarProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isCreationOpen, setIsCreationOpen] = useState(false)

  const handleCreateAgent = useCallback((options: { cwd?: string; continueSession?: boolean }) => {
    onOpenClaude(Object.keys(options).length > 0 ? options : undefined)
  }, [onOpenClaude])

  return (
    <div style={panelStyle}>
      <button
        onClick={() => setIsCreationOpen(true)}
        onMouseEnter={() => setHovered('agent')}
        onMouseLeave={() => setHovered(null)}
        style={{
          ...btnBase,
          padding: '5px 12px',
          background:
            hovered === 'agent'
              ? 'var(--pixel-agent-hover-bg)'
              : 'var(--pixel-agent-bg)',
          border: '2px solid var(--pixel-agent-border)',
          color: 'var(--pixel-agent-text)',
        }}
      >
        + Agent
      </button>
      <AgentCreationModal
        isOpen={isCreationOpen}
        onClose={() => setIsCreationOpen(false)}
        onCreateAgent={handleCreateAgent}
      />
      <button
        onClick={onToggleEditMode}
        onMouseEnter={() => setHovered('edit')}
        onMouseLeave={() => setHovered(null)}
        style={
          isEditMode
            ? { ...btnActive }
            : {
                ...btnBase,
                background: hovered === 'edit' ? 'var(--pixel-btn-hover-bg)' : btnBase.background,
              }
        }
        title="Edit office layout"
      >
        Layout
      </button>
      {onToggleTv && (
        <button
          onClick={onToggleTv}
          onMouseEnter={() => setHovered('tv')}
          onMouseLeave={() => setHovered(null)}
          style={
            isTvOpen
              ? { ...btnActive }
              : {
                  ...btnBase,
                  background: hovered === 'tv' ? 'var(--pixel-btn-hover-bg)' : btnBase.background,
                }
          }
          title="Pipeline schedules TV"
        >
          TV
        </button>
      )}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setIsSettingsOpen((v) => !v)}
          onMouseEnter={() => setHovered('settings')}
          onMouseLeave={() => setHovered(null)}
          style={
            isSettingsOpen
              ? { ...btnActive }
              : {
                  ...btnBase,
                  background: hovered === 'settings' ? 'var(--pixel-btn-hover-bg)' : btnBase.background,
                }
          }
          title="Settings"
        >
          Settings
        </button>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          isDebugMode={isDebugMode}
          onToggleDebugMode={onToggleDebugMode}
        />
      </div>
    </div>
  )
}
