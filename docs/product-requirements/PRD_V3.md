# Product Requirements Document (PRD)
## Version 3 — User Authentication, Per-User Todo Lists & Admin

**Status:** In Progress

---

## 1. Product Vision

Adds user accounts to the full-stack app. Users register with a username and password, authenticate via JWT, and each user sees only their own todo list. An admin role allows user management (list, delete, password reset) without access to todo data. Existing V2 todos (which have no owner) are wiped on migration.

---

## 2. Tech Stack

Same stack as Version 2, with the following additions:

| Layer | Addition |
|---|---|
| Backend | Spring Security, spring-security-oauth2-resource-server, spring-security-oauth2-jose, BCrypt password hashing |
| Database | `users` table; foreign key from `todos.user_id` → `users.id` |

---

## 3. Functional Requirements

Features F-01 through F-17 carry over unchanged from Version 2.

| ID | Requirement |
|---|---|
| F-18 | A user can register with a unique username and a password; the password is stored as a BCrypt hash |
| F-19 | A registered user can log in with their username and password; on success the server returns a signed JWT |
| F-20 | A logged-in user can log out; the client discards the JWT and returns to the login screen |
| F-21 | All `/api/todos` endpoints require a valid JWT in the `Authorization: Bearer` header; requests without one receive HTTP 401 |
| F-22 | Each todo item is owned by the user who created it; a user can only read, complete, and delete their own todos |
| F-23 | When no valid JWT is present the app shows a login/registration screen; the todo list view is only accessible when authenticated |
| F-24 | On first startup, if no admin account exists, the application creates one using credentials supplied via environment variables |
| F-25 | An admin user can list all registered users |
| F-26 | An admin user can delete any user account; deleting a user also deletes their associated todos |
| F-27 | An admin user can reset any user's password |
| F-28 | Admin users cannot read or modify any user's todo items; admin access is restricted to user management endpoints |
| F-29 | A logged-in user can change their own password |

---

## 4. Out of Scope for Version 3

- Email-based / self-service password reset flows
- Email verification
- Social / OAuth login
- Sharing todo lists between users
- Editing an existing todo item's text
- Filtering, searching, or reordering todo items
- Due dates, priorities, or categories
