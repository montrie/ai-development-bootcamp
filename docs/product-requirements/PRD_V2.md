# Product Requirements Document (PRD)
## Version 2 — Full-Stack App

**Status:** In Progress

---

## 1. Product Vision

Rebuilds the same user-facing behaviour as Version 1 on a React/TypeScript frontend backed by a Spring Boot 4 REST API and a PostgreSQL database. The browser's `localStorage` is replaced by server-side persistence.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Spring Boot 4, Java 26 |
| Database | PostgreSQL |
| Frontend unit tests | Vitest + React Testing Library |
| E2E / BDD tests | Playwright + Gherkin |
| Backend tests | JUnit 5 + Spring Boot Test |

---

## 3. Functional Requirements

Features F-01 through F-10 carry over unchanged in UX behaviour from Version 1. The persistence requirements change as follows:

| ID | Requirement |
|---|---|
| F-14 | The full list (text + done state) is saved to Postgres on every change (add, complete, delete) via the REST API |
| F-15 | On page load, todos are fetched from the REST API and rendered |
| F-16 | If the API is unreachable, the app shows a non-intrusive error note; it does **not** fall back to in-memory (the server is the authoritative source of truth) |

---

## 4. Out of Scope for Version 2

- User authentication / accounts
- Editing an existing ToDo item's text
- Filtering or searching the list
- Reordering ToDo items (drag-and-drop)
- Due dates, priorities, or categories
- Undo / redo
- Multiple lists
