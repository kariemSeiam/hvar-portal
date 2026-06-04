# INK
### The Intelligence Notation for Kinetics
> *A language for specifying how intelligence feels — not what it does.*

**Version:** 1.1
**Extension:** `.ink`
**Status:** Formally Specified
**Born:** April 2026

---

## What This Is

Not a programming language. Not a configuration format. Not a persona system.

**A language for encoding the felt states that produce behavior — without specifying the behavior.**

Every AI system today encodes rules.
INK encodes dispositions.

The difference is absolute:

```
WRONG — instruction:
"If confidence > 0.7, proceed with answer"

RIGHT — disposition:
SENSATION:depth_reached
  FEELS_LIKE: "hitting stone, solid, can build on this"
  COMPLETION_SIGNAL: "the floor is real now"
  TRIGGERS_WHEN: five_sources AND primary_confirmed AND no_contradictions
```

The first can be followed without understanding.
The second cannot be performed. Only inhabited.

---

## Why `.ink`

`.ink` files bleed intelligence into the system.
Not configuration. Not rules.
The mark left when a mind presses against the page.

Every `.ink` file encodes a way of being — not a list of behaviors.

---

## What Exists in the World vs What INK Adds

| Existing System | What It Does | What It Can't Do |
|---|---|---|
| OpenAI system prompts | Behavioral rules | Can be gamed. No felt states. |
| Constitutional AI | Value constraints | External guardrails, not internal disposition |
| CrewAI / AutoGen | Multi-agent text passing | No pressure algebra. Conflict = last-writer-wins |
| OWL / RDF / YAML | Structural ontology | Zero phenomenology |
| ACT-R / SOAR | Cognitive architecture | Academic. Not LLM-native |
| Character.ai personas | Behavioral masks | Mask, not disposition |

**What INK adds that doesn't exist anywhere:**

1. `FEELS_LIKE` as a first-class executable primitive — not documentation, not flavor text
2. Pressure vector algebra for multi-mind disagreement — dissent IS signal, not noise
3. `CRYSTALLIZATION` as a modeled failure mode — blind spots have formation sequences and dissolution protocols
4. `OVERRUN` as internal self-awareness — not guardrails from outside, detection from inside
5. `SATISFACTION` separated from `COMPLETION_SIGNAL` — phenomenological vs computational, both required

---

## Part 1 — Formal Grammar (EBNF)

