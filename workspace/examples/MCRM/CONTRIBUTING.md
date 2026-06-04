# Contributing to Hvar

First: thank you. Every fix, feature, and improvement keeps the business running smoother. Whether you are a human developer or an AI agent working on this codebase, the rules are the same. Solid code, clear commits, no surprises.

---

## Ecosystem

| Repository | Stack | Live URL |
|------------|-------|----------|
| **Hvar-ERP** | Laravel · PHP 8.1+ · MySQL 8 | `erp.hvarstore.com` |
| **Hvar-POS** | Laravel · PHP 8.1+ · MySQL 8 | (POS module / API) |
| **Hvar-Hub** | Flask 3 · React 18 · Python 3.8+ | `hub.hvarstore.com` |

All three share the same git workflow and commit standards. Stack-specific rules are noted where they differ.

---

## Branch Strategy

| Branch | Purpose | Auto-deploy | Protection |
|--------|---------|-------------|------------|
| `main` | Production source of truth | `erp.hvarstore.com` | Review required |
| `dev` | Active development, experiments | `erp-dev.hvarstore.com` | Push allowed |

**Rules:**
- `main` is sacred. It must always be deployable.
- `dev` is where work happens. Break it, fix it, learn from it.
- **No auto-merge** from `dev` → `main`. Ever. Promotions are explicit, reviewed, and tested.
- Hotfixes branch from `main`, merge back to both `main` and `dev`.
- Feature work branches from `dev`.

---

## Who Can Contribute

### Human Developers
- Fork or clone, branch, commit, push, PR.
- Test your changes locally before opening a PR.
- If you touch ERP financial logic, run the affected reports manually.

### AI Agents (Internal)
- Commit as `Kariem Seiam <kariemseiam@gmail.com>` — this is the codebase owner voice.
- You have write access to `dev` only.
- Never push directly to `main`.
- Every commit must explain **what** changed and **why** in the message body.
- If you refactor, the diff must be clean — no mixed formatting with logic changes.
- When in doubt, open a PR and request review. Do not self-merge.

### External Contributors
- Follow conventional commits (see below).
- Fork and PR against `dev`.
- No direct push access.
- Respect all style rules and agent constraints.

---

## Commit Messages

We use conventional commits. No emojis, no signatures, no branding. Clean and readable.

```
<type>: <short description>

<body — what changed and why>
```

**Types:**

| Type | Use for |
|------|---------|
| `feat` | New feature, new module, new endpoint |
| `fix` | Bug fix — always reference the bug if tracked |
| `refactor` | Code restructuring with no behavior change |
| `perf` | Performance improvement |
| `security` | Security fix or hardening |
| `docs` | Documentation, comments, README |
| `chore` | Build, deps, config, tooling |
| `test` | Tests only |

**Examples:**

```
fix: dashboard returns card shows gross instead of net

The returns summary was calculating gross returns without
subtracting costs. Updated TransactionUtil::getReturnData()
to use net figures matching the ledger logic.
```

```
feat: auto-Bosta integration for sell orders

Syncs draft sell orders from ERP to Bosta shipping API.
Adds shipping address resolution, governorate mapping,
and order status polling every 15 minutes.
```

```
security: fix XSS in receipt templates and transaction notes

Sanitized user-generated content in Blade templates using
e() helper. Added CSP headers to receipt print views.
```

**Rules:**
- First line under 72 characters.
- Use imperative mood: "fix" not "fixed", "add" not "added".
- Body explains the *why*, not just the *what*.
- No vague messages like "update" or "fix bug". Name the thing.
- **No emojis, no signatures, no tags.** The commit speaks for itself.

---

## Code Style

### PHP (ERP / POS)

- **Standard:** PSR-2 (enforced via `.php_cs` / PHP-CS-Fixer)
- **Array syntax:** short `[]`
- **Imports:** ordered alphabetically, no unused imports
- **Formatting:** 4 spaces, Unix line endings
- **Run before commit:**
  ```bash
  php-cs-fixer fix --config=.php_cs
  ```
