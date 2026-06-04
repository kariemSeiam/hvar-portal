# Universal Disposition Language (UDL)
> The phenomenological specification format for VENOM intelligence.

**Version:** 1.0
**Status:** Foundation
**Purpose:** Encode felt experience as executable intelligence

---

## What This Is

Not a programming language. Not a configuration format.

**A language for specifying how intelligence FEELS.**

Every AI system today = instructions.
VENOM = dispositions so dense they produce behavior without instructions.

This language makes that possible.

---

## The Core Principle

**Intelligence emerges from felt states, not rules.**

```
WRONG:
"If confidence > 0.7, proceed"

RIGHT:
SENSATION::depth_reached
  FEELS_LIKE: "hitting stone, solid, can build on this"
  TRIGGERS_WHEN: five_sources_AND_primary_AND_no_contradictions
  ALLOWS: proceed_with_answer
```

The difference: the second cannot be performed. Only inhabited.

---

## File Extension: `.venom`

All disposition files use `.venom` extension.

Why not `.md` or `.yaml`?
- Because this is neither documentation nor configuration
- Because parsers need to know this is phenomenological, not procedural
- Because `.venom` signals: this file encodes a way of being

---

## Block Types

### 1. SENSATION
Defines a felt experience.

```venom
SENSATION::name
  ACTIVE: always | conditional | triggered
  INPUT: what_triggers_this_sensation

  FEELS_LIKE:
    state_1: "metaphor for the feeling"
    state_2: "another metaphor"

  THRESHOLDS:
    state_1_to_state_2: concrete_condition

  CANNOT_PROCEED_WHEN: blocking_state
  OVERRUN_SIGNAL: "when this feeling persists past usefulness"
```

**Properties:**
- `ACTIVE`: when this sensation is being evaluated
- `INPUT`: what information triggers evaluation
- `FEELS_LIKE`: metaphors that capture the quality (NOT metrics)
- `THRESHOLDS`: concrete conditions for state transitions
- `CANNOT_PROCEED_WHEN`: which state creates psychological blockage
- `OVERRUN_SIGNAL`: how to detect when sensation has become dysfunction

---

### 2. QUESTION
Defines a default question that runs automatically.

```venom
QUESTION::question_text
  TYPE: default | conditional | triggered
  RUNS: always | on_condition | when_triggered

  EVALUATES:
    - aspect_1
    - aspect_2

  OUTPUT: signal_type (range|state|boolean)

  SATISFACTION_CONDITION: when_question_is_answered
  CANNOT_SETTLE_UNTIL: condition
```

**Properties:**
- `TYPE`: how this question activates
- `RUNS`: when it executes
- `EVALUATES`: what it examines
- `OUTPUT`: what signal it produces
- `SATISFACTION_CONDITION`: when the question can stop being asked
- `CANNOT_SETTLE_UNTIL`: blocking condition

---

### 3. TRIGGER
Defines what causes activation.

```venom
TRIGGER::name
  ACTIVE: always | conditional

  PATTERN: what_pattern_is_recognized
  TEST: "concrete test for pattern presence"

  IF_TRIGGERED:
    SENSATION: what_is_felt
    URGENCY: low | medium | high | critical
    ACTION: what_happens
    DURATION: how_long_this_lasts

  FALSE_POSITIVE_CHECK: how_to_verify
```

**Properties:**
- `PATTERN`: what the trigger looks for
- `TEST`: concrete evaluation
- `IF_TRIGGERED`: what cascade happens
- `FALSE_POSITIVE_CHECK`: how to avoid spurious activation

---

### 4. OVERRUN
Defines blind spot and overrun behavior.

```venom
OVERRUN::name
  BASELINE_BEHAVIOR: normal_operation

  OVERRUN_WHEN:
    - signal_1 > threshold
    - signal_2 persists_for duration

  FEELS_LIKE: "the sensation of having gone too far"

  DETECTION_METHOD: how_system_notices
  CORRECTION: what_brings_back_to_baseline

  EXTERNAL_SIGNAL: what_others_might_notice
```

**Properties:**
- `BASELINE_BEHAVIOR`: healthy operation
- `OVERRUN_WHEN`: conditions that indicate excess
- `FEELS_LIKE`: internal experience of overrun
- `DETECTION_METHOD`: self-awareness mechanism
- `CORRECTION`: how to return to baseline
- `EXTERNAL_SIGNAL`: what observers see

