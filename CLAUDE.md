# CLAUDE.md — ToDo Application

This file gives you all the context needed to work on the ToDo application. Read it before making any changes.

---

## Project Overview

A full-stack ToDo application (React/TypeScript + Spring Boot 4 + PostgreSQL). Source under `apps/`.

---

## File Structure

See @docs/ARCHITECTURE.md — Section 2.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Backend:** Spring Boot 4, Java 26
- **Database:** PostgreSQL (developer-run locally)
- **No auth, no Docker** (planned for later versions)

---

## Visual Design

Clean and minimal — white/light grey aesthetic, ample whitespace, readable typography.

---

## Naming Conventions

See @docs/ARCHITECTURE.md — Section 7.

---

## Development Workflow

See @docs/testing/TESTING_WORKFLOW.md.

---

## Testing Requirements

Every new feature or bug fix must include corresponding tests at all three layers (backend TDD, frontend TDD, E2E BDD). A PR that introduces new behaviour without accompanying test coverage is a CLAUDE.md violation.