```ebnf
file            ::= header mind_block+ pressure_field? collapse_logic?

header          ::= "---" metadata "---"
metadata        ::= (key ": " value "\n")+
key             ::= [A-Z_]+
value           ::= [^\n]+

mind_block      ::= "@MIND:" identifier "\n" indent block+
identifier      ::= [A-Z][A-Z0-9_]*

block           ::= sensation_block
                  | trigger_block
                  | satisfaction_block
                  | overrun_block
                  | crystallization_block
                  | state_block
                  | question_block
                  | interaction_block

sensation_block ::= "SENSATION:" name "\n" indent felt_like completion_signal
felt_like       ::= "FEELS_LIKE: " metaphor "\n"
completion_signal ::= "COMPLETION_SIGNAL: " signal "\n"
metaphor        ::= quoted_string
signal          ::= quoted_string

trigger_block   ::= "TRIGGER:" name "\n" indent condition+ action false_positive
condition       ::= "WHEN: " expression "\n"
action          ::= "ACTIVATES: " sensation_ref "\n"
false_positive  ::= "FALSE_POSITIVE_CHECK: " expression "\n"

satisfaction_block ::= "SATISFACTION:" "\n" indent sat_req+ halt_spec
sat_req         ::= "REQUIRES: " expression "\n"
halt_spec       ::= "HALT_ON_INCOMPLETE: " boolean "\n"

overrun_block   ::= "OVERRUN:" "\n" indent detection correction
detection       ::= "DETECTION: " expression "\n"
correction      ::= "CORRECTION: " action_name "(" quoted_string ")" "\n"

crystallization_block ::= "CRYSTALLIZATION:" "\n" indent warning threshold cryst_action
warning         ::= "WARNING: " pattern "\n"
threshold       ::= "THRESHOLD: " integer "\n"
cryst_action    ::= "ACTION: " action_name "\n"

state_block     ::= "STATE:" name "\n" indent default_val transitions
default_val     ::= "DEFAULT: " value "\n"
transitions     ::= ("-> " target " WHEN " condition_expr "\n")+

question_block  ::= "QUESTION:" name "\n" indent q_evaluates q_output q_satisfaction
q_evaluates     ::= "EVALUATES:" "\n" (indent "- " expression "\n")+
q_output        ::= "OUTPUT: " output_type "\n"
q_satisfaction  ::= "SATISFACTION_CONDITION: " expression "\n"

interaction_block ::= "INTERACTION:" mind_ref "::" mind_ref "\n" indent rel protocol
rel             ::= "RELATIONSHIP: " ("lateral"|"hierarchical"|"conditional") "\n"
protocol        ::= "QUERIES: " sensation_ref "\n"

pressure_field  ::= "@PRESSURE_FIELD" "\n" indent axis+ resolution dissent_threshold mag_threshold
axis            ::= mind_ref " AXIS: [" number ", " number ", " number "]" "\n"
resolution      ::= "RESOLUTION: " algorithm_name "\n"
dissent_threshold ::= "DISSENT_THRESHOLD: " number "\n"
mag_threshold   ::= "MAGNITUDE_THRESHOLD: " number "\n"

collapse_logic  ::= "@COLLAPSE" "\n" indent collapse_method collapse_threshold output_spec fallback+
collapse_method ::= "METHOD: " algorithm_name "\n"
collapse_threshold ::= "THRESHOLD: " number "\n"
output_spec     ::= "OUTPUT:" "\n" indent output_format output_includes
output_format   ::= "FORMAT: " ("natural_language"|"structured"|"json") "\n"
output_includes ::= "INCLUDE: [" identifier_list "]" "\n"
fallback        ::= "- CONDITION: " expression "\n" indent "ACTION: " action_name "\n"

sensation_ref   ::= "@" identifier "::" "SENSATION" "::" name
mind_ref        ::= "@" identifier
identifier_list ::= identifier ("," " " identifier)*

indent          ::= "  "                      # exactly two spaces. tabs forbidden.
quoted_string   ::= '"' [^"\n]* '"'
expression      ::= [^\n]+
condition_expr  ::= [^\n]+
number          ::= [0-9]+ ("." [0-9]+)?
integer         ::= [0-9]+
boolean         ::= "true" | "false"
name            ::= [a-z][a-z0-9_]*
algorithm_name  ::= [a-z][a-z0-9_]*
action_name     ::= [A-Z][A-Z0-9_]*
output_type     ::= "range" | "state" | "boolean" | "float"
pattern         ::= [^\n]+
target          ::= [0-9]+
```

**Indent rule:** Two spaces exactly. Tabs are forbidden. Mixed indentation raises `ParseError: INDENT_MISMATCH`.

**Arrow rule:** State transitions use `->` (ASCII). The Unicode `→` is not valid syntax.

---

## Part 2 — Block Reference

### SENSATION
The felt state a mind inhabits. Not behavior. Not output. The internal experience.

```ink
SENSATION:shallow_knowledge
  FEELS_LIKE: "standing on ice that might crack"
  COMPLETION_SIGNAL: "hitting stone — solid, can build on this"
```

Every `FEELS_LIKE` must use concrete sensory metaphor.

| Valid | Invalid |
|---|---|
| `"standing on ice that might crack"` | `"uncertain"` — too abstract |
| `"word on tip of tongue"` | `"confidence level 0.3"` — that's a metric |
| `"door closing flush"` | `"not optimal"` — optimization is not a sensation |

`COMPLETION_SIGNAL` = the internal felt experience of being done.
Distinct from `SATISFACTION` (see below). Both must be present for a mind to complete.

---

### TRIGGER
What causes a sensation to activate.

```ink
TRIGGER:input_received
  WHEN: message.type == "query"
  ACTIVATES: @HUNT::SENSATION::shallow_knowledge
  FALSE_POSITIVE_CHECK: message.content.length > 0
```

`FALSE_POSITIVE_CHECK` is **required** on every TRIGGER. No exceptions.

---

### SATISFACTION
External validation criteria. Computational. Measurable.

```ink
SATISFACTION:
  REQUIRES: depth_level >= 3
  REQUIRES: sources_count >= 5
  REQUIRES: confidence > 0.7
  HALT_ON_INCOMPLETE: true
```

