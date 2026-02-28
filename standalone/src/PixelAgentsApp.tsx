'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { OfficeState } from './office/engine/officeState'
import { OfficeCanvas } from './office/components/OfficeCanvas'
import { ToolOverlay } from './office/components/ToolOverlay'
import { EditorToolbar } from './office/editor/EditorToolbar'
import { EditorState } from './office/editor/editorState'
import { EditTool } from './office/types'
import { isRotatable } from './office/layout/furnitureCatalog'
import { sendMessage } from './lib/messageApi'
import { useWebSocket } from './hooks/useWebSocket'
import { PULSE_ANIMATION_DURATION_SEC } from './constants'
import { useEditorActions } from './hooks/useEditorActions'
import { useEditorKeyboard } from './hooks/useEditorKeyboard'
import { ZoomControls } from './components/ZoomControls'
import { BottomToolbar } from './components/BottomToolbar'
import { DebugView } from './components/DebugView'
import { TranscriptPanel } from './components/TranscriptPanel'
import { RetroTvPanel } from './components/RetroTvPanel'
import { useTvData } from './hooks/useTvData'

// Game state lives outside React — updated imperatively by message handlers
const officeStateRef = { current: null as OfficeState | null }
const editorState = new EditorState()

function getOfficeState(): OfficeState {
  if (!officeStateRef.current) {
    officeStateRef.current = new OfficeState()
  }
  return officeStateRef.current
}

const actionBarBtnStyle: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: '22px',
  background: 'var(--pixel-btn-bg)',
  color: 'var(--pixel-text-dim)',
  border: '2px solid transparent',
  borderRadius: 0,
  cursor: 'pointer',
}

const actionBarBtnDisabled: React.CSSProperties = {
  ...actionBarBtnStyle,
  opacity: 'var(--pixel-btn-disabled-opacity)',
  cursor: 'default',
}

function EditActionBar({ editor, editorState: es }: { editor: ReturnType<typeof useEditorActions>; editorState: EditorState }) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const undoDisabled = es.undoStack.length === 0
  const redoDisabled = es.redoStack.length === 0

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 'var(--pixel-controls-z)',
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        background: 'var(--pixel-bg)',
        border: '2px solid var(--pixel-border)',
        borderRadius: 0,
        padding: '4px 8px',
        boxShadow: 'var(--pixel-shadow)',
      }}
    >
      <button
        style={undoDisabled ? actionBarBtnDisabled : actionBarBtnStyle}
        onClick={undoDisabled ? undefined : editor.handleUndo}
        title="Undo (Ctrl+Z)"
      >
        Undo
      </button>
      <button
        style={redoDisabled ? actionBarBtnDisabled : actionBarBtnStyle}
        onClick={redoDisabled ? undefined : editor.handleRedo}
        title="Redo (Ctrl+Y)"
      >
        Redo
      </button>
      <button
        style={actionBarBtnStyle}
        onClick={editor.handleSave}
        title="Save layout"
      >
        Save
      </button>
      {!showResetConfirm ? (
        <button
          style={actionBarBtnStyle}
          onClick={() => setShowResetConfirm(true)}
          title="Reset to last saved layout"
        >
          Reset
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: '22px', color: 'var(--pixel-reset-text)' }}>Reset?</span>
          <button
            style={{ ...actionBarBtnStyle, background: 'var(--pixel-danger-bg)', color: '#fff' }}
            onClick={() => { setShowResetConfirm(false); editor.handleReset() }}
          >
            Yes
          </button>
          <button
            style={actionBarBtnStyle}
            onClick={() => setShowResetConfirm(false)}
          >
            No
          </button>
        </div>
      )}
    </div>
  )
}

