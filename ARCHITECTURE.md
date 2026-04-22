# Architecture Document
## ToDo Application

**Version:** 1.0  
**Date:** 2026-04-21  
**Status:** Draft

---

## 1. Overview

The ToDo application is a fully client-side web application with no backend or external dependencies. It consists of three files served statically from the same directory. All application state is managed in-memory via a JavaScript array, and optionally persisted to `localStorage` from Iteration 4 onwards.

---

## 2. Technical Constraints

| Constraint | Decision |
|---|---|
| Technologies | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| Frameworks | None |
| Runtime | Modern web browser (Chrome, Firefox, Safari, Edge — latest 2 versions) |
| Backend | None — fully client-side |
| Persistence | Browser `localStorage` — introduced in Iteration 4 |
| Deployment | Three files: `index.html`, `style.css`, `app.js` |

---

## 3. File Structure

```
index.html
style.css
app.js
```

| File | Role |
|---|---|
| `index.html` | Page structure and markup; links to `style.css` and `app.js` |
| `style.css` | All visual styling and layout rules |
| `app.js` | All application logic — state management, DOM rendering, event handling, localStorage |

---

## 4. State Management

Application state is held in a single in-memory array of ToDo item objects, alongside an auto-incrementing counter for generating unique item IDs:

```javascript
let todos = [];
let nextId = 1;
```

Each item in the array has the following shape:

```javascript
{
  id: 1,                   // number — auto-incremented integer, starting at 1
  text: "Buy groceries",   // string — task description entered by the user
  done: false              // boolean — true if the item is completed
}
```

The array is the single source of truth. Every user action (add, complete, delete) mutates this array and then triggers a full re-render of the list.

---

## 5. DOM Rendering Strategy

The list is rendered using a **full re-render** approach: on every state change, the ToDo list container is cleared and rebuilt entirely from the current `todos` array. This keeps the rendering logic simple and predictable.

### Render trigger points

| User Action | State Change | Introduced |
|---|---|---|
| Clicks "Add" | New item appended to `todos` | Iteration 2 |
| Clicks a checkbox | Item's `done` toggled in `todos` | Iteration 2 |
| Page loads | `todos` populated (from memory or localStorage) | Iteration 2 |
| Clicks delete button | Item removed from `todos` | Iteration 3 |

### Render logic (pseudocode)

```
function render():
  clear the list container
  if todos is empty:
    show placeholder message
  else:
    for each item in todos:
      create a row with checkbox and text
      if Iteration 3+: include delete button
      if item.done: apply completed styles
      append row to list container
```

---

## 6. app.js Internal Structure

`app.js` is organised as a set of clearly separated functions, each with a single responsibility. There are no classes — only plain functions and a module-level state variable.

### 6.1 State

| Variable | Type | Description | Introduced |
|---|---|---|---|
| `todos` | `Array` | The in-memory list of all ToDo item objects | Iteration 2 |
| `nextId` | `number` | Auto-incrementing counter used to assign a unique `id` to each new item. Starts at 1 and increments by 1 on every `addTodo()` call. | Iteration 2 |

### 6.2 Functions

| Function | Responsibility | Introduced |
|---|---|---|
| `init()` | Entry point — called on page load. Binds event listeners, calls `render()`. From Iteration 4 onwards also calls `loadState()`. | Iteration 2 |
| `render()` | Clears and rebuilds the ToDo list in the DOM from the current `todos` array. From Iteration 3 onwards also renders delete buttons. | Iteration 2 |
| `addTodo(text)` | Creates a new item object, appends it to `todos`, calls `render()`. From Iteration 4 onwards also calls `saveState()`. | Iteration 2 |
| `toggleTodo(id)` | Finds the item by `id`, toggles its `done` property, calls `render()`. From Iteration 4 onwards also calls `saveState()`. | Iteration 2 |
| `deleteTodo(id)` | Removes the item with the given `id` from `todos`, calls `render()`. From Iteration 4 onwards also calls `saveState()`. | Iteration 3 |
| `saveState()` | Serialises `todos` to JSON and writes to `localStorage`. | Iteration 4 |
| `loadState()` | Reads and deserialises `todos` from `localStorage`. Returns an empty array if unavailable. | Iteration 4 |

### 6.3 Event Binding

All event listeners are bound once in `init()`. The list container uses **event delegation** — a single listener on the container handles clicks on checkboxes and delete buttons by reading the item `id` from the closest row element.

---

## 7. localStorage

### 7.1 Key

```
"todo-items"
```

### 7.2 Value

A JSON-serialised array of ToDo item objects:

```json
[
  { "id": 1, "text": "Buy groceries", "done": false },
  { "id": 2, "text": "Call dentist", "done": true }
]
```

### 7.3 Read / Write Strategy

- **Write** — `saveState()` is called after every mutation (add, complete, delete).
- **Read** — `loadState()` is called once in `init()` on page load.
- **Fallback** — if `localStorage` is unavailable (e.g. private browsing), `loadState()` returns an empty array and a non-intrusive note is shown to the user. The app continues to function in-memory for the session.

---

## 8. Iteration-by-Iteration Changes

| Iteration | app.js changes |
|---|---|
| 1 — Static HTML | `app.js` is absent or empty. |
| 2 — Core (in-memory) | `init()`, `render()`, `addTodo()`, `toggleTodo()` introduced. No persistence. |
| 3 — Delete items | `deleteTodo()` introduced. `render()` updated to include delete buttons. |
| 4 — localStorage | `saveState()` and `loadState()` introduced. `init()`, `addTodo()`, `toggleTodo()`, `deleteTodo()` updated to call `saveState()`. |