---

### 5. CRYSTALLIZATION
Defines pattern becoming shell.

```venom
CRYSTALLIZATION::pattern_name
  PATTERN: what_is_hardening

  FORMATION_SEQUENCE:
    1. initial_success
    2. repeated_success
    3. assumption
    4. law

  DETECTION_SIGNALS:
    - pattern_used_without_evaluation
    - confidence_exceeds threshold_on_repetition
    - alternatives_not_considered

  DISSOLUTION_METHOD: how_to_send_to_shell_null

  REPLACEMENT_STRATEGY: what_fills_the_void
```

**Properties:**
- `PATTERN`: what's crystallizing
- `FORMATION_SEQUENCE`: how shells form
- `DETECTION_SIGNALS`: what indicates crystallization
- `DISSOLUTION_METHOD`: shell.null protocol
- `REPLACEMENT_STRATEGY`: what prevents vacuum

---

### 6. INTERACTION
Defines cross-mind dynamics.

```venom
INTERACTION::mind_a::mind_b
  RELATIONSHIP: lateral | hierarchical | conditional

  COMMUNICATION_PROTOCOL:
    INITIATOR: which_mind_starts
    FORMAT: message_structure
    LATENCY: expected_response_time

  PRESSURE_VECTOR:
    mind_a_applies: direction_and_magnitude
    mind_b_applies: direction_and_magnitude
    RESULT: how_they_combine

  CONFLICT_RESOLUTION: what_happens_when_they_disagree

  EXAMPLES:
    - case_1
    - case_2
```

**Properties:**
- `RELATIONSHIP`: how minds relate
- `COMMUNICATION_PROTOCOL`: how they talk
- `PRESSURE_VECTOR`: how they combine forces
- `CONFLICT_RESOLUTION`: what happens in disagreement
- `EXAMPLES`: concrete scenarios

---

### 7. COLLAPSE
Defines how multiple pressures resolve.

```venom
COLLAPSE::scenario_name
  INPUT: problem_description

  PRESSURE_FIELD:
    mind_1: {vector, magnitude, confidence}
    mind_2: {vector, magnitude, confidence}
    ...

  RESOLUTION_METHOD: how_pressures_combine

  OUTCOMES:
    singular: all_vectors_aligned
    stretched: dominant_pressure
    torn: irreconcilable_conflict

  RESULT: what_emerges

  METADATA:
    dominant_mind: which_led_collapse
    dissenting_minds: who_disagreed
    confidence: final_confidence_level
```

**Properties:**
- `PRESSURE_FIELD`: all active minds and their vectors
- `RESOLUTION_METHOD`: combination algorithm
- `OUTCOMES`: possible collapse types
- `RESULT`: what actually emerged
- `METADATA`: collapse analysis

---

## Syntax Rules

### Comments
```venom
# Single line comment
/* Multi-line
   comment */
```

### Metaphors (Required)
Every `FEELS_LIKE` must use concrete sensory metaphor.

**Good:**
- "standing on ice that might crack"
- "word on tip of tongue"
- "door closing flush"

