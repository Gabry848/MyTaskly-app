# Documentazione Chat Vocale WebSocket

## Panoramica

Il sistema di chat vocale WebSocket permette comunicazione bidirezionale real-time tra client e server per interazioni vocali con l'assistente IA. Il flusso completo include trascrizione audio, elaborazione IA con strumenti MCP, e sintesi vocale (TTS).

## Endpoint

```
WebSocket: /chat/voice-bot-websocket
```

## Flusso di Comunicazione

### 1. Connessione WebSocket

```javascript
const ws = new WebSocket('wss://api.mytasklyapp.com/chat/voice-bot-websocket');
```

### 2. Autenticazione

**Prima richiesta obbligatoria:** inviare il token JWT per autenticarsi.

```javascript
ws.send(JSON.stringify({
  type: "auth",
  token: "Bearer YOUR_JWT_TOKEN"
}));
```

**Risposta di successo:**
```json
{
  "type": "status",
  "phase": "authenticated",
  "message": "Autenticato come username (ID: 123)"
}
```

**Risposta di errore:**
```json
{
  "type": "error",
  "message": "Token non valido: ..."
}
```

### 3. Invio Audio

Dopo l'autenticazione, puoi inviare chunk audio in formato base64.

**Formato messaggio:**
```javascript
ws.send(JSON.stringify({
  type: "audio_chunk",
  data: base64AudioData,    // Audio codificato in base64
  is_final: false           // true per l'ultimo chunk
}));
```

**Esempio invio completo:**
```javascript
// Registra audio
const audioBlob = await recordAudio();
const reader = new FileReader();

reader.onload = function() {
  const base64Data = reader.result.split(',')[1];

  // Invia chunk
  ws.send(JSON.stringify({
    type: "audio_chunk",
    data: base64Data,
    is_final: true
  }));
};

reader.readAsDataURL(audioBlob);
```

### 4. Ricezione Risposte

Il server invia diversi tipi di messaggi durante l'elaborazione:

#### Status Updates

```json
{
  "type": "status",
  "phase": "transcription|ai_processing|tts_generation|audio_streaming|complete",
  "message": "Descrizione fase corrente"
}
```

**Fasi disponibili:**
- `receiving_audio` - Ricezione chunk audio
- `transcription` - Trascrizione audio con OpenAI Whisper
- `transcription_complete` - Trascrizione completata
- `ai_processing` - Elaborazione IA in corso
- `ai_complete` - Risposta IA generata
- `tts_generation` - Generazione audio TTS
- `audio_streaming` - Streaming chunk audio
- `complete` - Pipeline completata

#### Audio Chunks

```json
{
  "type": "audio_chunk",
  "data": "base64AudioData",
  "chunk_index": 0
}
```

**Esempio ricezione:**
```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === "audio_chunk") {
    const audioData = atob(message.data);
    playAudioChunk(audioData);
  }
};
```

#### Errori

```json
{
  "type": "error",
  "message": "Descrizione errore"
}
```

### 5. Controlli

Puoi inviare comandi di controllo durante l'elaborazione:

```javascript
// Annulla operazione
ws.send(JSON.stringify({
  type: "control",
  action: "cancel"
}));

// Pausa (non implementato completamente)
ws.send(JSON.stringify({
  type: "control",
  action: "pause"
}));

// Riprendi (non implementato completamente)
ws.send(JSON.stringify({
  type: "control",
  action: "resume"
}));
```

## Pipeline di Elaborazione

### Flusso Completo

1. **Ricezione Audio** → Accumula chunk audio fino a `is_final: true`
2. **Trascrizione** → OpenAI Whisper API (lingua: italiano)
3. **Elaborazione IA** → Processamento con MCP tools e cronologia chat limitata (4 messaggi max)
4. **Ottimizzazione Voce** → Riduce risposta per TTS (max 500 caratteri)
5. **Sintesi Vocale** → OpenAI TTS con streaming real-time
6. **Streaming Audio** → Invia chunk MP3 via WebSocket

### Caratteristiche Tecniche

**Trascrizione:**
- Engine: OpenAI Whisper API
- Formato supportato: MP3, altri formati audio
- Lingua: Italiano (forzato)
- Output: Testo trascritto

**Elaborazione IA:**
- Modelli disponibili: base (gpt-3.5-turbo) o advanced (gpt-4)
- Cronologia limitata: 4 messaggi (2 scambi) per voice mode
- Supporto MCP tools per operazioni task/categorie
- Ottimizzazione automatica risposta per voce
- Salvataggio automatico in cronologia chat

**Sintesi Vocale:**
- Engine: OpenAI TTS (tts-1 o tts-1-hd)
- Voci disponibili: female/male (basato su impostazioni utente)
- Formato output: MP3
- Streaming: Real-time chunk-based (2048 bytes)

**Impostazioni Utente:**
- `voice_model`: "base" o "advanced"
- `voice_gender`: "female" o "male"
- `voice_quality`: "standard", "high", "ultra"

## Esempio Completo Client JavaScript

