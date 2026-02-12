# Documentazione Feature: Durata Task

**Data implementazione**: 12 Febbraio 2026  
**Versione**: 2.1.0  
**Migration**: `13_20260212145848_add_duration_to_tasks.py`

---

## 📋 Panoramica

Aggiunto il campo `duration_minutes` alla tabella `Tasks` per consentire agli utenti di specificare la durata stimata di un task in minuti.

---

## 🔧 Modifiche al Database

### Campo Aggiunto
- **Nome**: `duration_minutes`
- **Tipo**: `INTEGER`
- **Nullable**: `TRUE`
- **Default**: `NULL`
- **Range valido**: 1-10080 minuti (1 minuto - 7 giorni)

### Migration SQL
```sql
ALTER TABLE "Tasks" ADD "duration_minutes" INT;
```

---

## 📡 Modifiche agli Endpoint API

### ✅ Endpoint Modificati

Tutti gli endpoint esistenti supportano ora il campo `duration_minutes` in modo **retrocompatibile**.

#### **POST /tasks** - Crea nuovo task

**Request Body (aggiornato)**:
```json
{
  "title": "Meeting con team",
  "description": "Sprint planning",
  "user": "username",
  "category_id": 1,
  "priority": "Alta",
  "status": "In sospeso",
  "end_time": "2026-02-15T10:00:00Z",
  "duration_minutes": 60
}
```

**Campo nuovo**:
- `duration_minutes` (opzionale): Durata del task in minuti
  - **Min**: 1
  - **Max**: 10080 (7 giorni)
  - **Tipo**: Integer
  - **Default**: `null`

**Response** (invariata):
```json
{
  "task_id": 123,
  "status_code": 201
}
```

---

#### **PUT /tasks/{task_id}** - Modifica task esistente

**Request Body (aggiornato)**:
```json
{
  "title": "Meeting aggiornato",
  "duration_minutes": 90
}
```

**Campo nuovo**:
- `duration_minutes` (opzionale): Nuova durata del task in minuti
  - Validazione: 1-10080 minuti

**Response** (invariata):
```json
{
  "message": "Task updated successfully",
  "task_id": 123
}
```

---

#### **GET /tasks** - Lista tutti i task

**Response (aggiornato)**:
```json
[
  {
    "task_id": 123,
    "user_id": 1,
    "title": "Meeting con team",
    "description": "Sprint planning",
    "start_time": "2026-02-12T14:30:00Z",
    "end_time": "2026-02-15T10:00:00Z",
    "duration_minutes": 60,
    "notification_sent": false,
    "category_id": 5,
    "priority": "Alta",
    "status": "In sospeso",
    "is_recurring": false,
    "recurrence_pattern": null,
    ...
  }
]
```

**Campo nuovo in response**:
- `duration_minutes`: Durata del task in minuti (può essere `null`)

---

#### **GET /tasks/by-category-id/{category_id}** - Task per categoria

**Response**: Stesso formato di `GET /tasks` (include `duration_minutes`)

---

#### **GET /tasks/{category_name}** - Task per nome categoria (deprecato)

**Response**: Stesso formato di `GET /tasks` (include `duration_minutes`)

---

### ✅ Endpoint NON Modificati

I seguenti endpoint **non sono stati modificati** ma continuano a funzionare normalmente:

- `DELETE /tasks/{task_id}` - Nessun cambiamento
- `GET /tasks/stats/overview` - Nessun cambiamento (possibile estensione futura)
- `GET /tasks/debug/simple` - Nessun cambiamento
- `GET /tasks/debug/performance` - Nessun cambiamento

---

## 📝 Esempi di Utilizzo

### Esempio 1: Creare task con durata di 1 ora
```bash
curl -X POST http://localhost:8080/tasks \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Code review",
    "description": "Review PR #234",
    "user": "developer",
    "category_id": 3,
    "priority": "Media",
    "status": "In sospeso",
    "duration_minutes": 60
  }'
```

### Esempio 2: Creare task senza durata (retrocompatibile)
```bash
curl -X POST http://localhost:8080/tasks \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Task generico",
    "description": "Nessuna durata specificata",
    "user": "developer",
    "category_id": 3,
    "priority": "Bassa",
    "status": "In sospeso"
  }'
```

### Esempio 3: Modificare solo la durata di un task
```bash
curl -X PUT http://localhost:8080/tasks/123 \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "duration_minutes": 120
  }'
```

### Esempio 4: Rimuovere la durata (impostare a null)
```bash
curl -X PUT http://localhost:8080/tasks/123 \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "duration_minutes": null
  }'
```

---

## 🔢 Valori di Durata Comuni

| Durata | Minuti | Esempio |
|--------|--------|---------|
| 15 minuti | `15` | Quick stand-up |
| 30 minuti | `30` | Breve meeting |
| 1 ora | `60` | Sessione di lavoro |
| 2 ore | `120` | Workshop |
| Mezza giornata | `240` | 4 ore di lavoro |
| 1 giorno | `1440` | Giornata intera |
| 1 settimana | `10080` | Progetto lungo |

---

## ✅ Validazioni

### Validazione Input (Pydantic)

