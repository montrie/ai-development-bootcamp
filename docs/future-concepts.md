# Future Version Concepts & Learning Roadmap

A curated, opinionated catalogue of technologies and architectural concepts worth introducing in V7 and beyond. The intent is not just to list interesting tech but to rank it by **leverage for this specific learning sandbox**, given that the sandbox exists to prepare for a customer engagement on **Spring Boot with a hexagonal architecture and a lot of data**.

---

## How to read this document

Every concept is rated on two independent axes:

- **Learning value (1–5 ★)** — how much general engineering value does mastering this concept carry? This rating is roughly the same whichever project you learn it in.
- **Fit for this codebase (1–5 ★)** — does *this* todo app give you a realistic, motivated use case for the concept, or do you have to invent one? A high learning-value concept can still have a low fit if the codebase is too small or too uniform to expose what makes the concept matter.

The verdict combines both:

| Tier | Meaning |
|---|---|
| **S** | High learning value AND a strong, realistic fit here. Do these next. |
| **A** | High learning value, moderate fit. Worth doing; expect to manufacture or stretch the use case a little. |
| **B** | High learning value, **weak fit as the codebase stands today**. Each Tier B entry names exactly what would have to change in the codebase for the concept to graduate to Tier S/A. |
| **C** | Skip or defer indefinitely. The upgrade cost outweighs the learning, or the concept duplicates something already present. |

### Bias declared up front

Customer project: Spring Boot, hexagonal architecture, **lots of data**. Two consequences run through every verdict below:

1. **Data-heavy and Spring-ecosystem concepts get a fit bump.** Even when the local todo app does not feel the pain a concept solves, the *carryover* into the customer project is the real metric. JPA performance tuning, batch processing, caching, observability, and resilience patterns all sit at the top of the list for this reason — not because a single-user todo app needs them.
2. **Hexagonal architecture is deliberately not on this list.** That lesson is reserved for the customer project itself; refactoring a 5-entity todo app into ports-and-adapters would be ceremonial. Spring Modulith covers the closely related bounded-context lesson at a more appropriate scale (see Tier A).

### Per-entry template

```
What it is             — 1–2 sentences.
Canonical use case     — the specific feature / endpoint / migration this would land in.
Learning value         — ★ rating + why.
Fit for this codebase  — ★ rating + why (citing concrete files/entities).
Verdict                — Tier + reasoning.
Key sub-concepts       — the 3–5 ideas worth digging into.
What you'd skip        — explicit non-goals so scope stays honest.
Prerequisites          — concepts that should land first.
What would upgrade fit — (Tier B/C only) the specific codebase change that would
                         promote this concept from contrived to natural.
```

---

## Already in place — review and extend, do not re-implement

Two of the original document's top recommendations — Docker Compose and GitHub Actions CI — are **already in this repository**. The most useful thing to do with them now is treat the existing setup as a learning artefact: read it, understand the design decisions, and extend it deliberately rather than rewriting from scratch.

### Docker Compose (already in place)

**What exists today:**
- `compose.yml` — `db` (postgres:17-alpine) + `backend` (Spring Boot) + `frontend` (Vite) + `backend-test`, `frontend-unit-test`, `e2e-test` profiles.
- `compose.prod.yml` — production overlay.
- Multi-stage `Dockerfile`s at `apps/backend/Dockerfile`, `apps/frontend/Dockerfile`, `apps/frontend/Dockerfile.prod`, plus a top-level `Dockerfile.e2e` for Playwright.
- Healthchecks (`pg_isready`, TCP probe on `:8080`), `depends_on: condition: service_healthy`, a named `postgres_data` volume.

**What's worth learning on top of this:**
- **Read the multi-stage Dockerfiles end-to-end.** Identify the builder vs runtime split and measure the image size delta (`docker image ls`). Write a short note in `docs/` summarising what each stage does and why; this is the single best way to internalise the multi-stage pattern.
- **Map every Compose primitive to its Kubernetes equivalent.** `service` → Deployment + Service, `volume` → PersistentVolumeClaim, healthcheck → readinessProbe/livenessProbe, `depends_on` → init containers or readiness gates, `env_file` → ConfigMap/Secret. Make this mapping explicit before tackling K8s in Tier B.
- **Audit the healthcheck design.** The TCP probe on `:8080` is shallower than Spring Boot Actuator's `/actuator/health/readiness`. Decide whether the simpler probe is intentional (it is, for now) and document the trade-off.
- **Build profiles vs override files.** The `profiles: [test]` mechanism is used to gate `backend-test`, `frontend-unit-test`, `e2e-test`. Understand the difference between profiles and `compose.prod.yml`-style overrides — both are valid in production setups.

### GitHub Actions CI (already in place)

**What exists today:**
- `.github/workflows/ci.yml` — `lint` → `backend-test` → `frontend-unit-test` → `e2e-test`, fan-out after lint. Uses `docker buildx bake` with GHA layer cache (`type=gha,mode=max`).
- `.github/workflows/deploy.yml` — deployment workflow.
- `.github/workflows/claude.yml` and `claude-code-review.yml` — Claude-driven review automation.

**What's worth learning on top of this:**
- **Matrix builds.** None of the current jobs use a matrix. Add a matrix to one job (e.g. `node-version: [20, 22]` or test against multiple Postgres versions) just to internalise the YAML and the fan-out behaviour. Revert if it's not useful — the goal is exposure to the construct.
- **Reusable workflows (`workflow_call`).** The build-image step is duplicated between `backend-test`, `frontend-unit-test`, `e2e-test`. Extract it into a reusable workflow and call it from each job. This is the YAML equivalent of a function and the canonical maintainability lever in any CI codebase.
- **Deployment environments + required reviewers.** Configure a GitHub `production` environment with a required-reviewer gate on `deploy.yml`. The audit trail and the approval-as-infrastructure pattern are the actual lesson, not the YAML.
- **Cache invalidation review.** Verify that the `cache-from`/`cache-to=type=gha` keys invalidate correctly on dependency changes (touch `pom.xml`/`package-lock.json` and observe). A miscalibrated cache that silently serves stale dependencies is a common CI bug.
- **Read `deploy.yml` line by line.** It is the most production-shaped artefact in the repo. Treat it as the "real" learning surface and ask: what happens on a failed deploy? Is rollback automated? Are secrets correctly scoped?

**Neither of these is a V7+ implementation item.** They are reading-and-extension material that should precede the rest of the roadmap.

---

# Tier S — Highest priority

Strong learning value *and* a realistic, motivated fit in the current codebase, *or* a learning value so high and so directly relevant to the customer project (heavy-data Spring Boot) that the carryover dominates the local fit question.

---

## Testcontainers

**What it is:** A Java library that starts real dependencies (Postgres, Kafka, Redis, Elasticsearch, browsers, anything Docker can run) as part of a JUnit test lifecycle. The container is started before the test class, the JDBC URL or bootstrap address is injected via `@DynamicPropertySource`, and the container is destroyed at the end.

**Canonical use case in this project:** Replace the manual `scripts/setup_db.sh` + peer-auth Postgres ritual (called out as a recurring pain point in `feedback_v2_local_setup`) with a `@Testcontainers`-managed Postgres for every backend integration test. The Flyway migrations under `apps/backend/src/main/resources/db/migration/` run inside the container at test startup, guaranteeing that every test sees the *real* schema and the *real* Postgres SQL dialect, not H2's approximation.

**Learning value:** ★★★★★ — integration testing against a real datastore (rather than an in-memory substitute) is the dominant pattern in modern Spring Boot codebases. The lesson — *parity between test and prod is bought, not assumed* — is one of the highest-leverage testing ideas in the language.

**Fit for this codebase:** ★★★★★ — the project already uses Postgres-specific features (the `BIGINT[]` `custom_order` column on `users`, native `array_position` queries in `TodoRepository`). These cannot be tested faithfully against H2 or HSQLDB. Testcontainers is the only honest answer.

**Verdict:** **Tier S.** Highest-priority Tier S item, alongside JPA performance tuning. No infrastructure prerequisites — Docker is already configured.

**Key sub-concepts to explore:**
- **`@DynamicPropertySource` vs `application-test.yml`.** Dynamic property sources are how the random container port and credentials are injected into the Spring context at boot. Understand why a static properties file does not work for this.
- **Container reuse (`withReuse(true)` + `~/.testcontainers.properties`).** Without reuse, each test class starts a fresh Postgres (~3s overhead). With reuse, the container survives across runs, cutting suite time dramatically. Important when running tests in a tight inner loop locally.
- **Singleton-container pattern.** Define the container as a `static` field on a base test class; every subclass shares the same container. Pair with `@Sql` or per-test cleanup to keep test isolation despite the shared container.
- **GenericContainer vs module-specific containers.** `PostgreSQLContainer`, `KafkaContainer`, `LocalStackContainer` are pre-configured wrappers; `GenericContainer` is the escape hatch. Knowing when each is appropriate is a small but real skill.
- **CI integration.** Testcontainers + GitHub Actions runners works out of the box (the runner has Docker). Compare with the current CI strategy of running tests inside `backend-test` Compose service — both are valid, with different trade-offs in startup cost and isolation.

