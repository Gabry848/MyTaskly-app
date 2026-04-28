## UI Pattern Matrix

Scope analizzato: `Categories`, `TaskList`, `Calendar`, `Calendar20`, `Home`.

| Pattern | Categories | TaskList | Calendar | Calendar20 | Home | Opportunity |
|---|---|---|---|---|---|---|
| Screen header | titolo con `Text` custom | usa navigation header + action icon custom | titolo + toggle icon custom | top bar custom | header con title + azioni | estrarre `ScreenHeader` + `IconActionButton` |
| Card/surface | card categoria locali | card task con ombre/radius custom | task list usa `Task` card locale | viste interne con superfici locali | bubble/input surface locali | estrarre `CardSurface` |
| Loading | refresh control native | overlay dots animata custom | `ActivityIndicator` + dots custom | `ActivityIndicator` semplice | loading bubble e indicatori custom | estrarre `LoadingState` (`spinner`,`dots`) |
| Empty state | non standardizzato | blocco icona + testo inline | blocco icona + testo inline | dipende dalla vista | chat pre-start state custom | estrarre `EmptyState` |
| Modal shell | `GlobalTaskSearch` + modali categoria locali | `FilterModal` + `AddTask` | `AddTask` | `ViewSelector`, `SearchOverlay`, `MiniCalendar`, `AddTask` | `VoiceChatModal`, `VoiceCalendarModal` | estrarre `ModalShell` base |
| Input shell | solo search button | task form esterno | task form esterno | task form esterno | input chat duplicato in 2 varianti | estrarre `InputShell` |
| Status/metadata chip | limitato | filtri/stati custom | sync indicator chips inline | category filters/view selector locali | badge e stati locali | estrarre `StatusChip`/`MetaChip` |
| Typography scale | titolo 30/700 | mixed local styles | titolo 30/200 + body custom | varianti locali | grande varianza (display/body/caption) | estrarre `AppText` + token typography |
| Spacing/radii/elevation | numeri hardcoded | numeri hardcoded | numeri hardcoded | numeri hardcoded | numeri hardcoded | estrarre token `spacing`,`radius`,`elevation` |

## Duplicazioni critiche emerse

1. Titoli schermata non uniformi (peso/font-size diversi tra screen principali).
2. Loader multipli con logiche simili ma implementazioni diverse.
3. Empty state ripetuti con icona + testo hardcoded.
4. Card/bubble/input surfaces con bordi, radius, ombre ricreate localmente.
5. Chip di stato/sync e metadati implementati in modo ad-hoc.
