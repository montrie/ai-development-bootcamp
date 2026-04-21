# CLAUDE.md — ToDo Application

This file gives you all the context needed to work on the ToDo application. Read it before making any changes.

---

## Project Overview

A simple, lightweight ToDo application that runs in the browser. No frameworks, no build tools, no dependencies — plain HTML, CSS, and JavaScript only.

---

## File Structure

```
index.html   — page structure and markup
style.css    — all styling
app.js       — all logic (state, rendering, events, localStorage)
```

---

## Tech Stack & Hard Constraints

- **HTML5, CSS3, Vanilla JavaScript (ES6+) only** — no frameworks, no libraries, no CDN scripts
- **No backend** — fully client-side
- **Three files only** — `index.html`, `style.css`, `app.js`
- **Target browsers** — Chrome, Firefox, Safari, Edge (latest 2 versions each)

---

## Visual Design

Clean and minimal — white/light grey aesthetic, ample whitespace, readable typography. Specific colours, fonts, and spacing are left to the developer.

---

## Naming Conventions

| Context | Convention | Example |
|---|---|---|
| JavaScript variables & functions | camelCase | `addTodo`, `nextId` |
| CSS classes | kebab-case | `todo-item`, `todo-list` |
| HTML IDs | kebab-case | `todo-input`, `add-button` |