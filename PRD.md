# Product Requirements Document (PRD)
## ToDo Application

**Version:** 1.0  
**Date:** 2026-04-21  
**Status:** Final

---

## 1. Product Vision

A simple, lightweight ToDo application accessible in any modern web browser. The application is built with plain HTML, CSS, and JavaScript — no frameworks, no build tools, no dependencies. The goal is a clean, minimal tool that lets users manage a personal task list with zero friction.

---

## 2. Target Users

Anyone who needs a straightforward task list in their browser — no account, no setup, no learning curve required.

---

## 3. Visual Design

**Style:** Clean and minimal — white/light grey aesthetic, ample whitespace, readable typography. All further styling details (colours, typography, spacing, layout) are to be determined during development.

---

## 4. Iterations Overview

| Iteration | Focus |
|---|---|
| Iteration 1 | Static HTML page |
| Iteration 2 | Core — add, complete (in-memory) |
| Iteration 3 | Delete items |
| Iteration 4 | localStorage persistence |

---

## 5. Iteration 1 — Static HTML Page

### 5.1 Goal

Build the full visual structure of the application as a static HTML page with no JavaScript functionality. This establishes the layout, markup, and styling foundation that all subsequent iterations will build upon.

### 5.2 User Interface

#### Page Structure (top to bottom)

```
┌────────────────────────────────┐
│  Page heading: "To-Do List"    │
├────────────────────────────────┤
│  New ToDo Form                 │
│  [_______________________] [Add]│
├────────────────────────────────┤
│  ToDo List                     │
│  ☐  Buy groceries              │
│  ☑  Call dentist               │  ← greyed out
│  ☐  Finish report              │
└────────────────────────────────┘
```

#### New ToDo Form

- A single-line **text input** for entering the task description.
- An **"Add" button** to the right of the input.
- No interactivity in this iteration — the form is purely structural.

#### ToDo List

- A hardcoded list of sample ToDo items to demonstrate the layout.
- Each item is a row containing a checkbox and task text.
- At least one item should appear in a completed state (greyed out, strikethrough) to validate the styling.

### 5.3 Success Criteria

Iteration 1 is considered complete when:

1. The page renders correctly in the latest versions of Chrome, Firefox, Safari, and Edge.
2. The layout matches the page structure sketch above.
3. Hardcoded ToDo items are visible, including at least one in a completed state.
4. No JavaScript is required or used.
5. `index.html` and `style.css` are present; `app.js` is absent or empty.

---

## 6. Iteration 2 — Core (In-Memory)

### 6.1 Goal

Replace the hardcoded content with fully functional add and complete behaviour. All state is held in-memory only — the list does not survive a page refresh in this iteration.

### 6.2 User Interface

The visual structure from Iteration 1 remains unchanged. The following behaviours are added:

#### New ToDo Form

- If the input is empty or contains only whitespace, the Add action is blocked (no item is created; the input shows a subtle validation cue).
- After a successful add, the input is cleared.

#### ToDo List

- The hardcoded items are removed; the list is now rendered dynamically from JavaScript.
- Items are displayed in insertion order (newest at the bottom).
- When the list is empty, a short placeholder message is shown: *"No tasks yet — add one above!"*

#### Completed Item Appearance

When a ToDo item is marked as done:
- The checkbox is checked.
- The task text is visually greyed out with a strikethrough to clearly distinguish it from open items.
- The row may optionally have a subtly different background to further distinguish it.

### 6.3 Functional Requirements

#### Add a ToDo Item

| ID | Requirement |
|---|---|
| F-01 | The user can type a task description into the text input. |
| F-02 | Clicking "Add" creates a new ToDo item and appends it to the list. |
| F-03 | Pressing Enter in the text input triggers the same add action as clicking "Add". |
| F-04 | An item cannot be added if the input is empty or whitespace-only. |
| F-05 | After adding, the input field is cleared. |

#### Complete a ToDo Item

| ID | Requirement |
|---|---|
| F-06 | Each item has a checkbox. Clicking it toggles the item's "done" state. |
| F-07 | A completed item is visually greyed out with strikethrough text. |
| F-08 | A completed item can be toggled back to "not done" by clicking the checkbox again. |

### 6.4 Behaviour Edge Cases

| Scenario | Expected Behaviour |
|---|---|
| User submits empty input | No item added; the input shows a subtle validation cue. |
| User submits input with only spaces | Treated as empty — no item added. |
| List is empty on load | Placeholder text shown: *"No tasks yet — add one above!"* |
| Very long task text | Text wraps within the item row; layout does not break. |

### 6.5 Success Criteria

Iteration 2 is considered complete when:

1. A user can add and complete ToDo items through the browser UI.
2. All state is in-memory — the list resets on page refresh.
3. The page is fully functional in the latest versions of Chrome, Firefox, Safari, and Edge.
4. No external libraries, CDN scripts, or frameworks are used.

---

## 7. Iteration 3 — Delete Items

### 7.1 Goal

Allow users to permanently remove individual ToDo items from the list within the same session. State remains in-memory only — deletions do not persist across page refreshes until Iteration 4.

### 7.2 User Interface

Each ToDo item row gains a **delete button** on the right side. Clicking it immediately removes the item from the list.

### 7.3 Functional Requirements

| ID | Requirement |
|---|---|
| F-09 | Each item has a delete button. |
| F-10 | Clicking the delete button removes the item from the list permanently. |

### 7.4 Success Criteria

Iteration 3 is considered complete when:

1. Every item in the list can be deleted via its delete button.
2. Deleted items do not reappear after adding new ones in the same session.

---

## 8. Iteration 4 — localStorage Persistence

### 8.1 Goal

Persist the ToDo list across page refreshes using `localStorage`, so the user's tasks survive closing and reopening the browser tab.

### 8.2 Functional Requirements

| ID | Requirement |
|---|---|
| F-11 | The full list (text + done state) is saved to `localStorage` on every change (add, complete, delete). |
| F-12 | On page load, the saved list is read from `localStorage` and rendered. |
| F-13 | If `localStorage` is unavailable (private browsing restrictions), the app degrades gracefully — it works in-memory for the session and displays a short note informing the user that changes will not be saved. |

### 8.3 Behaviour Edge Cases

| Scenario | Expected Behaviour |
|---|---|
| `localStorage` is full or blocked | App works in-memory for the session; a short non-intrusive note is shown to the user (e.g. *"Storage unavailable — changes won't be saved after closing the tab."*). |

### 8.4 Success Criteria

Iteration 4 is considered complete when:

1. The list survives a page refresh.
2. The done state of each item is also preserved.
3. Deleted items do not reappear after a page refresh.
4. When `localStorage` is unavailable, the app still works in-memory and informs the user.

---

## 9. Out of Scope

The following features are excluded from all planned iterations:

- Editing an existing ToDo item's text
- Filtering or searching the list
- Reordering items (drag-and-drop)
- Due dates, priorities, or categories
- User accounts or cloud sync
- Multiple lists
- Undo / redo