```python
duration_minutes: Optional[int] = Field(
    None, 
    ge=1,           # Minimo: 1 minuto
    le=10080,       # Massimo: 10080 minuti (7 giorni)
    description="Durata del task in minuti (max 7 giorni)"
)
```

### Errori di Validazione

**Valore sotto il minimo**:
```json
{
  "detail": [
    {
      "type": "greater_than_equal",
      "loc": ["body", "duration_minutes"],
      "msg": "Input should be greater than or equal to 1"
    }
  ]
}
```

**Valore sopra il massimo**:
```json
{
  "detail": [
    {
      "type": "less_than_equal",
      "loc": ["body", "duration_minutes"],
      "msg": "Input should be less than or equal to 10080"
    }
  ]
}
```

---

## 🔄 Retrocompatibilità

### ✅ Garantita al 100%

1. **Task esistenti**: Tutti i task esistenti hanno `duration_minutes = NULL`
2. **Client vecchi**: Client che non inviano `duration_minutes` continuano a funzionare
3. **Endpoint invariati**: Nessun endpoint richiede obbligatoriamente `duration_minutes`
4. **Response sempre inclusa**: Il campo è sempre presente nelle response (può essere `null`)

### Breaking Changes

❌ **Nessuna breaking change**

---

## 🔍 Note sul Sistema di Notifiche

### ⚠️ IMPORTANTE

Il campo `duration_minutes` è **completamente indipendente** dal sistema di notifiche.

**Le notifiche si basano su**:
- `end_time` - Data/ora di scadenza del task
- `notification_sent` - Flag per evitare invii duplicati

**`duration_minutes` NON influenza**:
- Quando vengono inviate le notifiche
- La logica dei trigger PostgreSQL
- Il sistema di retry delle notifiche

`duration_minutes` è un campo **puramente informativo** che indica quanto tempo stimato serve per completare il task.

---

## 🚀 Possibili Estensioni Future

### 1. Calcolo Automatico End Time
```python
# Se duration_minutes è specificato ma end_time no:
if duration_minutes and not end_time:
    end_time = start_time + timedelta(minutes=duration_minutes)
```

### 2. Statistiche Durata
```python
GET /tasks/stats/duration
# Response:
{
  "average_duration_by_category": {...},
  "total_estimated_time": 1440,
  "completed_tasks_avg_duration": 85
}
```

### 3. Time Tracking Effettivo
```python
# Nuovo campo:
actual_duration_minutes = fields.IntField(null=True)

# Confronto stima vs realtà
{
  "estimated": 60,
  "actual": 75,
  "variance": "+25%"
}
```

### 4. Alert Superamento Tempo
```python
# Notifica se task sta impiegando più tempo del previsto
if current_time - start_time > duration_minutes:
    send_notification("Task sta superando il tempo stimato")
```

### 5. Integrazione Google Calendar
```python
# Usa duration_minutes per calcolare end_time dell'evento
event = {
    "start": {"dateTime": start_time},
    "end": {"dateTime": start_time + timedelta(minutes=duration_minutes)}
}
```

---

## 📊 Schema Database Completo

### Tabella Tasks (estratto campi rilevanti)

```sql
CREATE TABLE "Tasks" (
    task_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMPTZ,
    duration_minutes INT,  -- ← NUOVO CAMPO
    notification_sent BOOLEAN DEFAULT FALSE,
    priority VARCHAR(5) DEFAULT 'Media',
    status VARCHAR(10) DEFAULT 'In sospeso',
    ...
);
```

---

## 🧪 Testing

### Test Eseguiti

✅ Validazione minima (1 minuto)  
✅ Validazione massima (10080 minuti)  
✅ Valore NULL accettato (campo opzionale)  
✅ Task con durata valida (60 minuti)  
✅ ModifyTask con duration_minutes  
✅ Retrocompatibilità con task esistenti  

### Comandi Test Manuali

```bash
# Test creazione task con durata
uv run python -c "
from src.app.schemas.task import TaskIn
task = TaskIn(
    title='Test',
    description='Test durata',
    user='test',
    category_id=1,
    priority='Media',
    status='In sospeso',
    duration_minutes=60
)
print(f'✓ Task creato: {task.duration_minutes} minuti')
"
```

---

## 📚 File Modificati

1. **src/app/models/task.py** - Aggiunto campo al model Tortoise ORM
2. **src/app/schemas/task.py** - Aggiornati TaskIn, ModifyTask, TaskOut
3. **pyproject.toml** - Aggiunta configurazione `[tool.aerich]`
4. **migrations/models/13_20260212145848_add_duration_to_tasks.py** - Migration creata

---

## 🔗 Riferimenti

- **Migration file**: `migrations/models/13_20260212145848_add_duration_to_tasks.py`
- **Model**: `src/app/models/task.py:27`
- **Schema Input**: `src/app/schemas/task.py:58-60`
- **Schema Output**: `src/app/schemas/task.py:78`
- **Endpoint**: `src/app/api/routes/tasks.py`

---

## 📞 Support

Per domande o problemi relativi a questa feature, contatta il team di sviluppo.

**Versione documento**: 1.0  
**Ultimo aggiornamento**: 12 Febbraio 2026
