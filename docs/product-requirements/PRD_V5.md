# Product Requirements Document (PRD)
## Version 5 — Due Dates & Todo Editing

**Status:** Complete

---

## 1. Product Vision

Adds two quality-of-life improvements to the todo list: the ability to attach a due date to any todo item, and the ability to edit the text of an existing todo item in place. Due dates are set when a todo is created or when it is edited, displayed at a glance on the item, and flagged visually in red when they are overdue — giving users a clear sense of urgency without leaving the main list view.

---

## 2. Tech Stack

Same stack as Version 4, with the following additions:

| Layer | Addition |
|---|---|
| Database | `due_date` column (`DATE`, nullable) added to the `todos` table |
| Backend | `POST /api/todos` extended to accept an optional `dueDate` field; `PATCH /api/todos/{id}` extended to accept `text` and `dueDate` fields alongside the existing `done` field |
| Frontend | `react-datepicker` added as a dependency for the due date input in both the add form and the inline edit form |

---

## 3. Functional Requirements

Features F-01 through F-40 carry over unchanged from Version 4.

### 3.1 Due Dates

| ID | Requirement |
|---|---|
| F-41 | The "Add todo" form includes a date picker field (optional) for setting a due date at creation time |
| F-42 | When a todo is created with a due date, the date is sent to `POST /api/todos` as `{ "text": "<text>", "dueDate": "YYYY-MM-DD" }` |
| F-43 | Due dates can also be set, changed, or cleared while editing an existing todo (see F-52 and F-53) |
| F-44 | An already-set due date is displayed on the todo item in a human-readable format: "Due 15 May" when the due date falls within the current calendar year; "Due 15 May 2027" (year included) when it falls outside the current calendar year |
| F-45 | When a todo item has a due date and that date is strictly in the past (relative to the current local date at render time), the due-date label is shown in red |
| F-46 | Completed todo items do not show the overdue indicator, regardless of their due date |
| F-47 | The `POST /api/todos` endpoint accepts an optional `dueDate` field (`YYYY-MM-DD` string); when omitted the due date defaults to `null` |
| F-48 | The `GET /api/todos` response includes a `dueDate` field (`YYYY-MM-DD` string or `null`) for each todo item |
| F-49 | The `todos` table gains a nullable `due_date DATE` column; existing rows default to `null` |
| F-50 | The due date is included in the audit log payload of the existing `TODO_CREATED` and `TODO_EDITED` events; no separate `TODO_DUE_DATE_SET` event is written |

### 3.2 Todo Editing

| ID | Requirement |
|---|---|
| F-51 | Each todo item has a visible "Edit" button |
| F-52 | Clicking the "Edit" button switches the todo item into inline edit mode: the todo text is replaced by a focused text input pre-populated with the current text, and a date picker pre-populated with the current due date (or empty if none) appears alongside it |
| F-53 | While in edit mode, clicking a "Save" button or pressing Enter saves the updated text and due date via `PATCH /api/todos/{id}` with `{ "text": "<new text>", "dueDate": "<YYYY-MM-DD or null>" }` and exits edit mode |
| F-54 | While in edit mode, pressing Escape or clicking a "Cancel" button discards any changes and exits edit mode without making an API call |
| F-55 | A todo item cannot be saved with empty or whitespace-only text; the save action is blocked and the text input is marked invalid |
| F-56 | Only one todo item can be in edit mode at a time; activating edit mode on a second item cancels (discards) the currently open edit before opening the new one |
| F-57 | The `PATCH /api/todos/{id}` endpoint accepts optional `text` and `dueDate` fields; when either field is provided it updates the corresponding column; when either field is omitted it leaves that column unchanged; sending `"dueDate": null` explicitly clears the due date |
| F-58 | Successfully saving an edited todo item is recorded in the audit log with `action_type = TODO_UPDATED`, `outcome = SUCCESS`, and the todo's ID as `resource_id` — a single entry regardless of whether text, due date, or both were changed |

---

## 4. Out of Scope for Version 5

- A dedicated per-item "set due date" control independent of the edit flow (due dates are set only at creation or during edit)
- Sorting or filtering todos by due date
- Recurring or repeating due dates
- Due date reminders, push notifications, or email alerts
- Time-of-day precision on due dates (date-only granularity is sufficient)
- Bulk editing of todo text
- Rich-text or multi-line todo descriptions
- Drag-and-drop reordering of todo items
- Sharing or assigning todo items to other users
