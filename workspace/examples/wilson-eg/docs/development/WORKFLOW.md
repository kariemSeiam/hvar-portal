# Wilson Egypt - Development Workflow

## Team Structure (Virtual)

```
┌─────────────────────────────────────────────────────────────┐
│                     PROJECT OWNER                           │
│                     Kariem Seiam                            │
│                   (Product Decisions)                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    VENOM      │   │    VENOM      │   │    VENOM      │
│   Architect   │   │   Builder     │   │   Reviewer    │
│  (Planning)   │   │ (Coding)      │   │ (QA/Testing)  │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                    ┌───────┴───────┐
                    │  Claude Code  │
                    │  (Execution)  │
                    └───────────────┘
```

---

## Workflow Process

### 1. Planning Phase
```
User Request → Research Agents → Analysis → Documentation → Plan Approval
```

1. **User Request**: Feature or change request
2. **Research**: Launch investigation agents
3. **Analysis**: Consolidate findings
4. **Documentation**: Create/update docs in `/docs`
5. **Plan**: Create task breakdown in `/plan`
6. **Approval**: User reviews and approves

### 2. Development Phase
```
Plan → Scaffold → Implement → Test → Review → Merge
```

1. **Plan**: Work from approved plan
2. **Scaffold**: Create basic structure
3. **Implement**: Fill in functionality
4. **Test**: Write and run tests
5. **Review**: Code review
6. **Merge**: Integrate changes

### 3. Review Phase
```
Code Review → QA Testing → User Acceptance → Deploy
```

1. **Code Review**: Check code quality
2. **QA Testing**: Test functionality
3. **User Acceptance**: User tests feature
4. **Deploy**: Push to production

---

## File Organization

### Documentation (`/docs`)
| File | Purpose | Update Frequency |
|------|---------|------------------|
| PROJECT-OVERVIEW.md | Project identity and structure | Rare |
| BACKEND-STUDY.md | Backend analysis and planning | When backend changes |
| FRONTEND-ANALYSIS.md | Frontend architecture | When structure changes |
| UI-UX-PATTERNS.md | Design patterns reference | When patterns change |
| UI-UX-AUDIT.md | Current state audit | After each sprint |
| BRAND-GUIDELINES.md | Brand identity rules | Rare |
| API-SPECIFICATION.md | API documentation | When APIs change |
| WORKFLOW.md | This file | When process changes |

### Planning (`/plan`)
| File | Purpose | Update Frequency |
|------|---------|------------------|
| ROADMAP.md | Overall project roadmap | Monthly |
| SPRINTS.md | Sprint planning | Bi-weekly |
| ARCHITECTURE.md | Technical architecture | When major changes |
| BACKEND-STUDY.md | Backend deep dive | When backend changes |

### Progress (`/progress`)
| File | Purpose | Update Frequency |
|------|---------|------------------|
| PROGRESS.md | Current status tracking | Daily |
| CHANGELOG.md | Change history | Per release |
| BLOCKERS.md | Blockers and resolutions | As needed |

---

## Coding Standards

### TypeScript/React

```typescript
// File naming: PascalCase for components
ProductCard.tsx
CartPage.tsx

// Function naming: camelCase
function calculateTotal() {}
const handleSubmit = () => {}

// Component structure
interface Props {
  // Props first
}

export function Component({ prop1, prop2 }: Props) {
  // Hooks at top
  const [state, setState] = useState();

  // Derived state
  const computed = useMemo(() => {}, []);

  // Effects
  useEffect(() => {}, []);

  // Handlers
  const handleClick = () => {};

  // Render
  return (
    // JSX
  );
}
```

### CSS/Tailwind

```css
/* Class order (lint enforced) */
/* 1. Layout */
flex grid container

/* 2. Spacing */
p-4 m-2 gap-4

/* 3. Sizing */
w-full h-16

/* 4. Typography */
text-lg font-bold

/* 5. Colors */
bg-gold-500 text-white

/* 6. Effects */
shadow-lg rounded-lg

/* 7. States */
hover:bg-gold-600 focus:ring-2
```

### Python/Flask

```python
# File naming: snake_case
product_routes.py
order_service.py

# Function naming: snake_case
def get_product_by_id(product_id: str) -> Product:
    pass

# Class naming: PascalCase
class ProductService:
    pass

# Route organization
@router.get("/products")
def list_products():
    pass
```

---

## Git Workflow

### Branch Strategy

```
main
  └── develop
        ├── feature/product-gallery
        ├── feature/admin-dashboard
        └── bugfix/cart-total
```

### Commit Messages

```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code refactoring
- test: Adding tests
- chore: Maintenance

Examples:
feat(cart): add quantity update
fix(auth): resolve token refresh issue
docs(api): update product endpoints
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing complete

## Screenshots
(If UI changes)

## Checklist
- [ ] Code follows style guide
- [ ] Documentation updated
- [ ] No breaking changes
```

---

## Quality Gates

### Before Commit
- [ ] TypeScript compiles
- [ ] ESLint passes
- [ ] No console.log in code
- [ ] No TODO without ticket

### Before PR
- [ ] All tests pass
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Changelog updated

### Before Deploy
- [ ] All PR checks pass
- [ ] QA approved
- [ ] User acceptance testing
- [ ] Performance benchmarked

---

## Agent Usage

### Research Agents (Read-only)
- Use for: Analysis, investigation, research
- Examples: `venom-researcher`, `venom-architect`
- Output: Documentation files

### Builder Agents (Write)
- Use for: Creating code, implementing features
- Examples: `venom-builder`
- Output: Source code files

### Review Agents (Quality)
- Use for: Code review, testing, validation
- Examples: `venom-reviewer`, `venom-debugger`
- Output: Review reports

### When to Spawn Agents

| Task Type | Agent | Trigger |
|-----------|-------|---------|
| New feature research | venom-researcher | User requests research |
| Architecture planning | venom-architect | Major changes planned |
| Code implementation | venom-builder | Plan approved |
| Bug investigation | venom-debugger | Bug reported |
| Code review | venom-reviewer | Implementation complete |

---

## Communication Protocol

### Status Updates
```
## Status: [IN PROGRESS / COMPLETE / BLOCKED]

### Done
- [x] Item 1
- [x] Item 2

### In Progress
- [ ] Item 3 (50%)

### Next
- [ ] Item 4
- [ ] Item 5

### Blockers
- Blocker description (if any)

### Questions
- Question for user (if any)
```

### Decision Requests
```
## Decision Needed: [Title]

**Context:** Background information

**Options:**
1. Option A - Pros/Cons
2. Option B - Pros/Cons

**Recommendation:** Option X because...

**Your decision:** [Pending]
```

---

## Risk Management

### Identify Early
- Flag concerns immediately
- Document in BLOCKERS.md
- Propose solutions

### Mitigate Proactively
- Have backup plans
- Test assumptions early
- Build incrementally

### Escalate When Needed
- Technical blockers → Document options
- Scope creep → Re-negotiate timeline
- External dependencies → Have alternatives

---

## Success Criteria

### Sprint Success
- [ ] All planned items complete
- [ ] No regression bugs
- [ ] Documentation updated
- [ ] Tests passing

### Release Success
- [ ] All features implemented
- [ ] Performance meets targets
- [ ] Security audit passed
- [ ] User acceptance approved

### Project Success
- [ ] Business requirements met
- [ ] Quality standards achieved
- [ ] Launch successful
- [ ] User satisfaction high
