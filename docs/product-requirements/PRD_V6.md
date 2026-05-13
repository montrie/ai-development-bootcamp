# Product Requirements Document (PRD)
## Version 6 — Custom Sorting, Drag & Drop Reordering, and Todo Sharing

**Status:** In Progress

---

## 1. Product Vision

Gives users full control over how their todo list is presented and who can see it. Users can choose from six automatic sort modes (by creation date, due date, or title — ascending or descending) or switch to a custom manual order by dragging items into any position they like. All sort preferences and custom orderings are stored server-side, so the list looks identical on every device and after every page refresh. Additionally, users can share individual todo items with other registered users by username; shared todos appear in the recipient's list alongside their own todos, marked with a "shared by &lt;owner_username&gt;" annotation. The original owner retains full ownership while recipients get full read/write access to the shared items. Sharing events are recorded in the existing audit log.

---

## 2. Tech Stack

Same stack as Version 5, with the following additions:

| Layer | Addition |
|---|---|
| Database | `sort_mode VARCHAR` column added to the `users` table (default `'CREATED_ASC'`); `custom_order BIGINT[]` column added to the `users` table (default `'{}'`); `todo_shares` join table linking todos to recipient users |
| Backend | `PATCH /api/users/me/sort-mode` endpoint to update the authenticated user's sort preference; `PATCH /api/todos/reorder` endpoint to persist a new custom ordering; `GET /api/todos` extended to order results by the user's active sort mode and to return todos shared with the authenticated user; `POST /api/todos/shares` bulk endpoint to create share records |
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

### 3.6 Todo Sharing — Data Model

| ID | Requirement |
|---|---|
| F-70 | A new `todo_shares` table is added with columns: `id` (auto-generated), `todo_id` (FK → `todos.id` ON DELETE CASCADE, NOT NULL), `recipient_user_id` (FK → `users.id` ON DELETE CASCADE, NOT NULL), and a unique constraint on `(todo_id, recipient_user_id)` to prevent duplicate shares |

### 3.7 Todo Sharing — API

| ID | Requirement |
|---|---|
| F-71 | A new `POST /api/todos/shares` endpoint accepts a JSON body `{ "todoIds": [<id>, ...], "recipientUsername": "<username>" }` and creates share records for each todo ID with the resolved recipient user; it returns HTTP 200 on full success |
| F-72 | `POST /api/todos/shares` returns HTTP 400 with distinct error messages depending on the failure reason: `"user does not exist"` when the recipient username is not found in the system; `"cannot share with user"` when the actor attempts to share with themselves or the recipient is an admin user (both cases use the same opaque message); `"already shared with user"` when any todo in the request has already been shared with the specified recipient |
| F-73 | `GET /api/todos` returns the authenticated user's own todos AND any todos shared with them by other users, all ordered by creation time ascending; shared todos include a `sharedBy` field containing the original owner's username |
| F-74 | Each successful share operation is recorded in the audit log with `action_type = TODO_SHARED`, the sharer's username as `actor_username`, `outcome = SUCCESS`, and the shared todo's ID as `resource_id`; one audit log entry is written per shared todo |

### 3.8 Todo Sharing — UI: Selection Mode

| ID | Requirement |
|---|---|
| F-75 | The navbar contains a "Share Todos" button; clicking it activates sharing mode |
| F-76 | While sharing mode is active, the "Share Todos" button changes its label (e.g. to "Back") and clicking it deactivates sharing mode, returning the UI to the default todo list view |
| F-77 | When sharing mode is active, each todo item owned by the authenticated user becomes selectable; hovering over a selectable item shows a highlighted background and border to indicate selectability; clicking an item selects it, applying the same highlighted background and border as a persistent selected state |
| F-78 | The sharing panel displays the current in-memory todo list (no fresh API fetch is performed when sharing mode opens) |
| F-79 | The sharing panel includes a username text input field for the recipient |
| F-80 | The sharing panel includes a "Share selected todos" button that is disabled when no todos are selected OR when the username input is empty |
| F-81 | Clicking "Share selected todos" while the button is enabled calls `POST /api/todos/shares` with the IDs of all selected todos and the entered username |
| F-82 | On a successful share, the selection is cleared (all todos become deselected), the username input is cleared, and a success toast notification is displayed |
| F-83 | On a failed share (HTTP 400 from the API), the selection and username input are preserved and an error toast notification is displayed showing the error message returned by the API |
| F-84 | Todos shared with the authenticated user (received shares) are visible in sharing mode but are not selectable; only the authenticated user's own todos can be shared |

### 3.9 Todo Sharing — UI: Recipient View

| ID | Requirement |
|---|---|
| F-85 | Todos shared with the authenticated user appear in their main todo list alongside their own todos; each shared todo displays the label `"Shared by <owner_username>"`, where `<owner_username>` is the username of the user who shared the todo |
| F-86 | Recipients can read, mark done, edit text/due-date, and delete shared todos; all such actions behave identically to the same actions on the recipient's own todos |

---

## 4. Out of Scope for Version 6

- Sharing or synchronising custom order across multiple user accounts
- Per-device sort preferences (one preference per user across all devices)
- Sorting or filtering by completion status
- Saving multiple named orderings or "views"
- Touch-only swipe gestures as an alternative to drag handles (standard drag-and-drop touch support via the chosen library is acceptable)
- Admin-visible sort preferences in the audit log
- Revoking or unsharing a todo (once shared, the share is permanent in this version)
- Limiting the number of users a todo can be shared with
- Sharing a todo with more than one recipient per API call (single recipient per request)
- Notifications to the recipient when a todo is shared with them
- Per-todo sharing history or share audit trail beyond the standard audit log
- Sharing entire todo lists or categories rather than individual items
