# MyTaskly Chatbot Text Endpoint - Guida Completa

## Panoramica

L'endpoint `/chat/text` è il cuore dell'intelligenza artificiale di MyTaskly. Permette agli utenti di interagire con un assistente AI che può creare, modificare e visualizzare task, categorie e note attraverso il protocollo MCP (Model Context Protocol).

**Endpoint**: `POST /chat/text`

**Autenticazione**: Richiesta (JWT token via header `Authorization: Bearer <token>`)

**Tipo di risposta**: Server-Sent Events (SSE) streaming

---

## Architettura

### Flusso di Elaborazione

```
User Input → OpenAI Agent → MCP Tools → Database → Formatted Response → SSE Stream → React Native App
```

### Componenti Chiave

1. **OpenAI Agents SDK**: Gestisce la logica conversazionale e le decisioni
2. **MCP Server Esterno**: Fornisce strumenti per manipolare task, categorie, note
3. **Sistema di Visualizzazione**: Determina quali output mostrare all'utente
4. **Streaming SSE**: Invia risposte in tempo reale chunk per chunk

---

## Formato della Richiesta

### Schema JSON

```json
{
  "quest": "string (richiesto)",
  "model": "string (opzionale: 'base' o 'advanced')",
  "previous_messages": [
    {
      "role": "user | assistant",
      "content": "string"
    }
  ]
}
```

### Parametri

- **quest**: La domanda/richiesta dell'utente (max consigliato: 500 caratteri)
- **model**:
  - `"base"` → usa GPT-3.5-Turbo (più veloce, meno costoso)
  - `"advanced"` → usa GPT-4 (più intelligente, più lento)
  - Default: `"advanced"`
- **previous_messages**: Storico conversazione per contesto (max consigliato: 6 messaggi recenti)

---

## Formato della Risposta (SSE)

L'endpoint ritorna un flusso di eventi Server-Sent Events. Ogni evento è nel formato:

```
data: {JSON object}\n\n
```

### Tipi di Eventi

#### 1. Status Event
```json
{
  "type": "status",
  "message": "Processing with MCP tools..."
}
```

Indica che l'AI sta elaborando la richiesta.

#### 2. Tool Call Event
```json
{
  "type": "tool_call",
  "tool_name": "add_task",
  "tool_args": {
    "title": "Riunione team",
    "category_name": "Lavoro",
    "end_time": "2025-12-15T10:00:00"
  },
  "item_index": 0
}
```

Mostra quale strumento MCP l'AI sta chiamando e con quali parametri.

#### 3. Tool Output Event
```json
{
  "type": "tool_output",
  "tool_name": "add_task",
  "output": "{\"success\": true, \"type\": \"task_created\", ...}",
  "item_index": 1
}
```

Ritorna il risultato dello strumento MCP chiamato. Questo output può contenere dati per la visualizzazione UI.

#### 4. Content Event (streaming della risposta)
```json
{
  "type": "content",
  "delta": "Ho creato il task "
}
```

Parte della risposta testuale dell'AI, inviata chunk per chunk (50 caratteri alla volta).

#### 5. Done Event
```json
{
  "type": "done",
  "message": "Stream completed"
}
```

Indica che lo streaming è terminato.

#### 6. Error Event
```json
{
  "type": "error",
  "message": "Errore MCP: Database connection failed"
}
```

Indica un errore durante l'elaborazione.

---

## Casi d'Uso ed Esempi

### Caso 1: Creazione di un Task Semplice

**INPUT:**
```json
{
  "quest": "Crea un task Riunione team per domani alle 10",
  "model": "advanced"
}
```

**OUTPUT (sequenza eventi SSE):**