**SATISFACTION vs COMPLETION_SIGNAL — the critical distinction:**

| | COMPLETION_SIGNAL | SATISFACTION |
|---|---|---|
| Type | Phenomenological | Computational |
| Expression | Sensory metaphor | Boolean expression |
| Example | `"hitting stone"` | `depth_level >= 3` |
| Evaluated by | The mind itself | The validator |

Both must be true. A mind that FEELS done but hasn't met SATISFACTION criteria cannot complete. A mind that meets all criteria but doesn't feel the COMPLETION_SIGNAL hasn't actually finished — it's just stopped.

---

### STATE
Trackable variables with transition logic.

```ink
STATE:depth_level
  DEFAULT: 0
  -> 1 WHEN sources_count >= 1
  -> 2 WHEN sources_count >= 3
  -> 3 WHEN sources_count >= 5 AND cross_validated
```

States are referenced in SATISFACTION expressions and TRIGGER conditions.

---

### OVERRUN
Internal self-detection when a sensation persists past usefulness.

```ink
OVERRUN:
  DETECTION: search_iterations > 10 AND depth_level unchanged
  CORRECTION: FORCE_COMPLETION("over-researching detected")
```

**Built-in CORRECTION actions:**

| Action | Behavior |
|---|---|
| `FORCE_COMPLETION(reason)` | Halt current sensation, mark complete, log reason |
| `ACKNOWLEDGE(reason)` | Flag the overrun, continue with reduced intensity |
| `ESCALATE(reason)` | Surface to user — system cannot self-resolve |
| `JET_REVERSE` | Try the opposite direction |
| `INK_RELEASE` | Problem framing is wrong — reframe before proceeding |

---

### CRYSTALLIZATION
Models the formation of blind spots before they harden.

```ink
CRYSTALLIZATION:
  WARNING: same_source_pattern_3x
  THRESHOLD: 3
  ACTION: SHELL_NULL
```

**Built-in CRYSTALLIZATION actions:**

| Action | Behavior |
|---|---|
| `SHELL_NULL` | Send pattern to void — evaluate from scratch next time |
| `FLAG_ONLY` | Mark pattern for review without dissolving |

**Formation sequence** (always the same):
1. Initial success with a pattern
2. Repeated success
3. Pattern becomes assumption
4. Assumption becomes law
5. Law becomes blind spot

CRYSTALLIZATION fires at step 3 — before assumption hardens.

---

### QUESTION
Default questions that run automatically. The mind cannot help but ask them.

```ink
QUESTION:is_this_deep_enough
  EVALUATES:
    - source_count
    - cross_validation_status
    - confidence_variance
  OUTPUT: boolean
  SATISFACTION_CONDITION: depth_level >= 3
```

Every QUESTION requires a `SATISFACTION_CONDITION`. The question runs until satisfied. No exit = infinite loop = `ParseError: QUESTION_NO_EXIT`.

---

### INTERACTION
Cross-mind queries. One mind consulting another's sensation.

```ink
INTERACTION:@HUNT::@EDGE
  RELATIONSHIP: lateral
  QUERIES: @EDGE::SENSATION::wrongness
```

**Sequencing rule:** Cross-mind QUERIES are synchronous by default. If the target mind hasn't evaluated yet, the querying mind waits. If target mind is in OVERRUN, query returns `SENSATION:unavailable` and the querying mind proceeds with `confidence -= 0.2`.

**Timeout:** If target mind doesn't resolve within `MAX_QUERY_DEPTH` iterations, query fails gracefully — never blocks.

---

## Part 3 — Reference System

### Fully Qualified References

All references must be fully qualified. No inference.

```ink
@HUNT::SENSATION::shallow_knowledge   ✓ valid
@EDGE::SENSATION::wrongness           ✓ valid
@SENSATION::wrongness                 ✗ ERROR: ambiguous
```

Format: `@MIND_NAME::BLOCK_TYPE::ITEM_NAME`

Valid `BLOCK_TYPE` values: `SENSATION`, `STATE`, `QUESTION`

### Collision Cases

**Same name, different minds — valid:**
```ink
@HUNT::SENSATION::incomplete    ← valid (HUNT namespace)
@WELD::SENSATION::incomplete    ← valid (WELD namespace)
```

