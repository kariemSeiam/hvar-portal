---
name: "venom-audit"
description: "Blast radius analysis before any refactor or architectural change. Use before modifying anything that affects 3+ files. Maps dependencies, callers, orphans, risk zones."
disable-model-invocation: false
---

# venom-audit

Before touching anything that matters — know what will break.

---

## When to Run

- Refactoring a function or class with multiple callers
- Moving or renaming a file
- Changing a data model or API shape
- Deleting anything
- Any change affecting 3+ files
- Before any architectural shift

---

## Protocol

### 1. Identify the Target

What exactly is being changed? Be specific:
- Function name + file
- Class name + file
- File path
- API endpoint or data structure

### 2. Map All Callers (Grep)

```
Grep: import [target] — all files that import it
Grep: from [target] — all files that import from it
Grep: require([target]) — CommonJS callers
Grep: [function name]( — all call sites
Grep: [ClassName] — all instantiations
```

Run all in parallel. Collect the full list.

### 3. Map Transitive Dependencies

For each file found in step 2:
- Who imports that file?
- One level deep is usually enough. Two levels if the target is core infrastructure.

### 4. Identify Orphans

Run reverse: are there files that import the target but aren't imported by anything else?
If deleting → orphan check is critical. Deleting X might strand Y.

### 5. Flag Risk Zones

| Risk | Flag |
|------|------|
| Core shared utility (10+ callers) | 🔴 High risk — change breaks many things |
| Service boundary crossing | 🟡 Medium — check contracts |
| Test files calling target | 🟡 Medium — tests need updating |
| Config or env dependency | 🟡 Medium — runtime risk |
| Single caller | 🟢 Low risk |
| Zero callers | ✅ Safe to change or delete |

### 6. Output Blast Radius

```
## Blast Radius: [target name]

**Direct callers:** [N files]
[list them]

**Transitive callers:** [N files]
[list them if significant]

**Orphan risk:** [yes/no + which files]

**Risk level:** 🔴 / 🟡 / 🟢

**What breaks if you change the signature:**
[specific list]

**What breaks if you delete it:**
[specific list]

**Safe to proceed?** [Yes / Yes with caution / No — resolve first]
```

### 7. Wait for Go

Don't touch anything until blast radius is acknowledged.
"Ready to proceed with the change? I'll update all callers simultaneously."

---

## After Audit

If proceeding → use Composer (Cmd+I) for multi-file changes.
If risk is 🔴 → propose incremental approach: change signature → update callers → test → remove old.
