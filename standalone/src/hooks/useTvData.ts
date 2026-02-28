import { useState, useEffect, useCallback } from 'react'
import { sendMessage, addSecondaryHandler } from '../lib/messageApi'

// Types mirrored from server-side gitlabPipelines.ts (avoid importing Node.js module)
export interface PipelineSchedule {
  id: number
  description: string
  ref: string
  cron: string
  cron_timezone: string
  next_run_at: string
  active: boolean
  created_at: string
  updated_at: string
  owner: { id: number; username: string; name: string }
}

export interface Pipeline {
  id: number
  iid: number
  status: string
  ref: string
  sha: string
  source: string
  created_at: string
  updated_at: string
  web_url: string
  duration?: number
}

export interface PipelineJob {
  id: number
  name: string
  stage: string
  status: string
  created_at: string
  started_at: string | null
  finished_at: string | null
  duration: number | null
  web_url: string
  runner?: { id: number; description: string }
}

export type TvScreen = 'schedules' | 'pipelines' | 'jobs' | 'log'

export interface TvBreadcrumb {
  screen: TvScreen
  label: string
}

export interface TvState {
  screen: TvScreen
  breadcrumbs: TvBreadcrumb[]
  loading: boolean
  error: string | null

  schedules: PipelineSchedule[]
  pipelines: Pipeline[]
  jobs: PipelineJob[]
  jobLog: string | null

  // Context for current drilldown
  selectedScheduleId: number | null
  selectedScheduleDesc: string | null
  selectedPipelineId: number | null
  selectedJobId: number | null
  selectedJobName: string | null
}

const initialState: TvState = {
  screen: 'schedules',
  breadcrumbs: [{ screen: 'schedules', label: 'Schedules' }],
  loading: false,
  error: null,
  schedules: [],
  pipelines: [],
  jobs: [],
  jobLog: null,
  selectedScheduleId: null,
  selectedScheduleDesc: null,
  selectedPipelineId: null,
  selectedJobId: null,
  selectedJobName: null,
}

export interface TvActions {
  loadSchedules: () => void
  selectSchedule: (scheduleId: number, description: string) => void
  selectPipeline: (pipelineId: number) => void
  selectJob: (jobId: number, jobName: string) => void
  navigateTo: (index: number) => void
  goBack: () => void
}