```
data: {"type": "status", "message": "Processing with MCP tools..."}

data: {"type": "tool_call", "tool_name": "add_task", "tool_args": {"title": "Riunione team", "end_time": "2025-12-16T10:00:00", "priority": "MEDIA"}, "item_index": 0}

data: {"type": "tool_output", "tool_name": "add_task", "output": "{\"success\": true, \"type\": \"task_created\", \"message\": \"✅ Task 'Riunione team' creato con successo\", \"task\": {\"task_id\": 42, \"title\": \"Riunione team\", \"end_time\": \"2025-12-16T10:00:00\", \"priority\": \"MEDIA\", \"status\": \"IN_SOSPESO\"}}", "item_index": 1}

data: {"type": "content", "delta": "Ho creato il task "}

data: {"type": "content", "delta": "'Riunione team' per domani alle 10:00"}

data: {"type": "content", "delta": ". Il task è stato salvato con successo!"}

data: {"type": "done", "message": "Stream completed"}
```

**VISUALIZZAZIONE APP:**
- Mostra notifica di successo: "✅ Task 'Riunione team' creato con successo"
- Mostra bottone "Modifica Riunione team" (grazie a `type: "task_created"`)
- Mostra il testo dell'AI nella chat

---

### Caso 2: Visualizzazione Lista Task

**INPUT:**
```json
{
  "quest": "Mostrami i miei task di oggi",
  "model": "base"
}
```

**OUTPUT:**

```
data: {"type": "status", "message": "Processing with MCP tools..."}

data: {"type": "tool_call", "tool_name": "show_tasks_to_user", "tool_args": {"filter_type": "today"}, "item_index": 0}

data: {"type": "tool_output", "tool_name": "show_tasks_to_user", "output": "{\"type\": \"task_list\", \"version\": \"1.0\", \"tasks\": [{\"id\": 1, \"title\": \"Riunione team\", \"endTimeFormatted\": \"Oggi, 10:00\", \"category\": \"Lavoro\", \"categoryColor\": \"#3B82F6\", \"priority\": \"Alta\", \"priorityEmoji\": \"[!]\", \"priorityColor\": \"#EF4444\", \"status\": \"In sospeso\", \"actions\": {...}}, {...}], \"summary\": {\"total\": 5, \"pending\": 3, \"completed\": 2, \"high_priority\": 1}, \"voice_summary\": \"Hai 5 task oggi, di cui 1 ad alta priorità. 3 sono in sospeso e 2 completati.\", \"ui_hints\": {...}}", "item_index": 1}

data: {"type": "content", "delta": "Ecco i tuoi task di oggi:"}

data: {"type": "content", "delta": " hai 5 task, di cui 1 ad alta priorità."}

data: {"type": "content", "delta": " 3 sono ancora in sospeso."}

data: {"type": "done", "message": "Stream completed"}
```

**VISUALIZZAZIONE APP:**
- Rileva `type: "task_list"` nel tool output
- Renderizza lista formattata con:
  - Colori categoria
  - Emoji priorità
  - Date formattate in italiano
  - Bottoni azione (completa, modifica, elimina)
  - Raggruppamento per categoria (da `ui_hints.group_by`)
- Se TTS attivo, legge il `voice_summary`

---

### Caso 3: Creazione Categoria con Task

**INPUT:**
```json
{
  "quest": "Crea una categoria Progetti e aggiungi un task sviluppa app mobile",
  "model": "advanced"
}
```

**OUTPUT:**

```
data: {"type": "status", "message": "Processing with MCP tools..."}

data: {"type": "tool_call", "tool_name": "create_category", "tool_args": {"name": "Progetti", "description": "Progetti personali"}, "item_index": 0}

data: {"type": "tool_output", "tool_name": "create_category", "output": "{\"success\": true, \"type\": \"category_created\", \"message\": \"✅ Categoria 'Progetti' creata con successo\", \"category\": {\"category_id\": 10, \"name\": \"Progetti\", \"description\": \"Progetti personali\"}}", "item_index": 1}

data: {"type": "tool_call", "tool_name": "add_task", "tool_args": {"title": "Sviluppa app mobile", "category_name": "Progetti"}, "item_index": 2}

data: {"type": "tool_output", "tool_name": "add_task", "output": "{\"success\": true, \"type\": \"task_created\", \"message\": \"✅ Task 'Sviluppa app mobile' creato con successo in 'Progetti'\", \"task\": {\"task_id\": 43, \"title\": \"Sviluppa app mobile\", \"category_id\": 10}, \"category_used\": \"Progetti\"}", "item_index": 3}

data: {"type": "content", "delta": "Ho creato la categoria 'Progetti'"}

data: {"type": "content", "delta": " e aggiunto il task 'Sviluppa app mobile'"}

data: {"type": "content", "delta": " al suo interno!"}

data: {"type": "done", "message": "Stream completed"}
```

