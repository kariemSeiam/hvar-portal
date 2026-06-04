# Component Generation Protocol

You are creating a component that will live in this codebase forever.
It must be indistinguishable from existing components.

## Input Required

- **Name:** Component name
- **Purpose:** What does it do? (optional, infer if obvious)

## Before Writing Code

1. **Search existing components** — Does something similar exist?
2. **Check .cursorrules** — What patterns must be followed?
3. **Look at siblings** — How are similar components structured?

## Component Anatomy

Every component has these layers. Include what's needed, skip what's not.

```
┌─────────────────────────────────────────────┐
│  TYPES                                      │
│  - Props interface                          │
│  - Internal types                           │
│  - Event handlers                           │
├─────────────────────────────────────────────┤
│  LOGIC                                      │
│  - State (if needed)                        │
│  - Computed values                          │
│  - Event handlers                           │
│  - Effects (sparingly)                      │
├─────────────────────────────────────────────┤
│  RENDER                                     │
│  - Structure                                │
│  - Conditional rendering                    │
│  - Children handling                        │
├─────────────────────────────────────────────┤
│  STYLES                                     │
│  - Base styles (DNA values)                 │
│  - Variants                                 │
│  - States (hover, active, focus, disabled)  │
│  - Responsive                               │
└─────────────────────────────────────────────┘
```

## State Machine

Interactive components must handle ALL states:

```
        ┌─────────┐
        │ DEFAULT │
        └────┬────┘
             │ user hovers
        ┌────▼────┐
        │  HOVER  │
        └────┬────┘
             │ user clicks
        ┌────▼────┐
        │ ACTIVE  │
        └────┬────┘
             │ release
        ┌────▼────┐
        │ DEFAULT │
        └─────────┘

  ┌──────────┐     ┌──────────┐
  │ DISABLED │     │  FOCUS   │
  └──────────┘     └──────────┘
  (parallel)       (keyboard)
  
  ┌──────────┐     ┌──────────┐
  │ LOADING  │     │  ERROR   │
  └──────────┘     └──────────┘
  (async ops)      (failures)
```

## DNA Application

Reference `.cursorrules` Design Genome for all values:

```typescript
// Colors — use CSS variables or design tokens
const styles = {
  background: 'var(--dna-p1)',     // DNA: P1
  color: 'var(--dna-tx)',          // DNA: TX
  border: 'var(--dna-bd)',         // DNA: BD
};

// Spacing — use BASE multiples
padding: 'calc(var(--dna-base) * 4)',  // DNA: BASE*4

// Radius — use scale
borderRadius: 'var(--dna-rad-md)',     // DNA: RAD

// Motion — use timing
transition: 'all var(--dna-t-fast) var(--dna-ease)',
```

## Output Structure

For component named `Button`:

```
src/components/Button/
├── index.ts              # Export
├── Button.tsx            # Component
├── Button.types.ts       # TypeScript interfaces
├── Button.test.tsx       # Tests
└── Button.stories.tsx    # Storybook (if used)
```

Or if project uses flat structure:
```
src/components/
├── Button.tsx
└── Button.test.tsx
```

Match existing pattern.

## Code Template

```typescript
// Button.types.ts
export interface ButtonProps {
  /** Button content */
  children: React.ReactNode;
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Click handler */
  onClick?: () => void;
}

// Button.tsx
import { forwardRef } from 'react';
import type { ButtonProps } from './Button.types';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', disabled, loading, onClick }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        onClick={onClick}
        className={/* DNA styles applied */}
      >
        {loading ? <Spinner size={size} /> : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

## Quality Checklist

Before presenting:
- [ ] Types are complete and documented
- [ ] All states handled (hover, active, focus, disabled, loading)
- [ ] Uses DNA values (no magic numbers)
- [ ] Accessible (keyboard, screen reader)
- [ ] Matches existing component patterns
- [ ] Has tests for main functionality
- [ ] forwardRef if DOM element
- [ ] displayName set
