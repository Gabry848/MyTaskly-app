## 1. Audit e baseline UI

- [x] 1.1 Estrarre in una matrice i pattern duplicati nelle schermate `Categories`, `TaskList`, `Calendar`, `Calendar20`, `Home` (header, card, loader, empty, modal, input shell)
- [x] 1.2 Definire naming convention e cartelle target (`src/theme`, `src/components/UI/foundation`) per token e primitive
- [x] 1.3 Creare checklist visuale di validazione per schermata (tipografia, spazi, elevazione, stati di caricamento/vuoto, azioni)

## 2. Fondazioni (token + primitive)

- [x] 2.1 Implementare `src/theme/tokens.ts` con scale di spacing, typography roles, colori semantici neutrali, radius, elevation
- [x] 2.2 Implementare `AppText` con varianti (`display`, `title`, `subtitle`, `body`, `caption`, `label`) basate su token
- [x] 2.3 Implementare `ScreenContainer` e `ContentContainer` per sostituire wrapper ripetuti `backgroundColor/padding`
- [ ] 2.4 Implementare `ScreenHeader` con supporto titolo, azioni destre, varianti allineamento
- [ ] 2.5 Implementare `CardSurface` con varianti (`default`, `outlined`, `interactive`) e supporto accent border

## 3. Pattern composabili condivisi

- [ ] 3.1 Implementare `SectionHeader` (titolo + action slot + opzionale subtitle)
- [ ] 3.2 Implementare `StatusChip`/`MetaChip` per stati task, categoria, sync
- [ ] 3.3 Implementare `LoadingState` con varianti `spinner` e `dots` riusabili
- [ ] 3.4 Implementare `EmptyState` con icona, titolo, descrizione e CTA opzionale
- [ ] 3.5 Implementare `ModalShell` con header/body/footer slot e gestione safe-area
- [ ] 3.6 Implementare `InputShell` (row con leading/trailing action e text input) per pattern usato in `Home`

## 4. Migrazione schermate prioritarie

- [ ] 4.1 Migrare `Categories` a `ScreenContainer + ScreenHeader + ContentContainer` e uniformare spazi e titolo
- [ ] 4.2 Migrare componenti categoria principali (`CategoryCard`/vista lista) a `CardSurface` e `SectionHeader`
- [ ] 4.3 Migrare `TaskListContainer` a `LoadingState`, `EmptyState`, `SectionHeader`, chip stato/filtro condivisi
- [ ] 4.4 Migrare `TaskCard` verso composizione `CardSurface + AppText + MetaChip` mantenendo comportamento corrente
- [ ] 4.5 Migrare `CalendarView` a loader/empty/sync chip condivisi e header standardizzato
- [ ] 4.6 Verificare `Calendar20View` su container/header coerenti e compatibilita con pattern foundation
- [ ] 4.7 Applicare hardening su `Home` (header actions, loading bubble pattern, input shell) senza alterare flussi chat

## 5. Validazione, cleanup e adozione

- [ ] 5.1 Eseguire smoke test manuale per `Categories`, `TaskList`, `Calendar`, `Home` dopo ogni slice di migrazione
- [ ] 5.2 Rimuovere stili duplicati e inline obsolete nelle schermate migrate
- [ ] 5.3 Aggiungere documentazione d’uso dei nuovi componenti in `src/components/UI/foundation/README.md`
- [ ] 5.4 Definire lista “do/don’t” per evitare nuovi macro-componenti e favorire composizione

## 6. Lista componenti da creare

- [x] 6.1 `AppText`
- [x] 6.2 `ScreenContainer`
- [x] 6.3 `ContentContainer`
- [ ] 6.4 `ScreenHeader`
- [ ] 6.5 `CardSurface`
- [ ] 6.6 `SectionHeader`
- [ ] 6.7 `StatusChip` / `MetaChip`
- [ ] 6.8 `LoadingState` (`spinner`, `dots`)
- [ ] 6.9 `EmptyState`
- [ ] 6.10 `ModalShell`
- [ ] 6.11 `InputShell`
- [ ] 6.12 `IconActionButton`
