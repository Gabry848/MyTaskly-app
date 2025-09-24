# Voice Bot WebSocket - Guida Integrazione

## Endpoint
```
ws://localhost:8080/chat/voice-bot-websocket
```

## Protocollo di Comunicazione

### 1. Autenticazione (OBBLIGATORIA)

**Client → Server:**
```json
{
  "type": "auth",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Server → Client (Successo):**
```json
{
  "type": "status",
  "phase": "authenticated",
  "message": "Autenticato come username (ID: 123)"
}
```

**Server → Client (Errore):**
```json
{
  "type": "error",
  "message": "Token non valido: Invalid or expired token"
}
```

### 2. Invio Audio

**Client → Server:**
```json
{
  "type": "audio_chunk",
  "data": "base64_encoded_audio_data",
  "is_final": false
}
```

```json
{
  "type": "audio_chunk",
  "data": "base64_encoded_audio_data",
  "is_final": true
}
```

### 3. Controlli Real-time

**Client → Server:**
```json
{
  "type": "control",
  "action": "cancel"
}
```

Azioni disponibili: `"cancel"`, `"pause"`, `"resume"`

### 4. Risposte Server

**Stati Pipeline:**
```json
{
  "type": "status",
  "phase": "receiving_audio",
  "message": "Ricevuti 4096 bytes"
}
```

Fasi: `"receiving_audio"`, `"transcription"`, `"ai_processing"`, `"tts_generation"`, `"audio_streaming"`, `"complete"`

**Audio Streaming:**
```json
{
  "type": "audio_chunk",
  "data": "base64_encoded_mp3_chunk",
  "chunk_index": 0
}
```

**Errori:**
```json
{
  "type": "error",
  "message": "Descrizione errore"
}
```

## Flusso Completo

```
1. Client connette WebSocket
2. Client invia autenticazione JWT
3. Server valida e conferma autenticazione
4. Client invia chunks audio (is_final=false)
5. Client invia ultimo chunk (is_final=true)
6. Server elabora: trascrizione → IA + MCP tools → TTS
7. Server stream audio di risposta in chunks
8. Ripete dal punto 4 per nuove richieste
```

## Esempio Codice JavaScript

```javascript
const ws = new WebSocket('ws://localhost:8080/chat/voice-bot-websocket');

// 1. Autenticazione
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: localStorage.getItem('bearer_token') // JWT from login
  }));
};

// 2. Gestione messaggi
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch(data.type) {
    case 'status':
      console.log(`Status: ${data.phase} - ${data.message}`);
      break;

    case 'audio_chunk':
      // Riproduci chunk audio
      playAudioChunk(data.data, data.chunk_index);
      break;

    case 'error':
      console.error('Error:', data.message);
      break;
  }
};

// 3. Invio audio
function sendAudio(audioBlob, isFinal = false) {
  const reader = new FileReader();
  reader.onload = () => {
    const base64 = reader.result.split(',')[1];
    ws.send(JSON.stringify({
      type: 'audio_chunk',
      data: base64,
      is_final: isFinal
    }));
  };
  reader.readAsDataURL(audioBlob);
}

// 4. Controlli
function cancelOperation() {
  ws.send(JSON.stringify({
    type: 'control',
    action: 'cancel'
  }));
}
```

## Note Implementazione

### Autenticazione
- **Token JWT obbligatorio** prima di qualsiasi operazione
- Token deve essere ottenuto da `/auth/login`
- Formato: `"Bearer <token>"` oppure solo `"<token>"`
- Errore 401 se token scaduto/invalido

### Audio Format
- **Formato supportato**: MP3, WAV, M4A
- **Encoding**: Base64 per trasporto WebSocket
- **Chunk size consigliato**: 2-8KB per chunk
- **Sample rate**: 16kHz o 44.1kHz

### Performance
- **Cache TTS**: Risposte identiche vengono cachate (24h)
- **Streaming real-time**: Audio inizia prima che TTS sia completo
- **Metrics**: Performance tracciata automaticamente

### Errori Comuni
- `"Autenticazione richiesta"` → Invia auth prima di audio
- `"Pipeline già in esecuzione"` → Aspetta completion prima di nuovo audio
- `"Token non valido"` → Rinnova JWT da `/auth/login`
- `"Audio vuoto"` → Verifica encoding Base64 corretto

### MCP Tools Integration
Il WebSocket ha accesso completo agli MCP tools dell'utente:
- Gestione task (creazione, modifica, eliminazione)
- Gestione categorie
- Promemoria e notifiche
- Cronologia chat personale

Ogni tool opera nel contesto dell'utente autenticato.