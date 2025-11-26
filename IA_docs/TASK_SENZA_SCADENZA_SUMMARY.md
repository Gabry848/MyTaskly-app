# Implementazione Task Senza Data di Scadenza

## Panoramica
È stata implementata la possibilità di creare e gestire impegni/task senza una data di scadenza specifica. Questa funzionalità permette maggiore flessibilità nella gestione dei task che non hanno una deadline precisa.

## Modifiche Implementate

### 1. Modal di Aggiunta Task (`components/AddTask.tsx`)
- **Campo data reso opzionale**: Il campo "Data e ora di scadenza" è ora marcato come "(opzionale)"
- **Placeholder aggiornato**: Mostra "Nessuna scadenza" quando non è selezionata una data
- **Pulsante rimozione scadenza**: Aggiunto pulsante "Rimuovi scadenza" per cancellare una data già selezionata
- **Validazione rimossa**: Non è più obbligatorio inserire una data di scadenza
- **Gestione null**: Il task viene creato con `end_time: null` se non viene selezionata una scadenza

### 2. Visualizzazione Task (`components/TaskCard.tsx`, `components/task/BasicComponents.tsx`)
- **Icona speciale**: I task senza scadenza mostrano un'icona `calendar-clear-outline`
- **Testo "Nessuna scadenza"**: Visualizzazione chiara per i task senza deadline
- **Gestione date null**: Componenti aggiornati per gestire valori null/undefined

### 3. Funzioni di Utilità
#### `components/task/TaskUtils.tsx`
- **getDaysRemainingText()**: Restituisce "Nessuna scadenza" per task senza `end_time`
- **getDaysRemainingColor()**: Colore grigio neutro (#999999) per task senza scadenza

#### `components/TaskList/TaskUtils.ts`
- **filterTasksByDay()**: Nuovo filtro "Senza scadenza" per mostrare solo i task senza deadline
- **Esclusione da filtri temporali**: I task senza scadenza non compaiono nei filtri per data specifica

### 4. Sistema di Filtri (`components/TaskList/FilterModal.tsx`)
- **Nuovo filtro**: Aggiunto chip "Senza scadenza" nella sezione filtri di scadenza
- **Colore distintivo**: Il filtro ha un colore grigio (#999999) per distinguerlo

### 5. Ordinamento (`components/TaskList/TaskListContainer.tsx`, `src/services/taskService.ts`)
- **Priorità nell'ordinamento**: I task senza scadenza vengono sempre posizionati in fondo alla lista
- **Gestione null**: Logica aggiornata per gestire confronti con valori null
- **Coerenza**: Ordinamento mantenuto sia nei servizi che nei componenti UI

### 6. Modal di Modifica (`components/task/TaskEditModal.tsx`)
- **Campo opzionale**: Etichetta aggiornata a "Data e ora di scadenza (opzionale)"
- **Rimozione scadenza**: Possibilità di rimuovere la scadenza da un task esistente
- **Placeholder aggiornato**: "Nessuna scadenza" quando non c'è una data impostata

### 7. Stili (`components/task/TaskStyles.tsx`, `components/AddTask.tsx`)
- **Nuovi stili aggiunti**:
  - `disabledText`: Testo disabilitato per elementi non interattivi
  - `clearDateButton`: Stile per il pulsante di rimozione scadenza
  - `clearDateText`: Testo del pulsante di rimozione con sottolineatura

## Comportamenti Implementati

### Creazione Task
1. L'utente può lasciare vuoto il campo data di scadenza
2. Il task viene salvato con `end_time: null`
3. Non viene mostrato alcun errore di validazione

### Visualizzazione
1. I task senza scadenza mostrano "Nessuna scadenza" con icona speciale
2. Vengono posizionati in fondo alle liste ordinate per data
3. Hanno un colore grigio neutro per distinguerli

### Filtri
1. Nuovo filtro "Senza scadenza" per visualizzare solo questi task
2. Non compaiono nei filtri per date specifiche (Oggi, Domani, etc.)
3. Sono inclusi nel filtro "Tutte"

### Modifica
1. È possibile rimuovere la scadenza da un task esistente
2. È possibile aggiungere una scadenza a un task che non l'aveva
3. La modifica mantiene tutti gli altri attributi del task

## Compatibilità
- ✅ Retrocompatibile con task esistenti che hanno una scadenza
- ✅ L'API backend gestisce correttamente `end_time: null`
- ✅ Tutti i componenti esistenti continuano a funzionare
- ✅ Non breaking changes per il database o l'API

## Testing
- Verificare la creazione di task senza scadenza
- Testare i filtri con il nuovo filtro "Senza scadenza"
- Verificare l'ordinamento corretto (task senza scadenza in fondo)
- Testare la modifica di task esistenti per rimuovere/aggiungere scadenze
- Controllo della visualizzazione corretta nelle card e nei dettagli
