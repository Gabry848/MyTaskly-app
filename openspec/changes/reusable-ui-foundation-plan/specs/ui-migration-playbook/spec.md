## ADDED Requirements

### Requirement: Migration plan SHALL prioritize target screens in defined order
The system SHALL define and follow a phased migration order covering `Categories`, `TaskList`, and `Calendar` first, with `Home` used as compatibility validation context.

#### Scenario: Ordered migration execution
- **WHEN** migration tasks are executed
- **THEN** implementation MUST prioritize shared primitives adoption on the target screens before broader rollout

### Requirement: Migration SHALL preserve existing business behavior
The system SHALL preserve existing screen behavior (task CRUD, sync indicators, chat interactions, navigation) while refactoring visual composition to shared components.

#### Scenario: Visual refactor without functional regressions
- **WHEN** a screen is refactored to foundation components
- **THEN** user-visible business actions and data flows MUST continue to work equivalently to the pre-migration implementation

### Requirement: Migration checklist MUST define verification criteria
The system MUST include a per-screen verification checklist for typography, spacing, loading state, empty state, modal shell, and interactive controls after each migration slice.

#### Scenario: Post-migration validation
- **WHEN** a migration slice is completed for a screen
- **THEN** the team SHALL verify checklist criteria before marking the slice as done
