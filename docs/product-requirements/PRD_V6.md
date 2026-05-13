# Product Requirements Document (PRD)
## Version 6 — Drag & Drop Todo Reordering with Persistent Sort

**Status:** In Progress

---

## 1. Product Vision

Gives users full control over how their todo list is presented. Users can choose from six automatic sort modes (by creation date, due date, or title — ascending or descending) or switch to a custom manual order by dragging items into any position they like. All preferences and custom orderings are stored server-side, so the list looks identical on every device and after every page refresh.

---

## 2. Tech Stack

Same stack as Version 5, with the following additions:

| Layer | Addition |
|---|---|
| Database | `sort_mode VARCHAR` column added to the `users` table (default `'CREATED_ASC'`); `custom_order BIGINT[]` column added to the `users` table (default `'{}'`) |
| Backend | `PATCH /api/users/me/sort-mode` endpoint to update the authenticated user's sort preference; `PATCH /api/todos/reorder` endpoint to persist a new custom ordering; `GET /api/todos` extended to order results by the user's active sort mode |
| Frontend | Drag-and-drop library (e.g. `@dnd-kit/core`) added as a dependency for reordering todo items within the list |

---

## 3. Functional Requirements

Features F-01 through F-58 carry over unchanged from Version 5.

### 3.1 Sort Mode — Data Model & Defaults

| ID | Requirement |
|---|---|
| F-59 | The `users` table gains two columns: `sort_mode VARCHAR NOT NULL DEFAULT 'CREATED_ASC'` and `custom_order BIGINT[] NOT NULL DEFAULT '{}'`; existing rows are migrated to these defaults |
| F-60 | The valid values for `sort_mode` are exactly: `CREATED_ASC`, `CREATED_DESC`, `DUE_DATE_ASC`, `DUE_DATE_DESC`, `ALPHA_ASC`, `ALPHA_DESC`, `CUSTOM`; any other value is rejected with HTTP 400 |

### 3.2 Sort Mode — API

| ID | Requirement |
|---|---|
| F-61 | `PATCH /api/users/me/sort-mode` (authenticated only — unauthenticated → HTTP 401) accepts `{ "sortMode": "<value>" }` and updates the user's `sort_mode`; returns HTTP 200 with the updated sort mode on success |
| F-62 | `PATCH /api/todos/reorder` (authenticated only — unauthenticated → HTTP 401; IDs belonging to another user → HTTP 403) accepts `{ "order": [<id>, ...] }`; sets `sort_mode = 'CUSTOM'` and replaces `custom_order` with the supplied array; returns HTTP 200 on success |
| F-63 | `GET /api/todos` returns todos ordered by the user's active `sort_mode`: `CREATED_ASC` → `created_at ASC`; `CREATED_DESC` → `created_at DESC`; `DUE_DATE_ASC` → `due_date ASC NULLS LAST, created_at ASC`; `DUE_DATE_DESC` → `due_date DESC NULLS LAST, created_at ASC`; `ALPHA_ASC` → `text ASC`; `ALPHA_DESC` → `text DESC`; `CUSTOM` → `array_position(custom_order, id)` with IDs absent from `custom_order` appended sorted by `created_at ASC` |

### 3.3 Sort Mode — Custom Order Maintenance

| ID | Requirement |
|---|---|
| F-64 | When a todo is created and `sort_mode = 'CUSTOM'`, the new ID is appended to `custom_order`; when a todo is deleted, its ID is removed from `custom_order` via `array_remove(custom_order, id)` regardless of the active sort mode |

### 3.4 Sort Mode — UI Controls

| ID | Requirement |
|---|---|
| F-65 | The UI displays a sort mode selector above the todo list showing the current active mode, offering: "Created (oldest first)" (`CREATED_ASC`), "Created (newest first)" (`CREATED_DESC`), "Due date (earliest first)" (`DUE_DATE_ASC`), "Due date (latest first)" (`DUE_DATE_DESC`), "Title (A → Z)" (`ALPHA_ASC`), "Title (Z → A)" (`ALPHA_DESC`), and "Custom order" (`CUSTOM`); selecting `CUSTOM` restores the order stored in `custom_order` (i.e. the last manually arranged order) |
| F-66 | Selecting a sort mode calls `PATCH /api/users/me/sort-mode` (selector is disabled while the request is in flight) and re-renders the list in the order returned by the subsequent `GET /api/todos` |

### 3.5 Drag & Drop — UI Behaviour

| ID | Requirement |
|---|---|
| F-67 | Each todo item has a visible drag handle affordance (e.g. a grip icon) that the user can grab to reorder the item; dragging it to a new position immediately reorders the list optimistically in the UI |
| F-68 | After a drag, the frontend calls `PATCH /api/todos/reorder` with the full new ID array; on success the sort selector updates to "Custom order"; on failure the list reverts and an error message is shown; a drag always transitions the user to `CUSTOM` mode regardless of the previous sort mode |
| F-69 | Drag handles are hidden and drag-and-drop is disabled while any todo item is in inline edit mode (see F-52) |

---

## 4. Out of Scope for Version 6

- Sharing or synchronising custom order across multiple user accounts
- Per-device sort preferences (one preference per user across all devices)
- Sorting or filtering by completion status
- Saving multiple named orderings or "views"
- Touch-only swipe gestures as an alternative to drag handles (standard drag-and-drop touch support via the chosen library is acceptable)
- Admin-visible sort preferences in the audit log
