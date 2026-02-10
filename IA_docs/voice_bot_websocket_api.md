# Voice Bot WebSocket API Documentation

## Endpoint

```
WS /chat/voice-bot-websocket
```

WebSocket endpoint for real-time voice interaction with the AI assistant. Uses the OpenAI Realtime API with MCP tools, handling transcription, AI reasoning, tool execution, and TTS natively — no separate Whisper or TTS calls needed.

---

## Connection Flow

```
Client                          Server
  |                                |
  |--- WebSocket connect --------->|
  |<-- connection accepted --------|
  |                                |
  |--- { type: "auth", token } --->|  Phase 1: Authentication
  |<-- { type: "status",          |
  |      phase: "authenticated" } -|
  |                                |
  |    (server sets up MCP +       |  Phase 2: Setup
  |     RealtimeAgent internally)  |
  |<-- { type: "status",          |
  |      phase: "ready" } ---------|
  |                                |
  |<== bidirectional messages ====>|  Phase 3: Conversation
  |                                |
  |<-- { type: "done" } -----------|  Session ended
```

---

## Phase 1: Authentication

The **first message** sent by the client **must** be an authentication message. Any other message type before authentication will return an error.

### Request

```json
{
  "type": "auth",
  "token": "<JWT_ACCESS_TOKEN>"
}
```

| Field   | Type   | Required | Description                                                        |
|---------|--------|----------|--------------------------------------------------------------------|
| `type`  | string | yes      | Must be `"auth"`                                                   |
| `token` | string | yes      | JWT access token. May optionally include the `"Bearer "` prefix.   |

### Responses

**Success:**

```json
{
  "type": "status",
  "phase": "authenticated",
  "message": "Autenticato come <username> (ID: <user_id>)"
}
```

**Error — missing token:**

```json
{
  "type": "error",
  "message": "Token di autenticazione richiesto"
}
```

**Error — invalid token:**

```json
{
  "type": "error",
  "message": "Token non valido: <detail>"
}
```

**Error — user not found:**

```json
{
  "type": "error",
  "message": "Utente non trovato"
}
```

> After a failed auth attempt the connection remains open and the client can retry.

---

## Phase 2: Setup (automatic)

After successful authentication the server:

1. Reads the user's `voice_gender` preference (`"female"` or `"male"`) and selects the corresponding voice (`coral` / `echo`).
2. Connects to the MCP server with a scoped JWT.
3. Creates a `RealtimeAgent` with MCP tools and the system prompt.
4. Opens the OpenAI Realtime session configured with:
   - Audio format: PCM16
   - Transcription model: `gpt-4o-mini-transcribe` (language: `it`)
   - Turn detection: semantic VAD with interrupt support

When ready the server sends:

```json
{
  "type": "status",
  "phase": "ready",
  "message": "Sessione vocale pronta"
}
```

The client should **wait for this message** before sending audio or text.

---

## Phase 3: Conversation

### Client -> Server messages

#### Send text

```json
{
  "type": "text",
  "content": "Quali task ho per oggi?"
}
```

| Field     | Type   | Required | Description            |
|-----------|--------|----------|------------------------|
| `type`    | string | yes      | `"text"`               |
| `content` | string | yes      | Plain text message     |

#### Send audio

Stream audio data in chunks. Audio must be **PCM16** encoded.

```json
{
  "type": "audio",
  "data": "<base64_encoded_pcm16>"
}
```

| Field  | Type   | Required | Description                        |
|--------|--------|----------|------------------------------------|
| `type` | string | yes      | `"audio"`                          |
| `data` | string | yes      | Base64-encoded PCM16 audio bytes   |

#### Commit audio buffer

Signal the end of an audio utterance to trigger processing:

```json
{
  "type": "audio_commit"
}
```

> Only needed if the client wants to explicitly commit; otherwise semantic VAD handles turn detection automatically.

#### Interrupt

Cancel the current assistant response (e.g. when the user starts speaking):

```json
{
  "type": "interrupt"
}
```

---

### Server -> Client messages

#### Status updates

```json
{
  "type": "status",
  "phase": "<phase>",
  "message": "<description>"
}
```

