# Architecture Document
## ToDo Application

**Version:** 2.0  
**Date:** 2026-04-29  
**Status:** Draft

---

## 1. Overview

The ToDo application has two versions:

- **Version 1** — fully client-side (HTML/CSS/Vanilla JS, `localStorage` persistence). Files remain at the repository root.
- **Version 2** — full-stack: React/TypeScript frontend + Spring Boot 4 REST API + PostgreSQL database. Source lives under `apps/`.

---

## 2. Repository Layout

```
apps/
  frontend/            React + TypeScript app (Vite)
    src/               React components, hooks, api.ts
    features/          Gherkin .feature files (BDD)
    package.json
    vite.config.ts
    tsconfig.json
    playwright.config.ts
  backend/             Spring Boot 4 app
    src/main/java/     Production code
    src/test/java/     JUnit 5 tests
    pom.xml
index.html             Version 1 (unchanged)
style.css              Version 1 (unchanged)
app.js                 Version 1 (unchanged)
features-v1/           Version 1 Gherkin .feature files
tests/                 Version 1 Playwright specs
```

---

## 3. Technical Constraints

| Constraint | Version 1 | Version 2 |
|---|---|---|
| Frontend | HTML5, CSS3, Vanilla JS (ES6+) | React 19, TypeScript, Vite |
| Backend | None | Spring Boot 4, Java 26 |
| Database | None (`localStorage`) | PostgreSQL |
| Frameworks | None | React, Spring Boot |
| Runtime | Modern browser | Browser + JVM |
| Deployment | Three static files | `apps/frontend/` + `apps/backend/` |
| Containerisation | N/A | Out of scope for V2 |

---

## 4. Version 2 — Backend

### 4.1 REST API

All endpoints are prefixed `/api`.

| Method | Path | Request Body | Description |
|---|---|---|---|
| GET | `/api/todos` | — | Return all ToDo items ordered by creation time (ascending) |
| POST | `/api/todos` | `{ "text": "string" }` | Create a new ToDo item |
| PATCH | `/api/todos/{id}` | `{ "done": boolean }` | Toggle the done state of a ToDo item |
| DELETE | `/api/todos/{id}` | — | Permanently delete a ToDo item |
| DELETE | `/api/todos` | — | Delete all ToDo items (E2E test state reset; foundation for future "Clear list" feature) |

### 4.2 Data Model

```sql
CREATE TABLE todos (
  id          BIGSERIAL    PRIMARY KEY,
  text        TEXT         NOT NULL,
  done        BOOLEAN      NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
```

### 4.3 Backend Class Structure (`apps/backend/`)

| File | Responsibility |
|---|---|
| `TodoApplication.java` | `@SpringBootApplication` entry point |
| `Todo.java` | JPA entity mapping the `todos` table |
| `TodoRepository.java` | `JpaRepository<Todo, Long>` — data access |
| `TodoController.java` | `@RestController` — maps HTTP endpoints to service calls |

---

## 5. Version 2 — Frontend

### 5.1 State Management

No Redux. Local React state (`useState` / `useReducer`) mirrors the V1 in-memory `todos` array. Every mutation dispatches an API call immediately; the response updates local state.

```typescript
type Todo = {
  id: number;
  text: string;
  done: boolean;
};
```

### 5.2 API Client (`apps/frontend/src/api.ts`)

Typed `fetch` wrappers for all four endpoints. Each function returns a `Promise` that resolves to the updated list or throws on network/server error.

### 5.3 DOM / Component Strategy

Full re-render on every state change — mirrors V1's `render()` approach, now expressed as React component re-renders triggered by `setState`.

---

## 6. Testing Strategy

Three layered test cycles run in order for every new feature:

### 6.1 Backend TDD (JUnit 5)

Write failing `@SpringBootTest` or `@WebMvcTest` controller/service tests → implement → green.

### 6.2 Frontend TDD (Vitest)

Write failing Vitest component tests using React Testing Library → implement → green.

### 6.3 End-to-End BDD (Playwright + Gherkin)

Follow the 5-step BDD cycle defined in `TESTING_WORKFLOW.md`. Gherkin `.feature` files live in `apps/frontend/features/`. Playwright specs live alongside them and target the Vite dev server.

| Layer | Tool | Scope |
|---|---|---|
| Backend unit/integration | JUnit 5 + Spring Boot Test | Service logic, HTTP contract |
| Frontend component | Vitest + React Testing Library | Component rendering, interactions |
| End-to-end BDD | Playwright + Gherkin | Full user journey in the browser |

---

## 7. Naming Conventions

| Context | Convention | Example |
|---|---|---|
| JavaScript/TypeScript variables & functions | camelCase | `addTodo`, `nextId` |
| React components | PascalCase | `TodoList`, `AddTodoForm` |
| CSS classes | kebab-case | `todo-item`, `todo-list` |
| HTML IDs | kebab-case | `todo-input`, `add-button` |
| Java classes | PascalCase | `TodoController`, `TodoRepository` |
| Java variables & methods | camelCase | `findAllByOrderByCreatedAtAsc` |

---

## 8. Version 1 Architecture (Reference)

Version 1 details are preserved here for reference. No changes are made to V1 files.

### 8.1 File Structure

```
index.html   — page structure and markup
style.css    — all styling
app.js       — all logic (state, rendering, events, localStorage)
```

### 8.2 State

```javascript
let todos = [];   // array of { id, text, done }
let nextId = 1;
```

### 8.3 Functions

| Function | Responsibility |
|---|---|
| `init()` | Entry point — binds events, loads state, renders |
| `render()` | Clears and rebuilds the list from `todos` |
| `addTodo(text)` | Appends a new ToDo item, saves, renders |
| `toggleTodo(id)` | Toggles `done`, saves, renders |
| `deleteTodo(id)` | Removes a ToDo item, saves, renders |
| `saveState()` | Serialises `todos` to `localStorage` |
| `loadState()` | Deserialises `todos` from `localStorage`; returns `[]` if unavailable |

### 8.4 localStorage

| Key | Value |
|---|---|
| `"todo-items"` | JSON array of `{ id, text, done }` objects |