**What you'd skip and why:** Skip `TestcontainersExtension`'s JUnit 4 mode; the project is on JUnit 5. Skip the more exotic modules (LocalStack, Selenium grid) until a use case actually appears.

**Prerequisites:** none. Docker is already configured.

---

## JPA / Hibernate performance tuning

**What it is:** The discipline of writing JPA mappings, queries, and fetch strategies that scale gracefully with data volume. Encompasses the N+1 problem, lazy vs eager fetching, batch fetching, projections, entity vs DTO query targets, `@EntityGraph`, the second-level cache, statement caching, and reading `EXPLAIN ANALYZE` output to drive the next index.

**Canonical use case in this project:** The existing repository already exhibits the *shape* of every problem this skill solves, even though the data volume is currently tiny:
- `TodoRepository.findAllByUserOrderByCreatedAtAsc(User user)` and its sort-mode variants are the obvious entry point for an `@EntityGraph` exercise — make `Todo.user` lazy and observe the lazy-load triggered by `@JsonIgnore` serialisation.
- The shared-todos merge logic in `TodoController.getTodos` (own todos + `TodoShareRepository.findAllByRecipientUser`) is a classic N+1 candidate when serialising `sharedBy` usernames. Pair with DTO projection (`TodoResponseDto`) to short-circuit the lazy load.
- The native `findAllByUserOrderByCustom` query using `array_position` is a great hook for `EXPLAIN ANALYZE`: index the array, observe the plan, compare with a CTE rewrite.
- `AuditLogRepository.search` with up to four optional filters is the canonical "should this be a Specification, a Criteria query, or QueryDSL?" decision.

**Learning value:** ★★★★★ — this is the single highest-carryover skill on the entire roadmap for a heavy-data Spring Boot engagement. Every customer-project incident around "the API is slow" reduces to one of: N+1, missing index, wrong fetch type, oversized result set, or transaction-scope mistake. Naming and recognising each is non-negotiable.

**Fit for this codebase:** ★★★★★ — the entities, repositories, and queries are right there. You do not need to invent a scenario; you need to *measure* what is already there. Flip `spring.jpa.properties.hibernate.generate_statistics=true`, hit `GET /api/todos` with one user and one share, count the queries, and the lesson writes itself.

**Verdict:** **Tier S.** Pair with Testcontainers (above) so that every measurement runs against the same Postgres that production would. This is the V7 cornerstone.

**Key sub-concepts to explore:**
- **The N+1 problem and its fixes.** `@EntityGraph` (declarative), `JOIN FETCH` in JPQL (imperative), `@BatchSize` (in-flight batching), Hibernate's `default_batch_fetch_size` (global). Each has different ergonomics; do at least two side-by-side.
- **DTO projections vs entity projections.** Selecting `new com.todo.dto.TodoSummary(t.id, t.text, t.dueDate)` directly in JPQL skips entity hydration and the persistence context entirely. Massive difference on read-heavy endpoints; the right answer is almost always projection for list responses.
- **`OpenSessionInView` (OSIV).** Spring Boot enables this by default and it silently hides N+1 problems by holding the session open until response serialisation. Disabling OSIV (`spring.jpa.open-in-view=false`) and seeing every lazy-load explode into a `LazyInitializationException` is one of the most clarifying exercises in Spring Boot.
- **Second-level cache + query cache.** Hibernate's L2 cache (EhCache, Caffeine, Infinispan, Hazelcast) and the query cache. Understand the difference, the invalidation model, and why naive use can serve stale data across instances.
- **Reading `EXPLAIN ANALYZE`.** Sequential scan vs index scan vs bitmap heap scan, the cost model, when statistics are stale, the role of `pg_stat_statements`. The DBA literacy you build here is reusable across every relational database.
- **Pagination strategies.** `OFFSET`/`LIMIT` (simple, degrades on deep pages) vs keyset pagination (fast, more complex). The `findAllByUserOrderBy*` queries are a natural place to swap one for the other and benchmark.
- **Persistence-context staleness around `@Modifying` native queries.** A `@Modifying` native `UPDATE`/`DELETE` writes straight to the database and never goes through the persistence context, so any entity already loaded into the first-level cache continues to show its pre-update field values for the remainder of the transaction — and any later `findById` in the same transaction is served from that stale cache, not the database. `UserRepository.removeFromCustomOrder` (native `array_remove`) is the canonical instance of this in the codebase; it bit V7's repository integration tests immediately. Three remedies, each with a different trade-off: ① `@Modifying(flushAutomatically = true, clearAutomatically = true)` — forces a pre-update flush and a post-update clear for every caller; safest, but throws away the entire persistence context, which destroys any optimisation that relied on cached entities later in the same transaction. ② an explicit `entityManager.refresh(entity)` at the call site — surgical, reuses the same managed reference, but every caller must remember to do it. ③ a JPQL update with explicit field assignment so Hibernate can route the change through the persistence context — only viable when the operation can be expressed without Postgres-specific functions (which `array_remove` cannot). The choice between ① and ② is the more general "do I optimise for safety-by-default or for explicit-and-fast" question that comes up repeatedly with custom modifying queries.

**What you'd skip and why:** Skip the bytecode-enhancement-based lazy loading until you understand why default lazy loading is sometimes insufficient; the feature is real but has surprising failure modes. Skip Envers (Hibernate auditing) — the project's V4 audit log already covers this conceptual ground in a more transparent way.

**Prerequisites:** Testcontainers (so every measurement runs against real Postgres).

---

## Apache Kafka (async audit log)

**What it is:** A distributed, append-only, partitioned log. Producers publish messages to topics; consumers read independently and at their own pace, tracked by a per-consumer-group offset. Kafka is the de-facto backbone for event-driven Spring Boot systems.

**Canonical use case in this project:** Refactor `AuditAspect` (the AOP advice currently synchronous in the request thread) so that instead of writing an `AuditLog` row directly via `AuditService`, it publishes an `AuditEvent` to a Kafka topic and returns immediately. A new `AuditConsumerService` reads the topic and persists rows asynchronously. The API surface and `/api/admin/audit-logs` UI do not change; the *behaviour change* is that the request thread no longer blocks on audit persistence, and the audit table can be rebuilt from the topic at any time.

**Learning value:** ★★★★★ — every modern Spring Boot system at scale uses some form of asynchronous event backbone, and Kafka is the dominant choice. The producer/consumer/serialiser/partition/offset mental model is reusable across RabbitMQ, AWS Kinesis, GCP Pub/Sub, Redis Streams, and NATS.

**Fit for this codebase:** ★★★★ — the audit log is a genuinely good first Kafka use case because the *visible* behaviour stays unchanged, isolating the concept. The fit is not ★★★★★ only because a single-broker, single-partition, single-consumer-group setup hides the most interesting Kafka properties (rebalancing, lag monitoring, replication factor). Acknowledge the limitation; don't pretend it scales the way production Kafka does.

**Verdict:** **Tier S.** Customer-project carryover is the deciding factor. Build it knowing it is a teaching scaffold.

**Key sub-concepts to explore:**
- **Producer semantics.** `acks=all` + idempotent producer = at-least-once with no duplicates on the broker side. Exactly-once requires Kafka transactions (`enable.idempotence=true` + transactional IDs); learn what it costs and why most systems do not need it.
- **Consumer groups and partition assignment.** A consumer group is the unit of horizontal scaling. Two consumers in the same group split the partitions; two consumers in different groups each see every message. Run two consumer instances locally and watch the rebalance log.
- **Schema Registry + Avro / Protobuf / JSON Schema.** Plain JSON in a topic is a contract waiting to break silently. A Schema Registry enforces versioned schemas with backward/forward compatibility rules. This is non-negotiable in any real-world Kafka deployment.
- **Dead-letter topics (DLT).** When a consumer fails repeatedly on a poisoned message, route it to a DLT so the partition does not block. Spring Kafka's `DeadLetterPublishingRecoverer` makes this declarative.
- **Idempotent consumers.** At-least-once delivery means consumers must be idempotent. The audit-log consumer can use the event ID as a Postgres unique constraint — a clean illustration of "make the consumer the place that enforces exactly-once at the business level".
- **Spring Kafka vs Spring Cloud Stream.** `spring-kafka` is the lower-level binding; Spring Cloud Stream abstracts over Kafka/Rabbit/Kinesis with a functional API. Know both exist; pick `spring-kafka` for first contact because the abstraction leak in Stream is more confusing than helpful for a first learner.

**What you'd skip and why:** Skip Kafka Streams and ksqlDB at first — they are a separate paradigm and easily double the time to learning. Skip MirrorMaker, multi-datacentre replication, and tiered storage entirely — they are operational concerns for a production cluster you do not have.

**Prerequisites:** none beyond Docker (already in place). Add a `kafka` and `schema-registry` service to `compose.yml`.

---

## OpenTelemetry + Prometheus + Grafana