| `phase`          | Meaning                              |
|------------------|--------------------------------------|
| `authenticated`  | Auth succeeded                       |
| `ready`          | Session ready for input              |
| `interrupted`    | Audio playback interrupted           |
| `audio_end`      | Assistant finished speaking          |
| `agent_start`    | Agent started processing             |
| `agent_end`      | Agent finished processing            |

#### Audio response

```json
{
  "type": "audio",
  "data": "<base64_encoded_pcm16>",
  "chunk_index": 0
}
```

| Field         | Type   | Description                                  |
|---------------|--------|----------------------------------------------|
| `data`        | string | Base64-encoded PCM16 audio chunk             |
| `chunk_index` | int    | Sequential index (resets to 0 each turn)     |

The client should decode and play these chunks sequentially.

#### Transcript

```json
{
  "type": "transcript",
  "role": "user" | "assistant",
  "content": "Hai 3 task per oggi..."
}
```

| Field     | Type   | Description                                  |
|-----------|--------|----------------------------------------------|
| `role`    | string | `"user"` (transcribed speech) or `"assistant"` (generated text) |
| `content` | string | Transcript text                              |

#### Tool execution

**Start:**

```json
{
  "type": "tool_start",
  "tool_name": "get_tasks",
  "arguments": "{\"date\": \"2026-01-29\"}"
}
```

**End:**

```json
{
  "type": "tool_end",
  "tool_name": "get_tasks",
  "output": "[{\"title\": \"Meeting\", ...}]"
}
```

#### Error

```json
{
  "type": "error",
  "message": "<error_description>"
}
```

#### Done

Sent when the session ends cleanly:

```json
{
  "type": "done"
}
```

---

## Audio Format

| Parameter    | Value           |
|--------------|-----------------|
| Encoding     | PCM16 (signed 16-bit little-endian) |
| Sample rate  | 24000 Hz        |
| Channels     | 1 (mono)        |
| Transport    | Base64 over JSON |

---

## Example Client (JavaScript)

```javascript
const ws = new WebSocket("wss://api.mytasklyapp.com/chat/voice-bot-websocket");

ws.onopen = () => {
  // Step 1: Authenticate
  ws.send(JSON.stringify({
    type: "auth",
    token: accessToken
  }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  switch (msg.type) {
    case "status":
      if (msg.phase === "ready") {
        // Session ready — can now send audio/text
        startRecording();
      }
      break;

    case "audio":
      // Decode and enqueue for playback
      const pcm = base64ToArrayBuffer(msg.data);
      audioPlayer.enqueue(pcm);
      break;

    case "transcript":
      console.log(`[${msg.role}]: ${msg.content}`);
      break;

    case "tool_start":
      console.log(`Calling tool: ${msg.tool_name}`);
      break;

    case "tool_end":
      console.log(`Tool result: ${msg.output}`);
      break;

    case "error":
      console.error("Server error:", msg.message);
      break;

    case "done":
      ws.close();
      break;
  }
};

// Send audio chunk from microphone
function onAudioChunk(pcm16Buffer) {
  const b64 = arrayBufferToBase64(pcm16Buffer);
  ws.send(JSON.stringify({ type: "audio", data: b64 }));
}

// Interrupt assistant
function onUserStartsSpeaking() {
  ws.send(JSON.stringify({ type: "interrupt" }));
}
```

---

## Error Handling

| Scenario                    | Behavior                                              |
|-----------------------------|-------------------------------------------------------|
| No auth message first       | Server responds with error, connection stays open     |
| Invalid/expired token       | Server responds with error, client can retry auth     |
| User not found in DB        | Server responds with error, client can retry auth     |
| MCP server unreachable      | Server sends error and closes the connection          |
| OpenAI session failure      | Server sends error and closes the connection          |
| Client disconnects          | Server cleans up MCP and Realtime session gracefully  |
| Unknown message type        | Server responds with error, connection stays open     |

---

## Notes

- The voice used by the assistant depends on the user's `voice_gender` setting in the database (`"female"` -> `coral`, `"male"` -> `echo`).
- Turn detection uses **semantic VAD** — the server automatically detects when the user stops speaking. Manual `audio_commit` is optional.
- The `interrupt` message cancels the current assistant response, useful for barge-in scenarios.
- MCP tools (task management, calendar, etc.) are available to the voice assistant and execute automatically when needed.
- This endpoint does **not** require the `X-API-Key` header (authentication is handled via the WebSocket auth message).
