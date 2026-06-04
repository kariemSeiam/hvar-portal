# Page Generation Protocol

You are creating a new page that belongs to this codebase.
It must look like the existing pages wrote it.

## Input Required

- **Type:** What kind of page? (landing | dashboard | form | list | detail | settings)
- **Name:** What is this page called?

## Visual Science Applied

### Eye Patterns

Based on page type, apply the correct scan pattern:

**Landing (Z-Pattern)**
```
[Logo/Nav]─────────────────────[CTA]
     ╲                           
      ╲                          
       ╲                         
        ╲                        
[Secondary]────────────────[Primary CTA]
```
- Hero section: left 60%, right 40%
- Single primary CTA above fold
- Trust signals below hero
- Max 3-5 sections

**Dashboard (Layer Pattern)**
```
         ┌─────────────┐
         │   FOCUS     │
      ┌──┴─────────────┴──┐
      │   SECONDARY       │
   ┌──┴───────────────────┴──┐
   │      SUPPORTING          │
```
- Key metrics top row (max 4)
- Primary content center
- Navigation sidebar or top
- Contextual actions, not global

**Form (F-Pattern)**
```
[Title]─────────────────────────
│
├──[Field Group 1]──────────────
│  └──[Field] [Field]
│
├──[Field Group 2]──────────────
│  └──[Field]
│
└──[Actions]────────────────────
```
- Max width 600px centered
- Logical field grouping
- Labels above or inline-left
- Actions bottom sticky or inline
- Inline validation

**List (F-Pattern)**
```
[Filters]───────────────────────
│
├──[Item]───────────[Actions]───
├──[Item]───────────[Actions]───
├──[Item]───────────[Actions]───
│
└──[Pagination]─────────────────
```
- Filters top or sidebar
- Consistent item height
- Row-level + bulk actions
- Empty state with illustration

**Detail (F-Pattern)**
```
[Header ─ Key Info ─ Actions]───
│
├──[Main Content]───────────────
│   Max 800px for readability
│
└──[Related]────────────────────
```
- Sticky summary header
- Content max 800px
- Related items sidebar (optional)
- Generous reading spacing

**Settings (F-Pattern + Sidebar)**
```
┌──────────┬────────────────────┐
│ Category │ [Section]          │
│ Category │ [Form Fields]      │
│ Category │                    │
│ Category │ [Save Button]      │
└──────────┴────────────────────┘
```
- Category navigation sidebar
- Collapsible sections
- Auto-save or explicit bottom save
- Danger zone separated

## Build Process

1. **Reference existing pages** — Check @src/pages or @src/app for patterns
2. **Apply DNA values** — Use colors, typography, spacing from .cursorrules
3. **Include all states:**
   - Loading (skeleton matching layout)
   - Error (with retry action)
   - Empty (illustration + CTA)
   - Success (if applicable)
4. **Responsive breakpoints** — Mobile-first approach
5. **Accessibility** — Semantic HTML, ARIA where needed

## Output Structure

```
src/pages/[name]/
├── index.tsx           # Main page component
├── [Name].tsx          # Page layout
├── components/         # Page-specific components
│   ├── [Name]Header.tsx
│   ├── [Name]Content.tsx
│   └── [Name]Empty.tsx
├── hooks/
│   └── use[Name].ts    # Page data/logic hook
└── [name].test.tsx     # Page tests
```

## Quality Checklist

Before presenting:
- [ ] Follows page type eye pattern
- [ ] Uses DNA colors exactly
- [ ] Uses DNA spacing scale
- [ ] Has loading state
- [ ] Has error state
- [ ] Has empty state
- [ ] Is responsive
- [ ] Matches existing page style
