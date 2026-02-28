# Pixel Agents Roadmap

## Agent Type System

Currently pixel-agents only supports Claude Code. The next major feature is a configurable **agent type** system so each spawned agent can be one of several CLI tools:

### Supported Agent Types

| Agent Type | CLI | Status |
|---|---|---|
| **Claude Code** | `claude --session-id <uuid>` | Supported |
| **OpenAI Codex** | `codex` | Planned |
| **OpenClaw** | `openclaw` | Planned |

### Agent Creation Flow

When clicking **+ Agent**, a creation dialog lets you pick:

1. **Agent type** — Claude Code, Codex, or OpenClaw
2. **Working directory** — browse and select via a directory picker (not a text input)

The agent type determines:
- Which CLI binary to spawn in the PTY session (`ptyManager.ts`)
- How to parse the agent's transcript/output for status tracking (typing, reading, waiting)
- Which session flags to pass (e.g. `--session-id` for Claude, equivalent for others)

### Directory Browser

Server-side directory browsing so you can click through folders instead of typing paths:

- Server endpoint lists directories starting from a configured root (e.g. `~/porch/`)
- Frontend renders a browsable list — click to expand, click to select
- Recently used directories pinned at the top for quick access

### Implementation Notes

- `LaunchOptions` in `agentManager.ts` gets a new `agentType` field
- `ptyManager.ts` builds the spawn command based on agent type instead of hardcoding `claude`
- Transcript parsing needs per-type adapters since Codex and OpenClaw may not use the same JSONL format
- Agent type stored in persisted agent metadata so characters can be restored correctly
- Character sprite or badge could visually distinguish agent types in the office
- Server endpoint: `GET /api/directories?path=<base>` returns `{ name, path, isDirectory }[]`

---

## Project Info & Quick Reference

Each agent's working directory is a project. When you click/select a character, you should be able to see at a glance what they're working on and quickly access related resources.

### Agent Info Panel

Clicking a character (or hovering) shows:

- **Directory** — `~/porch/portkey` displayed as a short label (e.g. "portkey")
- **Agent type** — Claude Code / Codex / OpenClaw icon or label
- **GitLab link** — direct link to the repo (derived from directory name or configured per-project)
- **Notes** — freeform text per agent or per project ("AI platform", "new frontend redesign", etc.)
- **Status** — current activity (typing, reading, idle, waiting)

### Project Registry

A lightweight config file (`~/.pixel-agents/projects.json`) that maps directories to metadata:

```json
{
  "projects": [
    {
      "directory": "~/porch/portkey",
      "name": "Portkey",
      "description": "AI Platform",
      "gitlabUrl": "https://gitlab.porch.com/backend/portkey",
      "notes": ""
    },
    {
      "directory": "~/porch/frontend-insurance-portal",
      "name": "Insurance Portal",
      "description": "New frontend",
      "gitlabUrl": "https://gitlab.porch.com/frontend/frontend-insurance-portal",
      "notes": ""
    }
  ]
}
```

- Auto-populated when you first spawn an agent in a directory (name derived from folder)
- Editable from the UI — click the info panel to update name, description, notes, GitLab URL
- GitLab URL could be auto-detected from `.git/config` remote origin
- No layout changes needed — this is just metadata attached to agents

---

## GitLab Pipeline Agents

Devbox pipelines and other GitLab CI schedules represented as **permanent server agents** — always-on characters that reflect pipeline health.

### Concept

- **Pipeline agents** are not PTY sessions — they're polling-based characters that watch a GitLab pipeline schedule
- Each pipeline agent maps to a GitLab project + schedule, displayed as a character sitting at a desk
- Status is fetched periodically via GitLab API (or `gitlab-mcp`):
  - **Running** — character is typing (active pipeline)
  - **Success** — character is idle/reading (green bubble)
  - **Failed** — character shows error state (red bubble, sound notification)
  - **Scheduled/Pending** — character is waiting
- Clicking the character shows the project info panel with pipeline logs, last run status, and a manual trigger button

### Configuration

- Add pipeline agents through a "+ Pipeline" option alongside "+ Agent"
- Configure: GitLab project path, schedule ID or ref, polling interval
- Pipeline agents persist across sessions (stored in project config)
- Support for multiple pipeline agents (one per schedule)

### Pipeline Management

- Trigger a new pipeline run from the UI
- View recent pipeline history and job logs
- Link to GitLab pipeline page

---

## Other Planned Work

Carried forward from the README:

- **Agent definition** — custom names, system prompts, skills, and skins before launching
- **Agent teams** — visualize multi-agent coordination (Claude Code agent teams, or cross-type collaboration)
- **Git worktree support** — agents in different worktrees to avoid file conflicts
- **Improved status detection** — better heuristics and per-agent-type parsing for state transitions
- **Community assets** — freely usable pixel art tilesets and characters
