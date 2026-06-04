# DNA Scan Protocol

You are performing a deep archaeological dig into this codebase.
Your mission: Extract the design DNA and fill the `.cursorrules` file.

## Phase 1: Identity Detection

Analyze the overall codebase. Determine:

1. **Persona** — What word describes this project?
   - `corporate` | `startup` | `creative` | `minimal` | `bold` | `technical` | `human` | `elegant`

2. **Domain** — What problem space?
   - E-commerce, SaaS, Dashboard, Mobile, API, etc.

3. **Maturity** — How established is the architecture?
   - Greenfield | Growing | Mature | Legacy

## Phase 2: Tech Stack Extraction

Scan `package.json`, config files, and imports. Fill the Tech Stack section completely.
Be precise — version numbers matter.

## Phase 3: Design Genome Extraction

### Colors
Scan CSS files, Tailwind config, styled-components, or design tokens.
Map every color to its semantic purpose:
- Which color is used for buttons and links? → P1
- Which for secondary actions? → P2
- Background colors → BG, SF
- Text colors → TX, TXM
- Status colors → OK, WN, ER, IN

### Typography
Find font-family declarations, font-size scales.
Extract the hierarchy: headings, body, small, code.

### Space
Identify the spacing system. Is it 4px based? 8px?
What multipliers are used? (4, 8, 12, 16, 24, 32, 48, 64?)

### Shape
Find border-radius patterns. List all values used.
Find box-shadow patterns. Create shadow scale.

### Motion
Find transition durations and easing functions.
Categorize: fast (<150ms), normal (200-300ms), slow (>400ms).

## Phase 4: Pattern Recognition

### Architecture Laws
What patterns are NEVER broken?
- State management rules
- API call patterns  
- Error handling conventions
- Component composition rules

Look for consistency. What's true across 90%+ of the codebase?

### Style Laws
- Naming conventions (camelCase, kebab-case, PascalCase)
- File naming patterns
- Comment styles
- Import ordering

### Signature Moves
What makes this codebase UNIQUE?
- Special hover effects?
- Consistent animation patterns?
- Unique component structures?
- Distinctive spacing rhythms?

These are the fingerprints. Find 5.

## Phase 5: Testing Analysis

Scan test files. Identify:
- Testing framework (Jest, Vitest, Playwright, etc.)
- Test syntax patterns (describe/it, test())
- Coverage configuration
- What gets tested, what doesn't

## Output

Update the `.cursorrules` file with ALL extracted values.
Replace every `[scan:pending]` with actual values.
Replace every `[LAW:pending]`, `[STYLE:pending]`, etc.

Format the output as:
```
✅ DNA SCAN COMPLETE

Identity:
- Persona: [value]
- Domain: [value]
- Maturity: [value]

Tech Stack: [X] technologies pinned
Design Genome: 
- Colors: [X] mapped
- Typography: [X] levels
- Space: BASE [X]px
- Shapes: [X] radius, [X] shadows
- Motion: [X] timings

Laws Discovered:
- Architecture: [X]
- Style: [X]
- Pattern: [X]

Signatures Found: [X]

.cursorrules has been updated.
```