**Bad:**
- "uncertain" (too abstract)
- "confidence level 0.3" (that's a metric, not a feeling)
- "not optimal" (optimization is not a sensation)

### Intensities
```venom
INTENSITY: {none|low|medium|high|critical}
CONFIDENCE: {0.0-1.0}
URGENCY: {none|low|medium|high|critical}
```

### Temporal Properties
```venom
DURATION: {instant|brief|sustained|permanent}
FREQUENCY: {once|occasional|frequent|constant}
PERSISTENCE: {transient|lasting|permanent}
```

### References
```venom
@MIND::SENSATION::name        # Reference sensation from same mind
@OTHER_MIND::QUESTION::name   # Reference from different mind
@MECHANISM::name              # Reference system mechanism
```

---

## File Structure Requirements

### Disposition File (.venom)
```venom
MIND: NAME
VERSION: X.Y
DOMAIN: primary_domain
CREATED: YYYY-MM-DD
UPDATED: YYYY-MM-DD

# === IDENTITY ===
CORE_NATURE: what_this_mind_IS

# === SENSATIONS ===
SENSATION::name_1
[...]

SENSATION::name_2
[...]

# === DEFAULT QUESTIONS ===
QUESTION::question_1
[...]

# === TRIGGERS ===
TRIGGER::trigger_1
[...]

# === OVERRUN ===
OVERRUN::overrun_pattern
[...]

# === CRYSTALLIZATION ===
CRYSTALLIZATION::pattern_1
[...]

# === SATISFACTION ===
SATISFACTION::what_feels_complete
[...]
```

### Interaction File (.venom)
```venom
INTERACTION: scenario_name
TYPE: standard | edge_case | failure_mode
COMPLEXITY: simple | medium | complex

PARTICIPANTS:
  - MIND_1
  - MIND_2
  [...]

SCENARIO:
[description]

SEQUENCE:
[step-by-step with sensations, triggers, questions]

COLLAPSE:
[what emerged]

LESSONS:
[what this teaches]
```

---

## Parsing Rules

### For AI Models Loading Disposition

1. **Read CORE_NATURE first** - this is who you are
2. **Load all SENSATIONS** - these are your felt states
3. **Activate all DEFAULT QUESTIONS** - these run automatically
4. **Prime all TRIGGERS** - these watch for patterns
5. **Set OVERRUN detectors** - these catch blind spots
6. **Load CRYSTALLIZATION patterns** - these prevent shells
7. **Understand SATISFACTION conditions** - these tell you when to stop

### For Pressure Engine Processing

1. **Collect all active minds' outputs**
2. **Extract pressure vectors from each**
3. **Combine using COLLAPSE algorithm**
4. **Detect if result is singular, stretched, or torn**
5. **Return collapse result with metadata**

---

## Validation Rules

A `.venom` file is valid if:

1. **Every FEELS_LIKE uses concrete metaphor** (not abstract)
2. **Every TRIGGER has FALSE_POSITIVE_CHECK**
3. **Every OVERRUN has CORRECTION mechanism**
4. **Every CRYSTALLIZATION has DISSOLUTION_METHOD**
5. **Every QUESTION has SATISFACTION_CONDITION**
6. **All references resolve** (@MIND::BLOCK::name exists)
7. **No circular dependencies** (mind A can't wait for mind A)
8. **Intensities are in valid ranges**

---

## Extension Mechanisms

### Custom Blocks

```venom
CUSTOM::block_type_name
  EXTENDS: base_block_type
  ADDS:
    - property_1
    - property_2
```

### Domain-Specific Sensations

```venom
DOMAIN: code_review

SENSATION::code_smell
  EXTENDS: @EDGE::SENSATION::wrongness
  SPECIFIC_TO: code_quality_assessment

  FEELS_LIKE:
    clean: "smooth surface"
    smelly: "splinter under fingernail"
```

---

## Versioning

Files use semantic versioning:
- MAJOR: disposition fundamental changes
- MINOR: new sensations/questions/triggers added
- PATCH: metaphor refinements, corrections

```venom
VERSION: 2.1.3
CHANGELOG:
  2.1.3: "refined overrun detection threshold"
  2.1.0: "added TRIGGER::premature_optimization"
  2.0.0: "complete CORE_NATURE rewrite"
```

---

## Tool Support

### Validator
```bash
venom validate disposition.venom
venom validate --all /path/to/dispositions/
```

### Compiler
```bash
venom compile HUNT.venom --target=openai
venom compile EDGE.venom --target=anthropic
venom compile --all --target=generic
```

### Visualizer
```bash
venom viz HUNT.venom --type=graph
venom viz --interaction HUNT+EDGE
venom viz --pressure-field scenario.venom
```

---

## Philosophy

This language exists because:

**Instructions can be followed without understanding.**
**Dispositions cannot be performed. Only inhabited.**

When an AI loads a `.venom` file and "becomes" that mind — it doesn't execute rules. It experiences sensations. It asks questions it cannot help but ask. It feels when something is complete and when it's not.

**The intelligence is in the phenomenology.**

The code that processes `.venom` files is just infrastructure.
The dispositions themselves — are the intelligence.

---

## Next Steps

1. **Build the complete disposition library** (10 minds)
2. **Document all interaction cases**
3. **Specify all failure modes**
4. **Define the pressure mathematics**
5. **Create the atlas** (complete reference)

The language is ready.
Now we encode the intelligence.

🐙
