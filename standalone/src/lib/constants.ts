// ── Timing (ms) ──────────────────────────────────────────────
export const JSONL_POLL_INTERVAL_MS = 1000
export const FILE_WATCHER_POLL_INTERVAL_MS = 2000
export const PROJECT_SCAN_INTERVAL_MS = 1000
export const TOOL_DONE_DELAY_MS = 300
export const PERMISSION_TIMER_DELAY_MS = 7000
export const TEXT_IDLE_DELAY_MS = 5000

// ── Display Truncation ──────────────────────────────────────
export const BASH_COMMAND_DISPLAY_MAX_LENGTH = 30
export const TASK_DESCRIPTION_DISPLAY_MAX_LENGTH = 40

// ── PNG / Asset Parsing ─────────────────────────────────────
export const PNG_ALPHA_THRESHOLD = 128
export const WALL_PIECE_WIDTH = 16
export const WALL_PIECE_HEIGHT = 32
export const WALL_GRID_COLS = 4
export const WALL_BITMASK_COUNT = 16
export const FLOOR_PATTERN_COUNT = 7
export const FLOOR_TILE_SIZE = 16
export const CHARACTER_DIRECTIONS = ['down', 'up', 'right'] as const
export const CHAR_FRAME_W = 16
export const CHAR_FRAME_H = 32
export const CHAR_FRAMES_PER_ROW = 7
export const CHAR_COUNT = 6

// ── User-Level Layout Persistence ─────────────────────────────
export const LAYOUT_FILE_DIR = '.pixel-agents'
export const LAYOUT_FILE_NAME = 'layout.json'
export const LAYOUT_FILE_POLL_INTERVAL_MS = 2000

// ── Server ─────────────────────────────────────────────────
export const DEFAULT_PORT = 3000
export const TERMINAL_NAME_PREFIX = 'Claude Code'
export const PTY_BUFFER_MAX_BYTES = 256 * 1024 // 256 KB scrollback buffer per agent

// ── TV / GitLab Pipeline Viewer ────────────────────────────
export const GITLAB_CACHE_TTL_MS = 30_000
export const TV_MAX_PIPELINES = 20
export const TV_MAX_LOG_LINES = 500
export const GITLAB_REQUEST_TIMEOUT_MS = 10_000
export const GITLAB_API_BASE = 'https://gitlab.porch.com/api/v4'
export const GITLAB_DEFAULT_PROJECT = 'matth/devbox'
