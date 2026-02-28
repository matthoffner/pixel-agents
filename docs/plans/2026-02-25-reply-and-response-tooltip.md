# Reply Input & Response Tooltip Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users send replies to agents via an inline text input when a character is selected, and view the agent's last response by hovering over the character.

**Architecture:** Extract assistant text from JSONL transcripts in the extension backend, send it to the webview as `agentResponse` messages, and extend ToolOverlay to display response text on hover and a reply input on selection. Reply submits text directly to the agent's VS Code terminal via `terminal.sendText()`.

**Tech Stack:** TypeScript, VS Code Extension API (`terminal.sendText`), React (webview)

---

### Task 1: Add constants for response text

**Files:**
- Modify: `src/constants.ts`
- Modify: `webview-ui/src/constants.ts`

**Step 1: Add backend constant**

In `src/constants.ts`, add after the Display Truncation section:

```typescript
// ── Agent Response ──────────────────────────────────────────
export const AGENT_RESPONSE_MAX_LENGTH = 500;
```

**Step 2: Add webview constants**

In `webview-ui/src/constants.ts`, add after the `TOOL_OVERLAY_VERTICAL_OFFSET` line:

```typescript
export const RESPONSE_TOOLTIP_MAX_LINES = 3
export const RESPONSE_TOOLTIP_MAX_WIDTH = 320
export const REPLY_INPUT_WIDTH = 260
```

---

### Task 2: Add `lastResponse` to AgentState and extract assistant text

**Files:**
- Modify: `src/types.ts:2-18` — add `lastResponse` field
- Modify: `src/transcriptParser.ts:58-98` — extract assistant text and emit `agentResponse`

**Step 1: Add `lastResponse` to AgentState**

In `src/types.ts`, add to the `AgentState` interface after `hadToolsInTurn`:

```typescript
lastResponse: string;
```

**Step 2: Extract assistant text in processTranscriptLine**

In `src/transcriptParser.ts`, inside the `record.type === 'assistant'` block (line 58), after the `blocks` variable is declared, add logic to extract text content and send it to the webview. The text blocks exist alongside tool_use blocks — we want to capture them regardless of whether tools are present.

After `const blocks = ...` (line 59-61) and before `const hasToolUse = ...` (line 62), add:

```typescript
// Extract assistant text response
const textParts: string[] = [];
for (const block of blocks) {
    if (block.type === 'text' && typeof (block as Record<string, unknown>).text === 'string') {
        textParts.push((block as Record<string, unknown>).text as string);
    }
}
if (textParts.length > 0) {
    const fullText = textParts.join('\n');
    const truncated = fullText.length > AGENT_RESPONSE_MAX_LENGTH
        ? fullText.slice(0, AGENT_RESPONSE_MAX_LENGTH) + '\u2026'
        : fullText;
    agent.lastResponse = truncated;
    webview?.postMessage({
        type: 'agentResponse',
        id: agentId,
        text: truncated,
    });
}
```

Add `AGENT_RESPONSE_MAX_LENGTH` to the import from `./constants.js`.

**Step 3: Initialize `lastResponse` everywhere AgentState is created**

In `src/fileWatcher.ts` `adoptTerminalForFile()` (line 185-200), add `lastResponse: ''` to the AgentState constructor.

In `src/agentManager.ts`, find where AgentState objects are created and add `lastResponse: ''`.

---

### Task 3: Handle `sendReply` message in PixelAgentsViewProvider

**Files:**
- Modify: `src/PixelAgentsViewProvider.ts:64-256` — add `sendReply` handler

**Step 1: Add message handler**

In the `onDidReceiveMessage` handler (after the `closeAgent` handler around line 82), add:

```typescript
} else if (message.type === 'sendReply') {
    const agent = this.agents.get(message.id);
    if (agent) {
        agent.terminalRef.sendText(message.text);
    }
```

This sends the text directly to the terminal. `sendText()` appends a newline by default.

---

### Task 4: Add `agentResponses` state to useExtensionMessages

**Files:**
- Modify: `webview-ui/src/hooks/useExtensionMessages.ts`

**Step 1: Add state**

Add to the state declarations (after `layoutReady` around line 69):

```typescript
const [agentResponses, setAgentResponses] = useState<Record<number, string>>({})
```

**Step 2: Handle `agentResponse` message**

In the message handler, add a case (after `agentToolPermissionClear` handling):

```typescript
} else if (msg.type === 'agentResponse') {
    const id = msg.id as number
    const text = msg.text as string
    setAgentResponses((prev) => ({ ...prev, [id]: text }))
```

**Step 3: Clean up on agent close**

In the `agentClosed` handler, add cleanup for responses:

```typescript
setAgentResponses((prev) => {
    if (!(id in prev)) return prev
    const next = { ...prev }
    delete next[id]
    return next
})
```

**Step 4: Add to ExtensionMessageState interface and return**

Add `agentResponses: Record<number, string>` to the `ExtensionMessageState` interface and the return value.

---

### Task 5: Update ToolOverlay with response tooltip and reply input

**Files:**
- Modify: `webview-ui/src/office/components/ToolOverlay.tsx`

**Step 1: Add props**

Add to `ToolOverlayProps`:

```typescript
agentResponses: Record<number, string>
onSendReply: (id: number, text: string) => void
```

**Step 2: Add reply input state**

Inside the component, add:

```typescript
const [replyText, setReplyText] = useState('')
const [replyAgentId, setReplyAgentId] = useState<number | null>(null)
const inputRef = useRef<HTMLInputElement>(null)
```

When `selectedId` changes (a new agent is selected), clear the reply text:

```typescript
useEffect(() => {
    setReplyText('')
    setReplyAgentId(selectedId)
    // Auto-focus after a short delay to avoid stealing focus during click
    if (selectedId !== null) {
        setTimeout(() => inputRef.current?.focus(), 100)
    }
}, [selectedId])
```

**Step 3: Add response text display (hover tooltip)**

Inside each agent's overlay `<div>`, above the existing status bar, add:

```typescript
{/* Response tooltip - show on hover or selected */}
{responseText && (
    <div
        style={{
            background: 'var(--pixel-bg)',
            border: '2px solid var(--pixel-border)',
            borderRadius: 0,
            padding: '4px 8px',
            boxShadow: 'var(--pixel-shadow)',
            maxWidth: RESPONSE_TOOLTIP_MAX_WIDTH,
            marginBottom: 4,
        }}
    >
        <span
            style={{
                fontSize: '20px',
                color: 'var(--pixel-text-dim)',
                display: '-webkit-box',
                WebkitLineClamp: RESPONSE_TOOLTIP_MAX_LINES,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
            }}
        >
            {responseText}
        </span>
    </div>
)}
```

Where `responseText = agentResponses[id] || (isSub ? '' : '')` is derived at the top of the map callback. For sub-agents, no response is shown.

**Step 4: Add reply input (selected only)**

Below the status bar div, when `isSelected && !isSub`:

```typescript
{isSelected && !isSub && (
    <form
        onSubmit={(e) => {
            e.preventDefault()
            if (replyText.trim()) {
                onSendReply(id, replyText)
                setReplyText('')
            }
        }}
        style={{
            display: 'flex',
            marginTop: 4,
        }}
    >
        <input
            ref={inputRef}
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Escape') {
                    setReplyText('')
                    e.currentTarget.blur()
                }
                e.stopPropagation()
            }}
            placeholder="Type a reply..."
            style={{
                flex: 1,
                width: REPLY_INPUT_WIDTH,
                background: 'var(--pixel-input-bg, #2a2a3e)',
                border: '2px solid var(--pixel-border)',
                borderRadius: 0,
                color: 'var(--vscode-foreground)',
                fontSize: '20px',
                padding: '3px 6px',
                outline: 'none',
                fontFamily: 'inherit',
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
                fontSize: '20px',
                padding: '3px 8px',
                cursor: 'pointer',
                fontFamily: 'inherit',
            }}
        >
            &#x23CE;
        </button>
    </form>
)}
```

**Step 5: Make hovered overlays interactive for response tooltip**

Currently hovered (non-selected) overlays have `pointerEvents: 'none'`. Change so the response tooltip area is visible but doesn't block canvas clicks. The simplest approach: keep `pointerEvents: 'none'` on the whole overlay for hovered agents (the response text is just visual, no interaction needed on hover).

---

### Task 6: Wire up App.tsx

**Files:**
- Modify: `webview-ui/src/App.tsx`

**Step 1: Extract `agentResponses` from useExtensionMessages**

Update the destructuring on line 124:

```typescript
const { agents, selectedAgent, agentTools, agentStatuses, subagentTools, subagentCharacters, layoutReady, loadedAssets, agentResponses } = useExtensionMessages(...)
```

**Step 2: Add reply handler**

```typescript
const handleSendReply = useCallback((id: number, text: string) => {
    vscode.postMessage({ type: 'sendReply', id, text })
}, [])
```

**Step 3: Pass new props to ToolOverlay**

```tsx
<ToolOverlay
    officeState={officeState}
    agents={agents}
    agentTools={agentTools}
    agentResponses={agentResponses}
    subagentCharacters={subagentCharacters}
    containerRef={containerRef}
    zoom={editor.zoom}
    panRef={editor.panRef}
    onCloseAgent={handleCloseAgent}
    onSendReply={handleSendReply}
/>
```

---

### Task 7: Add CSS variable for input background

**Files:**
- Modify: `webview-ui/src/index.css`

**Step 1: Add input background variable**

In the `:root` block, add:

```css
--pixel-input-bg: #2a2a3e;
```

---

### Task 8: Build and verify

**Step 1: Build**

```bash
cd /Users/matthoffner/porch/pixel-agents && npm run build
```

**Step 2: Test in Extension Dev Host (F5)**

1. Open extension dev host
2. Create an agent (+ Agent)
3. Wait for agent to respond
4. Hover over the character — should see last response text as tooltip
5. Click to select — should see reply input appear below status
6. Type a message and press Enter — should appear in the terminal
7. Verify Escape clears the input
8. Verify sub-agents don't show reply input

---

### Summary of all file changes:

| File | Change |
|------|--------|
| `src/constants.ts` | Add `AGENT_RESPONSE_MAX_LENGTH` |
| `webview-ui/src/constants.ts` | Add `RESPONSE_TOOLTIP_MAX_LINES`, `RESPONSE_TOOLTIP_MAX_WIDTH`, `REPLY_INPUT_WIDTH` |
| `src/types.ts` | Add `lastResponse: string` to `AgentState` |
| `src/transcriptParser.ts` | Extract assistant text, emit `agentResponse` message |
| `src/fileWatcher.ts` | Add `lastResponse: ''` to adopted agent state |
| `src/agentManager.ts` | Add `lastResponse: ''` to created agent state |
| `src/PixelAgentsViewProvider.ts` | Handle `sendReply` message |
| `webview-ui/src/hooks/useExtensionMessages.ts` | Add `agentResponses` state, handle `agentResponse`, cleanup on close |
| `webview-ui/src/office/components/ToolOverlay.tsx` | Add response tooltip + reply input |
| `webview-ui/src/App.tsx` | Wire new props |
| `webview-ui/src/index.css` | Add `--pixel-input-bg` CSS variable |
