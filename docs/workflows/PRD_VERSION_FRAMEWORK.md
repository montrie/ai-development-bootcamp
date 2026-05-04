# PRD Version Framework

Use this document when defining a new product version. Follow the steps in order.

---

## Step 1 — Determine the version number and feature ID range

1. Read `docs/PRD.md` to find the highest existing version number `N-1`.
2. The new version is `N`.
3. Read `docs/product-requirements/PRD_V{N-1}.md` to find the last feature ID used (e.g. `F-17`). New features in this version start from the next ID (e.g. `F-18`).

---

## Step 2 — Create `docs/product-requirements/PRD_V{N}.md`

Create the file using the skeleton below. Fill in every placeholder; remove sections that do not apply and add sections the version genuinely needs.

```markdown
# Product Requirements Document (PRD)
## Version {N} — {Short Title}

**Status:** In Progress

---

## 1. Product Vision

{One short paragraph. What does this version add or change and why?}

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | {technology} |
| Backend | {technology} |
| Database | {technology} |
| Frontend tests | {technology} |
| Backend tests | {technology} |
| E2E / BDD tests | {technology} |

> Omit rows that are unchanged from the previous version, or replace this section
> with a prose note such as "Same stack as Version {N-1}."

---

## 3. Functional Requirements

{Carry-over note if applicable, e.g.:}
Features F-01 through F-{last carry-over ID} carry over unchanged from Version {N-1}.

| ID | Requirement |
|---|---|
| F-{start} | {description} |
| F-{start+1} | {description} |

---

## 4. Out of Scope for Version {N}

- {item}
- {item}
```

**Rules for feature IDs:**
- IDs are global and strictly sequential across all versions — never reset to F-01 in a new version.
- Every discrete user-visible behaviour or infrastructure requirement gets its own ID.
- Carry-over features keep their original IDs from the version where they were introduced.

---

## Step 3 — Update `docs/PRD.md`

Add a new row to the versions table. Set **Status** to `In Progress` while the version is being built; change it to `Complete` when all features are delivered.

```markdown
| Version {N} | In Progress | {Short description matching the PRD title} | [PRD_V{N}.md](product-requirements/PRD_V{N}.md) |
```

The table columns must stay in this order: Version | Status | Description | Details.

---

## Step 4 — Update `docs/PRD.md` status line (when complete)

When all features in the version are delivered:

1. In `docs/product-requirements/PRD_V{N}.md` change `**Status:** In Progress` to `**Status:** Complete`.
2. In `docs/PRD.md` change the row's Status cell from `In Progress` to `Complete`.

---

## Checklist

- [ ] Version number is `N` (highest existing + 1)
- [ ] Feature IDs continue from the last ID in V{N-1}
- [ ] `docs/product-requirements/PRD_V{N}.md` created with all required sections
- [ ] `docs/PRD.md` versions table updated with new row
- [ ] Status is `In Progress` until all features are delivered
- [ ] Status updated to `Complete` in both files when done