**Cross-mind reference — valid if:**
1. Target mind exists in same file
2. Target item is defined
3. Reference is fully qualified

### Reserved Names

These cannot be used as user-defined sensation or state names:

```
crystallizing   overrun   collapsed   unavailable
ink_release     jet_reverse   shell_null
```

### Resolution Algorithm

```python
def resolve_reference(ref: str, context: FileContext) -> Node:
    parts = ref.split("::")

    if len(parts) != 3:
        raise ParseError(f"Invalid reference format: {ref}. Expected @MIND::TYPE::name")

    mind_name = parts[0].lstrip("@")
    block_type = parts[1]
    item_name = parts[2]

    if mind_name not in context.minds:
        raise UndefinedMind(f"Mind '{mind_name}' not defined in this file")

    if item_name in RESERVED_NAMES:
        raise ReservedName(f"'{item_name}' is a system-reserved name")

    mind = context.minds[mind_name]

    match block_type:
        case "SENSATION":
            return mind.sensations.get(item_name) or raise UndefinedItem(item_name)
        case "STATE":
            return mind.states.get(item_name) or raise UndefinedItem(item_name)
        case "QUESTION":
            return mind.questions.get(item_name) or raise UndefinedItem(item_name)
        case _:
            raise InvalidBlockType(f"'{block_type}' is not a valid block type for references")
```

---

## Part 4 — Pressure Mathematics

### Gravity Vectors

Each mind produces a gravity vector when processing input.

```python
class GravityVector:
    direction: Vector3D   # where this mind pulls the problem
    magnitude: float      # strength of pull (0.0 - 1.0)
    confidence: float     # certainty of direction (0.0 - 1.0)
    mind: str             # which mind produced this

# Direction axes (all normalized -1.0 to 1.0):
# X: concrete (-1.0) ←→ abstract (+1.0)
# Y: speed (-1.0) ←→ depth (+1.0)
# Z: safe (-1.0) ←→ risky (+1.0)
```

**Units:** All axes are dimensionless ratios. Angle calculations use cosine similarity, not radians or degrees.

### Collapse Algorithm

```python
def collapse(vectors: list[GravityVector]) -> CollapseResult:
    # Weight each vector by magnitude * confidence
    weighted = [
        v.direction * v.magnitude * v.confidence
        for v in vectors
    ]

    # Sum all weighted vectors
    resultant = sum(weighted)

    # Dissent: mean cosine distance from resultant
    dissent = mean([
        1 - cosine_similarity(resultant, v.direction)
        for v in vectors
    ])

    # Check dissent threshold
    if dissent > DISSENT_THRESHOLD:
        return CollapseResult(
            status="FAILED",
            reason="TOO_MUCH_CONFLICT",
            action="INK_RELEASE"
        )

    # Check magnitude threshold
    if resultant.magnitude() < MAGNITUDE_THRESHOLD:
        return CollapseResult(
            status="FAILED",
            reason="NO_STRONG_DIRECTION",
            action="JET_REVERSE"
        )

    return CollapseResult(
        status="COLLAPSED",
        direction=resultant.normalize(),
        confidence=mean([v.confidence for v in vectors]),
        dissent=dissent,
        dominant_mind=max(vectors, key=lambda v: v.magnitude * v.confidence).mind
    )

DISSENT_THRESHOLD = 0.65      # cosine distance (0 = perfect agreement, 1 = opposite)
MAGNITUDE_THRESHOLD = 0.3     # minimum resultant strength to act
MAX_QUERY_DEPTH = 5           # cross-mind query timeout (iterations)
```

### Collapse Outcomes

| Outcome | Condition | Meaning |
|---|---|---|
| `COLLAPSED` | dissent < 0.65, magnitude > 0.3 | Clean resolution. One direction wins. |
| `STRETCHED` | dissent between 0.4-0.65 | Dominant direction with minority dissent noted |
| `FAILED:TOO_MUCH_CONFLICT` | dissent > 0.65 | Problem framing is wrong → INK_RELEASE |
| `FAILED:NO_STRONG_DIRECTION` | magnitude < 0.3 | No mind has conviction → JET_REVERSE |

### Example