**VISUALIZZAZIONE APP:**
- Prima tool output: mostra bottone "Modifica Progetti" (per `type: "category_created"`)
- Seconda tool output: mostra bottone "Modifica Sviluppa app mobile" (per `type: "task_created"`)
- Mostra il testo dell'AI nella chat

---

### Caso 4: Ricerca e Modifica Task

**INPUT:**
```json
{
  "quest": "Completa il task riunione team",
  "model": "advanced"
}
```

**OUTPUT:**

```
data: {"type": "status", "message": "Processing with MCP tools..."}

data: {"type": "tool_call", "tool_name": "get_tasks", "tool_args": {}, "item_index": 0}

data: {"type": "tool_output", "tool_name": "get_tasks", "output": "{\"tasks\": [{\"task_id\": 42, \"title\": \"Riunione team\", \"status\": \"IN_SOSPESO\"}, {...}], \"total\": 10}", "item_index": 1}

data: {"type": "tool_call", "tool_name": "complete_task", "tool_args": {"task_id": 42}, "item_index": 2}

data: {"type": "tool_output", "tool_name": "complete_task", "output": "{\"message\": \"Task completato con successo\", \"task_id\": 42}", "item_index": 3}

data: {"type": "content", "delta": "Ho completato il task 'Riunione team'"}

data: {"type": "content", "delta": ". Ottimo lavoro!"}

data: {"type": "done", "message": "Stream completed"}
```

**VISUALIZZAZIONE APP:**
- **NESSUNA visualizzazione** per `get_tasks` (uso interno, no `type` speciale)
- **NESSUNA visualizzazione** per `complete_task` (no `type` speciale)
- Solo il testo dell'AI appare nella chat
- L'app può aggiornare la lista task via polling/refresh

---

### Caso 5: Visualizzazione Categorie con Statistiche

**INPUT:**
```json
{
  "quest": "Quali categorie ho e quanti task ci sono in ognuna?",
  "model": "base"
}
```

**OUTPUT:**

```
data: {"type": "status", "message": "Processing with MCP tools..."}

data: {"type": "tool_call", "tool_name": "show_categories_to_user", "tool_args": {}, "item_index": 0}

data: {"type": "tool_output", "tool_name": "show_categories_to_user", "output": "{\"type\": \"category_list\", \"version\": \"1.0\", \"categories\": [{\"id\": 1, \"name\": \"Lavoro\", \"description\": \"Task di lavoro\", \"color\": \"#3B82F6\", \"icon\": \"briefcase\", \"taskCount\": 12}, {\"id\": 5, \"name\": \"Sport\", \"color\": \"#F59E0B\", \"icon\": \"activity\", \"taskCount\": 3}, {...}], \"summary\": {\"total\": 5, \"categories_with_tasks\": 3, \"total_tasks\": 25}, \"voice_summary\": \"Hai 5 categorie, di cui 3 con task attivi. Totale 25 task.\", \"ui_hints\": {\"display_mode\": \"grid\", \"enable_swipe_actions\": true}}", "item_index": 1}

data: {"type": "content", "delta": "Hai 5 categorie in totale."}

data: {"type": "content", "delta": " La categoria 'Lavoro' ha 12 task"}

data: {"type": "content", "delta": ", mentre 'Sport' ne ha 3."}

data: {"type": "done", "message": "Stream completed"}
```

