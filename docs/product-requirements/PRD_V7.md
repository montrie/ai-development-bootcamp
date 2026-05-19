# Product Requirements Document (PRD)
## Version 7 — Testcontainers Baseline for Backend Integration Tests

**Status:** In Progress

---

## 1. Product Vision

V7 is an internal infrastructure release: it does not change the user-facing application surface. All functional features from V1–V6 (F-01 through F-88) carry over unchanged. The purpose of V7 is to replace the implicit "developer-runs-Postgres-locally" contract that the backend test suite has relied on so far with an automated, hermetic Postgres dependency managed by Testcontainers. From this release onward, every backend test that touches persistence boots against a real Postgres container running the production Flyway migrations — never an in-memory substitute, never a developer-provided database. This buys two things: parity between test and production (Postgres-only features such as `BIGINT[]` columns, `array_position`, `array_remove`, and `NULLS LAST` ordering are exercised honestly), and a zero-setup contributor experience (cloning the repo and running `mvn test` is sufficient).

V7 also establishes the measurement surface for the JPA / Hibernate performance-tuning work scheduled for the next V7 chunk — every query plan, statistic, and timing collected from here on is read off the same Postgres dialect production uses.

Because these changes do not add or alter end-user functionality, this document tracks them as **Infrastructure Requirements** (`I-` prefix) rather than Functional Requirements.

---

## 2. Tech Stack

Same stack as Version 6, with the following test-side additions (already declared in `apps/backend/pom.xml`):

| Layer | Addition |
|---|---|
| Backend tests | `org.testcontainers:testcontainers-bom 1.20.4` (BOM); `org.springframework.boot:spring-boot-testcontainers` (Spring Boot's `@ServiceConnection` integration); `org.testcontainers:junit-jupiter` (JUnit 5 `@Testcontainers` extension); `org.testcontainers:postgresql` (`PostgreSQLContainer` wrapper) |
| Test runtime | A reachable Docker daemon on the contributor's host (already required by V2's compose stack) |

No production-code dependencies change.

---

## 3. Infrastructure Requirements

### 3.1 Container Lifecycle

| ID | Requirement |
|---|---|
| I-01 | A new `com.todo.support.TestcontainersConfig` `@TestConfiguration` declares a single `@Bean @ServiceConnection PostgreSQLContainer<?>` image-pinned to `postgres:17-alpine` with container reuse enabled (`withReuse(true)`). A new abstract base class `com.todo.support.IntegrationTestBase` annotated `@SpringBootTest`, `@ActiveProfiles("test")`, and `@Import(TestcontainersConfig.class)` wires the bean into the test context |
| I-02 | The Postgres container is managed by Spring as a singleton bean: every integration test class that extends `IntegrationTestBase` reuses the same cached application context and therefore the same running container instance, paying the startup cost (~3–8 s) at most once per test JVM. The container is intentionally not stopped between classes — Spring's bean lifecycle keeps it alive for the entire test run so cached `JdbcConnectionDetails` stay valid |
| I-03 | The JDBC URL, username, and password of the running container are wired into the Spring application context via `@ServiceConnection`; no `@DynamicPropertySource` block and no hand-written `spring.datasource.*` properties are permitted in `application-test.properties` |
| I-04 | A new `apps/backend/src/test/resources/application-test.properties` exists with at least `spring.flyway.enabled=true` and `spring.jpa.hibernate.ddl-auto=none`; the production Flyway migrations under `src/main/resources/db/migration/` are the single source of truth for the test schema |

### 3.2 Coverage of Postgres-Specific Behaviour

| ID | Requirement |
|---|---|
| I-05 | A repository integration test `V7TodoRepositoryTest` covers `TodoRepository.findAllByUserOrderByCustom` end-to-end, asserting that rows are returned in the order specified by the `custom_order` array (via `array_position`) and that ids absent from the array are appended last, ordered by `created_at ASC` |
| I-06 | The same repository IT asserts that `findAllByUserOrderByDueDateAscCreatedAtAsc` places rows with `due_date IS NULL` last, matching Postgres `NULLS LAST` semantics |
| I-07 | A repository integration test `V7UserRepositoryTest` covers the native `UPDATE users SET custom_order = array_remove(custom_order, :todoId) WHERE id = :userId` query, asserting that the supplied todo id is removed from the array and other ids are preserved |
| I-08 | A repository integration test `V7FlywayMigrationsTest` queries `flyway_schema_history` after context bootstrap and asserts that every migration shipped under `src/main/resources/db/migration/` is recorded with a successful status |

### 3.3 Test Suite Composition

| ID | Requirement |
|---|---|
| I-09 | The existing `@WebMvcTest` controller tests (V2–V6) remain in place and continue to use `@MockitoBean` for the persistence layer; V7 does not migrate them to integration tests |
| I-10 | The new integration tests live under `apps/backend/src/test/java/com/todo/repository/` and follow the existing V{n}{Name}Test naming convention (file pattern `V7*Test.java`) so Surefire's default include patterns pick them up with no Maven plugin reconfiguration |
| I-11 | Running `./mvnw test` from `apps/backend/` exits zero on a clean checkout with no developer-managed Postgres instance running |

### 3.4 Out of Scope for V7

| ID | Requirement |
|---|---|
| I-12 | V7 does not introduce JPA / Hibernate performance tuning (`@EntityGraph`, `JOIN FETCH`, DTO projections, OSIV disablement) — that work is sequenced as the next V7 chunk and depends on this foundation |
| I-13 | V7 does not change CI configuration; the GitHub-hosted runners already expose a Docker daemon and require no additional steps |
| I-14 | V7 does not add a JMH benchmark harness or a load-test profile |