```javascript
class VoiceWebSocketClient {
  constructor(token) {
    this.token = token;
    this.ws = null;
    this.audioQueue = [];
  }

  connect() {
    this.ws = new WebSocket('wss://api.mytasklyapp.com/chat/voice-bot-websocket');

    this.ws.onopen = () => {
      console.log('WebSocket connesso');
      this.authenticate();
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket chiuso');
    };
  }

  authenticate() {
    this.ws.send(JSON.stringify({
      type: "auth",
      token: this.token
    }));
  }

  async sendAudio(audioBlob) {
    const base64Data = await this.blobToBase64(audioBlob);

    this.ws.send(JSON.stringify({
      type: "audio_chunk",
      data: base64Data,
      is_final: true
    }));
  }

  handleMessage(message) {
    switch(message.type) {
      case "status":
        console.log(`Fase: ${message.phase} - ${message.message}`);
        this.updateUI(message);
        break;

      case "audio_chunk":
        this.playAudioChunk(message.data);
        break;

      case "error":
        console.error('Errore:', message.message);
        this.showError(message.message);
        break;
    }
  }

  async playAudioChunk(base64Data) {
    const audioData = atob(base64Data);
    const audioArray = new Uint8Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      audioArray[i] = audioData.charCodeAt(i);
    }

    const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);

    const audio = new Audio(audioUrl);
    this.audioQueue.push(audio);

    if (this.audioQueue.length === 1) {
      this.playNextInQueue();
    }
  }

  playNextInQueue() {
    if (this.audioQueue.length === 0) return;

    const audio = this.audioQueue[0];
    audio.play();

    audio.onended = () => {
      this.audioQueue.shift();
      this.playNextInQueue();
    };
  }

  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  cancel() {
    this.ws.send(JSON.stringify({
      type: "control",
      action: "cancel"
    }));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Utilizzo
const client = new VoiceWebSocketClient('Bearer YOUR_JWT_TOKEN');
client.connect();

// Registra e invia audio
const audioBlob = await recordAudioFromMicrophone();
await client.sendAudio(audioBlob);
```

## Gestione Errori

### Errori Comuni

1. **Autenticazione richiesta**
   ```json
   {
     "type": "error",
     "message": "Autenticazione richiesta prima di inviare audio"
   }
   ```
   **Soluzione:** Inviare messaggio di autenticazione prima di qualsiasi altra operazione.

2. **Pipeline già in esecuzione**
   ```json
   {
     "type": "status",
     "phase": "busy",
     "message": "Pipeline già in esecuzione, attendere..."
   }
   ```
   **Soluzione:** Attendere il completamento della richiesta precedente.

3. **Audio vuoto**
   ```json
   {
     "type": "error",
     "message": "Audio vuoto o non trascrivibile"
   }
   ```
   **Soluzione:** Verificare che l'audio registrato contenga parlato chiaro.

4. **Risposta IA vuota**
   ```json
   {
     "type": "error",
     "message": "Risposta IA vuota o non valida"
   }
   ```
   **Soluzione:** Riprovare la richiesta. Se persiste, contattare supporto.

## Limitazioni e Note

1. **Cronologia Limitata:** Voice mode usa solo gli ultimi 4 messaggi (2 scambi) per evitare token overflow
2. **Lunghezza Risposta:** Le risposte vocali sono limitate a 500 caratteri per TTS ottimale
3. **Formato Audio:** Input deve essere convertibile in MP3
4. **Connessione Singola:** Una sola elaborazione audio alla volta per WebSocket
5. **Cache Disabilitata:** TTS cache rimossa per prevenire contaminazione cross-utente
6. **Timeout:** Nessun timeout automatico implementato (gestire lato client)

## Metriche e Monitoraggio

Il sistema traccia automaticamente le performance di ogni fase:

- Tempo trascrizione
- Tempo elaborazione IA
- Tempo generazione TTS
- Dimensioni audio
- Errori per fase

**Endpoint metriche:**
```
GET /chat/performance-metrics?hours=24
GET /chat/performance-errors?hours=1
```

## Test di Esempio

File di test disponibile: `tests/test_voice_streaming_final.py`

```python
import asyncio
import websockets
import json
import base64

async def test_voice_websocket():
    uri = "ws://localhost:8080/chat/voice-bot-websocket"

    async with websockets.connect(uri) as websocket:
        # 1. Autenticazione
        await websocket.send(json.dumps({
            "type": "auth",
            "token": "Bearer YOUR_TOKEN"
        }))

        response = await websocket.recv()
        print(f"Auth response: {response}")

        # 2. Invio audio
        with open("test_audio.mp3", "rb") as f:
            audio_data = base64.b64encode(f.read()).decode('ascii')

        await websocket.send(json.dumps({
            "type": "audio_chunk",
            "data": audio_data,
            "is_final": True
        }))

        # 3. Ricezione risposte
        audio_chunks = []
        while True:
            message = await websocket.recv()
            data = json.loads(message)

            print(f"Received: {data['type']} - {data.get('phase', '')}")

            if data["type"] == "audio_chunk":
                audio_chunks.append(data["data"])

            if data["type"] == "status" and data["phase"] == "complete":
                break

        # 4. Salva audio ricevuto
        complete_audio = b''.join([base64.b64decode(chunk) for chunk in audio_chunks])
        with open("output.mp3", "wb") as f:
            f.write(complete_audio)

asyncio.run(test_voice_websocket())
```

## Sicurezza

1. **Autenticazione JWT:** Obbligatoria prima di qualsiasi operazione
2. **Validazione Utente:** Verifica esistenza utente nel database
3. **Rate Limiting:** Implementare lato client per evitare abuse
4. **Validazione Input:** Audio e messaggi validati prima dell'elaborazione
5. **Isolamento Utente:** Ogni WebSocket associato a un singolo user_id
6. **No Cross-User Contamination:** Cache disabilitata per TTS personalizzati

## Riferimenti Codice

- **WebSocket Handler:** `voice_bot_websocket()` (linea 668)
- **Pipeline Processing:** `process_voice_websocket_pipeline()` (linea 873)
- **Trascrizione:** `transcribe_audio_openai_whisper()` (linea 80)
- **Elaborazione IA:** `process_chatbot_with_mcp_tools()` (linea 270)
- **Ottimizzazione Voce:** `optimize_voice_response()` (linea 129)