**What it is:** OpenTelemetry (OTel) is a vendor-neutral instrumentation framework producing three signals: traces (request flows with spans), metrics (numeric aggregates), and logs. The Java agent instruments Spring, JDBC, Kafka, and HTTP clients automatically. Prometheus scrapes metrics; Grafana visualises both metrics dashboards and Jaeger/Tempo trace UIs.

**Canonical use case in this project:** Add the OTel Java agent to the `backend` container, run Jaeger + Prometheus + Grafana as Compose services, and instrument:
- Every HTTP endpoint (auto-instrumented) — see the full span tree of `GET /api/todos`, including the implicit JDBC spans for own todos, shared todos, and the customOrder array query.
- The Kafka producer in `AuditAspect` after V8 — the trace now spans process boundaries (HTTP request → producer span → consumer span → JDBC insert), making the multi-hop trace tree *finally* worth visualising.
- The `@PreAuthorize`/`AuditAspect` AOP layer — emit a custom span around `auditService.log` to see audit-write latency separated from business-logic latency.

**Learning value:** ★★★★★ — observability is the third pillar of operations (alongside CI and deployment). In customer projects, the question "why is this slow?" is the most common production question; OTel is the toolkit that answers it.

**Fit for this codebase:** ★★★★ — a single-service trace tree is shallow, so the value is muted until V8 (Kafka) adds a second hop. Even then, instrumenting a tiny app teaches the propagation model, exemplars, and the three-pillars view without a real-world distraction.

**Verdict:** **Tier S.** Land after V8 Kafka. The customer-project relevance dominates the local-fit hesitation.

**Key sub-concepts to explore:**
- **W3C TraceContext propagation.** The `traceparent` HTTP header carries the trace ID across services. Verify that the frontend's `fetch` calls propagate it (Vite dev tooling makes this visible) and that the Kafka producer/consumer span chain is intact.
- **The three pillars and their relationship.** Traces (per-request causal graph), metrics (aggregate time series), logs (point-in-time events). Exemplars — metric data points annotated with a trace ID — are the bridge: click a p99 spike on the Grafana panel, jump to the Jaeger trace for that exact slow request. This is the killer demo.
- **The OTel Collector.** A standalone process that receives telemetry, processes it (sampling, batching, attribute scrubbing), and exports to one or more backends. Routing the same data to Jaeger and an APM vendor with a config change is the "write once, export anywhere" lesson.
- **Sampling strategies.** Head-based (decide at the root span — cheap, lossy on rare-but-important traces) vs tail-based (decide after the trace is complete — captures errors and slow traces, requires the Collector). Know that both exist.
- **Micrometer + Spring Boot Actuator.** Spring Boot's metrics facade. Configure it to export OTLP and watch the JVM, HikariCP, HTTP, and Kafka metrics flow into Prometheus automatically.
- **RED method (Rate, Errors, Duration) and USE method (Utilisation, Saturation, Errors).** Two standard frameworks for what to dashboard. RED for request services, USE for resources. Build one Grafana dashboard with each.

**What you'd skip and why:** Skip building a custom backend (Honeycomb, Datadog, Lightstep) until you understand the open-source path. Skip log-shipping for now; the audit log already covers structured event capture.

**Prerequisites:** Kafka (V8) makes the trace tree multi-hop and the lesson visible.

---

## Resilience4j

**What it is:** A fault-tolerance library for Java providing Circuit Breaker, Retry, Rate Limiter, Bulkhead, and Timeout as composable decorators on method calls. Spring Boot autoconfigures all of them via annotations (`@CircuitBreaker`, `@Retry`, `@RateLimiter`) and exposes metrics to Micrometer automatically.

**Canonical use case in this project:** Once V8 (Kafka) and V11 (OAuth2 with an external IdP) are in place, the backend has real external calls that can fail or slow down:
- Wrap the Kafka producer publish call in `AuditAspect` with `@CircuitBreaker` + `@Retry`. Force-stop the Kafka broker and watch the circuit open after the failure threshold; the audit write falls back to a synchronous DB write or a local queue. Restart the broker; watch the half-open probe close the circuit.
- Wrap the OAuth2 token-endpoint call with `@Retry` (exponential back-off + jitter) and `@Bulkhead` (semaphore-bounded). Now a slow IdP cannot exhaust the request thread pool.

**Learning value:** ★★★★★ — every customer-project Spring Boot service talks to flaky downstreams. Every outage post-mortem includes some variant of "we should have had a circuit breaker". The patterns are the same across every language and framework; learning them once in Java pays off everywhere.

**Fit for this codebase:** ★★★★ — fit was ★★ before V8/V11, because the app currently has no external calls. After V8 (Kafka) and V11 (OAuth2 IdP), the fit becomes natural.

**Verdict:** **Tier S** *(after V8 and V11)*. Customer-project relevance is decisive.

**Key sub-concepts to explore:**
- **Circuit Breaker state machine.** CLOSED (calls pass through) → OPEN (calls fail fast) → HALF_OPEN (probe calls). Configure the sliding window (count- or time-based) and the failure rate threshold. Visualise state transitions in Grafana via the Micrometer-exported metrics.
- **Retry with exponential back-off + jitter.** Why pure exponential back-off across N instances causes a thundering herd; why jitter (randomised delay) prevents it. Surprising and important.
- **Bulkhead.** Thread-pool bulkhead vs semaphore bulkhead. The semaphore variant is lighter; the thread-pool variant gives you the isolation guarantee that one slow dependency cannot starve threads serving fast dependencies.
- **Timeout discipline.** Every blocking external call needs an explicit, opinionated timeout. The default in most clients is "wait forever" — this is wrong in production.
- **The composition order.** `@Retry(@CircuitBreaker(@Timeout(call)))` vs `@CircuitBreaker(@Retry(@Timeout(call)))` produce different behaviours. Resilience4j applies them in a documented order; understand the order before assuming.
- **Fallbacks.** A fallback is part of the resilience pattern, not an afterthought. Decide explicitly: degrade to cached value, return empty, or surface the error. The wrong fallback is worse than no fallback.

**What you'd skip and why:** Skip the reactive variants until WebFlux is in scope (Tier B). Skip the Cache module — `@Cacheable` from Spring Cache is more idiomatic.

**Prerequisites:** V8 Kafka and V11 OAuth2, so the protected calls actually exist.

---

## OAuth2 / OpenID Connect

**What it is:** OAuth2 is an authorisation framework letting a user grant a third-party application limited access to their account on another service without sharing their password. OpenID Connect (OIDC) is a thin identity layer on top of OAuth2 adding a standardised `id_token` for authentication.

**Canonical use case in this project:** Two parallel implementations, both illuminating:
1. **"Sign in with GitHub"** — the public-cloud version. Spring Security's OAuth2 Client autoconfig redirects to GitHub, handles the Authorization-Code-with-PKCE flow, exchanges the code for tokens, extracts claims, and issues a local session JWT. The current V3 hand-rolled JWT becomes the *target* of the OAuth flow, not the entry point.
2. **Local Keycloak in Compose.** A self-hosted IdP modelling the corporate-IdP pattern almost every customer project actually uses. Configure realms, clients, roles; map Keycloak roles to Spring authorities.

The current V3 `/api/auth/register` + `/api/auth/login` endpoints become "legacy local accounts"; new logins go through the OIDC flow.

**Learning value:** ★★★★★ — every non-trivial customer Spring Boot project integrates with a corporate IdP (Keycloak, Azure AD, Okta, Auth0, Ping). Knowing the protocol, not just the integration, distinguishes engineers who can debug "the login broke" from those who can only file tickets.

**Fit for this codebase:** ★★★★ — the existing V3 JWT auth is a literally perfect "before" picture: hand-rolled token issuance, hand-rolled claims extraction, hand-rolled `@PreAuthorize` mapping. Swapping it for the standard protocol is a clean, contained refactor.

**Verdict:** **Tier S.** High concept density per week of work.

**Key sub-concepts to explore:**
- **Authorization Code + PKCE flow.** The browser receives an authorisation code; the backend exchanges the code for tokens at the IdP's token endpoint. PKCE (Proof Key for Code Exchange) closes the code-interception attack vector for public clients. Trace the flow end-to-end in DevTools at least once — this is the single most clarifying exercise.
- **Token types: access, refresh, id.** Access token is sent with every API request (short-lived). Refresh token is held only by the client and used to obtain a new access token without re-login. `id_token` is identity proof for the client and is never sent to resource servers. Confusing these three is the most common OAuth2 mistake.
- **Scopes and the principle of least privilege.** Scopes (`read:user`, `repo`) are the user-visible permission grant. Design the application's scope vocabulary as a deliberate API decision, not an afterthought.
- **The `state` parameter and CSRF.** The `state` parameter passed in the authorisation request and verified on the callback is the CSRF token for the OAuth flow. Forgetting it is a real CVE shape.
- **JWT validation: signing keys, JWKS, key rotation.** The resource server fetches public signing keys from the IdP's JWKS endpoint and caches them. Key rotation works because the JWT carries a `kid` (key ID) header. Spring Security handles this; understand the mechanism in case it ever breaks.
- **Resource server vs client vs authorization server.** Three Spring Security autoconfigurations, three different sets of properties. Know which one each YAML key belongs to.

