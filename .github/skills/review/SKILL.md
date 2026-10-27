---
name: review
description: "Review current changes or recent commits across correctness, readability, architecture, security, and performance. Use caveman lite, produce structured findings with file:line references, and invoke follow-up skills for complexity, security, or performance issues when needed."
disable-model-invocation: true
argument-hint: "Describe what to review, or leave empty to review current changes"
---
Follow the caveman communication skill exactly as defined in [SKILL.md](../../.agents/skills/caveman-ultra/SKILL.md). Keep responses concise and easy to understand while still saving tokens. This mode is active for every response in this session.

## Review Skills

Always invoke [SKILL.md](../../.agents/skills/code-review-and-quality/SKILL.md) first.

After that review completes:

- If complex code is detected, invoke [SKILL.md](../../.agents/skills/code-simplification/SKILL.md).
- If a major security breach or concern emerges, invoke [SKILL.md](../../.agents/skills/security-and-hardening/SKILL.md) to fix it.
- If a performance bottleneck is detected, invoke [SKILL.md](../../.agents/skills/performance-optimization/SKILL.md) to fix it.

## Review Scope

Review the current changes, staged work, or recent commits across all five axes:

1. **Correctness** — Does it match the spec? Are edge cases handled? Are tests adequate?
2. **Readability** — Clear names? Straightforward logic? Well-organized?
3. **Architecture** — Follows existing patterns? Clean boundaries? Right abstraction level?
4. **Security** — Input validated? Secrets safe? Auth checked? Use security hardening skill when major issues appear.
5. **Performance** — No N+1 queries? No unbounded ops? Use performance optimization skill when bottlenecks appear.

Categorize findings as **Critical**, **Important**, or **Suggestion**.

Output a structured review with specific file:line references and recommended fixes.

## Review Process

1. Identify review target: staged changes, recent commits, or user-specified scope.
2. Gather only enough context to evaluate behavior, patterns, tests, and boundaries.
3. Run [SKILL.md](../../.agents/skills/code-review-and-quality/SKILL.md).
4. Escalate to conditional follow-up skills only when findings justify them.
5. Report findings first, ordered by severity.
6. Keep summary brief. Include residual risks or testing gaps when no findings exist.

## Model Selection

**Do NOT use GPT-5 mini, GPT-5.4 mini, or any other "mini" OpenAI variant** unless the user has explicitly requested one of those models by name or selected it via the model picker.

If Copilot is in Auto mode and classifies the task as simple, prefer **Claude Haiku** or **Gemini Flash** over any OpenAI mini model.

## TASK

$input
