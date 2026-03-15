---
name: code-comments
description: Enforce adding explanatory comments when writing exception patterns, special-case logic, workarounds, or conditional branches that handle edge cases. Use this skill whenever you add code that deviates from the normal flow — e.g., skipping logic for specific inputs, handling false positives, or adding guards for unexpected states. Also applies when modifying existing exception patterns.
---

# Exception Pattern Comments

When adding exception patterns, special-case logic, or conditional branches that handle edge cases, always add a comment explaining:

1. **What** the exception handles — describe the specific case
2. **Why** it exists — what goes wrong without it

## What counts as an exception pattern

- Conditional logic that skips or alters normal flow for specific inputs
- Guards against false positives or false negatives
- Workarounds for external tool behavior (e.g., tmux, CLI quirks)
- Regex pattern restrictions to avoid matching unintended content
- Early returns for edge cases
- Special handling based on detected state

## Comment style

Place the comment directly above the exception code. Keep it concise but specific enough that someone unfamiliar with the context can understand the reasoning.

```typescript
// Skip insert mode switch for choice responses (single digit 1-9)
// because choices work in normal mode and Escape+i would interfere.
const isChoiceResponse = status === 'waiting' && /^[1-9]$/.test(text)
```

```typescript
// Match only lines with special prompt markers (❯›>☞) followed by numbered choices.
// Space is intentionally excluded to avoid false positives on regular numbered lists.
const CHOICE_PATTERN = /^\s*[❯›>☞]\s*(\d+)[.)]\s+(.+)$/
```

## When modifying existing patterns

If you change the scope or behavior of an existing exception, update the comment to reflect the new logic. Stale comments are worse than no comments.
