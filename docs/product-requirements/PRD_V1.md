# Product Requirements Document (PRD)
## Version 1 — Vanilla Browser App

**Status:** Complete

---

## 1. Product Vision

A simple, lightweight ToDo application accessible in any modern web browser. The goal is a clean, minimal tool that lets users manage a personal task list with zero friction.

---

## 2. Target Users

Anyone who needs a straightforward task list in their browser — no account, no setup, no learning curve required.

---

## 3. Tech Stack

A fully client-side application built with plain HTML, CSS, and JavaScript — no frameworks, no build tools, no dependencies. State is persisted in the browser via `localStorage`.

---

## 4. Features Delivered

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

---

## 5. Out of Scope for Version 1

- Server-side persistence / database (data stored in `localStorage` only; introduced in Version 2)
- User authentication / accounts
- Multiple lists
- Editing an existing ToDo item's text
- Filtering or searching the list
- Reordering ToDo items (drag-and-drop)
- Due dates, priorities, or categories
- Undo / redo
