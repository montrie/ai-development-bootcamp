Feature: Drag and Drop Reordering of ToDo Items
  As a logged-in user of the ToDo application
  I want to drag todo items to reorder them
  So that I can arrange my tasks in a custom order that reflects my priorities

  Background:
    Given the ToDo app is open with a clean state
    And I am logged in as a registered user
    And the following todos exist: "Alpha", "Beta", "Gamma"

  # --- Drag handle visibility ---

  Scenario: Each todo item shows a drag handle in normal viewing mode
    Then each todo item displays a drag handle

  Scenario: Drag handles are hidden when any todo item is in inline edit mode
    When I start editing the todo "Beta"
    Then no todo item displays a drag handle

  Scenario: Drag is disabled when any todo item is in inline edit mode
    When I start editing the todo "Beta"
    Then dragging any todo item is not possible

  # --- Drag reorder and persistence ---

  Scenario: Dragging a todo to a new position reorders the list optimistically
    When I drag "Gamma" above "Alpha"
    Then the todo list immediately shows the order: "Gamma", "Alpha", "Beta"

  Scenario: After a successful drag, the reorder is sent to the API
    When I drag "Gamma" above "Alpha"
    Then a reorder request is sent with the new order: "Gamma", "Alpha", "Beta"

  Scenario: After a successful drag, the sort mode selector shows "Custom order"
    When I drag "Beta" below "Gamma"
    And the reorder request succeeds
    Then the sort mode selector displays "Custom order"

  Scenario: After a failed drag reorder, the list reverts to its pre-drag order
    When I drag "Gamma" above "Alpha"
    And the reorder request fails
    Then the todo list reverts to the order: "Alpha", "Beta", "Gamma"

  Scenario: After a failed drag reorder, an error message is shown
    When I drag "Gamma" above "Alpha"
    And the reorder request fails
    Then an error message is displayed to the user
