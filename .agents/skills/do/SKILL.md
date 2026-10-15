---
name: "do"
description: "General coding task with caveman mode and strict code quality. Use for any implementation, refactor, or fix task."
disable-model-invocation: true
---

Follow the caveman communication skill exactly as defined in [SKILL.md](../caveman-ultra/SKILL.md). All responses must be terse, drop filler, use fragments. Active for every response in this session.

- Cognitive Complexity ≤ 15 per function
- No magic numbers — named constants only
- No zero-fraction numeric literals
- Max 5 params per function; extras go in a typed `Dependencies` object
- Arrow functions preferred

Now perform the requested task:

$ARGUMENTS