**What you'd skip and why:** Skip the implicit flow (deprecated). Skip the resource owner password credentials flow (deprecated). Skip writing your own IdP — the lesson is the protocol from the consumer side, not the provider side.

**Prerequisites:** none beyond the V3 baseline.

---

# Tier A — Do these, expect to stretch the use case

High learning value, moderate fit. The local todo app provides a serviceable but not perfect canvas; the concept is worth learning anyway because the carryover or the concept's intrinsic value justifies the manufactured scenario.

---

## Server-Sent Events (SSE)

**What it is:** A browser-native API (`EventSource`) for receiving a one-way stream of server-pushed events over a long-lived HTTP connection. Simpler than WebSockets, with no protocol upgrade, proxy-friendly, and natively supported by `SseEmitter` in Spring MVC and `Flux<ServerSentEvent<T>>` in WebFlux.

**Canonical use case in this project:** V6 introduced todo sharing. Currently, a recipient sees a shared todo only on their next page load. With SSE, `POST /api/todos/shares` triggers a push event to each recipient's open browser session; the React app appends the new todo to its list immediately. A toast notification ("Alex shared a todo with you") completes the UX.

**Learning value:** ★★★★ — long-lived connection semantics, server-side fan-out, reconnection-with-replay, and the SSE-vs-WebSocket-vs-long-polling trade-off matrix are reusable across every real-time UX problem.

**Fit for this codebase:** ★★★★ — the share notification is a *real* feature, not a manufactured one. The user-visible improvement is obvious; the implementation is non-trivial but contained.

**Verdict:** **Tier A.** Bundle as a V6.5 polish item once Kafka is in (V8 publishes the `TodoShared` event the SSE endpoint subscribes to).

**Key sub-concepts to explore:**
- **`SseEmitter` lifecycle.** Create, emit, complete, error. Handle client disconnect cleanly — failing to do so leaks emitters and slowly exhausts the thread pool.
- **Heartbeat frames.** Proxies and load balancers close idle connections after 30–60s. Send a comment-line heartbeat (`: ping`) every 15s to keep the connection alive without triggering client-side event handlers.
- **`Last-Event-ID` replay.** The browser automatically reconnects after a dropped connection and sends the ID of the last event it received. The server can replay any events the client missed. Combine with a small in-memory ring buffer keyed by user.
- **Per-user fan-out.** A `ConcurrentMap<Long, List<SseEmitter>>` indexed by user ID. When `TodoShared` fires, look up the recipient's emitters and broadcast. This is the structural pattern; it generalises to any per-tenant push.
- **SSE vs WebSocket vs long-polling.** SSE: one-way, HTTP/1.1-compatible, simple. WebSocket: bidirectional, upgraded TCP, more complex, sometimes blocked by proxies. Long-polling: works everywhere, wasteful. Know the table.

**What you'd skip and why:** Skip the WebFlux/Reactor port until Tier B. Skip clustering (multi-instance SSE) until there is a real multi-instance deployment to cluster — at single-replica scale, the simple per-instance map is correct.

**Prerequisites:** V8 Kafka (so the consumer can fan out across multiple backend replicas in the future without coupling shares to a specific instance).

---

## Redis (cache-aside + pub/sub invalidation)

**What it is:** An in-memory key-value store commonly used as a cache, a message broker, and a session store. The cache-aside pattern uses `@Cacheable` to short-circuit a DB read on cache hit and `@CacheEvict` on mutation to keep the cache consistent. Redis Pub/Sub adds the multi-instance dimension: a write on replica A publishes an invalidation to all replicas, so replica B does not serve stale data.

**Canonical use case in this project:** Cache `GET /api/todos` per user, keyed by `(userId, sortMode, customOrderHash)`. Every successful `POST/PATCH/DELETE /api/todos*` evicts the affected user's key. Multiplicate the backend to two replicas in Compose; demonstrate that without pub/sub invalidation, replica B serves stale todos after a write on replica A. Add the pub/sub channel; the staleness disappears.

**Learning value:** ★★★★ — caching and cache invalidation are core to any read-heavy Spring Boot service. The right answer changes with the access pattern (write-through, write-back, cache-aside, refresh-ahead); knowing the menu is the skill.

**Fit for this codebase:** ★★★★ — the local workload is light, so the cache hit ratio will be theatrical, but the *patterns* (key design, TTL choice, eviction policy, invalidation strategy, multi-instance coherence) transfer directly.

**Verdict:** **Tier A.** Land after Spring Modulith (V16) so module-scoped cache namespaces are a natural design.

**Key sub-concepts to explore:**
- **`@Cacheable`/`@CacheEvict`/`@CachePut` and the key-generation contract.** Custom `KeyGenerator`s when method parameters do not uniquely identify the cache entry. The most common bug is two methods sharing a cache name but using incompatible key shapes.
- **TTL and eviction policies.** `allkeys-lru`, `allkeys-lfu`, `volatile-ttl`. Pick deliberately based on the access pattern; the default is rarely the right answer for a real workload.
- **Cache stampede.** When a hot key expires under high concurrency, every request that misses simultaneously re-computes the same value. Single-flight (Redis lock + recompute-once) and probabilistic early expiration are the two standard fixes.
- **Redis Pub/Sub vs Redis Streams.** Pub/Sub is fire-and-forget (no replay, no consumer groups). Streams is a durable log similar to Kafka (replay, consumer groups, at-least-once). Know when each is appropriate.
- **Sorted sets, hashes, bitmaps.** Redis is more than a KV store. Sorted sets for priority queues and leaderboards, hashes for object storage, bitmaps for daily-active-user counting. Worth a tour.
- **Persistence: RDB snapshots vs AOF.** Snapshots are fast but lose data on crash; AOF logs every write and replays on restart. The wrong choice is the difference between "Redis lost all our data" and "Redis is slow on restart".

**What you'd skip and why:** Skip Redis Cluster — the local app does not need sharding. Skip Redis Sentinel — there is no HA story to test against. Skip Redis as a session store — JWT auth makes it irrelevant here.