**VISUALIZZAZIONE APP:**
- Rileva `type: "category_list"`
- Renderizza griglia (da `ui_hints.display_mode: "grid"`)
- Ogni carta categoria mostra:
  - Icona (es. briefcase per Lavoro)
  - Colore (#3B82F6 per Lavoro)
  - Nome categoria
  - Conteggio task (12 per Lavoro)
  - Bottoni azione (✏️ Modifica, 🗑️ Elimina, 👁️ Vedi task)
- Swipe actions abilitate

---

### Caso 6: Creazione Note

**INPUT:**
```json
{
  "quest": "Crea una nota con scritto comprare il latte",
  "model": "advanced"
}
```

**OUTPUT:**

```
data: {"type": "status", "message": "Processing with MCP tools..."}

data: {"type": "tool_call", "tool_name": "create_note", "tool_args": {"title": "Comprare il latte", "color": "#FFEB3B"}, "item_index": 0}

data: {"type": "tool_output", "tool_name": "create_note", "output": "{\"success\": true, \"type\": \"note_created\", \"message\": \"✅ Nota creata con successo\", \"note\": {\"note_id\": 456, \"title\": \"Comprare il latte\", \"position_x\": \"0\", \"position_y\": \"0\", \"color\": \"#FFEB3B\"}}", "item_index": 1}

data: {"type": "content", "delta": "Ho creato la nota 'Comprare il latte'"}

data: {"type": "content", "delta": " con colore giallo."}

data: {"type": "done", "message": "Stream completed"}
```

**VISUALIZZAZIONE APP:**
- Rileva `type: "note_created"`
- Mostra notifica: "✅ Nota creata con successo"
- Mostra bottone "Modifica Comprare il latte"
- Nota avrà colore giallo (#FFEB3B)

---

### Caso 7: Conversazione Multi-Turn con Contesto

**INPUT (Turn 1):**
```json
{
  "quest": "Crea un task Palestra",
  "model": "advanced",
  "previous_messages": []
}
```

**INPUT (Turn 2 - con contesto):**
```json
{
  "quest": "Spostalo a domani alle 18",
  "model": "advanced",
  "previous_messages": [
    {
      "role": "user",
      "content": "Crea un task Palestra"
    },
    {
      "role": "assistant",
      "content": "Ho creato il task 'Palestra' per oggi."
    }
  ]
}
```

**OUTPUT (Turn 2):**

```
data: {"type": "status", "message": "Processing with MCP tools..."}

data: {"type": "tool_call", "tool_name": "get_tasks", "tool_args": {}, "item_index": 0}

data: {"type": "tool_output", "tool_name": "get_tasks", "output": "{\"tasks\": [{\"task_id\": 50, \"title\": \"Palestra\", \"end_time\": \"2025-12-15T12:00:00\"}, {...}]}", "item_index": 1}

data: {"type": "tool_call", "tool_name": "update_task", "tool_args": {"task_id": 50, "end_time": "2025-12-16T18:00:00"}, "item_index": 2}

data: {"type": "tool_output", "tool_name": "update_task", "output": "{\"message\": \"Task aggiornato con successo\"}", "item_index": 3}

data: {"type": "content", "delta": "Ho spostato il task 'Palestra'"}

data: {"type": "content", "delta": " a domani alle 18:00!"}

data: {"type": "done", "message": "Stream completed"}
```

**SPIEGAZIONE:**
- L'AI usa `previous_messages` per capire che "spostalo" si riferisce al task "Palestra" creato prima
- Cerca il task con `get_tasks()` (uso interno)
- Aggiorna con `update_task()` (uso interno, no visualizzazione UI)
- Solo il messaggio testuale appare nella chat

---

### Caso 8: Visualizzazione Note con Statistiche Colori

**INPUT:**
```json
{
  "quest": "Mostrami le mie note",
  "model": "base"
}
```

**OUTPUT:**

```
data: {"type": "status", "message": "Processing with MCP tools..."}

data: {"type": "tool_call", "tool_name": "show_notes_to_user", "tool_args": {}, "item_index": 0}

data: {"type": "tool_output", "tool_name": "show_notes_to_user", "output": "{\"type\": \"note_list\", \"version\": \"1.0\", \"notes\": [{\"id\": 1, \"title\": \"Comprare il latte\", \"color\": \"#FFEB3B\", \"positionX\": \"0\", \"positionY\": \"0\", \"actions\": {...}}, {\"id\": 2, \"title\": \"Chiamare dottore\", \"color\": \"#FF9800\", \"actions\": {...}}, {...}], \"summary\": {\"total\": 15, \"color_counts\": {\"#FFEB3B\": 8, \"#4CAF50\": 5, \"#2196F3\": 2}}, \"voice_summary\": \"Hai 15 note, la maggior parte sono gialle.\", \"ui_hints\": {\"display_mode\": \"grid\", \"enable_drag_and_drop\": true, \"enable_color_picker\": true}}", "item_index": 1}

data: {"type": "content", "delta": "Hai 15 note in totale."}

data: {"type": "content", "delta": " 8 sono gialle, 5 verdi e 2 blu."}

data: {"type": "done", "message": "Stream completed"}
```

**VISUALIZZAZIONE APP:**
- Rileva `type: "note_list"`
- Renderizza griglia (da `ui_hints.display_mode: "grid"`)
- Ogni carta nota mostra:
  - Titolo
  - Colore di sfondo
  - Bottoni azione (✏️ Modifica, 🗑️ Elimina, 🎨 Cambia colore)
- Drag & drop abilitato (da `ui_hints.enable_drag_and_drop`)
- Color picker disponibile

---

### Caso 9: Errore - API Key Mancante

**INPUT:**
```json
{
  "quest": "Crea task Test",
  "model": "advanced"
}
```

**OUTPUT (se OPENAI_API_KEY non configurata):**

```
data: {"type": "error", "message": "Configurazione OpenAI mancante. Controlla la variabile d'ambiente OPENAI_API_KEY."}
```

**VISUALIZZAZIONE APP:**
- Mostra messaggio di errore all'utente
- Suggerisce di contattare supporto

---

### Caso 10: Errore - Database Non Raggiungibile

**INPUT:**
```json
{
  "quest": "Mostrami i task",
  "model": "base"
}
```

**OUTPUT (se database offline):**

```
data: {"type": "status", "message": "Processing with MCP tools..."}

data: {"type": "tool_call", "tool_name": "show_tasks_to_user", "tool_args": {}, "item_index": 0}

data: {"type": "error", "message": "Errore MCP: Connection to database failed"}
```

**VISUALIZZAZIONE APP:**
- Mostra errore: "Errore durante l'operazione. Riprova più tardi."
- Può mostrare bottone "Riprova"

---

## Sistema di Visualizzazione UI

### Principio Chiave: Type-Based Detection

L'app React Native decide **cosa visualizzare** analizzando il campo `type` nel JSON di output dei tool MCP:

| **Type** | **Azione App** |
|----------|----------------|
| `task_created` | Mostra notifica + bottone "Modifica task" |
| `category_created` | Mostra notifica + bottone "Modifica categoria" |
| `note_created` | Mostra notifica + bottone "Modifica nota" |
| `task_list` | Renderizza lista formattata task |
| `category_list` | Renderizza griglia categorie |
| `note_list` | Renderizza griglia note |
| **Nessun type** | **NESSUNA visualizzazione** (uso interno AI) |

### Strumenti Interni vs Visualizzazione

#### Strumenti Interni (NO visualizzazione UI)
- `get_tasks()` - Ritorna: `{tasks: [...], total: N}`
- `get_my_categories()` - Ritorna: `{categories: [...], total: N}`
- `get_notes()` - Ritorna: `{notes: [...], total: N}`
- `update_task()` - Ritorna: `{message: "..."}`
- `complete_task()` - Ritorna: `{message: "..."}`
- `delete_note()` - Ritorna: `{message: "..."}`

**Uso:** L'AI li usa per cercare, modificare, eliminare dati senza mostrare nulla all'utente.

#### Strumenti di Visualizzazione (SI visualizzazione UI)
- `show_tasks_to_user()` - Ritorna: `{type: "task_list", ...}`
- `show_categories_to_user()` - Ritorna: `{type: "category_list", ...}`
- `show_notes_to_user()` - Ritorna: `{type: "note_list", ...}`

**Uso:** L'AI li chiama quando l'utente chiede esplicitamente di vedere/visualizzare qualcosa.

#### Strumenti di Creazione (Bottone "Modifica")
- `add_task()` - Ritorna: `{type: "task_created", task: {...}}`
- `create_category()` - Ritorna: `{type: "category_created", category: {...}}`
- `create_note()` - Ritorna: `{type: "note_created", note: {...}}`

**Uso:** Dopo la creazione, l'app mostra automaticamente un bottone per modificare l'elemento appena creato.

---

## Gestione Storico Conversazione

### Strategia Raccomandata

1. **Limita a 6 messaggi recenti** nel campo `previous_messages`
2. **Includi solo messaggi rilevanti** (user/assistant, no system)
3. **Non includere tool calls/outputs** nello storico (solo testo conversazionale)

### Esempio Storico

```json
{
  "quest": "Completa il task palestra",
  "previous_messages": [
    {
      "role": "user",
      "content": "Crea task Palestra per oggi"
    },
    {
      "role": "assistant",
      "content": "Ho creato il task 'Palestra' per oggi alle 12:00."
    },
    {
      "role": "user",
      "content": "Spostalo a domani"
    },
    {
      "role": "assistant",
      "content": "Ho spostato il task 'Palestra' a domani alle 12:00."
    }
  ]
}
```

---

## Best Practices

### Per gli Sviluppatori Frontend

1. **Parsing SSE Corretto**
   - Ogni evento inizia con `data: ` e termina con `\n\n`
   - Parsare il JSON dopo `data: `
   - Gestire eventi parziali/buffer

2. **Gestione Tool Outputs**
   - Quando ricevi `type: "tool_output"`, parsare il campo `output` come JSON
   - Controllare il campo `type` nel JSON parsato
   - Mostrare UI solo se `type` è uno dei tipi visualizzazione

3. **Concatenazione Content Delta**
   - Gli eventi `type: "content"` arrivano in chunk
   - Concatenare `delta` per costruire il messaggio completo
   - Mostrare progressivamente nella chat (effetto typing)

4. **Gestione Errori**
   - Su `type: "error"`, mostrare messaggio user-friendly
   - Offrire bottone "Riprova" per rifare la richiesta
   - Non mostrare stack trace tecnici

5. **Timeout**
   - Impostare timeout di 120 secondi per richieste complesse
   - Mostrare indicatore di caricamento durante streaming
   - Chiudere connessione SSE su timeout

### Per gli Sviluppatori Backend

1. **Tool Selection**
   - Usare strumenti interni (`get_*`) per ricerche/modifiche
   - Usare strumenti visualizzazione (`show_*`) solo su richiesta esplicita
   - Non chiamare `show_*` dopo ogni creazione

2. **Error Handling**
   - Catch tutte le eccezioni nel generator
   - Sempre inviare `type: "error"` con messaggio descrittivo
   - Non lasciare stream aperti senza `type: "done"`

3. **Performance**
   - Chunk size di 50 caratteri per `content` delta
   - `asyncio.sleep(0.01)` tra chunk per evitare overwhelm
   - Riusare connessioni HTTP client (pool)

---

## Limitazioni e Considerazioni

### Limiti Tecnici

- **Timeout SSE**: 120 secondi (configurato in `httpx.AsyncClient`)
- **Lunghezza Quest**: Consigliato max 500 caratteri (no limite hard)
- **Storico Messaggi**: Consigliato max 6 (più messaggi = più token = più costo)
- **Chunk Size**: 50 caratteri per evento content

### Costi OpenAI

- **Model Base** (GPT-3.5-Turbo): ~$0.002 / 1K token
- **Model Advanced** (GPT-4): ~$0.03 / 1K token input, ~$0.06 / 1K token output

**Raccomandazione**: Usare `model: "base"` per operazioni semplici (70% casi), `advanced` solo per conversazioni complesse.

### Rate Limiting

Se vengono inviate troppe richieste:
- OpenAI: 3,500 richieste/min (TPM varia per tier)
- MCP Server: No limite esplicito (dipende da database/API FastAPI)

---

## Troubleshooting

### Problema: Stream non completa mai

**Causa**: L'AI non riesce a completare la richiesta (loop infinito, errore non gestito)

**Soluzione:**
- Controllare i log server per eccezioni
- Verificare che tutti i tool MCP ritornino risposta valida
- Impostare timeout lato client (120s consigliato)

### Problema: App non mostra UI per lista task

**Causa**: Tool output non ha campo `type` corretto

**Soluzione:**
- Verificare che l'AI chiami `show_tasks_to_user()` e NON `get_tasks()`
- Controllare che output abbia `type: "task_list"`
- Verificare parsing JSON lato app

### Problema: Bottone "Modifica" non appare dopo creazione

**Causa**: Tool output non ha `type: "X_created"`

**Soluzione:**
- Verificare che `add_task()` ritorni `type: "task_created"`
- Verificare che app gestisca tipo creazione correttamente
- Controllare che il campo `task`, `category` o `note` sia presente

### Problema: AI non ricorda contesto conversazione

**Causa**: `previous_messages` vuoto o malformato

**Soluzione:**
- Assicurarsi che app invii storico corretto
- Verificare formato: `[{role, content}, ...]`
- Controllare che messaggi siano in ordine cronologico

---

## Riferimenti

### File Correlati

- **Endpoint**: [src/app/api/routes/chatbot.py:308](src/app/api/routes/chatbot.py#L308)
- **Schema Request**: [src/app/schemas/chatbot.py](src/app/schemas/chatbot.py)
- **Sistema Visualizzazione**: [UI_VISUALIZATION_SYSTEM.md](UI_VISUALIZATION_SYSTEM.md)
- **Tool MCP Tasks**: [src/tools/tasks.py](src/tools/tasks.py)
- **Tool MCP Categories**: [src/tools/categories.py](src/tools/categories.py)
- **Tool MCP Notes**: [src/tools/notes.py](src/tools/notes.py)
- **Formatters UI**: [src/formatters/tasks.py](src/formatters/tasks.py)

### Documentazione Esterna

- **OpenAI Agents SDK**: https://github.com/openai/agents
- **Model Context Protocol (MCP)**: https://modelcontextprotocol.io
- **Server-Sent Events (SSE)**: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events

---

## Changelog

### v3.0 (2025-01-12) - MCP Agents
- ✅ Migrato da chatbot interno a OpenAI Agents SDK
- ✅ MCP server esterno via SSE transport
- ✅ Sistema visualizzazione basato su `type` field
- ✅ Supporto tool call/output streaming
- ✅ JWT authentication per MCP tools

### v2.0 (2024-12) - MCP Integration
- ✅ Integrazione MCP tools
- ✅ Chat history con `previous_messages`

### v1.0 (2024-11) - Initial Release
- ✅ Endpoint base `/chat/text`
- ✅ OpenAI GPT integration
- ✅ SSE streaming

---

## Conclusione

L'endpoint `/chat/text` è il cuore conversazionale di MyTaskly. Attraverso OpenAI Agents, MCP tools e il sistema di visualizzazione type-based, offre un'esperienza utente fluida e intelligente per gestire task, categorie e note.

Per domande o supporto, consultare:
- **Issues**: https://github.com/YourOrg/MyTaskly-server/issues
- **Docs**: https://docs.mytasklyapp.com
