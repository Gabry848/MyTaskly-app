## ADDED Requirements

### Requirement: Reusable surface patterns SHALL standardize cards and sections
The system SHALL provide composable surface components (card shell, section block, section header) that standardize borders, radius, elevation, and internal spacing patterns.

#### Scenario: Card consistency across modules
- **WHEN** `Task`, `Category`, or `Calendar` content is rendered in a boxed surface
- **THEN** the rendered container MUST use the shared card surface pattern instead of independently redefined style objects

### Requirement: Loading and empty states MUST use shared feedback components
The system MUST provide reusable loading and empty-state components with configurable icon/text and visual variants for list and screen contexts.

#### Scenario: Unified loading behavior
- **WHEN** a screen enters an initial loading state
- **THEN** it SHALL render a shared loading component variant (`spinner` or `dots`) with standardized spacing and typography

### Requirement: Modal and action shells SHALL be reusable across features
The system SHALL expose reusable modal shell and action-row patterns to support feature-level modals without duplicating structure and base styling.

#### Scenario: Modal reuse between features
- **WHEN** a feature opens a modal for data entry or quick actions
- **THEN** the modal MUST be composable through a shared modal shell with configurable header, body, and action slots
