# Testing Workflow

Three layered cycles run in order for every new feature. Complete each cycle (red → green) before moving to the next.

---

## Cycle 1 — Backend TDD (JUnit 5)

1. Write a failing `@SpringBootTest` or `@WebMvcTest` test covering the backend behaviour.
2. Run tests — confirm they fail (red).
3. Implement the minimum backend code to satisfy the tests.
4. Rerun tests — confirm they pass (green).

**Separation of concerns:** each test file covers one logical functionality (e.g. all tests for adding a ToDo item live in one file; all tests for deleting live in another). Do not mix unrelated behaviours in a single test file.

**File naming:** prefix every test file with its version (`vN_`) followed by the feature name: e.g. `vN_addTodo.test.java`.

---

## Cycle 2 — Frontend TDD (Vitest)

1. Write a failing Vitest component test using React Testing Library.
2. Run tests — confirm they fail (red).
3. Implement the minimum frontend code to satisfy the tests.
4. Rerun tests — confirm they pass (green).

**Separation of concerns:** same rule as Cycle 1 — one test file per logical functionality. For example, `vN_addTodo.test.tsx` covers only the add behaviour; `vN_completeTodo.test.tsx` covers only the complete/toggle behaviour.

**File naming:** prefix every test file with its version (`vN_`) followed by the feature name.

---

## Cycle 3 — End-to-End BDD (Playwright + Gherkin)

1. **Define the feature in a `.feature` file** — before writing any tests or implementation, create a Gherkin `.feature` file prefixed `vN_` in the appropriate features directory that describes the behaviour to be implemented. Follow the conventions in @GherkinTests.md for file naming, structure, and step vocabulary.
2. **Write tests first** — add Playwright tests in a dedicated spec file (also prefixed `vN_`) that strictly adhere to the scenarios defined in the `.feature` file. Every scenario must have a corresponding test; no test should exercise behaviour not described in the `.feature` file.
3. **Run tests and confirm they fail** — execute the test suite; all new tests must fail at this point (red phase).
4. **Implement the feature** — write the minimum code needed to satisfy the feature requirements and the failing tests.
5. **Rerun tests and confirm they pass** — execute the test suite again; all tests must now pass (green phase). If any test still fails, refactor the implementation and repeat from step 4.
