# Chat History API - Documentazione Completa

## Indice
1. [Panoramica](#panoramica)
2. [Architettura](#architettura)
3. [Modelli Database](#modelli-database)
4. [Endpoints API](#endpoints-api)
5. [Esempi di Utilizzo](#esempi-di-utilizzo)
6. [Gestione degli Errori](#gestione-degli-errori)
7. [Limiti e Best Practices](#limiti-e-best-practices)

---

## Panoramica

Il sistema di **Chat History** di MyTaskly permette agli utenti di gestire sessioni di chat persistenti con l'assistente AI. Ogni utente può:

- Creare e gestire più sessioni di chat
- Mantenere la cronologia dei messaggi
- Organizzare le chat con titoli personalizzati
- Pinnare le chat più importanti
- Generare automaticamente titoli significativi
- Eliminare chat non più necessarie

**Base URL:** `http://localhost:8080/chat/history`

**Autenticazione:** Tutti gli endpoint richiedono:
- Header `X-API-Key`: Chiave API configurata nel server
- Header `Authorization: Bearer {token}`: Token JWT ottenuto dal login

---

## Architettura

### Componenti Principali

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATION                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              API Routes (chat_history.py)                   │
│  POST /           GET /         PATCH /{id}   DELETE /{id}  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          Service Layer (chat_history_service.py)            │
│  - create_new_chat()      - list_user_chats()               │
│  - add_message_to_chat()  - update_chat_title()             │
│  - get_chat_history()     - toggle_chat_pin()               │
│  - generate_chat_title()  - delete_chat()                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          CRUD Layer (chat_session & chat_message)           │
│  - create_chat_session()   - get_user_chat_sessions()       │
│  - create_chat_message()   - update_chat_session()          │
│  - get_chat_session()      - delete_chat_session()          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database (PostgreSQL)                      │
│         ChatSession Table    │    ChatMessage Table         │
└─────────────────────────────────────────────────────────────┘
```

### Flusso di Creazione Titolo Automatico

```
User Message → add_message_to_chat() → Primo Messaggio?
                                              │
                                              ▼ Sì
                                       generate_chat_title()
                                              │
                                              ▼
                                         OpenAI API
                                       (gpt-4o-mini)
                                              │
                                              ▼
                                    Titolo Generato (max 50 char)
                                              │
                                              ▼
                                    update_chat_session()
```

---

## Modelli Database

### ChatSession

Rappresenta una sessione di chat completa.

**Tabella:** `chat_sessions`

| Campo                 | Tipo       | Descrizione                                      |
|-----------------------|------------|--------------------------------------------------|
| `chat_id`             | VARCHAR(50)| ID univoco della chat (PK)                       |
| `user_id`             | INT        | ID utente proprietario (FK → users.user_id)      |
| `title`               | VARCHAR(100)| Titolo della chat                               |
| `is_pinned`           | BOOLEAN    | Chat pinnata in alto (default: false)            |
| `created_at`          | TIMESTAMP  | Data/ora creazione                               |
| `updated_at`          | TIMESTAMP  | Data/ora ultimo aggiornamento                    |
| `message_count`       | INT        | Numero totale messaggi (default: 0)              |
| `last_message_preview`| TEXT       | Anteprima ultimo messaggio (max 200 char)        |

**Indici:**
- `idx_chat_user`: (user_id, updated_at DESC) - ottimizza listing per utente
- `idx_chat_pinned`: (user_id, is_pinned, updated_at DESC) - ottimizza filtro pinnati

**Relazioni:**
- `user`: Relazione ForeignKey verso Users
- `messages`: Relazione OneToMany verso ChatMessage

### ChatMessage

Rappresenta un singolo messaggio in una chat.

**Tabella:** `chat_messages`

| Campo        | Tipo         | Descrizione                                    |
|--------------|--------------|------------------------------------------------|
| `message_id` | INT          | ID auto-incrementale (PK)                      |
| `chat_id`    | VARCHAR(50)  | ID chat di appartenenza (FK → chat_sessions)   |
| `role`       | VARCHAR(20)  | Ruolo: 'user', 'assistant', 'system'           |
| `content`    | TEXT         | Contenuto del messaggio                        |
| `created_at` | TIMESTAMP    | Data/ora creazione                             |
| `token_count`| INT          | Numero token (opzionale)                       |
| `model`      | VARCHAR(50)  | Modello AI usato (per assistant, opzionale)    |
| `tool_name`  | VARCHAR(100) | Nome tool MCP chiamato (opzionale)             |
| `tool_input` | JSONB        | Input del tool (opzionale)                     |
| `tool_output`| JSONB        | Output del tool (opzionale)                    |

**Indici:**
- `idx_message_chat`: (chat_id, created_at ASC) - ottimizza recupero cronologico
- `idx_message_role`: (chat_id, role) - ottimizza ricerca per ruolo

**Relazioni:**
- `chat_session`: Relazione ForeignKey verso ChatSession (CASCADE on delete)

---

## Endpoints API

### 1. Crea Nuova Chat Session

Crea una nuova sessione di chat per l'utente autenticato.

**Endpoint:** `POST /chat/history/`

**Headers:**
```http
Authorization: Bearer {access_token}
X-API-Key: {api_key}
Content-Type: application/json
```

**Request Body:**
```json
{
  "chat_id": "optional_custom_id"  // Opzionale: ID personalizzato
}
```

**Response:** `201 Created`
```json
{
  "chat_id": "chat_427649acde81",
  "user_id": 1,
  "title": "New Chat",
  "is_pinned": false,
  "created_at": "2026-01-17T05:43:53.562796Z",
  "updated_at": "2026-01-17T05:43:53.562796Z",
  "message_count": 0,
  "last_message_preview": null
}
```

**Note:**
- Se `chat_id` non viene fornito, viene generato automaticamente (formato: `chat_{12_hex_chars}`)
- Il titolo iniziale è "New Chat", verrà aggiornato automaticamente al primo messaggio utente
- Ogni utente può creare fino a 100 chat (configurabile)

---

### 2. Lista Sessioni Chat

Recupera tutte le sessioni di chat dell'utente autenticato con paginazione.

**Endpoint:** `GET /chat/history/`

**Headers:**
```http
Authorization: Bearer {access_token}
X-API-Key: {api_key}
```

**Query Parameters:**
- `skip` (int, default=0): Numero di record da saltare (paginazione)
- `limit` (int, default=50, max=100): Numero massimo di record da restituire
- `pinned_only` (bool, default=false): Se true, restituisce solo chat pinnate

**Esempi:**
```http
GET /chat/history/?skip=0&limit=20
GET /chat/history/?pinned_only=true
GET /chat/history/?skip=10&limit=5&pinned_only=false
```

**Response:** `200 OK`
```json
{
  "total": 3,
  "chats": [
    {
      "chat_id": "chat_f63a",
      "user_id": 1,
      "title": "AI assistant for your tasks",
      "is_pinned": true,
      "created_at": "2026-01-08T09:20:00Z",
      "updated_at": "2026-01-15T11:30:00Z",
      "message_count": 42,
      "last_message_preview": "I've created 3 new tasks for you..."
    },
    {
      "chat_id": "chat_arcv",
      "user_id": 1,
      "title": "Manage task with me",
      "is_pinned": false,
      "created_at": "2026-01-10T10:30:00Z",
      "updated_at": "2026-01-16T15:45:00Z",
      "message_count": 15,
      "last_message_preview": "Sure, I've updated your task for tomorrow..."
    }
  ]
}
```

**Ordinamento:**
- Chat pinnate appaiono sempre per prime
- All'interno di ciascun gruppo (pinnate/non pinnate): ordine per `updated_at` DESC (più recente prima)

---

### 3. Recupera Chat con Messaggi

Recupera una specifica chat con tutti i suoi messaggi.

**Endpoint:** `GET /chat/history/{chat_id}`

**Headers:**
```http
Authorization: Bearer {access_token}
X-API-Key: {api_key}
```

**Path Parameters:**
- `chat_id` (string): ID della chat da recuperare

**Response:** `200 OK`
```json
{
  "chat_id": "chat_f63a",
  "user_id": 1,
  "title": "Task Management Discussion",
  "is_pinned": true,
  "created_at": "2026-01-08T09:20:00Z",
  "updated_at": "2026-01-15T11:30:00Z",
  "message_count": 3,
  "last_message_preview": "I've created the task for tomorrow.",
  "messages": [
    {
      "message_id": 1,
      "chat_id": "chat_f63a",
      "role": "user",
      "content": "Create a task for tomorrow at 10 AM",
      "created_at": "2026-01-15T11:25:00Z",
      "token_count": 12,
      "model": null,
      "tool_name": null,
      "tool_input": null,
      "tool_output": null
    },
    {
      "message_id": 2,
      "chat_id": "chat_f63a",
      "role": "assistant",
      "content": "I've created the task for tomorrow at 10 AM.",
      "created_at": "2026-01-15T11:30:00Z",
      "token_count": 15,
      "model": "gpt-4",
      "tool_name": "create_task",
      "tool_input": {
        "title": "Meeting",
        "start_time": "2026-01-16T10:00:00Z"
      },
      "tool_output": {
        "task_id": 123,
        "status": "success"
      }
    }
  ]
}
```

**Errori:**
- `404 Not Found`: Chat non trovata o non appartiene all'utente

---

### 4. Aggiorna Chat (Titolo o Pin)

Aggiorna il titolo o lo stato di pin di una chat.

**Endpoint:** `PATCH /chat/history/{chat_id}`

**Headers:**
```http
Authorization: Bearer {access_token}
X-API-Key: {api_key}
Content-Type: application/json
```

**Path Parameters:**
- `chat_id` (string): ID della chat da aggiornare

**Request Body (Aggiorna Titolo):**
```json
{
  "title": "New Custom Title"
}
```

**Request Body (Pin/Unpin):**
```json
{
  "is_pinned": true
}
```

**Response:** `200 OK`
```json
{
  "chat_id": "chat_f63a",
  "user_id": 1,
  "title": "New Custom Title",
  "is_pinned": false,
  "created_at": "2026-01-08T09:20:00Z",
  "updated_at": "2026-01-17T10:15:00Z",
  "message_count": 42,
  "last_message_preview": "I've created 3 new tasks for you..."
}
```

**Validazione:**
- `title`: max 100 caratteri
- `is_pinned`: booleano true/false
- Almeno un campo deve essere fornito

**Errori:**
- `400 Bad Request`: Nessun campo fornito per l'aggiornamento
- `404 Not Found`: Chat non trovata o non appartiene all'utente

---

### 5. Elimina Chat

Elimina permanentemente una chat e tutti i suoi messaggi.

**Endpoint:** `DELETE /chat/history/{chat_id}`

**Headers:**
```http
Authorization: Bearer {access_token}
X-API-Key: {api_key}
```

**Path Parameters:**
- `chat_id` (string): ID della chat da eliminare

**Response:** `204 No Content`

**Note:**
- L'eliminazione è **permanente** e **irreversibile**
- Tutti i messaggi associati vengono eliminati automaticamente (CASCADE)
- Non è possibile recuperare una chat eliminata

**Errori:**
- `404 Not Found`: Chat non trovata o non appartiene all'utente

---

## Esempi di Utilizzo

### Scenario 1: Creazione e Utilizzo Chat Completa

```python
import requests

BASE_URL = "http://localhost:8080"
API_KEY = "abc123"

# 1. Login utente
login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={"username": "TheAdmin", "password": "Ciao"},
    headers={"X-API-Key": API_KEY}
)
token = login_response.json()["bearer_token"]

headers = {
    "Authorization": f"Bearer {token}",
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

# 2. Crea nuova chat
chat_response = requests.post(
    f"{BASE_URL}/chat/history/",
    headers=headers,
    json={}  # ID generato automaticamente
)
chat_id = chat_response.json()["chat_id"]
print(f"Chat creata: {chat_id}")

# 3. Invia primo messaggio (genera titolo automatico)
# Questo avverrebbe tramite l'endpoint chatbot, esempio:
message_response = requests.post(
    f"{BASE_URL}/chat/text",
    headers=headers,
    json={
        "quest": "Come posso creare un task per domani?",
        "chat_id": chat_id
    }
)

# 4. Recupera chat aggiornata
chat_details = requests.get(
    f"{BASE_URL}/chat/history/{chat_id}",
    headers=headers
)
print(f"Titolo generato: {chat_details.json()['title']}")
print(f"Messaggi: {len(chat_details.json()['messages'])}")

# 5. Pinna la chat
requests.patch(
    f"{BASE_URL}/chat/history/{chat_id}",
    headers=headers,
    json={"is_pinned": True}
)

# 6. Lista tutte le chat (pinnate in cima)
all_chats = requests.get(
    f"{BASE_URL}/chat/history/?limit=20",
    headers=headers
)
print(f"Totale chat: {all_chats.json()['total']}")
```

### Scenario 2: Gestione Chat Multiple

```python
# Lista solo chat pinnate
pinned_chats = requests.get(
    f"{BASE_URL}/chat/history/?pinned_only=true",
    headers=headers
)

for chat in pinned_chats.json()['chats']:
    print(f"📌 {chat['title']} - {chat['message_count']} messaggi")

# Paginazione: seconda pagina (10 record per pagina)
page_2 = requests.get(
    f"{BASE_URL}/chat/history/?skip=10&limit=10",
    headers=headers
)

# Aggiorna titolo di una chat specifica
requests.patch(
    f"{BASE_URL}/chat/history/chat_abc123",
    headers=headers,
    json={"title": "Progetto Marketing - Discussione"}
)

# Elimina chat vecchia
requests.delete(
    f"{BASE_URL}/chat/history/chat_old_id",
    headers=headers
)
```

### Scenario 3: Integrazione Frontend React

```javascript
// chatHistoryService.js
const API_BASE = 'http://localhost:8080';
const API_KEY = 'abc123';

class ChatHistoryService {
  constructor(authToken) {
    this.headers = {
      'Authorization': `Bearer ${authToken}`,
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    };
  }

  async createChat(customId = null) {
    const response = await fetch(`${API_BASE}/chat/history/`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ chat_id: customId })
    });
    return response.json();
  }

  async listChats(options = {}) {
    const { skip = 0, limit = 50, pinnedOnly = false } = options;
    const params = new URLSearchParams({
      skip,
      limit,
      pinned_only: pinnedOnly
    });

    const response = await fetch(
      `${API_BASE}/chat/history/?${params}`,
      { headers: this.headers }
    );
    return response.json();
  }

  async getChat(chatId) {
    const response = await fetch(
      `${API_BASE}/chat/history/${chatId}`,
      { headers: this.headers }
    );

    if (!response.ok) {
      throw new Error('Chat not found');
    }

    return response.json();
  }

  async updateTitle(chatId, newTitle) {
    const response = await fetch(
      `${API_BASE}/chat/history/${chatId}`,
      {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({ title: newTitle })
      }
    );
    return response.json();
  }

  async togglePin(chatId, isPinned) {
    const response = await fetch(
      `${API_BASE}/chat/history/${chatId}`,
      {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({ is_pinned: isPinned })
      }
    );
    return response.json();
  }

  async deleteChat(chatId) {
    const response = await fetch(
      `${API_BASE}/chat/history/${chatId}`,
      {
        method: 'DELETE',
        headers: this.headers
      }
    );

    return response.ok;
  }
}

// Utilizzo
const chatService = new ChatHistoryService(userToken);

// Carica lista chat
const { chats, total } = await chatService.listChats({ limit: 20 });

// Crea nuova chat
const newChat = await chatService.createChat();

// Pinna/Spinna chat
await chatService.togglePin('chat_abc123', true);
```

---

## Gestione degli Errori

### Codici di Stato HTTP

| Codice | Significato | Quando Appare |
|--------|-------------|---------------|
| `200` | OK | Richiesta completata con successo |
| `201` | Created | Chat creata con successo |
| `204` | No Content | Chat eliminata con successo |
| `400` | Bad Request | Parametri invalidi o mancanti |
| `401` | Unauthorized | Token mancante o scaduto |
| `403` | Forbidden | API Key mancante o invalida |
| `404` | Not Found | Chat non trovata |
| `500` | Internal Server Error | Errore del server |

### Formato Errori

Gli errori seguono il formato standard FastAPI:

```json
{
  "detail": "Chat session not found"
}
```

### Esempi di Errori Comuni

**1. Token Scaduto (401)**
```json
{
  "detail": "Token has expired"
}
```

**Soluzione:** Effettuare un nuovo login per ottenere un nuovo token.

**2. Chat Non Trovata (404)**
```json
{
  "detail": "Chat session not found"
}
```

**Possibili Cause:**
- `chat_id` inesistente
- Chat appartiene a un altro utente
- Chat eliminata

**3. Parametri Invalidi (400)**
```json
{
  "detail": "No updates provided"
}
```

**Soluzione:** Fornire almeno `title` o `is_pinned` nella richiesta PATCH.

**4. Limite Paginazione Superato (422)**
```json
{
  "detail": [
    {
      "loc": ["query", "limit"],
      "msg": "ensure this value is less than or equal to 100",
      "type": "value_error"
    }
  ]
}
```

**Soluzione:** Utilizzare `limit` ≤ 100.

---

## Limiti e Best Practices

### Limiti di Sistema

| Risorsa | Limite | Configurabile |
|---------|--------|---------------|
| Chat per utente | 100 | Sì (`MAX_CHATS_PER_USER`) |
| Messaggi per chat | Illimitato | No |
| Lunghezza titolo | 100 caratteri | No |
| Lunghezza anteprima | 200 caratteri | No |
| Risultati paginazione | 100 per pagina | No |
| Lunghezza messaggio | Illimitato | No |
| Chat pinnate | Illimitato | No |

### Best Practices

#### 1. Gestione Token di Autenticazione

```python
# ❌ NON FARE - Token hardcoded
headers = {"Authorization": "Bearer eyJhbGc..."}

# ✅ FARE - Token da variabile ambiente o storage sicuro
import os
token = os.getenv("USER_AUTH_TOKEN")
headers = {"Authorization": f"Bearer {token}"}
```

#### 2. Paginazione Efficiente

```python
# ❌ NON FARE - Caricare tutte le chat
all_chats = requests.get(f"{BASE_URL}/chat/history/?limit=100")

# ✅ FARE - Paginazione a piccoli chunk
def get_all_chats_paginated():
    all_chats = []
    skip = 0
    limit = 20

    while True:
        response = requests.get(
            f"{BASE_URL}/chat/history/?skip={skip}&limit={limit}"
        )
        data = response.json()
        all_chats.extend(data['chats'])

        if len(data['chats']) < limit:
            break

        skip += limit

    return all_chats
```

#### 3. Gestione Errori Robusta

```python
# ✅ FARE - Gestione errori completa
def get_chat_safe(chat_id):
    try:
        response = requests.get(
            f"{BASE_URL}/chat/history/{chat_id}",
            headers=headers,
            timeout=10  # Timeout per evitare blocchi
        )
        response.raise_for_status()  # Solleva eccezione per status >= 400
        return response.json()

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            print(f"Chat {chat_id} non trovata")
            return None
        elif e.response.status_code == 401:
            print("Token scaduto, effettua nuovo login")
            # Trigger re-login
            return None
        else:
            print(f"Errore HTTP: {e}")
            raise

    except requests.exceptions.Timeout:
        print("Timeout connessione")
        return None

    except requests.exceptions.RequestException as e:
        print(f"Errore di rete: {e}")
        return None
```

#### 4. Caching Lato Client

```python
# ✅ FARE - Implementare cache per ridurre chiamate API
from datetime import datetime, timedelta

class ChatCache:
    def __init__(self, ttl_seconds=300):  # 5 minuti
        self.cache = {}
        self.ttl = timedelta(seconds=ttl_seconds)

    def get(self, chat_id):
        if chat_id in self.cache:
            data, timestamp = self.cache[chat_id]
            if datetime.now() - timestamp < self.ttl:
                return data
        return None

    def set(self, chat_id, data):
        self.cache[chat_id] = (data, datetime.now())

    def invalidate(self, chat_id):
        if chat_id in self.cache:
            del self.cache[chat_id]

# Utilizzo
cache = ChatCache()

def get_chat_cached(chat_id):
    cached = cache.get(chat_id)
    if cached:
        return cached

    data = get_chat_safe(chat_id)
    if data:
        cache.set(chat_id, data)
    return data
```

#### 5. Ottimizzazione UI

```javascript
// ✅ FARE - Implementare infinite scroll invece di paginazione manuale
class ChatListManager {
  constructor(chatService) {
    this.chatService = chatService;
    this.chats = [];
    this.skip = 0;
    this.limit = 20;
    this.hasMore = true;
  }

  async loadMore() {
    if (!this.hasMore) return;

    const { chats, total } = await this.chatService.listChats({
      skip: this.skip,
      limit: this.limit
    });

    this.chats.push(...chats);
    this.skip += this.limit;
    this.hasMore = this.chats.length < total;

    return chats;
  }

  async refresh() {
    this.chats = [];
    this.skip = 0;
    this.hasMore = true;
    return this.loadMore();
  }
}
```

#### 6. Sincronizzazione Titoli Automatici

```python
# ✅ FARE - Attendere generazione titolo dopo primo messaggio
import time

def create_chat_and_send_message(message):
    # Crea chat
    chat = create_chat()
    chat_id = chat['chat_id']

    # Invia primo messaggio
    send_message(chat_id, message)

    # Attendi brevemente per generazione titolo
    time.sleep(2)

    # Recupera chat con titolo aggiornato
    updated_chat = get_chat(chat_id)

    return updated_chat
```

#### 7. Validazione Input Lato Client

```javascript
// ✅ FARE - Validare prima di inviare al server
function validateChatTitle(title) {
  if (!title || title.trim().length === 0) {
    throw new Error('Title cannot be empty');
  }

  if (title.length > 100) {
    throw new Error('Title must be 100 characters or less');
  }

  return title.trim();
}

async function updateChatTitle(chatId, newTitle) {
  try {
    const validTitle = validateChatTitle(newTitle);
    return await chatService.updateTitle(chatId, validTitle);
  } catch (error) {
    console.error('Validation error:', error.message);
    // Show error to user
  }
}
```

### Performance Tips

1. **Usa `pinned_only=true` quando appropriato** - Riduce il carico quando si cercano solo chat importanti

2. **Implementa debouncing per ricerche** - Non fare una chiamata API per ogni keystroke durante la ricerca

3. **Prefetch chat pinnate** - Carica le chat pinnate all'avvio dell'app per accesso rapido

4. **Lazy loading messaggi** - Carica i messaggi solo quando l'utente apre una chat specifica

5. **Batch operations** - Se devi aggiornare più chat, considera di raggruppare le operazioni

### Sicurezza

1. **Mai esporre API Key nel frontend** - Usa variabili ambiente o proxy backend

2. **Validare sempre lato server** - Non fidarsi mai dei dati client

3. **Implementare rate limiting** - Previeni abusi (già implementato nel server)

4. **Token refresh** - Implementa logica per refresh automatico token prima della scadenza

---

## Note sulla Generazione Titoli

### Modello Utilizzato

- **Modello:** `gpt-4o-mini`
- **Max Tokens:** 20
- **Temperature:** 0.7
- **Costo:** ~$0.0001 per titolo generato

### Prompt di Sistema

```
You are a title generator. Generate a concise, descriptive title
for a chat conversation based on the user's first message.
The title should be maximum 50 characters, in the same language
as the user's message. Return ONLY the title, without quotes or
extra text.
```

### Esempi di Titoli Generati

| Messaggio Utente | Titolo Generato |
|------------------|-----------------|
| "Come posso creare un task per domani?" | "Creazione task per domani" |
| "What's the weather like today in Rome?" | "Weather in Rome today" |
| "Ricordami di comprare il latte domani alle 10" | "Reminder: comprare latte domani" |
| "Can you explain how machine learning works?" | "Machine Learning Explanation" |

### Fallback Strategy

Se la generazione titolo fallisce (API down, errore, timeout):
- **Fallback:** Primi 47 caratteri del messaggio + "..."
- **Esempio:** "This is a very long message that will be trun..."

---

## FAQ

### Q: Posso creare chat con ID personalizzati?
**R:** Sì, puoi fornire un `chat_id` custom nella richiesta di creazione. Se non fornito, viene generato automaticamente nel formato `chat_{12_hex_chars}`.

### Q: Cosa succede ai messaggi quando elimino una chat?
**R:** Tutti i messaggi associati vengono eliminati automaticamente grazie al CASCADE nella relazione database. L'eliminazione è permanente.

### Q: Posso modificare un messaggio già inviato?
**R:** No, i messaggi sono immutabili. Questa è una scelta di design per mantenere l'integrità della cronologia conversazionale.

### Q: Quante chat pinnate posso avere?
**R:** Non c'è limite al numero di chat pinnate. Tuttavia, per UX ottimale, si consiglia di pinnare solo le chat più importanti (3-5).

### Q: Il titolo generato automaticamente può essere cambiato?
**R:** Sì, puoi sempre aggiornare il titolo manualmente tramite l'endpoint PATCH, sovrascrivendo quello generato automaticamente.

### Q: Come funziona l'ordinamento delle chat?
**R:** Le chat sono ordinate per:
1. **Pinnate prima** (is_pinned=true in cima)
2. **All'interno di ogni gruppo:** `updated_at` DESC (più recenti prima)

### Q: Cosa succede se supero il limite di 100 chat?
**R:** La creazione di nuove chat verrà bloccata. Dovrai eliminare chat vecchie per liberare spazio.

### Q: I messaggi con tool calls vengono salvati?
**R:** Sì, i messaggi con chiamate MCP tools includono `tool_name`, `tool_input` e `tool_output` per tracciare l'intero flusso conversazionale.

---

## Changelog

### v1.0.0 (2026-01-17)
- ✅ Implementazione completa sistema Chat History
- ✅ CRUD operations per chat sessions
- ✅ Gestione messaggi con metadata tool calls
- ✅ Generazione automatica titoli con GPT-4o-mini
- ✅ Sistema pin/unpin chat
- ✅ Paginazione con ordinamento intelligente
- ✅ Cascade deletion per messaggi
- ✅ Validazione e gestione errori
- ✅ Test suite completa (19/19 test passed)
- ✅ Documentazione API completa

---

## Supporto

Per problemi o domande:
- **Issues:** GitHub repository
- **Email:** support@mytasklyapp.com
- **Documentazione tecnica:** `/docs` endpoint Swagger UI

---

**Versione Documentazione:** 1.0.0
**Ultimo Aggiornamento:** 2026-01-17
**Autore:** MyTaskly Team