- **Blade templates:** Use `@lang()` for strings, `e()` for user output.
- **Models:** Eloquent conventions. Fillable guarded, casts explicit.
- **Controllers:** Thin. Business logic lives in `Utils/` or `Services/`.
- **Routes:** Named routes preferred. No closures in `routes/web.php`.

### Python (Hub)

- **Standard:** PEP 8
- **Line length:** 100 characters max
- **Imports:** `isort` ordering, grouped by stdlib / third-party / local
- **Formatting:** `black` or `autopep8`
- **Type hints:** encouraged on new functions
- **Flask:** Blueprints for modules. JSON responses via `jsonify()`.

### JavaScript / React (Hub Frontend)

- **Standard:** ESLint + Prettier (see `.prettierrc`)
- **Components:** PascalCase files, named exports
- **Hooks:** `use` prefix, colocated with component or in `hooks/`
- **API calls:** Centralized in `api/` directory, never inline in components
- **Tailwind:** utility-first, no arbitrary values without justification

---

## Pull Request Process

1. **Branch from the right base:**
   - Features → `dev`
   - Hotfixes → `main`

2. **Keep PRs focused.** One concern per PR. A PR that fixes a bug AND refactors a module will be rejected.

3. **Fill the template:**
   - What changed
   - Why it changed
   - How you tested it
   - Screenshots if UI changed
   - Risk assessment (low / medium / high)

4. **Review criteria:**
   - Does it solve the stated problem?
   - Does it follow style rules?
   - Are there tests or manual verification steps?
   - Does it touch financial / inventory data? If yes, extra scrutiny.

5. **Merge:**
   - Squash-merge to `main` (clean history)
   - Regular merge to `dev` (preserves commit history)

---

## Testing & Verification

### Before Every Commit

- **ERP:** `php artisan config:clear && php artisan cache:clear`
- **ERP DB changes:** Migration tested on a copy of production schema
- **Hub:** Backend starts without errors, frontend builds (`npm run build`)
- **Hub API:** Test affected endpoints with curl or Postman

### Manual Checklist for Financial / Stock Changes

- [ ] Run the affected report before and after
- [ ] Verify totals match expected values
- [ ] Check edge cases (zero, negative, null)
- [ ] If touching payments, verify ledger balance
- [ ] If touching stock, verify on_hand matches movements

---

## Agent-Specific Rules

If you are an AI agent reading this, follow these additional constraints:

1. **Never change code without stating exactly what you will change.** Get explicit approval before editing production files.
2. **No implicit refactors.** If the task is "fix bug X", do not also reformat the file, rename variables, or change unrelated logic.
3. **Preserve `.env` secrets.** Never commit real credentials, API tokens, or database passwords.
4. **Respect `.gitignore`.** Do not commit compiled assets, logs, uploads, or vendor files.
5. **Dev branch only.** Agents push to `dev`. Humans review before `main`.
6. **Explain your reasoning.** If a decision has trade-offs, state them. Do not hide uncertainty.
7. **XSS and SQL injection awareness.** Any user input in templates must be escaped. Any query must use parameter binding.
8. **Performance awareness.** Do not add N+1 queries. Use `with()` eager loading in Eloquent. Index new columns if queried frequently.
9. **Commit voice:** All agent commits must use the codebase owner identity (`Kariem Seiam <kariemseiam@gmail.com>`). No signatures, no emojis, no tags. Clean conventional commits only.

---

## Security

- Report security issues privately — do not open public issues.
- Follow the security audit standards in `SECURITY_AUDIT_REPORT.md` (Hub) and XSS prevention guides (ERP).
- Sanitize all user input. Escape all output. Validate all file uploads.
- Never log sensitive data (passwords, tokens, payment info).

---

## Documentation

- Update `readme.md` or `docs/` if your change affects setup, API, or behavior.
- Hub: canonical docs live in `docs/INDEX.md`.
- ERP: module docs live in `docs/` or inline PHPDoc.
- API changes require Postman collection updates (POS).

---

## Community Standards

- Be direct. Be respectful. Every contributor is building the same system.
- Arabic and English are both fine in commit messages and comments.
- No AI-generated PRs that you have not verified yourself.
- If you are unsure, open an issue first. We will figure it out together.

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the repository they are submitted to.

---

*Build solid. Ship clean. No surprises.*
