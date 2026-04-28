## Context

Le schermate analizzate (`Categories`, `TaskList`, `Calendar`, `Home`) mostrano una forte duplicazione di pattern UI:
- tipografia hardcoded (`fontSize`, `fontWeight`, `letterSpacing`, `fontFamily: "System"`) con varianti incoerenti;
- container e superfici ripetute (`backgroundColor: "#ffffff"`, ombre, bordi, raggi);
- loader custom multipli (dots animation in `TaskListContainer` e `CalendarView`, `ActivityIndicator` diretto in altri punti);
- shell di input/card/modal implementate localmente con stili simili ma non condivisi.

L'obiettivo non e riscrivere tutto subito, ma introdurre una base riusabile che riduca i macro-componenti e abiliti refactor incrementale senza regressioni funzionali.

## Goals / Non-Goals

**Goals:**
- Definire token di design riutilizzabili per typography, spacing, radius, elevation e colori neutrali.
- Introdurre primitive UI composabili per screen header, card shell, section header, chip, empty state, loading state, modal shell e content container.
- Preparare un piano di migrazione progressivo per `Categories`, `TaskList`, `Calendar` e compatibilita con `Home`.
- Ridurre l'uso di stile inline e stringhe colore/font duplicate nelle schermate target.

**Non-Goals:**
- Rebranding grafico completo o cambio radicale della visual identity.
- Migrazione completa di tutte le schermate in un'unica PR.
- Sostituzione totale delle librerie di animazione o navigazione esistenti.
- Cambiamenti funzionali ai flussi business (sync, CRUD task, chat logic).

## Decisions

### Decisione 1: Introdurre un layer `UI Foundation` in `src/components/UI/foundation` + `src/theme`
**Scelta:** creare moduli condivisi:
- `src/theme/tokens.ts` (spacing, typography scale, radii, elevation, semantic colors),
- `src/theme/primitives.ts` (helper e mapping runtime),
- `src/components/UI/foundation/*` (primitive React Native).

**Razionale:** separa stile e composizione da feature business, facilita consistenza e testing visuale.

**Alternative considerate:**
- mantenere style object locali e fare solo cleanup manuale -> scarsa scalabilita;
- usare libreria design-system esterna completa -> overhead alto per stato attuale del progetto.

### Decisione 2: Definire primitive “thin” e composabili invece di nuovi macro-componenti
**Scelta:** introdurre componenti base a responsabilita singola:
- `ScreenContainer`, `ScreenHeader`, `AppText`, `CardSurface`, `SectionBlock`, `StatusChip`, `EmptyState`, `LoadingState`, `ModalShell`.

**Razionale:** le schermate restano owner del flusso dati ma delegano il rendering ricorrente; evita monoliti difficili da riusare.

**Alternative considerate:**
- creare un unico `SmartScreenScaffold` onnicomprensivo -> poco flessibile e rischio coupling.

### Decisione 3: Loader unificato con varianti
**Scelta:** standardizzare in un singolo `LoadingState` con varianti:
- `spinner`,
- `dots`,
- `skeleton-card` (fase successiva).

**Razionale:** oggi esistono almeno tre pattern loader diversi; unificando API e animazioni si migliora coerenza e manutenzione.

**Alternative considerate:**
- lasciare loader per schermata -> UI incoerente e logica animazioni duplicata.

### Decisione 4: Migrazione per feature slices (Calendar/Task/Categories/Home)
**Scelta:** refactor incrementale per schermata, con fallback semplice (si puo mantenere uno style locale se la primitive non copre un edge case).

**Razionale:** riduce rischio regressioni e mantiene PR reviewabili.

**Alternative considerate:**
- big-bang migration completa -> alto rischio conflitti e bug UX.

## Risks / Trade-offs

- **[Rischio] Over-abstraction precoce** -> **Mitigazione:** introdurre solo primitive validate da almeno 2 schermate.
- **[Rischio] Regressioni di spacing/typography visive** -> **Mitigazione:** checklist visuale per schermata e verifica manuale su device principali.
- **[Rischio] Team adoption parziale** -> **Mitigazione:** documentare linee guida e usare lint rule/readme per nuovi componenti UI.
- **[Trade-off] Layer aggiuntivo iniziale** -> **Mitigazione:** naming semplice, props minime, esempi pratici in `tasks.md`.

## Migration Plan

1. Creare tokens + primitive base senza toccare feature logic.
2. Migrare `Categories` (screen header + container + spacing + action zone).
3. Migrare `TaskList` (loading, section title, empty state, card shell fragments).
4. Migrare `Calendar` e `Calendar20` (header blocks, loading, empty state, chip/sync indicator shell).
5. Rifinire compatibilita con `Home` (header actions, input shell, loading bubble pattern).
6. Rimuovere stili duplicati rimasti e documentare i pattern standard.

Rollback: mantenere le primitive backward-compatible e migrare file-by-file; eventuale rollback limitato al singolo screen commit.

## Open Questions

- Conviene centralizzare anche icon size tokens (es. `icon.sm/md/lg`) nella prima iterazione?
- `Home` richiede un `ChatInputShell` dedicato oppure basta comporre `CardSurface + InputRow + IconButton`?
- Si desidera aggiungere snapshot/UI tests per primitive critiche in questa change o in una successiva?
