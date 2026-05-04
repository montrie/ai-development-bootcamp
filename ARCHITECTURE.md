# Architecture Document
## ToDo Application

**Version:** 2.0  
**Date:** 2026-04-29  
**Status:** Draft

---

## 1. Overview

The ToDo application has two versions:

- **Version 1** — retired. App files deleted; Gherkin feature specs preserved in `features-v1/` for reference only.
- **Version 2** — full-stack: React/TypeScript frontend + Spring Boot 4 REST API + PostgreSQL database. Source lives under `apps/`.

---

## 2. Repository Layout

```
apps/
  frontend/            React + TypeScript app (Vite)
    src/               React components, hooks, api.ts
    package.json
    vite.config.ts
    tsconfig.json
  backend/             Spring Boot 4 app
    src/main/java/     Production code
    src/test/java/     JUnit 5 tests
    pom.xml
bdd/
  features/            V2 Gherkin .feature files
  tests/               V2 Playwright specs
features-v1/           V1 Gherkin .feature files (reference only; V1 app deleted)
scripts/               Dev helper scripts (start_v2.sh, setup_db.sh, test_all.sh)
```

---

## 3. Technical Constraints

| Constraint | Version 2 |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Backend | Spring Boot 4, Java 26 |
| Database | PostgreSQL |
| Frameworks | React, Spring Boot |
| Runtime | Browser + JVM |
| Deployment | `apps/frontend/` + `apps/backend/` |
| Containerisation | Out of scope for V2 |

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

Follow the 5-step BDD cycle defined in `TESTING_WORKFLOW.md`. Gherkin `.feature` files live in `bdd/features/`. Playwright specs live in `bdd/tests/` and target the Vite dev server.

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

## 8. Version 1 (Reference)

The V1 app files (`index.html`, `style.css`, `app.js`) have been deleted. The Gherkin feature specs in `features-v1/` are retained for reference only.