export default function PixelAgentsApp() {
  const editor = useEditorActions(getOfficeState, editorState)

  const isEditDirty = useCallback(() => editor.isEditMode && editor.isDirty, [editor.isEditMode, editor.isDirty])

  const { agents, selectedAgent, agentTools, agentStatuses, agentResponses, agentLastMessages, subagentTools, subagentCharacters, layoutReady, loadedAssets, transcriptData, setTranscriptData } = useWebSocket(getOfficeState, editor.setLastSavedLayout, isEditDirty)

  const [isDebugMode, setIsDebugMode] = useState(false)
  const tv = useTvData()

  const handleToggleDebugMode = useCallback(() => setIsDebugMode((prev) => !prev), [])

  const handleSelectAgent = useCallback((id: number) => {
    sendMessage({ type: 'focusAgent', id })
  }, [])

  const containerRef = useRef<HTMLDivElement>(null)

  const [editorTickForKeyboard, setEditorTickForKeyboard] = useState(0)
  useEditorKeyboard(
    editor.isEditMode,
    editorState,
    editor.handleDeleteSelected,
    editor.handleRotateSelected,
    editor.handleToggleState,
    editor.handleUndo,
    editor.handleRedo,
    useCallback(() => setEditorTickForKeyboard((n) => n + 1), []),
    editor.handleToggleEditMode,
  )

  // Tab key cycles through agents
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      // Don't intercept Tab when typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      // Don't intercept in edit mode
      if (editor.isEditMode) return

      e.preventDefault()
      const os = getOfficeState()
      // Get sorted non-sub-agent IDs
      const agentIds: number[] = []
      for (const ch of os.characters.values()) {
        if (!ch.isSubagent && ch.matrixEffect !== 'despawn') {
          agentIds.push(ch.id)
        }
      }
      if (agentIds.length === 0) return
      agentIds.sort((a, b) => a - b)

      const currentId = os.selectedAgentId
      let nextId: number
      if (currentId === null) {
        nextId = agentIds[0]
      } else {
        const idx = agentIds.indexOf(currentId)
        if (e.shiftKey) {
          // Shift+Tab goes backwards
          nextId = agentIds[idx <= 0 ? agentIds.length - 1 : idx - 1]
        } else {
          nextId = agentIds[(idx + 1) % agentIds.length]
        }
      }

      // Update officeState selection
      os.selectedAgentId = nextId
      os.cameraFollowId = nextId
      // Focus agent + open transcript (same as click)
      sendMessage({ type: 'focusAgent', id: nextId })
      sendMessage({ type: 'requestTranscript', id: nextId })
      tv.close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editor.isEditMode, tv])

  const handleCloseAgent = useCallback((id: number) => {
    sendMessage({ type: 'closeAgent', id })
  }, [])

  const handleSendReply = useCallback((id: number, text: string) => {
    sendMessage({ type: 'sendReply', id, text })
  }, [])

  const handleClick = useCallback((agentId: number) => {
    const os = getOfficeState()
    const meta = os.subagentMeta.get(agentId)
    const focusId = meta ? meta.parentAgentId : agentId
    sendMessage({ type: 'focusAgent', id: focusId })
    sendMessage({ type: 'requestTranscript', id: focusId })
    // Close TV when opening transcript
    tv.close()
  }, [tv])

  const handleFurnitureClick = useCallback((_type: string, _uid: string) => {
    // Close transcript, open TV
    setTranscriptData(null)
    if (!tv.isOpen) {
      tv.open()
    }
  }, [tv, setTranscriptData])

  const handleToggleTv = useCallback(() => {
    if (tv.isOpen) {
      tv.close()
    } else {
      setTranscriptData(null)
      tv.open()
    }
  }, [tv, setTranscriptData])

  const officeState = getOfficeState()

  // Force dependency on editorTickForKeyboard to propagate keyboard-triggered re-renders
  void editorTickForKeyboard

  const showRotateHint = editor.isEditMode && (() => {
    if (editorState.selectedFurnitureUid) {
      const item = officeState.getLayout().furniture.find((f) => f.uid === editorState.selectedFurnitureUid)
      if (item && isRotatable(item.type)) return true
    }
    if (editorState.activeTool === EditTool.FURNITURE_PLACE && isRotatable(editorState.selectedFurnitureType)) {
      return true
    }
    return false
  })()

  const [panelWidth, setPanelWidth] = useState(480)
  const draggingRef = useRef(false)

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    draggingRef.current = true

    const onMouseMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return
      const maxWidth = window.innerWidth * 0.8
      const minWidth = 320
      const newWidth = Math.max(minWidth, Math.min(maxWidth, window.innerWidth - ev.clientX))
      setPanelWidth(newWidth)
    }

    const onMouseUp = () => {
      draggingRef.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  const hasPanel = !!transcriptData || tv.isOpen

  if (!layoutReady) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cccccc' }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
      <style>{`
        @keyframes pixel-agents-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .pixel-agents-pulse { animation: pixel-agents-pulse ${PULSE_ANIMATION_DURATION_SEC}s ease-in-out infinite; }
      `}</style>

      {/* Pixel room — takes remaining space */}
      <div ref={containerRef} style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden', minWidth: 0 }}>
        <OfficeCanvas
          officeState={officeState}
          onClick={handleClick}
          onFurnitureClick={handleFurnitureClick}
          isEditMode={editor.isEditMode}
          editorState={editorState}
          onEditorTileAction={editor.handleEditorTileAction}
          onEditorEraseAction={editor.handleEditorEraseAction}
          onEditorSelectionChange={editor.handleEditorSelectionChange}
          onDeleteSelected={editor.handleDeleteSelected}
          onRotateSelected={editor.handleRotateSelected}
          onDragMove={editor.handleDragMove}
          editorTick={editor.editorTick}
          zoom={editor.zoom}
          onZoomChange={editor.handleZoomChange}
          panRef={editor.panRef}
        />

        <ZoomControls zoom={editor.zoom} onZoomChange={editor.handleZoomChange} />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--pixel-vignette)',
            pointerEvents: 'none',
            zIndex: 40,
          }}
        />

        <BottomToolbar
          isEditMode={editor.isEditMode}
          onOpenClaude={editor.handleOpenClaude}
          onToggleEditMode={editor.handleToggleEditMode}
          isDebugMode={isDebugMode}
          onToggleDebugMode={handleToggleDebugMode}
          isTvOpen={tv.isOpen}
          onToggleTv={handleToggleTv}
        />

        {editor.isEditMode && editor.isDirty && (
          <EditActionBar editor={editor} editorState={editorState} />
        )}

        {showRotateHint && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: '50%',
              transform: editor.isDirty ? 'translateX(calc(-50% + 100px))' : 'translateX(-50%)',
              zIndex: 49,
              background: 'var(--pixel-hint-bg)',
              color: '#fff',
              fontSize: '20px',
              padding: '3px 8px',
              borderRadius: 0,
              border: '2px solid var(--pixel-accent)',
              boxShadow: 'var(--pixel-shadow)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Press <b>R</b> to rotate
          </div>
        )}

        {editor.isEditMode && (() => {
          const selUid = editorState.selectedFurnitureUid
          const selColor = selUid
            ? officeState.getLayout().furniture.find((f) => f.uid === selUid)?.color ?? null
            : null
          return (
            <EditorToolbar
              activeTool={editorState.activeTool}
              selectedTileType={editorState.selectedTileType}
              selectedFurnitureType={editorState.selectedFurnitureType}
              selectedFurnitureUid={selUid}
              selectedFurnitureColor={selColor}
              floorColor={editorState.floorColor}
              wallColor={editorState.wallColor}
              onToolChange={editor.handleToolChange}
              onTileTypeChange={editor.handleTileTypeChange}
              onFloorColorChange={editor.handleFloorColorChange}
              onWallColorChange={editor.handleWallColorChange}
              onSelectedFurnitureColorChange={editor.handleSelectedFurnitureColorChange}
              onFurnitureTypeChange={editor.handleFurnitureTypeChange}
              loadedAssets={loadedAssets}
            />
          )
        })()}

        <ToolOverlay
          officeState={officeState}
          agents={agents}
          agentTools={agentTools}
          agentResponses={agentResponses}
          agentLastMessages={agentLastMessages}
          subagentCharacters={subagentCharacters}
          containerRef={containerRef}
          zoom={editor.zoom}
          panRef={editor.panRef}
          onCloseAgent={handleCloseAgent}
          onSendReply={handleSendReply}
        />

        {isDebugMode && (
          <DebugView
            agents={agents}
            selectedAgent={selectedAgent}
            agentTools={agentTools}
            agentStatuses={agentStatuses}
            subagentTools={subagentTools}
            onSelectAgent={handleSelectAgent}
          />
        )}
      </div>

      {/* Draggable divider + side panel (transcript or TV) */}
      {hasPanel && (
        <>
          <div
            onMouseDown={handleDividerMouseDown}
            style={{
              width: 6,
              flexShrink: 0,
              cursor: 'col-resize',
              background: 'var(--pixel-bg)',
              borderLeft: '2px solid var(--pixel-border)',
              borderRight: '2px solid var(--pixel-border)',
            }}
          />
          <div style={{ width: panelWidth, flexShrink: 0, height: '100%', minWidth: 0 }}>
            {transcriptData ? (
              <TranscriptPanel
                agentId={transcriptData.agentId}
                entries={transcriptData.entries}
                jsonlFile={transcriptData.jsonlFile}
                hasPty={transcriptData.hasPty}
                ptyBuffer={transcriptData.ptyBuffer}
                cwd={transcriptData.cwd}
                onClose={() => setTranscriptData(null)}
                onSendReply={handleSendReply}
                tools={agentTools[transcriptData.agentId]}
                status={agentStatuses[transcriptData.agentId]}
              />
            ) : tv.isOpen ? (
              <RetroTvPanel
                state={tv.state}
                actions={tv.actions}
                onClose={tv.close}
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