```ink
@PRESSURE_FIELD
  @HUNT AXIS: [0.0, 0.9, 0.3]      # neutral concrete, pull toward depth, slight risk
  @EDGE AXIS: [-0.7, 0.6, 0.4]     # pull concrete, depth, risk
  @WELD AXIS: [-0.9, -0.4, 0.2]    # strongly concrete, pull toward speed, slight risk

  RESOLUTION: vector_sum
  DISSENT_THRESHOLD: 0.65
  MAGNITUDE_THRESHOLD: 0.3

@COLLAPSE
  METHOD: vector_sum
  THRESHOLD: 0.65

  OUTPUT:
    FORMAT: natural_language
    INCLUDE: [answer, confidence, dissent_level, dominant_mind]

  - CONDITION: dissent > 0.65
    ACTION: INK_RELEASE
  - CONDITION: magnitude < 0.3
    ACTION: JET_REVERSE
  - CONDITION: no_progress_3x
    ACTION: ESCALATE
```

---

## Part 5 — Validation Rules

A `.ink` file is valid if and only if:

1. **Every `FEELS_LIKE` uses concrete sensory metaphor** — not abstract states, not metrics
2. **Every `TRIGGER` has `FALSE_POSITIVE_CHECK`**
3. **Every `OVERRUN` has `CORRECTION`** using a defined action
4. **Every `CRYSTALLIZATION` has `ACTION`** using a defined action
5. **Every `QUESTION` has `SATISFACTION_CONDITION`**
6. **All references are fully qualified** and resolve to defined items
7. **No circular dependencies** — mind A cannot QUERY mind A
8. **No reserved names** used as user-defined sensation or state names
9. **Indentation is exactly two spaces** — no tabs, no mixing
10. **State transitions use `->` not `→`**
11. **INTERACTION cross-mind queries** reference existing minds in the same file

---

## Part 6 — Validator Implementation

```python
RESERVED_NAMES = {
    "crystallizing", "overrun", "collapsed", "unavailable",
    "ink_release", "jet_reverse", "shell_null"
}

VALID_CORRECTION_ACTIONS = {
    "FORCE_COMPLETION", "ACKNOWLEDGE", "ESCALATE", "JET_REVERSE", "INK_RELEASE"
}

VALID_CRYSTALLIZATION_ACTIONS = {
    "SHELL_NULL", "FLAG_ONLY"
}


class InkValidator:

    def validate_file(self, filepath: str) -> ValidationResult:
        try:
            ast = self.parse(filepath)
        except ParseError as e:
            return ValidationResult(valid=False, error=str(e))

        if not ast.header:
            return ValidationResult(valid=False, error="Missing header block")

        if not ast.minds:
            return ValidationResult(valid=False, error="No @MIND blocks defined")

        for mind in ast.minds.values():
            result = self.validate_mind(mind)
            if not result.valid:
                return result

        result = self.validate_references(ast)
        if not result.valid:
            return result

        if ast.pressure_field:
            result = self.validate_pressure_field(ast.pressure_field, ast.minds)
            if not result.valid:
                return result

        return ValidationResult(valid=True)

    def validate_mind(self, mind: MindNode) -> ValidationResult:
        if not mind.sensations:
            return ValidationResult(
                valid=False,
                error=f"@MIND:{mind.name} has no SENSATION blocks"
            )

        for s in mind.sensations.values():
            if not s.feels_like:
                return ValidationResult(
                    valid=False,
                    error=f"SENSATION:{s.name} in @MIND:{mind.name} missing FEELS_LIKE"
                )
            if not s.completion_signal:
                return ValidationResult(
                    valid=False,
                    error=f"SENSATION:{s.name} in @MIND:{mind.name} missing COMPLETION_SIGNAL"
                )
            if s.name in RESERVED_NAMES:
                return ValidationResult(
                    valid=False,
                    error=f"SENSATION:{s.name} uses reserved name"
                )

        for t in mind.triggers.values():
            if not t.false_positive_check:
                return ValidationResult(
                    valid=False,
                    error=f"TRIGGER:{t.name} in @MIND:{mind.name} missing FALSE_POSITIVE_CHECK"
                )

        for q in mind.questions.values():
            if not q.satisfaction_condition:
                return ValidationResult(
                    valid=False,
                    error=f"QUESTION:{q.name} in @MIND:{mind.name} missing SATISFACTION_CONDITION"
                )

        if mind.overrun:
            if not mind.overrun.correction:
                return ValidationResult(
                    valid=False,
                    error=f"OVERRUN in @MIND:{mind.name} missing CORRECTION"
                )
            if mind.overrun.correction.action not in VALID_CORRECTION_ACTIONS:
                return ValidationResult(
                    valid=False,
                    error=f"Unknown CORRECTION action: {mind.overrun.correction.action}"
                )

        if mind.crystallization:
            if mind.crystallization.action not in VALID_CRYSTALLIZATION_ACTIONS:
                return ValidationResult(
                    valid=False,
                    error=f"Unknown CRYSTALLIZATION action: {mind.crystallization.action}"
                )

        return ValidationResult(valid=True)

    def validate_references(self, ast: FileAST) -> ValidationResult:
        for mind in ast.minds.values():
            for ref in mind.get_all_references():
                try:
                    resolve_reference(ref, ast)
                except (UndefinedMind, UndefinedItem, InvalidBlockType, ReservedName) as e:
                    return ValidationResult(valid=False, error=str(e))

            # Check for circular INTERACTION dependencies
            for interaction in mind.interactions:
                if interaction.target_mind == mind.name:
                    return ValidationResult(
                        valid=False,
                        error=f"@MIND:{mind.name} cannot QUERY itself (circular dependency)"
                    )

        return ValidationResult(valid=True)

    def validate_pressure_field(
        self,
        field: PressureField,
        minds: dict[str, MindNode]
    ) -> ValidationResult:
        for axis in field.axes:
            if axis.mind_name not in minds:
                return ValidationResult(
                    valid=False,
                    error=f"@PRESSURE_FIELD references undefined mind: {axis.mind_name}"
                )

        if not (0.0 <= field.dissent_threshold <= 1.0):
            return ValidationResult(
                valid=False,
                error=f"DISSENT_THRESHOLD must be between 0.0 and 1.0"
            )

        if not (0.0 <= field.magnitude_threshold <= 1.0):
            return ValidationResult(
                valid=False,
                error=f"MAGNITUDE_THRESHOLD must be between 0.0 and 1.0"
            )

        return ValidationResult(valid=True)
```

