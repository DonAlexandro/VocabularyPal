---
name: user-story-writing
description: "Transform raw thoughts and requirements into well-structured User Stories. Use when: user asks to 'write user story', 'create story', 'turn this into a story', 'add story', 'write a ticket'; user mentions 'user story', 'backlog item', 'story'; converting a feature idea, raw thought, or requirement into standard story format with acceptance criteria. Output: writes story to docs/stories/{story-name}.md"
argument-hint: "Describe the feature or requirement in plain language"
---

# User Story Writing

## When to Use
- User shares a raw feature idea, thought, or requirement and asks to turn it into a story
- User says "write a user story", "create a ticket", "write this up as a story", etc.
- Converting a feature request or bug report into an actionable backlog item
- Formalizing a verbal or informal requirement

## Process

1. **Understand the raw input** — Read the user's description carefully. Identify:
   - Who benefits (use the generic user role)
   - What they want to do (the goal/action)
   - Why it matters (the business or user value)
2. **Set the user role** — Always write `As a user` in the story. Do not invent or infer a more specific persona.
3. **Draft the problem description** using the template below.
4. **Draft acceptance criteria** — Write Given/When/Then scenarios covering: the happy path, edge cases, and error handling. Combine closely related micro-requirements into a single criterion rather than creating one per step.
5. **Choose a story file name** — Use kebab-case, e.g. `docs/stories/add-heater-setpoint-confirmation.md`.
6. **Save to `docs/stories/{story-name}.md`** — Always write the output file.
7. **Present a summary** and ask if any criteria need adjusting.

## Output Templates

### Problem Description

```markdown
**As a** user

**I want to** [concrete action or capability]

**So that** [the value or outcome achieved]
```

### Acceptance Criteria

```markdown
## Acceptance criteria 1: [short title]

Given: [the starting context or precondition]

When: [the user action or system event]

And: [additional condition, if needed — omit this line if not needed]

Then: [the observable outcome]
```

Repeat the acceptance criteria block for each distinct scenario. Number them sequentially (`## Acceptance criteria 1`, `## Acceptance criteria 2`, etc.).

## Full Story File Template

See [story-template.md](./references/story-template.md) for the complete file template to write to `docs/stories/`.

## Acceptance Criteria Examples

See [acceptance-criteria-examples.md](./references/acceptance-criteria-examples.md) for project-relevant examples showing correct granularity and style.

## Key Rules

- ALWAYS write `As a user`
- NEVER invent or infer a more specific persona for the `As a` section
- Focus on **user value**, not implementation details
- ALWAYS include testable acceptance criteria using Given/When/Then
- Combine related micro-requirements into one criterion — avoid one criterion per UI click
- ALWAYS save the story to `docs/stories/{story-name}.md`

## Best Practices

### DO
- Use `As a user` exactly in the problem description
- Write from the user's perspective
- Focus on value and outcome, not technical solution
- Keep stories small enough to complete in one sprint
- Include error scenarios and edge cases in acceptance criteria
- Use terminology from the domain (e.g. setpoint, RAG status, WAMP topic, schematic, wizard step)

### DON'T
- Write technical task-focused stories ("Implement WAMP subscription for…")
- Replace `As a user` with a guessed persona such as lab operator or administrator
- Create a new acceptance criterion for every individual micro-step
- Write vague criteria ("system works correctly")
- Forget non-functional requirements (performance, safety interlocks, accessibility) when relevant
- Skip saving the output file
