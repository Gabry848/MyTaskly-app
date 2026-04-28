## Why

Le schermate `Categories`, `TaskList`, `Calendar` e `Home` usano pattern visivi simili (titoli, card, loader, vuoti, contenitori, modali) ma implementati in modo diverso e locale. Questo rende difficile mantenere coerenza, velocita di sviluppo e qualita UX quando si aggiungono nuove feature.

## What Changes

- Definire una UI foundation condivisa per spacing, tipografia, colori neutrali, raggi, ombre e layout container.
- Introdurre componenti composabili riutilizzabili per header di schermata, card shell, blocchi di metadata, stati vuoti, indicatori di caricamento e shell modali.
- Standardizzare i pattern di interazione comuni (FAB, input shell, chip/badge stato, section title).
- Definire una roadmap di migrazione incrementale partendo da `Categories`, `TaskList`, `Calendar` e compatibilita con `Home`.
- Documentare naming, props minime, e linee guida di adozione per evitare nuovi macro-componenti monolitici.

## Capabilities

### New Capabilities
- `ui-foundation-primitives`: token e primitive di base (typography, spacing, colors, radii, elevation, container) con API riusabile in tutta l'app.
- `ui-composable-patterns`: componenti composti ma generici (card, section, loader, empty state, modal shell, header screen) da applicare alle schermate principali.
- `ui-migration-playbook`: piano operativo per migrare le schermate target senza regressioni visive o funzionali.

### Modified Capabilities
- Nessuna capability esistente da modificare (repository senza spec OpenSpec preesistenti).

## Impact

- Aree toccate: `src/components/UI`, `src/components/Task`, `src/components/Category`, `src/components/Calendar`, `src/navigation/screens`.
- Possibile introduzione di nuovi file di stile condiviso (es. `src/theme/*` o `src/components/UI/foundation/*`).
- Riduzione progressiva di stili inline e duplicazioni in componenti specifici di schermata.
