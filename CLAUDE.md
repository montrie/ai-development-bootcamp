# CLAUDE.md — ToDo Application

This file gives you all the context needed to work on the ToDo application. Read it before making any changes.

---

## Project Overview

A ToDo application in two versions:
- **Version 1** — client-side only (HTML/CSS/Vanilla JS, `localStorage`). Files at repo root.
- **Version 2** — full-stack (React/TypeScript + Spring Boot 4 + PostgreSQL). Source under `apps/`.

---

## File Structure

```
apps/
  frontend/    — React + TypeScript (Vite)
  backend/     — Spring Boot 4, Java 26
index.html     — Version 1 markup
style.css      — Version 1 styles
app.js         — Version 1 logic
```

---

## Tech Stack

### Version 1 (complete)
- HTML5, CSS3, Vanilla JavaScript (ES6+) — no frameworks, no libraries
- Client-side only; `localStorage` for persistence
- Target browsers: Chrome, Firefox, Safari, Edge (latest 2 versions each)

### Version 2 (in progress)
- **Frontend:** React 19, TypeScript, Vite
- **Backend:** Spring Boot 4, Java 26
- **Database:** PostgreSQL (developer-run locally)
- **No auth, no Docker** (planned for later versions)

---

## Visual Design

Clean and minimal — white/light grey aesthetic, ample whitespace, readable typography.

---

## Naming Conventions

See @ARCHITECTURE.md — Section 7.

---

## Development Workflow

See @TESTING_WORKFLOW.md.

---

## Testing Requirements

Every new feature or bug fix must include corresponding tests at all three layers (backend TDD, frontend TDD, E2E BDD). A PR that introduces new behaviour without accompanying test coverage is a CLAUDE.md violation.
