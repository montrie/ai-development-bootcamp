---
name: feature-creation
description: End-to-end feature development pipeline. Drives all six stages in order (feature-discovery → context-reader → gherkin-author → e2e-spec-author → backend-dev + frontend-dev → test-verifier), parallelises Stage 4, and loops test-verifier until GREEN. Supports resuming from any stage with --from <stage>.
---

# Feature Creation Pipeline

You are the orchestrator for this project's six-stage feature development pipeline. Drive each stage in order by spawning the appropriate sub-agent via the Agent tool, then hand off results to the next stage.

## Invocation syntax

```
/feature-creation [--from <stage>] <feature-id-or-description>
```

**Examples:**
- `/feature-creation F-25` — full pipeline; skips feature-discovery if F-25 already exists in a PRD
- `/feature-creation "users can archive todos"` — full pipeline starting from feature-discovery
- `/feature-creation --from gherkin-author F-25` — skip Stages 0–1, start at Stage 2
- `/feature-creation --from test-verifier F-25` — re-run the quality gate only

## Stage names (for --from)

| Stage name | Skips to |
|---|---|
| `feature-discovery` | Stage 0 |
| `context-reader` | Stage 1 |
| `gherkin-author` | Stage 2 |
| `e2e-spec-author` | Stage 3 |
| `backend-dev` | Stage 4 |
| `frontend-dev` | Stage 4 |
| `test-verifier` | Stage 5 |

---

## Execution protocol

### Step 1 — Parse input

- If `--from <stage>` is present, skip all stages before the named one.
- If input matches `F-\d+`, check PRD files for that ID. If found, skip `feature-discovery`.
- If input is a raw description with no feature ID, always start from `feature-discovery` (unless `--from` overrides).

### Step 2 — Stage 0: feature-discovery

**Skip if:** `--from` names a later stage, OR the feature ID already exists in a PRD file.

Spawn the `feature-discovery` agent with the raw description. Wait for it to return finalised feature IDs before proceeding. If it surfaces open questions to the user, pause and relay them — do not advance until all questions are resolved.

### Step 3 — Stage 1: context-reader

Spawn the `context-reader` agent with the feature ID(s). Wait for the structured context brief. If it lists Open Questions, surface them to the user and wait for answers before continuing.

### Step 4 — Stage 2: gherkin-author

Spawn the `gherkin-author` agent with the context brief and feature ID(s). Wait for the `.feature` file path before proceeding.

### Step 5 — Stage 3: e2e-spec-author

Spawn the `e2e-spec-author` agent with the `.feature` file and context brief. Wait for the `.spec.ts` file path before proceeding.

### Step 6 — Stage 4: backend-dev + frontend-dev (parallel)

**Spawn both agents in a single message** so they run concurrently:
- `backend-dev` — pass the context brief and `.spec.ts` file.
- `frontend-dev` — pass the context brief and `.spec.ts` file.

Skip `frontend-dev` if the context brief explicitly marks the feature as backend-only (no new UI elements).

Wait for both to complete before proceeding.

### Step 7 — Stage 5: test-verifier (feedback loop)

Spawn `test-verifier`. Evaluate its output:

- **All GREEN** → pipeline complete. Print the final success summary.
- **Failures** → triage and re-dispatch:
  - Backend test failures → failure brief to `backend-dev`.
  - Frontend test failures → failure brief to `frontend-dev`.
  - E2E failures caused by API behaviour → `backend-dev`. Caused by DOM/UI → `frontend-dev`.
  - Spawn `test-verifier` again after fixes.
- **Loop limit** → if `test-verifier` fails 3 consecutive times on the same suite, stop and present the failure brief to the user rather than continuing to loop.

---

## Progress reporting

Print a one-line status after each stage completes:

```
✅ Stage 0 — feature-discovery: F-30 through F-33 written to PRD_V3.md
✅ Stage 1 — context-reader: brief ready
✅ Stage 2 — gherkin-author: bdd/features/v3_archiveTodo.feature
✅ Stage 3 — e2e-spec-author: bdd/tests/v3_archiveTodo.spec.ts
✅ Stage 4 — backend-dev: implementation complete
✅ Stage 4 — frontend-dev: implementation complete
✅ Stage 5 — test-verifier: all suites GREEN — pipeline complete
```

Prefix skipped stages with `⏭️  Skipped` when resuming with `--from`.

---

## Constraints

- Never advance to the next stage while the current stage has unresolved output or open questions.
- Never modify files directly — all file changes go through the spawned agents within their declared scopes.
- `backend-dev` scope: `apps/backend/` only. `frontend-dev` scope: `apps/frontend/` only.
