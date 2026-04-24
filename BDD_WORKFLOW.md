# BDD Workflow

Follow a BDD (Behaviour-Driven Development) cycle for every new feature:

1. **Define the feature in a `.feature` file** — before writing any tests or implementation, create a Gherkin `.feature` file in the `features/` directory that describes the behaviour to be implemented. Follow the conventions in @GherkinTests.md for file naming, structure, and step vocabulary.
2. **Write tests first** — add Playwright tests in a dedicated test file that strictly adhere to the scenarios defined in the `.feature` file. Every scenario in the `.feature` file must have a corresponding test; no test should exercise behaviour not described in the `.feature` file.
3. **Run tests and confirm they fail** — execute the test suite; all new tests must fail at this point (red phase).
4. **Implement the feature** — write the minimum code needed to satisfy the feature requirements and the failing tests.
5. **Rerun tests and confirm they pass** — execute the test suite again; all tests must now pass (green phase). If any test still fails, refactor the implementation and repeat from step 4.
