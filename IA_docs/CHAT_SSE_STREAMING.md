# Chat SSE Streaming - Documentazione

## Panoramica

L'endpoint `/chat/text` utilizza Server-Sent Events (SSE) per inviare risposte in streaming dal server al client. Il sistema è stato aggiornato per gestire la cronologia delle chat lato server tramite `chat_id`, eliminando la necessità di inviare l'intera cronologia ad ogni richiesta.

## Cambiamenti Implementati

### Prima (Vecchio Sistema)
```typescript
// Il client inviava tutta la cronologia messaggi
await sendMessageToBot(
  userMessage,
  modelType,
  previousMessages, // ❌ Tutta la cronologia inviata dal client
  onStreamChunk,
  chatId
);
```

### Dopo (Nuovo Sistema)
```typescript
// Il client invia solo il chat_id per identificare la sessione
await sendMessageToBot(
  userMessage,
  modelType,
  onStreamChunk,
  chatId  // ✅ Solo il chat_id per identificare la chat
);
```

## Formato Request

### Endpoint
```
POST /chat/text
Content-Type: application/json
Authorization: Bearer {token}
```

### Body
```json
{
  "quest": "Il tuo messaggio qui",
  "model": "base" | "advanced",
  "chat_id": "uuid-della-chat-opzionale"
}
```

**Parametri:**
- `quest` (required): Il messaggio dell'utente
- `model` (optional): Tipo di modello ("base" o "advanced", default: "base")
- `chat_id` (optional): ID della chat per continuare una conversazione esistente

## Formato Response (SSE)

Il server invia eventi Server-Sent Events con i seguenti tipi:

### 1. Chat Info Event
Inviato all'inizio dello stream per comunicare il `chat_id` della sessione.

```
data: {"type": "chat_info", "chat_id": "550e8400-e29b-41d4-a716-446655440000", "is_new": true}
```

**Campi:**
- `type`: "chat_info"
- `chat_id`: UUID della sessione di chat
- `is_new`: `true` se è una nuova chat creata automaticamente, `false` se è una chat esistente

### 2. Status Event
Informazioni sullo stato di elaborazione.

```
data: {"type": "status", "message": "Processing with MCP tools..."}
```

### 3. Tool Call Event
Notifica quando viene chiamato un tool MCP.

```
data: {"type": "tool_call", "tool_name": "create_task", "tool_args": {...}, "item_index": 0}
```

**Campi:**
- `type`: "tool_call"
- `tool_name`: Nome del tool chiamato
- `tool_args`: Argomenti passati al tool
- `item_index`: Indice dell'item nel contesto di streaming

### 4. Tool Output Event
Risultato dell'esecuzione di un tool.

```
data: {"type": "tool_output", "tool_name": "create_task", "output": "...", "item_index": 0}
```

**Campi:**
- `type`: "tool_output"
- `tool_name`: Nome del tool
- `output`: Output del tool (JSON stringificato)
- `item_index`: Indice dell'item per correlare con tool_call

### 5. Content Event
Chunk di testo della risposta dell'assistente.

```
data: {"type": "content", "delta": "Ho creato"}
data: {"type": "content", "delta": " il task"}
data: {"type": "content", "delta": " con successo!"}
```

**Campi:**
- `type`: "content"
- `delta`: Frammento di testo da aggiungere alla risposta

### 6. Error Event
Notifica di errore durante l'elaborazione.

```
data: {"type": "error", "message": "Errore durante l'elaborazione"}
```

### 7. Done Event
Indica il completamento dello stream.

```
data: {"type": "done", "message": "Stream completed"}
```

## Esempio Completo di Stream

```
data: {"type": "chat_info", "chat_id": "550e8400-e29b-41d4-a716-446655440000", "is_new": true}

data: {"type": "status", "message": "Processing with MCP tools..."}

data: {"type": "tool_call", "tool_name": "create_task", "tool_args": {"title": "Comprare il latte", "due_date": "2024-01-20"}, "item_index": 0}

data: {"type": "tool_output", "tool_name": "create_task", "output": "{\"success\": true, \"task_id\": 123}", "item_index": 0}

data: {"type": "content", "delta": "Ho creato"}

data: {"type": "content", "delta": " il task"}

data: {"type": "content", "delta": " 'Comprare il latte'"}

data: {"type": "content", "delta": " con scadenza"}

data: {"type": "content", "delta": " il 20 gennaio."}

data: {"type": "done", "message": "Stream completed"}
```

