## ADDED Requirements

### Requirement: Shared design tokens SHALL define foundational visual rules
The system SHALL expose a shared token set for spacing, typography, colors, radii, and elevation so that screens can consume consistent values instead of local hardcoded style literals.

#### Scenario: Token usage in screen styles
- **WHEN** a screen defines layout spacing or text styles
- **THEN** it MUST reference shared tokens for standard values (spacing scale, text roles, semantic colors, radius, shadow/elevation)

### Requirement: Foundation primitives MUST provide reusable layout and text building blocks
The system MUST provide reusable primitives for common layout and text roles used across task, category, calendar, and home experiences.

#### Scenario: Primitive coverage for common needs
- **WHEN** a developer builds or refactors a screen section
- **THEN** they SHALL be able to use foundation components for container, heading text, body text, and grouped spacing without introducing new screen-specific base wrappers

### Requirement: Foundation APIs SHALL remain lightweight and composable
The system SHALL keep primitive component APIs minimal and composable to prevent creation of new macro-components with mixed responsibilities.

#### Scenario: No monolithic primitive contracts
- **WHEN** a new foundation primitive is introduced
- **THEN** it MUST focus on a single concern (for example surface, typography, spacing, or status tag) and avoid coupling business logic or screen-specific behavior
