import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { request as httpsRequest } from 'node:https'
import { request as httpRequest } from 'node:http'
import { GITLAB_CACHE_TTL_MS, TV_MAX_PIPELINES, TV_MAX_LOG_LINES, GITLAB_REQUEST_TIMEOUT_MS, GITLAB_API_BASE, GITLAB_DEFAULT_PROJECT } from './constants'

// ── Types ──────────────────────────────────────────────────

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

// ── Token resolution ───────────────────────────────────────

function resolveGitlabToken(): string {
  // Env vars first (multiple common names)
  const envToken = process.env.GITLAB_TOKEN
    || process.env.GITLAB_API_TOKEN
    || process.env.GITLAB_PERSONAL_ACCESS_TOKEN
    || ''
  if (envToken) return envToken

  // Fallback: ~/.gitlab-token file (plain text, one token)
  try {
    const token = readFileSync(join(homedir(), '.gitlab-token'), 'utf8').trim()
    if (token) return token
  } catch {
    // ignore
  }

  // Fallback: ~/.git-credentials (may not have api scope)
  try {
    const creds = readFileSync(join(homedir(), '.git-credentials'), 'utf8')
    const match = creds.match(/glpat-[^\s@]+/)
    if (match) return match[0]
  } catch {
    // ignore
  }

  return ''
}

let cachedToken: string | null = null
function getToken(): string {
  if (cachedToken === null) cachedToken = resolveGitlabToken()
  return cachedToken
}

// ── In-memory cache ────────────────────────────────────────

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<unknown>>()

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > GITLAB_CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() })
}

// ── HTTP helper (same approach as devbox/scripts/dashboard.js) ──

function gitlabRequest(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const opts = {
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      headers: { 'PRIVATE-TOKEN': getToken() },
      // Internal Porch GitLab uses corporate CA — skip TLS verification
      rejectUnauthorized: false,
    }
    const mod = u.protocol === 'https:' ? httpsRequest : httpRequest
    const req = mod(opts, (res) => {
      let data = ''
      res.on('data', (chunk: Buffer) => { data += chunk.toString() })
      res.on('end', () => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          if (res.statusCode === 401) {
            reject(new Error('GitLab API 401 Unauthorized. Your token may be expired or lack the "api" scope. Set GITLAB_TOKEN env var with a PAT that has api access.'))
          } else {
            reject(new Error(`GitLab API ${res.statusCode}: ${data.slice(0, 200)}`))
          }
          return
        }
        resolve(data)
      })
    })
    req.on('error', reject)
    req.setTimeout(GITLAB_REQUEST_TIMEOUT_MS, () => { req.destroy(); reject(new Error('timeout')) })
    req.end()
  })
}

async function gitlabFetch<T>(path: string, asText = false): Promise<T> {
  const token = getToken()
  if (!token) {
    throw new Error('No GitLab token found. Set GITLAB_API_TOKEN or GITLAB_PERSONAL_ACCESS_TOKEN env var, or add credentials to ~/.git-credentials')
  }

  const url = `${GITLAB_API_BASE}${path}`
  const raw = await gitlabRequest(url)

  if (asText) {
    return raw as unknown as T
  }
  return JSON.parse(raw) as T
}

// ── Public API ─────────────────────────────────────────────

export async function fetchSchedules(projectId?: string): Promise<PipelineSchedule[]> {
  const pid = encodeURIComponent(projectId || GITLAB_DEFAULT_PROJECT)
  const cacheKey = `schedules:${pid}`
  const cached = getCached<PipelineSchedule[]>(cacheKey)
  if (cached) return cached

  const data = await gitlabFetch<PipelineSchedule[]>(`/projects/${pid}/pipeline_schedules`)
  setCache(cacheKey, data)
  return data
}

export async function fetchPipelinesForSchedule(projectId?: string, scheduleId?: number): Promise<Pipeline[]> {
  const pid = encodeURIComponent(projectId || GITLAB_DEFAULT_PROJECT)
  const cacheKey = `pipelines:${pid}:schedule:${scheduleId || 'all'}`
  const cached = getCached<Pipeline[]>(cacheKey)
  if (cached) return cached

  let data: Pipeline[]
  if (scheduleId) {
    // Use the dedicated schedule pipelines endpoint — returns only pipelines triggered by this schedule
    data = await gitlabFetch<Pipeline[]>(`/projects/${pid}/pipeline_schedules/${scheduleId}/pipelines?per_page=${TV_MAX_PIPELINES}`)
  } else {
    // Fallback: fetch all pipelines
    data = await gitlabFetch<Pipeline[]>(`/projects/${pid}/pipelines?per_page=${TV_MAX_PIPELINES}`)
  }
  setCache(cacheKey, data)
  return data
}

export async function fetchPipelineJobs(projectId?: string, pipelineId?: number): Promise<PipelineJob[]> {
  const pid = encodeURIComponent(projectId || GITLAB_DEFAULT_PROJECT)
  const cacheKey = `jobs:${pid}:${pipelineId}`
  const cached = getCached<PipelineJob[]>(cacheKey)
  if (cached) return cached

  const data = await gitlabFetch<PipelineJob[]>(`/projects/${pid}/pipelines/${pipelineId}/jobs?per_page=100`)
  setCache(cacheKey, data)
  return data
}

export async function fetchJobLog(projectId?: string, jobId?: number): Promise<string> {
  const pid = encodeURIComponent(projectId || GITLAB_DEFAULT_PROJECT)
  const cacheKey = `log:${pid}:${jobId}`
  const cached = getCached<string>(cacheKey)
  if (cached) return cached

  const raw = await gitlabFetch<string>(`/projects/${pid}/jobs/${jobId}/trace`, true)

  // Strip ANSI escape sequences
  const stripped = raw.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\x1b\][^\x07]*\x07/g, '') // OSC sequences
    .replace(/\r/g, '')

  // Truncate to last N lines
  const lines = stripped.split('\n')
  const truncated = lines.length > TV_MAX_LOG_LINES
    ? lines.slice(-TV_MAX_LOG_LINES).join('\n')
    : stripped

  setCache(cacheKey, truncated)
  return truncated
}

export function hasGitlabToken(): boolean {
  return getToken() !== ''
}