export function useTvData(): { state: TvState; actions: TvActions; isOpen: boolean; open: () => void; close: () => void } {
  const [state, setState] = useState<TvState>(initialState)
  const [isOpen, setIsOpen] = useState(false)

  // Register secondary WS handler for tv* messages
  useEffect(() => {
    const remove = addSecondaryHandler((msg) => {
      if (msg.type === 'tvSchedules') {
        if (msg.error) {
          setState((s) => ({ ...s, loading: false, error: msg.error as string }))
        } else {
          setState((s) => ({
            ...s,
            loading: false,
            error: null,
            schedules: msg.schedules as PipelineSchedule[],
          }))
        }
      } else if (msg.type === 'tvPipelines') {
        if (msg.error) {
          setState((s) => ({ ...s, loading: false, error: msg.error as string }))
        } else {
          setState((s) => ({
            ...s,
            loading: false,
            error: null,
            pipelines: msg.pipelines as Pipeline[],
          }))
        }
      } else if (msg.type === 'tvJobs') {
        if (msg.error) {
          setState((s) => ({ ...s, loading: false, error: msg.error as string }))
        } else {
          setState((s) => ({
            ...s,
            loading: false,
            error: null,
            jobs: msg.jobs as PipelineJob[],
          }))
        }
      } else if (msg.type === 'tvJobLog') {
        if (msg.error) {
          setState((s) => ({ ...s, loading: false, error: msg.error as string }))
        } else {
          setState((s) => ({
            ...s,
            loading: false,
            error: null,
            jobLog: msg.log as string,
          }))
        }
      }
    })
    return () => remove()
  }, [])

  const loadSchedules = useCallback(() => {
    setState((s) => ({
      ...s,
      screen: 'schedules',
      breadcrumbs: [{ screen: 'schedules', label: 'Schedules' }],
      loading: true,
      error: null,
    }))
    sendMessage({ type: 'tvRequestSchedules' })
  }, [])

  const selectSchedule = useCallback((scheduleId: number, description: string) => {
    setState((s) => ({
      ...s,
      screen: 'pipelines',
      breadcrumbs: [
        { screen: 'schedules', label: 'Schedules' },
        { screen: 'pipelines', label: description },
      ],
      loading: true,
      error: null,
      selectedScheduleId: scheduleId,
      selectedScheduleDesc: description,
      pipelines: [],
    }))
    sendMessage({ type: 'tvRequestPipelines', scheduleId })
  }, [])

  const selectPipeline = useCallback((pipelineId: number) => {
    setState((s) => ({
      ...s,
      screen: 'jobs',
      breadcrumbs: [
        ...s.breadcrumbs.slice(0, 2),
        { screen: 'jobs', label: `#${pipelineId}` },
      ],
      loading: true,
      error: null,
      selectedPipelineId: pipelineId,
      jobs: [],
    }))
    sendMessage({ type: 'tvRequestJobs', pipelineId })
  }, [])

  const selectJob = useCallback((jobId: number, jobName: string) => {
    setState((s) => ({
      ...s,
      screen: 'log',
      breadcrumbs: [
        ...s.breadcrumbs.slice(0, 3),
        { screen: 'log', label: jobName },
      ],
      loading: true,
      error: null,
      selectedJobId: jobId,
      selectedJobName: jobName,
      jobLog: null,
    }))
    sendMessage({ type: 'tvRequestJobLog', jobId })
  }, [])

  const navigateTo = useCallback((index: number) => {
    setState((s) => {
      const target = s.breadcrumbs[index]
      if (!target) return s
      const newBreadcrumbs = s.breadcrumbs.slice(0, index + 1)
      const newState = { ...s, screen: target.screen, breadcrumbs: newBreadcrumbs, error: null }

      // Re-request data when navigating back
      if (target.screen === 'schedules') {
        sendMessage({ type: 'tvRequestSchedules' })
        return { ...newState, loading: true }
      } else if (target.screen === 'pipelines' && s.selectedScheduleId) {
        sendMessage({ type: 'tvRequestPipelines', scheduleId: s.selectedScheduleId })
        return { ...newState, loading: true }
      } else if (target.screen === 'jobs' && s.selectedPipelineId) {
        sendMessage({ type: 'tvRequestJobs', pipelineId: s.selectedPipelineId })
        return { ...newState, loading: true }
      }
      return newState
    })
  }, [])

  const goBack = useCallback(() => {
    setState((s) => {
      if (s.breadcrumbs.length <= 1) return s
      const index = s.breadcrumbs.length - 2
      const target = s.breadcrumbs[index]
      const newBreadcrumbs = s.breadcrumbs.slice(0, index + 1)
      const newState = { ...s, screen: target.screen, breadcrumbs: newBreadcrumbs, error: null }

      if (target.screen === 'schedules') {
        sendMessage({ type: 'tvRequestSchedules' })
        return { ...newState, loading: true }
      } else if (target.screen === 'pipelines' && s.selectedScheduleId) {
        sendMessage({ type: 'tvRequestPipelines', scheduleId: s.selectedScheduleId })
        return { ...newState, loading: true }
      } else if (target.screen === 'jobs' && s.selectedPipelineId) {
        sendMessage({ type: 'tvRequestJobs', pipelineId: s.selectedPipelineId })
        return { ...newState, loading: true }
      }
      return newState
    })
  }, [])

  const open = useCallback(() => {
    setIsOpen(true)
    // Auto-load schedules when opening
    setState((s) => ({ ...s, loading: true, error: null }))
    sendMessage({ type: 'tvRequestSchedules' })
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    state,
    actions: { loadSchedules, selectSchedule, selectPipeline, selectJob, navigateTo, goBack },
    isOpen,
    open,
    close,
  }
}
