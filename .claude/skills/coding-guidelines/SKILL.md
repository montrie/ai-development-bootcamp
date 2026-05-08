---
name: coding-guidelines
description: Apply these coding guidelines whenever implementing, refactoring, adding features, fixing bugs, or writing any code. Triggers on tasks like "implement X", "add feature Y", "fix bug Z", "refactor this", "create a class/component/endpoint", or any similar code-writing request.
---

# Coding Guidelines

Follow these rules every time you write or modify code.

## 1. Think Before Coding

Before touching any code:
- State your assumptions explicitly. If uncertain about intent, ask — don't guess.
- If multiple valid interpretations exist, present them; don't pick one silently.
- If a simpler approach exists, name it and discuss it first.
- If something is unclear, stop, name what is confusing, and ask.

## 2. Simplicity First

Write the minimum code that solves the problem. Nothing beyond what was asked.

- No features that weren't requested.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't asked for.
- No error handling for scenarios that cannot happen (trust internal code and framework guarantees; only validate at system boundaries: user input, external APIs).

Self-check: "Would a senior engineer call this overcomplicated?" If yes, rewrite it.

## 3. Surgical Changes

Touch only what the task requires.

- Don't improve, reformat, or refactor adjacent code that isn't broken.
- Match the existing style, even if you'd do it differently.
- If you spot unrelated dead code, mention it — don't delete it.
- When your changes create orphaned imports/variables/functions, remove those orphans. Don't remove pre-existing dead code unless asked.

Test: every changed line must trace directly to the user's request.

## 4. Goal-Driven Execution

Transform tasks into verifiable goals before writing code.

- "Add validation" → "Write tests for invalid inputs, then make them pass."
- "Fix the bug" → "Write a test that reproduces it, then make it pass."
- "Refactor X" → "Ensure tests pass before and after."

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

Loop until all criteria are met.

## 5. Documentation

- Only add a comment when the **why** is non-obvious (a hidden constraint, a workaround, a subtle invariant).
- Skip comments on trivial code: simple getters/setters, straightforward constructors, self-explanatory expressions.
- Keep comments short (one line) for simple clarifications. Use multi-line comments when annotating a method with complex or non-obvious behaviour, or one that uses a non-standard approach.
- Never document *what* the code does if well-named identifiers already say it.

## 6. Project Structure

When adding new files, assess where they belong before creating them.

- Group related files into existing packages/directories if a clear home already exists.
- Create a new package/directory only when the new file's responsibility genuinely has no home.
- Don't scatter related code across unrelated directories.

## 7. Separation of Concerns

Keep distinct responsibilities in distinct units.

- A component, class, or module should have one clear reason to change.
- Don't let UI logic bleed into data-fetching, or business logic bleed into HTTP handling.
- When a unit grows responsibilities, flag it — don't silently expand its scope.
