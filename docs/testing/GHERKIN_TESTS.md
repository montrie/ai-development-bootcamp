# Gherkin Test Guidelines (Condensed)

## Structure
- Version 1 feature files are in `features-v1/`
- Version 2 feature files are in `apps/frontend/features/`
- Each file is prefixed with its version: `vN_featureName.feature` (e.g. `v1_iteration_2_addTodo.feature`, `v2_addTodo.feature`)
- This prefix convention applies to all test-related files: `.feature` files, Playwright spec files, Vitest test files, and JUnit test files
- One `Feature:` block per file
- Scenarios ordered simple → complex

## Core Rules
- Every `Scenario:` must have a descriptive name
- `Given` = precondition, `When` = action, `Then` = assertion — never mix roles
- One behaviour per scenario; use `Scenario Outline` + `Examples:` for multiple inputs
- Use `Background:` for shared preconditions (open app + reset state)
- Steps must map to a single Playwright action or assertion

## Step Vocabulary
```gherkin
Given the ToDo app is open with a clean state
When I enter "Buy milk" into the todo input
When I click the add button
When I mark the todo "Buy milk" as completed
When I delete the todo "Buy milk"
Then I should see a todo item with text "Buy milk"
Then I should not see a todo item with text "Buy milk"
Then the todo "Buy milk" should be marked as completed
```

## Avoid UI coupling in step text
Write steps at the user-intent level, not the DOM level.

## Playwright MCP Tools
`browser_navigate` · `browser_fill_form` · `browser_click` · `browser_snapshot` · `browser_evaluate` (for clearing localStorage)

## localStorage
Always reset state in `Background` or `Given` — never assume a clean browser.

## Anti-Patterns
- Unnamed scenarios
- Assertions in `Given`/`When`
- DOM-level steps (e.g. `I click the element with id "add-button"`)
- Multiple behaviours per scenario
- Typos in step text
- Duplicate step phrasing across files