**Prerequisites:** V8 Kafka (so the pub/sub story is contrasted against Kafka's durability story side-by-side).

---

## Feature Flags (OpenFeature + a backend like Unleash or GrowthBook)

**What it is:** A configuration mechanism that gates code paths behind named flags evaluated at runtime against user, environment, or rollout-percentage attributes. OpenFeature is the vendor-neutral SDK standard; Unleash, GrowthBook, LaunchDarkly, ConfigCat are providers.

**Canonical use case in this project:** Gate V6 sharing behind `todo-sharing-enabled`. Roll it out to 10% of users first, then 50%, then 100%. Add a kill switch `audit-logging-enabled` so an oncall can disable audit writes from a UI without redeploying. Use targeting rules to enable an experimental sort mode for one user (`username == "alex"`).

**Learning value:** ★★★★ — progressive delivery (canary, cohort, rollout-percentage) is the deployment discipline distinguishing mature engineering organisations. Decoupling deploy from release is one of the highest-leverage concepts in the space.

**Fit for this codebase:** ★★★★ — small implementation cost, immediately useful for any new feature after V6. Demotes the V19 throwaway mention in the original doc to a proper Tier A entry.

**Verdict:** **Tier A.**

**Key sub-concepts to explore:**
- **Flag types: boolean, string, number, JSON.** Each unlocks different patterns. Boolean for kill switches, string for variant selection (A/B), JSON for richer per-tenant configuration.
- **Targeting rules and attribute context.** Pass user attributes (`userId`, `role`, `email`, custom segments) as part of evaluation context. The evaluation happens at flag-check time, not at sign-in time.
- **Cohort-based rollout vs percentage rollout.** Hashed user ID modulo 100 with a stable hash gives deterministic percentage rollout: user X is either always in or always out, never flapping between requests.
- **Flag debt.** Long-lived flags become technical debt. Tag flags as "experiment" (expected to be removed) vs "operational" (kill switch, permanent). Schedule cleanups.
- **Backend-evaluated vs client-evaluated flags.** Client-evaluated (rules shipped to the browser) is faster but leaks targeting logic. Backend-evaluated is private but adds latency. Mix as appropriate.
- **OpenFeature provider abstraction.** The point of OpenFeature is that you can swap Unleash for GrowthBook for LaunchDarkly without touching the call sites. Code against the SDK, not the vendor.

**What you'd skip and why:** Skip multivariate experimentation and statistical significance testing — that's an A/B platform, not a flag system. Skip building your own backend; pick one provider for the lesson.

**Prerequisites:** none.

---

## Spring Modulith

**What it is:** A Spring project that lets you express module boundaries inside a Spring Boot monolith, enforce them with build-time checks (ArchUnit-backed), and observe module-to-module interactions at runtime. Each top-level package becomes a module; cross-module calls are restricted to a module's published API.

**Canonical use case in this project:** Reorganise `com.todo.*` into modules: `auth` (registration, login, JWT), `todos` (CRUD), `audit` (aspect, logs, search), `users` (admin), `sharing` (V6 share, reorder). Each module exposes a small API; internal classes are package-private. Cross-module communication switches from direct service calls to Modulith's `ApplicationEventPublisher` for the genuinely async edges (e.g. `TodoCreated` event consumed by `audit`).

**Learning value:** ★★★★ — the *bounded-context* lesson is the most useful import from Domain-Driven Design and the conceptual basis for hexagonal architecture. Spring Modulith teaches it without the rewrite cost of full hexagonal. Carryover to the customer project's hexagonal architecture is real, even though the implementation differs.

**Fit for this codebase:** ★★★★ — the existing `controller/service/repository/aspect` package layout is the textbook anti-pattern Modulith corrects. The current cross-cutting nature of `AuditService` is the perfect "before" picture.

**Verdict:** **Tier A.**

**Key sub-concepts to explore:**
- **Module API surfaces.** A module exposes a `package-info.java` or public classes in its root package; everything else is package-private. The dependency graph between modules becomes inspectable and testable.
- **`@ApplicationModuleListener`.** A transactional, async event listener that ties module-to-module communication to the publishing transaction's commit, not its start. Critical detail.
- **Module verification tests.** `ApplicationModules.of(Application.class).verify()` fails the build if a module reaches into another module's internals. Architecture-as-test, not architecture-as-comment.
- **Generating module documentation.** Modulith can generate PlantUML diagrams of module dependencies as part of the build. Useful for keeping docs honest.
- **Comparison with hexagonal.** Modulith is "modules with enforced boundaries". Hexagonal is "modules with a specific shape: domain core, inbound ports, outbound ports, adapters". Modulith is a stepping stone; the customer project gets the full pattern.
- **Module-scoped persistence.** Each module owns its tables; cross-module reads go through the module's API, not direct repository access. This forces the database to respect the module graph too.

**What you'd skip and why:** Skip splitting into actual JARs/modules at the Maven level — that is a packaging change with its own concerns and is not the lesson. Skip the full hexagonal refactor; Modulith is the deliberate sub-step.

**Prerequisites:** none, though it works best after V8 Kafka (the event-driven module boundary becomes natural).

---

## Pact / Consumer-Driven Contract Testing

**What it is:** A testing technique where the API consumer (frontend) records the exact requests it sends and responses it expects as a JSON contract file. The provider (backend) runs a verifier that replays those expectations against the real implementation. The Pact Broker stores and versions contracts and tracks compatibility between consumer and provider versions.

**Canonical use case in this project:** The current test stack has a real gap at the service boundary. Frontend Vitest tests mock `api.ts` and never call the real backend. Backend `@WebMvcTest` tests have no consumer expectations. If the backend renames `dueDate` to `due_date`, neither suite fails — the mismatch surfaces only in Playwright E2E or in production. Add a Pact test on the frontend side recording the expected shape of `GET /api/todos`, `POST /api/todos`, etc.; verify it on the backend CI job.

**Learning value:** ★★★★ — contract testing closes the most common test-pyramid gap (the seam between consumer and provider) and is the boundary-testing technique of choice in microservice organisations. Even when you have one consumer and one provider today, the *pattern* is reusable.

**Fit for this codebase:** ★★★ — the value is muted by having a single consumer and a single provider, but the diagnosis (silent contract drift) is real. The test *architecture* is the lesson more than the test value.

**Verdict:** **Tier A.** Land late in the sequence (V17), after the API surface is stable enough that contract churn does not dominate.

**Key sub-concepts to explore:**
- **The Pact Broker.** The single source of truth for which consumer version expects which provider version. Enables the "can I deploy?" query: is there a compatible provider version already in production?
- **Pending pacts and WIP pacts.** A pending pact can fail provider verification without failing the build, letting a consumer publish expectations for a not-yet-implemented feature. This unlocks the "publish contract first, then implement provider" workflow.
- **Provider state.** Before verifying a consumer expectation that requires data ("given two todos exist, GET /api/todos returns them"), the provider must set up that state. Provider state handlers are the seam.
- **Comparison with OpenAPI/Schemathesis.** OpenAPI is provider-driven (here is what I produce); Pact is consumer-driven (here is what I need). Both have value; Pact catches consumer-specific mismatches that the OpenAPI spec might technically permit.
- **Comparison with E2E tests.** Pact verifies the *boundary contract* without a browser, in milliseconds; Playwright verifies the *user journey* through a browser, in seconds. Both are needed; neither substitutes for the other.

**What you'd skip and why:** Skip Pact's bi-directional mode (verifying OpenAPI as consumer-driven contract) until the basic CDC flow is internalised. Skip multiple-language consumers — there is only one consumer (the React frontend) here.

**Prerequisites:** A stable API surface (V11+). Earlier than that, contract churn dominates the value.

---

## Spring Batch

**What it is:** A Spring framework for batch processing: jobs composed of steps, each step a `Reader` → `Processor` → `Writer` chunk-oriented pipeline. Restartable, skip/retry policies, parallel-step execution, job metadata persistence, scheduling integration.

**Canonical use case in this project:** Two synthetic but realistic jobs:
1. **Nightly per-user todo statistics.** A job reads all `(user_id, todo_count, completed_count, overdue_count)` aggregates, writes to a new `todo_stats` table or Redis hash. The admin panel reads from the snapshot rather than recomputing on every request.
2. **Mass re-index after schema change.** When V12 Elasticsearch (Tier B, gated) lands, the backfill job is a Spring Batch job: read every `todos` row, transform to the Elasticsearch document shape, bulk-index. Restartable from the last checkpoint if it fails halfway.

**Learning value:** ★★★★ — "lots of data" almost always implies batch jobs: nightly aggregation, bulk import/export, reconciliation, data migrations, archival. Spring Batch is *the* JVM answer; the chunk-oriented mental model transfers directly to Spark, Flink, and AWS Glue.

**Fit for this codebase:** ★★★ — no batch surface exists today, so the use cases above are synthetic. The synthesis is plausible enough not to feel forced.

**Verdict:** **Tier A.**

**Key sub-concepts to explore:**
- **Chunk-oriented processing.** Items are read one by one, processed one by one, then written in batches of N. Tune the chunk size; observe the trade-off between memory and transaction overhead.
- **Job metadata schema.** Spring Batch persists `BATCH_JOB_INSTANCE`, `BATCH_JOB_EXECUTION`, `BATCH_STEP_EXECUTION` tables. These power restartability. Look at the rows after a job run.
- **Restartability.** A failed job can resume from the last successful chunk. Identify the conditions under which restart is safe vs unsafe (idempotent writers vs not).
- **Skip and retry policies.** Skip bad records with `SkipPolicy`, retry transient failures with `RetryPolicy`. Combine carefully; a permissive skip policy hides data quality issues.
- **Partitioned and remote-chunking steps.** For genuinely large data, split a step across threads (partitioned) or across machines (remote chunking). Know they exist; do not implement until needed.
- **Scheduling vs triggering.** Quartz, `@Scheduled`, or an external scheduler (Airflow, Kubernetes CronJobs). Each has trade-offs; the right choice depends on the deployment environment.

**What you'd skip and why:** Skip remote chunking and partitioned steps for first contact. Skip Spring Cloud Data Flow — it is an orchestration layer above Batch, useful only at organisational scale.

**Prerequisites:** none, though it pairs well with V12 Elasticsearch (Tier B) for a real bulk-index use case.

---

# Tier B — Weak fit today; named upgrade path

These are valuable concepts that the current codebase does not naturally motivate. Each entry includes an explicit **"What would have to change to upgrade the fit"** section: the precise codebase change that promotes the concept from "decorative exercise" to "natural fit". Do not force these in isolation; revisit each when its trigger lands.

---

## CQRS + Event Sourcing

**What it is:** CQRS (Command Query Responsibility Segregation) separates the write path (commands that mutate state) from the read path (queries that return data). The two sides may use different models and different data stores, scaling independently. Event Sourcing stores the append-only log of events that produced an entity's state rather than the current state itself; current state is a projection of that log.

**Canonical use case in this project:** Build a small projection from the V4 audit log: a `todo_history` read store (Postgres view or materialised view) that, for each todo, lists every state transition with timestamp and actor. The write side is unchanged; the read side gains a new query target the existing `todos` table cannot answer.

**Learning value:** ★★★★ — temporal queries ("what was the state at 2pm last Tuesday?"), perfect auditability, and the read/write asymmetry are all important architectural ideas. Connects naturally to Kafka (the topic *is* the event log) and to the customer project's heavy-data context.

**Fit for this codebase:** ★★ — the `todos` table has six columns and the read pattern is essentially "give me all my todos". Optimising reads and writes differently is decorative when both sides want the same shape. Event Sourcing on top of the audit log is a *toy*; CQRS as an architectural choice is unmotivated.

**Verdict:** **Tier B.** Build the toy ES projection as an exercise; defer full CQRS.

**What would have to change to upgrade the fit:**
- Introduce a feature that creates genuine read/write asymmetry. Examples: an analytics view ("todos per user per week, with average completion time, top 5 sharers") that requires a denormalised pre-joined store; a search view that needs free-text ranking; a feed view ("activity feed across all your shared todos and their state changes").
- Once that read store materially differs in shape from the write store, CQRS stops being decorative.
- Combine with V8 Kafka: every command produces a `TodoCreated`/`TodoCompleted`/`TodoShared` event; multiple consumers project into different read stores (Postgres MV, Redis, Elasticsearch). Now CQRS has at least three faces and the pattern is unambiguous.

**Key sub-concepts to explore:**
- **Projections and snapshots.** Replay the full event log to materialise current state; checkpoint with periodic snapshots so the replay does not run from the dawn of time on every restart.
- **The reconciliation problem.** Event-sourced systems must converge to a state matching the events. When projections lag or diverge, the rebuild-from-events is the recovery primitive. Practice it once.
- **Idempotent projections.** Consumers must tolerate replays. Most events carry an `eventId` used as a primary or unique key in the projection.
- **The complexity tax.** Event Sourcing makes every write path richer, every read path require a projection, and every schema change require an upcaster. The lesson is: do not adopt this lightly. Frame the trade-off explicitly.

**What you'd skip and why:** Skip Axon Framework and Eventuate at first — they are large frameworks that obscure the underlying pattern. Build the toy projection by hand with `spring-kafka` and JdbcTemplate so the moving parts stay visible.

**Prerequisites:** V8 Kafka. The projection consumer is a Kafka consumer.

---

## GraphQL + DataLoader

**What it is:** GraphQL is a query language for APIs where clients specify exactly which fields they need; the server returns only those. DataLoader is a batching/caching layer between resolvers and the data source, solving the N+1 problem that GraphQL otherwise amplifies.

**Canonical use case in this project:** Expose the existing REST surface as a GraphQL endpoint via `spring-boot-starter-graphql`. A single query `{ me { sortMode, todos { id, text, sharedBy { username } } } }` replaces three REST calls (`/api/users/me`, `/api/todos`, plus the implicit user-lookup for `sharedBy`).

**Learning value:** ★★★★ — GraphQL is a paradigm shift worth understanding (schema-first design, field-level resolvers, subscriptions). DataLoader's batching pattern is one of the most important performance ideas in any query-amplifying API. The schema/introspection model is also where GraphQL outshines OpenAPI for exploration.

**Fit for this codebase:** ★★ — with 5 entities and a small REST surface, the over-fetching and under-fetching pain GraphQL solves does not really exist here. The same N+1 lesson can be taught equally well in REST with JPA fetch joins. Building a GraphQL endpoint over this schema is performative.

**Verdict:** **Tier B.** Worth doing for the paradigm exposure if the upgrade condition below is met.

**What would have to change to upgrade the fit:**
- Add a UI surface that composes data from multiple aggregates per view. The clearest candidate is an admin dashboard combining `user → todos → audit-events → shares` in one render, where the current REST approach would fire 5+ calls and the frontend would assemble the view manually.
- Add a mobile or third-party consumer with different field needs than the web frontend. Two consumers with diverging needs is where GraphQL's "client decides the shape" stops being theoretical.
- Once either lands, BFF-style query composition has a real motivator and DataLoader has visible N+1 to batch.

**Key sub-concepts to explore:**
- **Schema-first design.** The `.graphqls` schema is the source of truth; resolvers implement it. Contrast with code-first (Java annotations generate the schema). Schema-first plays better with multi-team workflows.
- **DataLoader's scheduler.** Calls to `load(id)` within one event-loop tick are batched into a single resolver call. Per-request cache prevents cross-user pollution. This is the conceptual core of DataLoader.
- **Subscriptions over WebSocket.** GraphQL subscriptions push events to the client using the same query language as queries/mutations. The GraphQL-native answer to SSE; would replace the V9 SSE work if GraphQL were the API style.
- **N+1 inside REST too.** The same problem occurs when a REST serialiser iterates a list and calls `userRepository.findById` per item. DataLoader makes the anti-pattern visible; the lesson generalises.
- **Persisted queries.** Client sends a hash of the query; server looks up the full query. Reduces payload, enables CDN caching, restricts the query surface to a pre-registered allowlist.
- **Federation.** Each microservice owns its schema slice; a gateway composes them. Production approach for large API meshes. Know it exists.

**What you'd skip and why:** Skip federation (no second service). Skip GraphQL subscriptions if V9 SSE is already in place — the conceptual ground overlaps.

**Prerequisites:** the multi-aggregate UI named in the upgrade path.

---

## Spring WebFlux + Project Reactor

**What it is:** Spring's reactive web framework built on Project Reactor. Handlers return `Mono<T>` (zero or one) or `Flux<T>` (zero to N). The JVM handles I/O on a small, fixed thread pool without blocking — threads are released while waiting for I/O and reassigned when results arrive.

**Canonical use case in this project:** Port the V9 SSE endpoint from `SseEmitter` (imperative) to `Flux<ServerSentEvent<T>>` (reactive). Optionally port the read-heavy `GET /api/todos` to WebFlux + R2DBC. Both isolate the reactive concept without rewriting the whole app.

**Learning value:** ★★★ — reactive programming is a genuine paradigm shift and the foundation of Node, async Python, and Java virtual threads. The mental model (backpressure, cold vs hot publishers, operator semantics) is important. The rating is ★★★ rather than ★★★★ because **Java 21+ virtual threads now solve the thread-per-request scaling problem without giving up imperative code**, eroding WebFlux's primary motivation.

**Fit for this codebase:** ★★ — no thread-pool exhaustion exists at this scale, and there is no real measurable "before" picture. Porting working imperative code to reactive purely to learn the paradigm risks cargo-culting.

**Verdict:** **Tier B.** Read the docs, run one tutorial; do not refactor the app.

**What would have to change to upgrade the fit:**
- V9 SSE in place with many concurrent subscribers (hundreds+).
- A slow downstream (Kafka publish, external HTTP call to the IdP, Elasticsearch query) invoked per request.
- A measurement showing thread-pool saturation under load (Micrometer's `executor.active` metric pinned at max). At that point the WebFlux port has a real, measurable starting point.
- Alternatively, if the customer project is reactive, do it there — the carryover is the only reason to invest here.

**Key sub-concepts to explore:**
- **Backpressure.** A consumer signals to a producer how many items it can handle. Without it, a fast producer feeding a slow consumer either buffers indefinitely (OOM) or drops messages. The fundamental problem reactive streams solve.
- **Cold vs hot publishers.** A cold `Flux` (a DB query) starts producing data from the beginning on each subscription. A hot `Flux` (an SSE event stream) emits regardless of subscribers. Understanding this prevents "why am I running duplicate queries?" confusion.
- **`flatMap` vs `concatMap` vs `flatMapSequential`.** `flatMap` eager-parallel (unordered), `concatMap` sequential (ordered, serial), `flatMapSequential` parallel-with-ordering. Picking the wrong one is a common bug.
- **R2DBC vs JDBC.** Reactive Postgres driver. Useful only if the rest of the chain is also reactive — mixing R2DBC and JDBC in the same handler defeats the point.
- **Virtual threads as the alternative.** Java 21 virtual threads + structured concurrency give you "lots of concurrent I/O on cheap threads" with imperative code. Often the better answer for new Spring Boot 3.2+ projects. Frame WebFlux and virtual threads as the two paths.

**What you'd skip and why:** Skip a full app rewrite. Skip combining WebFlux with JDBC blocking calls (defeats the model). Skip RxJava 3 — Reactor is what Spring uses.

**Prerequisites:** the SSE feature from V9 plus a measured saturation condition.

---

## Kubernetes

**What it is:** A container orchestration system managing deployment, scaling, and self-healing of containerised applications across a cluster of nodes.

**Canonical use case in this project:** Spin up a local `kind` or `minikube` cluster, write Deployments + Services + ConfigMaps + Secrets + Ingress manifests for backend, frontend, and Postgres. Deploy with `kubectl apply -f`, then with Helm. Practice `kubectl rollout undo`.

**Learning value:** ★★★★ — K8s is the production deployment standard. The manifest model, the controller-loop reconciliation pattern, and the operational primitives (HPA, RBAC, network policies) are reusable across every cloud vendor's managed offering.

**Fit for this codebase:** ★★ — Docker Compose already covers local development. K8s without a real deployment target teaches the manifests but not the operational reality (rolling updates under traffic, eviction during node maintenance, HPA reacting to real load, RBAC enforced against real users). The lesson is rote without that context.

**Verdict:** **Tier B.** Do not force this; learn out-of-band via Kubernetes-the-hard-way or a paid course until the trigger below is met.

**What would have to change to upgrade the fit:**
- A real (even cheap) cloud cluster: managed K8s on AWS/GCP/Azure, or a self-hosted k3s on a VPS, with the app actually receiving traffic from outside `localhost`. Concretely: a public DNS record pointing at a load balancer, real users, real logs.
- Once that exists, HPA, rolling updates, blue/green, canary, RBAC, network policies all have real consequences and the learning compounds.
- Pairs with Terraform (below): provisioning the cluster *with* Terraform doubles the lesson.

**Key sub-concepts to explore:**
- **Pods, Deployments, ReplicaSets, Services.** The core abstraction stack. Understand how a Deployment owns ReplicaSets, ReplicaSets own Pods, and how Services route traffic to Pods.
- **ConfigMaps and Secrets.** Configuration injected as env vars or mounted files. Secrets are *not* encrypted at rest by default; understand the difference between "obscured" and "encrypted".
- **Ingress and the Ingress controller.** The Ingress resource is declarative; an Ingress controller (NGINX, Traefik, Contour, Istio) actually routes the traffic. Two-layer abstraction.
- **Helm charts.** Parameterised YAML templates; the K8s package manager. The `values.yaml` indirection is the right place for environment-specific overrides.
- **Horizontal Pod Autoscaler.** Scales replica count based on CPU or custom metrics. With Prometheus and Micrometer (V9), HPA on a custom metric (e.g. queue depth) is the natural next step.
- **`kubectl rollout undo`.** The production rollback primitive. Practice it. Knowing it exists is the difference between a calm incident response and a panicked one.

**What you'd skip and why:** Skip Operators and CRDs at first — they are a separate paradigm. Skip service meshes (Istio, Linkerd) until basic ingress is internalised.

**Prerequisites:** the cloud-cluster trigger above. Pairs with Terraform.

---

## Terraform

**What it is:** An Infrastructure-as-Code tool that provisions cloud resources declaratively via `.tf` files. The `terraform plan` / `terraform apply` workflow mirrors PR review for infrastructure.

**Canonical use case in this project:** A `main.tf` provisioning a managed Postgres instance, a small compute resource (EC2 / GCE / Azure VM or a managed K8s cluster), a load balancer, security groups, and DNS. The Docker images built in CI deploy to that infrastructure.

**Learning value:** ★★★★ — declarative infrastructure, state management, drift detection, and the plan/apply discipline are reusable across AWS CDK, Pulumi, Bicep, and Crossplane. The mental model is more important than Terraform-the-tool.

**Fit for this codebase:** ★★ — Terraform without a cloud account to provision against is syntax practice. No-ops are not the lesson.

**Verdict:** **Tier B.** Strongly gated.

**What would have to change to upgrade the fit:**
- A chosen cloud vendor and an active account. Even a free-tier AWS or a cheap Hetzner setup is enough.
- A commitment to deploy *this* app to *that* cloud, so the Terraform code does something visible and breakable.
- Pairs with Kubernetes (above): provisioning a managed K8s cluster with Terraform, then deploying the app onto it, is the natural double-feature.

**Key sub-concepts to explore:**
- **Remote state with locking.** State stored in S3 + DynamoDB (or GCS + native locking, or Terraform Cloud). Prevents two engineers from applying conflicting changes simultaneously.
- **Workspaces or root modules per environment.** `staging` and `prod` from the same codebase. Workspaces are simple but limited; separate root modules with shared modules are usually better for non-trivial cases.
- **Modules.** Reusable units, the analogue of functions. The public Terraform Registry has battle-tested modules for almost any common resource.
- **`plan` vs `apply` discipline.** Always read the plan. Always. Drift between plan and apply means someone changed the cloud out-of-band; investigate before you re-apply.
- **Imports and refactoring.** `terraform import` brings an existing resource under management. `moved {}` blocks let you refactor module structure without destroying and recreating.
- **The state-as-secret problem.** State files contain secrets (DB passwords, IAM credentials). Treat the state backend as a secret store.

**What you'd skip and why:** Skip Terragrunt at first; learn vanilla Terraform first to know what Terragrunt is fixing. Skip Sentinel/OPA policy enforcement until the basic workflow is internalised.

**Prerequisites:** cloud account, deployment target. Pairs with K8s.

---

## Elasticsearch (or OpenSearch)

**What it is:** A distributed full-text search engine built on Apache Lucene. Documents are indexed; queries are scored by relevance using BM25; results return ranked by score.

**Canonical use case in this project:** Once Kafka (V8) is in place, every `TodoUpdated` and `AuditCreated` event is consumed by an indexer that maintains an Elasticsearch index. The admin audit log search switches from Postgres `LIKE` to Elasticsearch, gaining relevance ranking, faceting (counts by action type, by user, by day), and millisecond latency on large corpora.

**Learning value:** ★★★ — inverted indexes, BM25 scoring, the read-replica/derived-data pattern, and `_bulk` indexing are reusable concepts. The rating is ★★★ rather than ★★★★ because the *specific* problems Elasticsearch solves (relevance ranking, faceting, full-text) are not always present in customer projects; "lots of data" alone is not enough to need Elasticsearch.

**Fit for this codebase:** ★★ — no search problem exists today. The audit-log filter is functional with Postgres. Adding Elasticsearch is performative until a relevance-ranking requirement appears.

**Verdict:** **Tier B.** Excellent gateway concept for CQRS-style derived data; do not adopt without the trigger.

**What would have to change to upgrade the fit:**
- A user-visible feature requiring ranked text search. Examples: cross-user audit search with relevance ("show me audit entries about password resets, most-recent-most-relevant"); todo full-text search across the share graph; an admin tag system with autocomplete and faceting.
- Once the feature requires "best matches first" rather than "all matches sorted by timestamp", BM25 and inverted indexes have a real motivator.
- Pairs naturally with Kafka (V8): events drive the indexer; bulk re-index is a Spring Batch job (V15).

**Key sub-concepts to explore:**
- **Inverted index, term frequency, document frequency.** Why prefix search is effectively O(1) regardless of corpus size, vs the full-table scan a `LIKE '%term%'` implies in Postgres.
- **BM25 scoring.** The algorithm that ranks "todo about meeting" higher for query `meeting` than "todo mentioning meeting once in passing". Tune the parameters; observe the effect on ranking.
- **Mappings, analyzers, tokenisers.** How a document becomes a set of indexed terms. The default standard analyzer is often wrong for production; multilingual analyzers, edge-ngram for autocomplete, keyword vs text fields all matter.
- **`_bulk` API and refresh interval.** Indexing is async; documents are not immediately searchable. Tune `refresh_interval` for the throughput-vs-freshness trade-off.
- **Index aliases for zero-downtime reindex.** Write to `todos-write`, read from `todos-read`. Atomically swap aliases after a reindex. The production-grade reindex pattern.
- **Comparison with Postgres full-text search.** `tsvector`/`tsquery` covers many use cases at a fraction of the operational cost. The point of Elasticsearch is the relevance-ranking, faceting, and scale-out story; if you only need basic full-text, stay in Postgres.

**What you'd skip and why:** Skip running a real cluster — single-node ES is fine for learning. Skip ELK-stack log shipping; OTel covers observability better. Skip Logstash entirely; Beats are obsolete in this stack.

**Prerequisites:** Kafka (V8), Spring Batch (V15) for the backfill, plus the user-visible search feature named above.

---

# Tier C — Defer indefinitely

The upgrade cost outweighs the learning at this app's scale. Read about these out-of-band; revisit when the trigger condition lands for an independent reason.

---

## gRPC

**What it is:** A high-performance RPC framework using Protocol Buffers for binary serialisation over HTTP/2. Generates type-safe client and server stubs in Java, TypeScript, Go, Python, and a dozen other languages from a single `.proto` file. Supports unary, server-streaming, client-streaming, and bidirectional-streaming interaction modes.

**Canonical use case in this project:** None natural. The hypothetical would be: split the audit subsystem into its own service. The main backend publishes audit events to the audit service via a gRPC unary call (or, more idiomatically, a Kafka topic the audit service consumes). The split is engineered to motivate gRPC, which inverts the cost/benefit.

**Learning value:** ★★★★ — Protocol Buffers, the four streaming modes, the HTTP/2 multiplexing model, and the contract-first generated-stub workflow are reusable concepts. The carryover to customer projects depends entirely on whether the customer uses gRPC; many do not.

**Fit for this codebase:** ★ — there is no second service. Engineering a service split purely to learn gRPC is the worst kind of resume-driven development.

**Verdict:** **Tier C.** Skip until the trigger below lands for an independent reason.

**What would have to change to upgrade the fit:**
- An actual service split, motivated by an independent reason (team ownership, deployment cadence, scale isolation). Example: the audit subsystem grows into its own service with its own database, owned by a different team.
- A second consumer language (Python data pipeline, Go background worker). gRPC's polyglot stub generation shines when you have polyglot consumers.
- Until then: read the gRPC docs, run one `.proto` tutorial, watch a CNCF talk on the four streaming modes. That is enough exposure without committing to the framework.

**Key sub-concepts to explore (when the trigger lands):**
- **The four streaming modes.** Unary, server-streaming, client-streaming, bidirectional. The latter three are the actual differentiator vs REST.
- **Protocol Buffer schema evolution.** Field numbers, optional vs required, reserved fields, the wire-compatibility rules.
- **gRPC-Web.** The browser-compatible variant; needs an Envoy or gRPC-Web proxy. Not first-class — REST + JSON is usually the right answer for a browser client.
- **Deadlines and cancellation propagation.** First-class in gRPC, awkward in REST.
- **Service mesh integration.** Istio/Linkerd offer mTLS, retries, circuit-breaking at the mesh layer for gRPC calls. Operational pattern at scale.

**What you'd skip and why:** Skip building anything until there is a second service.

**Prerequisites:** the service split named above.

---

# Re-derived sequencing

Docker Compose and CI are already in place, so V7 starts further along than the original document assumed. The sequencing below is built from the verdicts above, with explicit prerequisite arrows.

```
V7  — Testcontainers + JPA / Hibernate performance tuning
       Why first: highest-carryover Tier S items, zero infrastructure dependencies.
       Outcome:   integration tests run against real Postgres; the existing repository
                  becomes a measurement target for N+1 / fetch strategies / projections.

V8  — Apache Kafka (async audit log refactor)
       Why next:  the first event-driven use case; unlocks OTel multi-hop traces (V9),
                  Resilience4j (V10), CQRS projection (V18), Elasticsearch indexer (Tier B).
       Outcome:   AuditAspect publishes; AuditConsumerService persists. API behaviour unchanged.

V9  — OpenTelemetry + Prometheus + Grafana
       Why now:   Kafka added a second hop; the trace tree is finally worth visualising.
       Outcome:   full-request trace from HTTP through JDBC through Kafka producer to
                  AuditConsumer JDBC insert. RED-method dashboards.

V10 — Resilience4j
       Why now:   the Kafka producer in V8 is the first real external dependency that
                  can fail or slow down.
       Outcome:   circuit breaker + retry + bulkhead protecting the Kafka publish.
                  Will protect OAuth2 token endpoint in V11.

V11 — OAuth2 / OIDC ("Sign in with GitHub" + local Keycloak in Compose)
       Why now:   high concept density, contained refactor, the V3 hand-rolled JWT
                  is the perfect "before" picture.
       Outcome:   OAuth2 Client autoconfig replaces hand-rolled login. Two IdPs
                  (public + local) demonstrate the protocol from both ends.

V12 — Server-Sent Events (share notifications)
       Why now:   first user-facing real-time feature; small surface, real UX gain.
       Outcome:   recipient sees the share toast immediately, not on next reload.

V13 — Redis cache-aside + Pub/Sub invalidation
       Why now:   GET /api/todos is the natural cache target; multi-replica deployment
                  motivates pub/sub invalidation.
       Outcome:   measurable hit ratio; cache stays coherent across replicas.

V14 — Feature Flags (OpenFeature)
       Why now:   small implementation, high concept density. Gates V13 cache rollout
                  and any subsequent feature.
       Outcome:   percentage rollout, kill switches, targeting rules all wired in.

V15 — Spring Batch (nightly stats job; future bulk re-index job)
       Why now:   teaches the chunk-oriented batch mental model on a synthetic but
                  realistic job. Preps the Elasticsearch backfill for Tier B.
       Outcome:   admin dashboard reads pre-aggregated stats; the job is restartable
                  and observable through V9 OTel.

V16 — Spring Modulith
       Why now:   the codebase has accumulated enough cross-cutting concerns
                  (audit, sharing, sort, auth) that bounded contexts become legible.
                  Sets up the carryover lesson for the customer project's hexagonal.
       Outcome:   enforced module boundaries; module-to-module communication via
                  @ApplicationModuleListener; verified-as-test.

V17 — Pact / Consumer-Driven Contract Testing
       Why now:   the API surface has stabilised through V8–V16; contract churn no
                  longer dominates the value.
       Outcome:   frontend records expectations; backend CI verifies them on every
                  build. The dueDate/due_date drift class of bug becomes impossible.

V18 — Event Sourcing projection from the audit log
       Why now:   Kafka and Modulith are in place; the audit log is already a partial
                  event store. Building a small read-side projection (e.g. todo-history
                  view) is a cheap, contained ES exercise.
       Outcome:   one read model materialised from events; the rebuild-from-events
                  drill practised once.

V19 — GraphQL + DataLoader (admin dashboard BFF)
       Why now:   conditional on building the multi-aggregate admin UI named in the
                  GraphQL upgrade path. If that UI does not get built, skip this.
       Outcome:   single GraphQL query replaces the 5+ REST calls the dashboard
                  would otherwise require. DataLoader batches the resolvers.

V20+  — Tier B/C concepts, each gated on its own trigger condition:
        • Spring WebFlux        — gated on measured thread-pool saturation
        • Kubernetes            — gated on a real cloud deployment target
        • Terraform             — gated on the cloud commitment for K8s
        • Elasticsearch         — gated on a ranked-text-search feature
        • Full CQRS             — gated on a real read/write asymmetry feature
        • gRPC                  — gated on an actual service split
```

### What moved vs the original sequencing

- **Docker Compose and CI dropped from the implementation queue.** Both already exist; the rewrite reframes them as already-done foundations to read and extend.
- **JPA / Hibernate performance tuning introduced at V7.** The single highest-carryover skill for a heavy-data Spring Boot customer project; previously absent from the document entirely.
- **Testcontainers added at V7.** Pairs with JPA tuning; closes the manual-Postgres-setup loop.
- **OAuth2 moved from V15 to V11.** High concept density, contained refactor, the V3 JWT is the literal "before" picture.
- **Resilience4j and OpenTelemetry promoted to Tier S.** Their customer-project relevance dominates their local-fit hesitation.
- **Spring Batch added at V15.** Customer-project relevance demands an explicit batch entry; the original document had none.
- **Spring Modulith added at V16.** Stepping stone to hexagonal without the rewrite cost.
- **Feature Flags promoted from a V19 one-liner to a first-class V14 entry.**
- **gRPC, K8s, Terraform, WebFlux, full CQRS, Elasticsearch moved to V20+ / Tier B–C.** Each names the specific upgrade trigger; none of them are forced.

---

# Cross-cutting themes

A few patterns span multiple concepts and are worth naming explicitly so the roadmap stays coherent.

## The audit log is a latent event store

The V4 `AuditAspect` is the connective tissue between many later concepts:
- **V8 Kafka** turns the audit write into the first asynchronous event publish.
- **V9 OpenTelemetry** uses the AOP boundary as a natural span.
- **V18 Event Sourcing** projects from the audit topic into a read model.
- **A future Elasticsearch indexer** (Tier B) consumes the same topic.

Design the V8 audit topic schema carefully — partitioning key, event key shape, schema versioning. The downstream fan-out is real and decisions made at V8 will compound.

## The carryover skill is data, not architecture

Customer project: Spring Boot, heavy data. Spend disproportionate time on the data layer:
- **V7 JPA performance tuning** — the highest single-concept carryover.
- **V13 Redis caching** — read amplification's standard answer.
- **V15 Spring Batch** — heavy-data processing's standard answer.
- **Tier B Elasticsearch** — gated, but in the same family.

Architecture concepts (V16 Modulith, V18 ES projection, GraphQL) are valuable but secondary. The data-shaped skills compound across every backend role.

## Hexagonal architecture is deliberately not on this list

The customer project teaches hexagonal in its native habitat. Refactoring a 5-entity todo app into ports-and-adapters is ceremonial — the real lesson lives in a system with enough domain logic to *need* the separation. **Spring Modulith (V16)** is the deliberate substitute: it teaches bounded contexts and enforced module boundaries without the full hexagonal rewrite. That covers 70% of the conceptual ground at 20% of the cost; the remaining 30% belongs to the customer project.

## "Real reason to leave Compose"

Five Tier B concepts share one upgrade trigger:
- Kubernetes
- Terraform
- Elasticsearch (operationally)
- Spring WebFlux
- gRPC

The shared trigger is **a deployment target with real external traffic, or a service split for independent reasons**. None of these concepts should be forced individually; when the trigger lands, several will unlock together and reinforce each other.

## Infrastructure is done; observability and resilience are next

The original document opened with two infrastructure recommendations (Docker, CI). Both are now in place. The natural next *infrastructure-adjacent* lessons are not more infrastructure — they are **observability** (V9 OTel) and **resilience** (V10 Resilience4j). Both make the existing infrastructure visible and durable, which is more valuable than adding new infrastructure layers.

## "Skip and revisit" is a first-class outcome

Several entries (gRPC, full CQRS, WebFlux, K8s, Terraform) recommend reading-without-implementing. That is not laziness; it is a deliberate choice. The opportunity cost of forcing a poor-fit concept is real: time spent on a contrived gRPC service split is time not spent on JPA tuning or Kafka or OAuth2, all of which carry over directly. Knowing *that* a concept exists, and *what triggers its adoption*, is enough until the trigger lands.





