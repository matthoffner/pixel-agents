import * as fs from 'fs'

export interface TranscriptEntry {
  role: 'user' | 'assistant' | 'tool' | 'system'
  text: string
  timestamp?: number
  toolName?: string
}

const MAX_TRANSCRIPT_ENTRIES = 200
const MAX_TEXT_LENGTH = 2000

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '...'
}

export function readTranscript(jsonlFile: string): TranscriptEntry[] {
  let raw: string
  try {
    raw = fs.readFileSync(jsonlFile, 'utf-8')
  } catch {
    return []
  }

  const entries: TranscriptEntry[] = []

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    try {
      const record = JSON.parse(line)
      const ts = record.timestamp ? Number(record.timestamp) : undefined

      if (record.type === 'user') {
        const content = record.message?.content
        if (typeof content === 'string' && content.trim()) {
          entries.push({ role: 'user', text: truncate(content.trim(), MAX_TEXT_LENGTH), timestamp: ts })
        } else if (Array.isArray(content)) {
          // Could be tool_result blocks — skip those, extract text blocks
          for (const block of content) {
            if (block.type === 'text' && typeof block.text === 'string' && block.text.trim()) {
              entries.push({ role: 'user', text: truncate(block.text.trim(), MAX_TEXT_LENGTH), timestamp: ts })
            }
          }
        }
      } else if (record.type === 'assistant' && Array.isArray(record.message?.content)) {
        for (const block of record.message.content) {
          if (block.type === 'text' && typeof block.text === 'string' && block.text.trim()) {
            entries.push({ role: 'assistant', text: truncate(block.text.trim(), MAX_TEXT_LENGTH), timestamp: ts })
          } else if (block.type === 'tool_use') {
            const toolName = block.name || 'unknown'
            const input = block.input || {}
            let detail = ''
            if (toolName === 'Bash' && typeof input.command === 'string') {
              detail = truncate(input.command, 80)
            } else if ((toolName === 'Read' || toolName === 'Edit' || toolName === 'Write') && typeof input.file_path === 'string') {
              detail = input.file_path.split('/').pop() || input.file_path
            } else if (toolName === 'Grep' && typeof input.pattern === 'string') {
              detail = `pattern: ${truncate(input.pattern, 40)}`
            } else if (toolName === 'Glob' && typeof input.pattern === 'string') {
              detail = truncate(input.pattern, 40)
            } else if (toolName === 'Task' && typeof input.description === 'string') {
              detail = truncate(input.description, 60)
            }
            entries.push({
              role: 'tool',
              text: detail ? `${toolName}: ${detail}` : toolName,
              toolName,
              timestamp: ts,
            })
          }
        }
      } else if (record.type === 'system' && record.subtype === 'turn_duration') {
        // Mark turn boundaries
        entries.push({ role: 'system', text: '--- turn complete ---', timestamp: ts })
      }
    } catch {
      // Skip malformed lines
    }
  }

  // Return the most recent entries
  if (entries.length > MAX_TRANSCRIPT_ENTRIES) {
    return entries.slice(-MAX_TRANSCRIPT_ENTRIES)
  }
  return entries
}
