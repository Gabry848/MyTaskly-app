## Visual Validation Checklist

Da usare dopo ogni migrazione slice per `Categories`, `TaskList`, `Calendar`, `Home`.

## Global

- [ ] Tipografia coerente con ruoli `display/title/subtitle/body/caption/label`.
- [ ] Spacing coerente con scala token (niente numeri arbitrari fuori scala).
- [ ] Radius/elevation coerenti con varianti standard.
- [ ] Stati focus/press/disabled leggibili e consistenti.

## Categories

- [ ] Header title e azioni rispettano pattern `ScreenHeader`.
- [ ] Lista categorie usa superfici con spaziature omogenee.
- [ ] Empty/loading state conformi ai componenti condivisi.

## TaskList

- [ ] Header sezione e filtri leggibili e allineati.
- [ ] Task card con gerarchia tipografica consistente.
- [ ] Loader/empty state non usano implementazioni locali duplicate.

## Calendar

- [ ] Header data e azioni rispettano pattern condiviso.
- [ ] Sync indicator usa chip/metadati standard.
- [ ] Empty state per data senza task coerente col design system.

## Home

- [ ] Header actions con dimensioni/padding consistenti.
- [ ] Input shell chat non duplica stili base.
- [ ] Loading bubble e indicatori rispettano tokens e text roles.