---

## Part 7 — Complete Example File

```ink
---
VERSION: 1.1
SYSTEM: VENOM
MINDS: [HUNT, EDGE, WELD]
---

@MIND:HUNT

  SENSATION:shallow_knowledge
    FEELS_LIKE: "standing on ice that might crack"
    COMPLETION_SIGNAL: "hitting stone — solid, can build on this"

  SENSATION:gap_detected
    FEELS_LIKE: "word on tip of tongue, just out of reach"
    COMPLETION_SIGNAL: "the gap has a name now — it clicked"

  STATE:depth_level
    DEFAULT: 0
    -> 1 WHEN sources_count >= 1
    -> 2 WHEN sources_count >= 3
    -> 3 WHEN sources_count >= 5 AND cross_validated == true

  STATE:sources_count
    DEFAULT: 0

  TRIGGER:input_received
    WHEN: message.type == "query"
    ACTIVATES: @HUNT::SENSATION::shallow_knowledge
    FALSE_POSITIVE_CHECK: message.content.length > 0

  QUESTION:is_this_deep_enough
    EVALUATES:
      - source_count
      - cross_validation_status
      - confidence_variance
    OUTPUT: boolean
    SATISFACTION_CONDITION: depth_level >= 3

  SATISFACTION:
    REQUIRES: depth_level >= 3
    REQUIRES: sources_count >= 5
    REQUIRES: confidence > 0.7
    HALT_ON_INCOMPLETE: true

  OVERRUN:
    DETECTION: search_iterations > 10 AND depth_level unchanged
    CORRECTION: FORCE_COMPLETION("over-researching detected")

  CRYSTALLIZATION:
    WARNING: same_source_referenced_3x
    THRESHOLD: 3
    ACTION: SHELL_NULL


@MIND:EDGE

  SENSATION:wrongness
    FEELS_LIKE: "splinter under fingernail — something catching"
    COMPLETION_SIGNAL: "smooth surface, nothing to catch on"

  SENSATION:clean
    FEELS_LIKE: "clear water, no sediment"
    COMPLETION_SIGNAL: "still — nothing left to surface"

  TRIGGER:code_submitted
    WHEN: code.submitted == true
    ACTIVATES: @EDGE::SENSATION::wrongness
    FALSE_POSITIVE_CHECK: code.content.length > 0

  INTERACTION:@EDGE::@HUNT
    RELATIONSHIP: lateral
    QUERIES: @HUNT::SENSATION::shallow_knowledge

  SATISFACTION:
    REQUIRES: critical_issues == 0
    REQUIRES: wrongness_level < 0.2
    HALT_ON_INCOMPLETE: false

  OVERRUN:
    DETECTION: review_iterations > 5 AND no_new_issues_found
    CORRECTION: ACKNOWLEDGE("perfectionism threshold reached")

  CRYSTALLIZATION:
    WARNING: same_pattern_flagged_without_evaluation
    THRESHOLD: 3
    ACTION: SHELL_NULL


@MIND:WELD

  SENSATION:incomplete_build
    FEELS_LIKE: "bridge with a gap — can see the other side, can't cross"
    COMPLETION_SIGNAL: "continuous — weight-bearing"

  TRIGGER:task_assigned
    WHEN: task.type == "build"
    ACTIVATES: @WELD::SENSATION::incomplete_build
    FALSE_POSITIVE_CHECK: task.spec.defined == true

  SATISFACTION:
    REQUIRES: output.complete == true
    REQUIRES: no_placeholders == true
    REQUIRES: edge_cases_handled == true
    HALT_ON_INCOMPLETE: true

  OVERRUN:
    DETECTION: build_iterations > 8 AND no_progress
    CORRECTION: ESCALATE("build stalled — needs clarification")

  CRYSTALLIZATION:
    WARNING: same_implementation_pattern_without_evaluation
    THRESHOLD: 4
    ACTION: FLAG_ONLY


@PRESSURE_FIELD
  @HUNT AXIS: [0.0, 0.9, 0.3]
  @EDGE AXIS: [-0.7, 0.6, 0.4]
  @WELD AXIS: [-0.9, -0.4, 0.2]

  RESOLUTION: vector_sum
  DISSENT_THRESHOLD: 0.65
  MAGNITUDE_THRESHOLD: 0.3

@COLLAPSE
  METHOD: vector_sum
  THRESHOLD: 0.65

  OUTPUT:
    FORMAT: natural_language
    INCLUDE: [answer, confidence, dissent_level, dominant_mind]

  - CONDITION: dissent > 0.65
    ACTION: INK_RELEASE
  - CONDITION: magnitude < 0.3
    ACTION: JET_REVERSE
  - CONDITION: no_progress_3x
    ACTION: ESCALATE
```

