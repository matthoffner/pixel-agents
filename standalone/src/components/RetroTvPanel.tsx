import { useRef, useEffect } from 'react'
import type { TvState, TvActions, PipelineSchedule, Pipeline, PipelineJob } from '../hooks/useTvData'
import { TV_STATUS_COLORS, TV_TEXT_COLOR, TV_DIM_COLOR, TV_HEADER_COLOR, TV_PANEL_BG, TV_ROW_HOVER_BG, TV_ROW_BORDER, TV_STAGE_BORDER, TV_ERROR_COLOR } from '../constants'

// ── Helpers ────────────────────────────────────────────────

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function timeUntil(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff < 0) return 'overdue'
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `in ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `in ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `in ${days}d`
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '-'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}m${secs}s`
}

function statusColor(status: string): string {
  return (TV_STATUS_COLORS as Record<string, string>)[status.toLowerCase()] || TV_DIM_COLOR
}

function statusDot(status: string): string {
  const lower = status.toLowerCase()
  if (lower === 'running') return '◉'
  if (lower === 'pending' || lower === 'created') return '○'
  if (lower === 'manual') return '◎'
  if (lower === 'canceled' || lower === 'skipped') return '◌'
  return '●'
}

// ── Styles ─────────────────────────────────────────────────

const panelStyle: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  background: TV_PANEL_BG,
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

const screenStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: '12px',
  position: 'relative',
  fontFamily: '"Operator Mono", Menlo, Monaco, "Courier New", monospace',
  fontSize: '13px',
  lineHeight: '1.6',
}

const breadcrumbStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  minWidth: 0,
  overflow: 'hidden',
}

const breadcrumbBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: TV_DIM_COLOR,
  cursor: 'pointer',
  fontSize: '13px',
  padding: '0 2px',
  fontFamily: '"Operator Mono", Menlo, Monaco, "Courier New", monospace',
}

const rowStyle: React.CSSProperties = {
  padding: '6px 8px',
  cursor: 'pointer',
  borderBottom: `1px solid ${TV_ROW_BORDER}`,
  transition: 'background 0.1s',
}

// ── Sub-views ──────────────────────────────────────────────

function LoadingIndicator() {
  return (
    <div style={{ color: TV_TEXT_COLOR, textAlign: 'center', marginTop: 40, opacity: 0.7 }}>
      <span className="pixel-agents-pulse">Loading...</span>
    </div>
  )
}

function ErrorDisplay({ error }: { error: string }) {
  return (
    <div style={{ color: TV_ERROR_COLOR, padding: '20px', textAlign: 'center', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {error}
    </div>
  )
}

function formatNextRun(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = d.toDateString() === tomorrow.toDateString()
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `Today ${time}`
  if (isTomorrow) return `Tomorrow ${time}`
  const day = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  return `${day} ${time}`
}

function cronToHuman(cron: string): string {
  const parts = cron.split(/\s+/)
  if (parts.length < 5) return cron
  const [min, hour, , , dow] = parts
  const days: Record<string, string> = { '0': 'Sun', '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', '6': 'Sat', '7': 'Sun' }
  let dayStr = ''
  if (dow === '*') {
    dayStr = 'Daily'
  } else if (dow.includes('-')) {
    const [start, end] = dow.split('-')
    dayStr = `${days[start] || start}–${days[end] || end}`
  } else if (dow.includes(',')) {
    dayStr = dow.split(',').map((d) => days[d] || d).join(', ')
  } else {
    dayStr = days[dow] || dow
  }
  const timeStr = hour !== '*' && min !== '*'
    ? `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`
    : cron
  return `${dayStr} @ ${timeStr}`
}

function ScheduleListView({ schedules, onSelect }: { schedules: PipelineSchedule[]; onSelect: (scheduleId: number, desc: string) => void }) {
  if (schedules.length === 0) {
    return <div style={{ color: TV_DIM_COLOR, textAlign: 'center', marginTop: 40 }}>No schedules found</div>
  }

  // Sort: active first, then by next_run_at
  const sorted = [...schedules].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1
    return new Date(a.next_run_at || 0).getTime() - new Date(b.next_run_at || 0).getTime()
  })

  return (
    <div>
      {/* TV Guide header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
        marginBottom: 8,
        borderBottom: `2px solid ${TV_DIM_COLOR}`,
      }}>
        <span style={{ color: TV_HEADER_COLOR, fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Pipeline Guide
        </span>
        <span style={{ color: TV_DIM_COLOR, fontSize: '11px' }}>
          {sorted.filter((s) => s.active).length} active
        </span>
      </div>

      {sorted.map((s) => {
        const diff = s.next_run_at ? new Date(s.next_run_at).getTime() - Date.now() : Infinity
        const isSoon = diff > 0 && diff < 3600000 // within 1 hour
        const channelColor = s.active ? '#1a3a2a' : '#1a1a22'
        const borderColor = s.active ? (isSoon ? TV_STATUS_COLORS.running : TV_DIM_COLOR) : '#333344'

        return (
          <div
            key={s.id}
            onClick={() => onSelect(s.id, s.description || s.ref)}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(51, 255, 102, 0.08)'; e.currentTarget.style.borderLeftColor = TV_HEADER_COLOR }}
            onMouseLeave={(e) => { e.currentTarget.style.background = channelColor; e.currentTarget.style.borderLeftColor = borderColor }}
            style={{
              display: 'flex',
              alignItems: 'stretch',
              cursor: 'pointer',
              marginBottom: 4,
              background: channelColor,
              borderLeft: `3px solid ${borderColor}`,
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            {/* Time column */}
            <div style={{
              width: 72,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 4px',
              borderRight: `1px solid ${TV_ROW_BORDER}`,
            }}>
              {s.active ? (
                <>
                  <span style={{
                    color: isSoon ? TV_STATUS_COLORS.running : TV_TEXT_COLOR,
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    lineHeight: '1.3',
                  }}>
                    {timeUntil(s.next_run_at)}
                  </span>
                  {isSoon && (
                    <span style={{ color: TV_STATUS_COLORS.running, fontSize: '9px', marginTop: 2 }}>SOON</span>
                  )}
                </>
              ) : (
                <span style={{ color: '#555566', fontSize: '10px' }}>OFF</span>
              )}
            </div>

            {/* Program info */}
            <div style={{ flex: 1, padding: '6px 10px', minWidth: 0 }}>
              <div style={{
                color: s.active ? TV_HEADER_COLOR : '#556666',
                fontSize: '13px',
                fontWeight: 'bold',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: 2,
              }}>
                {s.description || s.ref}
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: '10px', flexWrap: 'wrap' }}>
                <span style={{ color: s.active ? TV_DIM_COLOR : '#444455' }}>
                  {cronToHuman(s.cron)}
                </span>
                <span style={{ color: s.active ? TV_DIM_COLOR : '#444455' }}>
                  {s.ref}
                </span>
              </div>
              {s.active && s.next_run_at && (
                <div style={{ fontSize: '10px', color: TV_DIM_COLOR, marginTop: 2 }}>
                  {formatNextRun(s.next_run_at)}
                </div>
              )}
            </div>

            {/* Arrow indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px',
              color: s.active ? TV_DIM_COLOR : '#333344',
              fontSize: '14px',
            }}>
              ▸
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PipelineListView({ pipelines, onSelect }: { pipelines: Pipeline[]; onSelect: (id: number) => void }) {
  if (pipelines.length === 0) {
    return <div style={{ color: TV_DIM_COLOR, textAlign: 'center', marginTop: 40 }}>No pipelines found</div>
  }

  return (
    <div>
      {pipelines.map((p) => (
        <div
          key={p.id}
          onClick={() => onSelect(p.id)}
          onMouseEnter={(e) => { e.currentTarget.style.background = TV_ROW_HOVER_BG }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          style={rowStyle}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: statusColor(p.status), fontSize: '14px' }}>{statusDot(p.status)}</span>
            <span style={{ color: TV_HEADER_COLOR }}>#{p.id}</span>
            <span style={{ color: statusColor(p.status), fontSize: '11px' }}>{p.status}</span>
            <span style={{ flex: 1 }} />
            <span style={{ color: TV_DIM_COLOR, fontSize: '11px' }}>{formatDuration(p.duration)}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 2, fontSize: '11px' }}>
            <span style={{ color: TV_DIM_COLOR }}>{p.source}</span>
            <span style={{ color: TV_DIM_COLOR }}>{p.ref}</span>
            <span style={{ color: TV_DIM_COLOR }}>{timeAgo(p.updated_at || p.created_at)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function JobListView({ jobs, onSelect }: { jobs: PipelineJob[]; onSelect: (id: number, name: string) => void }) {
  if (jobs.length === 0) {
    return <div style={{ color: TV_DIM_COLOR, textAlign: 'center', marginTop: 40 }}>No jobs found</div>
  }

  // Group by stage
  const stages = new Map<string, PipelineJob[]>()
  for (const job of jobs) {
    const list = stages.get(job.stage) || []
    list.push(job)
    stages.set(job.stage, list)
  }

  return (
    <div>
      {Array.from(stages.entries()).map(([stage, stageJobs]) => (
        <div key={stage} style={{ marginBottom: 12 }}>
          <div style={{
            color: TV_HEADER_COLOR,
            fontSize: '11px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            padding: '4px 8px',
            borderBottom: `1px solid ${TV_STAGE_BORDER}`,
            marginBottom: 4,
          }}>
            {stage}
          </div>
          {stageJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => onSelect(job.id, job.name)}
              onMouseEnter={(e) => { e.currentTarget.style.background = TV_ROW_HOVER_BG }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              style={{ ...rowStyle, paddingLeft: 16 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: statusColor(job.status), fontSize: '14px' }}>{statusDot(job.status)}</span>
                <span style={{ color: TV_TEXT_COLOR, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {job.name}
                </span>
                <span style={{ color: TV_DIM_COLOR, fontSize: '11px' }}>{formatDuration(job.duration)}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function JobLogView({ log }: { log: string | null }) {
  const scrollRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [log])

  if (!log) {
    return <div style={{ color: TV_DIM_COLOR, textAlign: 'center', marginTop: 40 }}>No log data</div>
  }

  return (
    <pre
      ref={scrollRef}
      style={{
        color: TV_TEXT_COLOR,
        fontSize: '11px',
        lineHeight: '1.4',
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        overflow: 'auto',
        maxHeight: '100%',
      }}
    >
      {log}
    </pre>
  )
}

// ── Main Component ─────────────────────────────────────────

interface RetroTvPanelProps {
  state: TvState
  actions: TvActions
  onClose: () => void
}

export function RetroTvPanel({ state, actions, onClose }: RetroTvPanelProps) {
  const renderContent = () => {
    if (state.loading) return <LoadingIndicator />
    if (state.error) return <ErrorDisplay error={state.error} />

    switch (state.screen) {
      case 'schedules':
        return <ScheduleListView schedules={state.schedules} onSelect={actions.selectSchedule} />
      case 'pipelines':
        return <PipelineListView pipelines={state.pipelines} onSelect={actions.selectPipeline} />
      case 'jobs':
        return <JobListView jobs={state.jobs} onSelect={actions.selectJob} />
      case 'log':
        return <JobLogView log={state.jobLog} />
    }
  }

  return (
    <div className="transcript-panel" style={panelStyle}>
      {/* Header with breadcrumbs */}
      <div style={headerStyle}>
        <div style={breadcrumbStyle}>
          {state.breadcrumbs.length > 1 && (
            <button
              onClick={actions.goBack}
              style={{
                ...closeBtnStyle,
                color: TV_DIM_COLOR,
                border: 'none',
                padding: '0 6px',
                fontSize: '16px',
              }}
              title="Go back"
            >
              &lt;
            </button>
          )}
          {state.screen === 'schedules' ? (
            <span style={{ color: TV_HEADER_COLOR, fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '15px' }}>▦</span> CI/CD TV
            </span>
          ) : (
            state.breadcrumbs.map((bc, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {i > 0 && <span style={{ color: TV_DIM_COLOR, fontSize: '11px' }}>/</span>}
                <button
                  onClick={() => actions.navigateTo(i)}
                  style={{
                    ...breadcrumbBtnStyle,
                    color: i === state.breadcrumbs.length - 1 ? TV_HEADER_COLOR : TV_DIM_COLOR,
                    fontWeight: i === state.breadcrumbs.length - 1 ? 'bold' : 'normal',
                  }}
                >
                  {bc.label}
                </button>
              </span>
            ))
          )}
        </div>
        <button style={closeBtnStyle} onClick={onClose} title="Close TV">
          X
        </button>
      </div>

      {/* CRT Screen */}
      <div className="retro-tv-screen" style={screenStyle}>
        {renderContent()}
      </div>
    </div>
  )
}