## Gestione Client

### TypeScript Client Implementation

```typescript
import { sendMessageToBot } from './services/botservice';

// Stato per tracciare chat_id
const [currentChatId, setCurrentChatId] = useState<string | null>(null);

// Callback per gestire lo streaming
const onStreamChunk = (
  chunk: string,
  isComplete: boolean,
  toolWidgets?: ToolWidget[],
  chatInfo?: { chat_id: string; is_new: boolean }
) => {
  // Aggiorna chat_id se ricevuto dal server
  if (chatInfo?.chat_id) {
    setCurrentChatId(chatInfo.chat_id);
    if (chatInfo.is_new) {
      console.log('Nuova chat creata:', chatInfo.chat_id);
    }
  }

  // Gestisci chunk di testo
  if (chunk) {
    // Aggiungi chunk al messaggio
  }

  // Gestisci tool widgets
  if (toolWidgets) {
    // Aggiorna UI con widgets
  }

  // Se completato, finalizza il messaggio
  if (isComplete) {
    // Messaggio completato
  }
};

// Invia messaggio
const result = await sendMessageToBot(
  userMessage,
  modelType,
  onStreamChunk,
  currentChatId || undefined
);

// Aggiorna chat_id se cambiato
if (result.chat_id && result.chat_id !== currentChatId) {
  setCurrentChatId(result.chat_id);
}
```

### Gestione Chat History

```typescript
// Carica una chat esistente
import { getChatWithMessages } from './services/chatHistoryService';

const loadChat = async (chatId: string) => {
  const chatData = await getChatWithMessages(chatId);

  // Imposta chat_id corrente
  setCurrentChatId(chatId);

  // Carica messaggi nella UI
  setMessages(chatData.messages.map(msg => ({
    id: msg.message_id.toString(),
    text: msg.content,
    sender: msg.role === 'user' ? 'user' : 'bot',
    // ... altri campi
  })));
};

// Crea nuova chat
import { createNewChat } from './services/botservice';

const startNewChat = async () => {
  const chatId = await createNewChat();
  setCurrentChatId(chatId);
  setMessages([]);
};
```

## Vantaggi del Nuovo Sistema

1. **Riduzione Banda**: Non è più necessario inviare tutta la cronologia ad ogni messaggio
2. **Performance**: Meno dati da processare lato client e server
3. **Scalabilità**: La cronologia è gestita centralmente nel database
4. **Semplicità**: L'API client è più semplice e intuitiva
5. **Consistenza**: La cronologia è sempre sincronizzata con il server

## Retrocompatibilità

Il server supporta ancora richieste senza `chat_id`. In questo caso:
- Viene creata automaticamente una nuova chat
- Il `chat_id` viene restituito nell'evento `chat_info`
- Il client può salvare il `chat_id` per messaggi successivi

## Best Practices

1. **Persistenza Chat ID**: Salva sempre il `chat_id` ricevuto dal server
2. **Gestione Errori**: Implementa fallback se il `chat_id` non è più valido
3. **Nuova Chat**: Resetta il `chat_id` quando l'utente inizia una nuova conversazione
4. **Loading States**: Mostra indicatori di caricamento durante lo streaming
5. **Widget Management**: Usa `item_index` per correlare tool_call e tool_output

## Troubleshooting

### Chat ID non valido
Se il server non trova il `chat_id`, crea automaticamente una nuova chat e restituisce il nuovo ID nell'evento `chat_info`.

### Tool Output con tool_name "unknown"
Il client usa `item_index` per correlare tool_output con tool_call, risolvendo il problema del tool_name "unknown".

### Streaming interrotto
Gestisci l'evento `error` e mostra un messaggio appropriato all'utente.

## Riferimenti

- [Chat History API Documentation](./CHAT_HISTORY_API.md)
- [Bot Service Implementation](../src/services/botservice.ts)
- [Chat History Service](../src/services/chatHistoryService.ts)
