# Product Requirements Document (PRD)
## ToDo Application

**Version:** 2.0  
**Date:** 2026-04-29  
**Status:** In Progress

---

## 1. Product Vision

A simple, lightweight ToDo application accessible in any modern web browser. The goal is a clean, minimal tool that lets users manage a personal task list with zero friction.

---

## 2. Target Users

Anyone who needs a straightforward task list in their browser — no account, no setup, no learning curve required.

---

## 3. Visual Design

**Style:** Clean and minimal — white/light grey aesthetic, ample whitespace, readable typography.

---

## 4. Version 1 — Vanilla Browser App (Complete)

A fully client-side application built with plain HTML, CSS, and JavaScript — no frameworks, no build tools, no dependencies. State is persisted in the browser via `localStorage`.

### Features Delivered

| ID | Feature |
|---|---|
| F-01 | User can type a task description into the text input |
| F-02 | Clicking "Add" creates a new ToDo item and appends it to the list |
| F-03 | Pressing Enter in the text input triggers the same add action |
| F-04 | A ToDo item cannot be added if the input is empty or whitespace-only |
| F-05 | After adding, the input field is cleared |
| F-06 | Each ToDo item has a checkbox; clicking it toggles the item's done state |
| F-07 | A completed ToDo item is visually greyed out with strikethrough text |
| F-08 | A completed ToDo item can be toggled back to not-done |
| F-09 | Each ToDo item has a delete button |
| F-10 | Clicking the delete button removes the ToDo item permanently |
| F-11 | The full list (text + done state) is saved to `localStorage` on every change |
| F-12 | On page load, the saved list is read from `localStorage` and rendered |
| F-13 | If `localStorage` is unavailable, the app works in-memory and shows a short notice to the user |

### Out of Scope (all versions)

- Editing an existing ToDo item's text
- Filtering or searching the list
- Reordering ToDo items (drag-and-drop)
- Due dates, priorities, or categories
- User accounts or cloud sync
- Multiple lists
- Undo / redo

---

## 5. Version 2 — Full-Stack App (Planned)

Rebuilds the same user-facing behaviour on a React/TypeScript frontend backed by a Spring Boot 4 REST API and a Postgres database. The browser's `localStorage` is replaced by server-side persistence.

### 5.1 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Spring Boot 4, Java 26 |
| Database | PostgreSQL |
| Frontend unit tests | Vitest + React Testing Library |
| E2E / BDD tests | Playwright + Gherkin |
| Backend tests | JUnit 5 + Spring Boot Test |

### 5.2 Functional Requirements

Features F-01 through F-10 carry over unchanged in UX behaviour. The persistence requirements change as follows:

| ID | Requirement |
|---|---|
| F-11 | The full list (text + done state) is saved to Postgres on every change (add, complete, delete) via the REST API |
| F-12 | On page load, todos are fetched from the REST API and rendered |
| F-13 | If the API is unreachable, the app shows a non-intrusive error note; it does **not** fall back to in-memory (the server is the authoritative source of truth) |

### 5.3 Out of Scope for Version 2

- User authentication / accounts
- Docker / containerisation (planned for a later version)
- Any features from the all-versions out-of-scope list above