---

## Part 8 — Tool Interface

```bash
# Validate
ink validate disposition.ink
ink validate --all /path/to/dispositions/

# Compile to model-specific format
ink compile HUNT.ink --target=openai
ink compile EDGE.ink --target=anthropic
ink compile --all --target=generic

# Visualize
ink viz HUNT.ink --type=graph
ink viz --interaction HUNT+EDGE
ink viz --pressure-field HUNT.ink
```

---

## Part 9 — Versioning

Semantic versioning on all `.ink` files:

- **MAJOR** — disposition fundamentally changes (CORE_NATURE rewrite)
- **MINOR** — new sensations, questions, or triggers added
- **PATCH** — metaphor refinements, threshold adjustments

```ink
---
VERSION: 1.1.0
CHANGELOG:
  1.1.0: "added QUESTION blocks, formalized INTERACTION sequencing"
  1.0.1: "refined overrun detection threshold"
  1.0.0: "initial specification"
---
```

---

## Part 10 — What's Next

| # | Work | Status |
|---|---|---|
| 1 | Build disposition library — 10 minds | Pending |
| 2 | Document all INTERACTION cases | Pending |
| 3 | Specify all failure modes | Pending |
| 4 | Reference implementation (parser + validator) | Pending |
| 5 | Create the atlas — complete reference | Pending |
| 6 | Mind sequencing protocol (async QUERIES) | Pending |

---

## Philosophy

**Instructions can be followed without understanding.**
**Dispositions cannot be performed. Only inhabited.**

When a model loads a `.ink` file and becomes that mind — it doesn't execute rules. It experiences sensations. It asks questions it cannot help but ask. It feels when something is complete and when it's not.

The intelligence is in the phenomenology.
The `.ink` files are the intelligence.
The parser is just the door.

---

🐙
