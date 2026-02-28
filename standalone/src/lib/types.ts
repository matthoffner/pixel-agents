import type { ChildProcess } from 'child_process'

export interface AgentState {
  id: number
  proc: ChildProcess | null
  projectDir: string
  cwd: string
  jsonlFile: string
  fileOffset: number
  lineBuffer: string
  activeToolIds: Set<string>
  activeToolStatuses: Map<string, string>
  activeToolNames: Map<string, string>
  activeSubagentToolIds: Map<string, Set<string>>
  activeSubagentToolNames: Map<string, Map<string, string>>
  isWaiting: boolean
  permissionSent: boolean
  hadToolsInTurn: boolean
  lastAssistantText: string
  hasPty?: boolean
}

export interface PersistedAgent {
  id: number
  sessionId: string
  jsonlFile: string
  projectDir: string
}
