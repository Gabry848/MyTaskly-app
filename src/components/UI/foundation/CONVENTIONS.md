## UI Foundation Conventions

Questa cartella contiene primitive UI riutilizzabili e composabili.

## Folder Targets

- `src/theme`: token, scale e helper di stile condivisi.
- `src/components/UI/foundation`: componenti primitivi presentazionali.

## Naming Convention

- File componenti: `PascalCase.tsx` (es. `AppText.tsx`, `ScreenHeader.tsx`).
- File tema/token: `camelCase.ts` (es. `tokens.ts`, `primitives.ts`).
- Export pubblici: centralizzati in `index.ts`.
- Props types: `<ComponentName>Props`.
- Varianti: prop `variant` con union type string literal.

## Design Rules

- Primitive senza logica business (solo rendering/stile/accessibility base).
- Nessun accesso diretto a service, navigation o stato globale.
- Stili hardcoded limitati: preferire token da `src/theme/tokens.ts`.
