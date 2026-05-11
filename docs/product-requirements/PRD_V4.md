# Product Requirements Document (PRD)
## Version 4 — Admin Audit Logs

**Status:** In Progress

---

## 1. Product Vision

Adds an audit log system to the full-stack app. Every significant user action (todo mutations, authentication events, admin operations, and access-denied attempts) is recorded in a persistent log. Only admins can view or purge the log. A dedicated admin UI page displays the log in a filterable table.

---

## 2. Tech Stack

Same stack as Version 3, with the following additions:

| Layer | Addition |
|---|---|
| Database | `audit_logs` table |
| Backend | Spring AOP (`spring-boot-starter-aop`); `@Aspect` advice intercepts audited service/controller methods and writes entries via `AuditService`; `AuthenticationEntryPoint` and `AccessDeniedHandler` beans capture security-filter-chain 401/403 events |

---

## 3. Functional Requirements

Features F-01 through F-29 carry over unchanged from Version 3.

| ID | Requirement |
|---|---|
| F-30 | A new `audit_logs` table persists each audited event with: `id` (auto-generated), `timestamp` (server-side, UTC), `action_type` (enum string), `actor_username` (the username at the time of the action; `"anonymous"` when no authenticated user is identifiable), `outcome` (`SUCCESS` or `FAILURE`), and `resource_id` (nullable BIGINT — the ID of the affected todo or user record) |
| F-31 | When a todo is successfully created, toggled, or deleted, an audit log entry is written with the corresponding `action_type` (`TODO_CREATED`, `TODO_TOGGLED`, or `TODO_DELETED`), the acting user's username, `outcome = SUCCESS`, and the todo's ID as `resource_id` |
| F-32 | When a user registers, an audit log entry is written with `action_type = USER_REGISTERED`, the new username as `actor_username`, and `outcome = SUCCESS` |
| F-33 | When a login attempt is made, an audit log entry is written with `action_type = USER_LOGIN`, the supplied username as `actor_username`, and `outcome = SUCCESS` on success or `outcome = FAILURE` on wrong-password |
| F-34 | When an admin deletes a user or resets a user's password, an audit log entry is written with the corresponding `action_type` (`ADMIN_DELETE_USER` or `ADMIN_RESET_PASSWORD`), the admin's username, `outcome = SUCCESS`, and the affected user's ID as `resource_id` |
| F-35 | When any request is rejected with HTTP 401 (missing or invalid JWT) or HTTP 403 (insufficient role at the security layer or inside a controller), an audit log entry is written with `action_type = ACCESS_DENIED`, `actor_username` set to the username extracted from the token payload (or `"anonymous"` if no valid token is present), and `outcome = FAILURE` |
| F-36 | An admin-only `GET /api/admin/audit-logs` endpoint returns all audit log entries as a JSON array ordered by `timestamp` descending; it accepts optional query parameters `startDate` and `endDate` (ISO-8601 datetime strings, e.g. `2026-05-11T00:00:00Z`), `actionType`, and `username` to filter the result server-side |
| F-37 | An admin-only `DELETE /api/admin/audit-logs` endpoint permanently deletes all audit log entries and returns HTTP 204 |
| F-38 | The admin panel includes an "Audit Logs" page with a table showing columns: Timestamp, Action Type, Username, Outcome, and Resource ID |
| F-39 | The audit log page provides filter controls (date-range pickers for start/end, an action-type dropdown, and a username text field); applying filters re-fetches results from `GET /api/admin/audit-logs` without a full page reload |
| F-40 | The audit log page includes a "Clear All Logs" button that, after the admin confirms a browser dialog, calls `DELETE /api/admin/audit-logs` and refreshes the table |

---

## 4. Out of Scope for Version 4

- Server-side logout endpoint; logout is client-side only (token discard) and is not audited
- Server-side pagination of audit log results
- Automatic log expiry or TTL-based deletion
- Exporting logs as CSV or JSON download
- Per-user access to the user's own audit entries
- Editing or selectively deleting individual log entries
- Real-time log streaming or push notifications
- Auditing admin reads of the audit log itself
