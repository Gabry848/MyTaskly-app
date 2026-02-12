import { Message, ToolWidget, ToolOutputData } from '../types';
import { ChatMessage } from '../../../services/chatHistoryService';

/**
 * Reconstruct UI Messages with ToolWidgets from API chat history messages.
 *
 * When loading a past chat, the API returns messages with tool_name/tool_input/tool_output
 * fields. This function converts those into proper ToolWidget objects attached to the
 * assistant Message, so that inline widget components render correctly
 * (instead of showing raw "[tool_name]" text or duplicating text + widget).
 *
 * Strategy (turn-based):
 * 1. Split conversation into "turns" – each turn starts at a user message
 * 2. Within each turn, messages with tool_name → widget ONLY (never a text bubble)
 * 3. Messages without tool_name → normal text bubble
 * 4. Attach all turn widgets to the last non-tool assistant message of the turn
 * 5. If a turn has ONLY tool messages (no separate text), create a synthetic
 *    empty-text message to hold the widgets (just like streaming does)
 */
export function reconstructMessagesFromHistory(
  apiMessages: ChatMessage[],
  userSender: string = 'user',
  botSender: string = 'bot',
): Message[] {
  // ── Step 1: split into turns ──────────────────────────────────────────
  const turns: ChatMessage[][] = [];
  let currentTurn: ChatMessage[] = [];

  for (const msg of apiMessages) {
    if (msg.role === 'user' && currentTurn.length > 0) {
      turns.push(currentTurn);
      currentTurn = [msg];
    } else {
      currentTurn.push(msg);
    }
  }
  if (currentTurn.length > 0) {
    turns.push(currentTurn);
  }

  // ── Step 2: process each turn ─────────────────────────────────────────
  const result: Message[] = [];
  let globalToolIndex = 0;

  for (const turn of turns) {
    const turnWidgets: ToolWidget[] = [];
    const turnMessages: Message[] = [];

    for (const apiMsg of turn) {
      // ── Tool message → widget ONLY, never a text bubble ──
      if (apiMsg.tool_name) {
        const widget = buildToolWidget(apiMsg, globalToolIndex);
        turnWidgets.push(widget);
        globalToolIndex++;
        // Skip creating any bubble for this message — the widget represents it
        continue;
      }

      // ── Filter out orphan bracket labels from legacy data ──
      const content = apiMsg.content?.trim() || '';
      if (apiMsg.role !== 'user' && isToolLabelContent(content)) {
        continue;
      }

      // ── Normal message → text bubble ──
      if (apiMsg.role === 'user') {
        turnMessages.push(buildUIMessage(apiMsg, userSender));
      } else if (apiMsg.role === 'assistant' || apiMsg.role === 'system') {
        turnMessages.push(buildUIMessage(apiMsg, botSender));
      }
    }

    // ── Attach all turn widgets to the last bot message of this turn ──
    if (turnWidgets.length > 0) {
      const lastBotMsg = findLastBotMessage(turnMessages, botSender);

      if (lastBotMsg) {
        lastBotMsg.toolWidgets = [
          ...(lastBotMsg.toolWidgets || []),
          ...turnWidgets,
        ];
      } else {
        // No non-tool bot message in this turn → create a synthetic empty message
        // so that the widgets still render (just like during streaming the bot
        // message starts empty and widgets appear above it)
        const syntheticTimestamp = turn.length > 0
          ? new Date(turn[turn.length - 1].created_at)
          : new Date();

        turnMessages.push({
          id: `synthetic_${Date.now()}_${globalToolIndex}`,
          text: '',
          sender: botSender as 'user' | 'bot',
          start_time: syntheticTimestamp,
          isStreaming: false,
          isComplete: true,
          toolWidgets: turnWidgets,
        });
      }
    }

    result.push(...turnMessages);
  }

  console.log('[chatHistoryUtils] Reconstructed messages:', {
    apiTotal: apiMessages.length,
    uiTotal: result.length,
    withWidgets: result.filter(m => m.toolWidgets && m.toolWidgets.length > 0).length,
    widgetDetails: result
      .filter(m => m.toolWidgets && m.toolWidgets.length > 0)
      .map(m => ({
        msgId: m.id,
        text: m.text?.substring(0, 40),
        widgets: m.toolWidgets!.map(w => w.toolName),
      })),
  });

  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

/** Parse tool_output and build a ToolWidget from an API message. */
function buildToolWidget(apiMsg: ChatMessage, index: number): ToolWidget {
  let toolOutput = apiMsg.tool_output as any;

  // Unwrap if nested in {type: "text", text: "stringified_json"}
  if (toolOutput?.type === 'text' && typeof toolOutput?.text === 'string') {
    try {
      toolOutput = JSON.parse(toolOutput.text);
    } catch (_) {
      // Keep original if parsing fails
    }
  }

  // If tool_output is a raw string, try parsing it
  if (typeof toolOutput === 'string') {
    try {
      toolOutput = JSON.parse(toolOutput);
    } catch (_) {
      // Keep as-is
    }
  }

  return {
    id: `tool_restored_${index}`,
    toolName: apiMsg.tool_name!,
    status: toolOutput?.success !== false ? 'success' : 'error',
    itemIndex: index,
    toolArgs: apiMsg.tool_input
      ? (typeof apiMsg.tool_input === 'string' ? apiMsg.tool_input : JSON.stringify(apiMsg.tool_input))
      : undefined,
    toolOutput: toolOutput as ToolOutputData,
    errorMessage: toolOutput?.success === false ? toolOutput?.message : undefined,
  };
}

/** Build a UI Message from an API message. */
function buildUIMessage(
  apiMsg: ChatMessage,
  senderValue: string,
): Message {
  return {
    id: apiMsg.message_id.toString(),
    text: apiMsg.content,
    sender: senderValue as 'user' | 'bot',
    start_time: new Date(apiMsg.created_at),
    modelType: apiMsg.model as 'base' | 'advanced' | undefined,
    isStreaming: false,
    isComplete: true,
  };
}

/**
 * Returns true when the content of a non-tool message looks like a tool label
 * and should NOT be shown as a visible chat bubble (legacy/orphan data).
 */
function isToolLabelContent(content: string): boolean {
  if (!content || content.length === 0) return true;
  // "[add_task]", "[show_tasks_to_user]", etc.
  if (/^\[[\w\s._-]+\]$/.test(content)) return true;
  return false;
}

/** Find the last bot message in a list. */
function findLastBotMessage(
  messages: Message[],
  botSender: string,
): Message | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].sender === botSender) return messages[i];
  }
  return undefined;
}
