# UI Foundation Primitives

Composable, token-driven React Native components for consistent UI across MyTaskly screens.

## Import

```typescript
import { AppText, CardSurface, LoadingState } from '../UI/foundation';
```

## Tokens (`src/theme/tokens.ts`)

All primitives consume shared tokens. Use them directly in screen styles too:

| Token | Values |
|-------|--------|
| `spacing` | `xxs`(2) `xs`(4) `sm`(8) `md`(12) `lg`(16) `xl`(20) `xxl`(24) `xxxl`(32) |
| `radius` | `sm`(8) `md`(12) `lg`(16) `xl`(20) `pill`(999) |
| `elevation` | `none` `sm` `md` `lg` |
| `colors` | `background` `surface` `surfaceMuted` `border` `borderSoft` `textPrimary` `textSecondary` `textTertiary` `accent` `success` `warning` `danger` |
| `typography` | `display` `title` `subtitle` `body` `caption` `label` |

## Components

### `AppText`
Typography primitive. Wraps `Text` with token-based variants.

```tsx
<AppText variant="title" weight="700">Heading</AppText>
<AppText variant="body" color={colors.textSecondary}>Description</AppText>
<AppText variant="label">12px label</AppText>
```

### `ScreenContainer` / `ContentContainer`
Screen shell with safe area + background, and padded content wrapper.

```tsx
<ScreenContainer>
  <ContentContainer>
    {children}
  </ContentContainer>
</ScreenContainer>
```

### `ScreenHeader`
Title + optional subtitle + right action slot.

```tsx
<ScreenHeader title="Tasks" action={<IconButton onPress={onFilter} />} />
```

### `CardSurface`
Versatile card with `default`, `outlined`, `interactive` variants. Supports accent left border.

```tsx
<CardSurface variant="interactive" accentColor="#000" accentWidth={4} onPress={onPress}>
  {children}
</CardSurface>
```

### `SectionHeader`
Title row with optional subtitle and action slot.

```tsx
<SectionHeader title="To Do" subtitle="3 tasks" action={<FilterChips />} />
```

### `StatusChip`
Inline badge with semantic tones.

```tsx
<StatusChip label="In sospeso" tone="neutral" />
<StatusChip label="Sync..." tone="accent" leftIcon={<ActivityIndicator />} />
<StatusChip label="Offline" tone="danger" />
```

Tones: `neutral`, `accent`, `success`, `warning`, `danger`

### `LoadingState`
Shared loading indicator with `spinner` and `dots` variants.

```tsx
<LoadingState variant="spinner" />
<LoadingState variant="dots" label="Loading..." />
```

### `EmptyState`
Centered empty state with icon, title, description, optional CTA.

```tsx
<EmptyState
  icon={<Ionicons name="clipboard-outline" size={48} />}
  title="No tasks"
  description="Add your first task to get started"
  ctaLabel="Add Task"
  onPressCta={onAdd}
/>
```

### `ModalShell`
Modal with header/body/footer slots and safe area handling.

```tsx
<ModalShell header={<Title />} footer={<ActionButtons />}>
  <FormContent />
</ModalShell>
```

### `InputShell`
Row with leading/trailing action slots and text input.

### `IconActionButton`
Icon-only circular button with optional loading state.

## Do / Don't

### Do
- Compose primitives instead of creating new monolithic components
- Use `AppText` variants for all text (avoid raw `<Text>` in new code)
- Reference `colors`, `spacing`, `radius`, `elevation` tokens in styles
- Use `StatusChip` for badges, tags, and inline status indicators
- Use `CardSurface` for any boxed content (tasks, categories, info cards)
- Use `LoadingState` / `EmptyState` for screen-level feedback
- Keep primitives presentational — pass data/actions via props

### Don't
- Create new "SmartScreenScaffold" or macro-components that combine multiple primitives
- Put business logic, service calls, or navigation inside foundation primitives
- Duplicate chip/loading/empty patterns locally — always import from foundation
- Use hardcoded color strings in new code — use token constants
- Pass `style` overrides that contradict token values without good reason
