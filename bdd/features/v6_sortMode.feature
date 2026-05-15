Feature: Sort Mode for ToDo List
  As a logged-in user of the ToDo application
  I want to choose how my todo list is sorted
  So that I can view my tasks in the order that suits me best

  Background:
    Given the ToDo app is open with a clean state
    And I am logged in as a registered user

  # --- Sort-mode-aware GET /api/todos ---

  Scenario: Todos are returned in ascending creation order when sort mode is CREATED_ASC
    Given my sort mode is set to "CREATED_ASC"
    And the following todos exist in creation order: "Alpha", "Beta", "Gamma"
    When I fetch my todos
    Then the todos are returned in the order: "Alpha", "Beta", "Gamma"

  Scenario: Todos are returned in descending creation order when sort mode is CREATED_DESC
    Given my sort mode is set to "CREATED_DESC"
    And the following todos exist in creation order: "Alpha", "Beta", "Gamma"
    When I fetch my todos
    Then the todos are returned in the order: "Gamma", "Beta", "Alpha"

  Scenario: Todos are returned sorted by due date ascending when sort mode is DUE_DATE_EARLIEST_FIRST
    Given my sort mode is set to "DUE_DATE_EARLIEST_FIRST"
    And a todo "Later task" exists with a due date of "2027-12-01"
    And a todo "Earlier task" exists with a due date of "2027-01-15"
    When I fetch my todos
    Then "Earlier task" appears before "Later task"

  Scenario: Todos are returned sorted by due date descending when sort mode is DUE_DATE_LATEST_FIRST
    Given my sort mode is set to "DUE_DATE_LATEST_FIRST"
    And a todo "Later task" exists with a due date of "2027-12-01"
    And a todo "Earlier task" exists with a due date of "2027-01-15"
    When I fetch my todos
    Then "Later task" appears before "Earlier task"

  Scenario: Todos are returned sorted alphabetically ascending when sort mode is ALPHA_ASC
    Given my sort mode is set to "ALPHA_ASC"
    And the following todos exist: "Zebra", "Apple", "Mango"
    When I fetch my todos
    Then the todos are returned in the order: "Apple", "Mango", "Zebra"

  Scenario: Todos are returned sorted alphabetically descending when sort mode is ALPHA_DESC
    Given my sort mode is set to "ALPHA_DESC"
    And the following todos exist: "Zebra", "Apple", "Mango"
    When I fetch my todos
    Then the todos are returned in the order: "Zebra", "Mango", "Apple"

  Scenario: Todos are returned in custom order when sort mode is CUSTOM
    Given my sort mode is set to "CUSTOM"
    And the following todos exist in creation order: "First", "Second", "Third"
    And my custom order is set to "Third", "First", "Second"
    When I fetch my todos
    Then the todos are returned in the order: "Third", "First", "Second"

  # --- PATCH /api/users/me/sort-mode ---

  Scenario: Updating sort mode with a valid value succeeds
    When I send a request to update my sort mode to "ALPHA_ASC"
    Then the response status is 200
    And the response body is empty

  Scenario: Updating sort mode with an invalid value returns 400
    When I send a request to update my sort mode to "INVALID_MODE"
    Then the response status is 400

  Scenario: Updating sort mode without authentication returns 401
    Given I am not authenticated
    When I send a request to update my sort mode to "ALPHA_ASC"
    Then the response status is 401

  # --- PATCH /api/todos/reorder ---

  Scenario: Reordering todos sets sort mode to CUSTOM and saves the order
    Given the following todos exist in creation order: "Alpha", "Beta", "Gamma"
    When I send a reorder request with the IDs in the order: "Gamma", "Alpha", "Beta"
    Then the response status is 200
    And my sort mode is now "CUSTOM"
    And fetching my todos returns them in the order: "Gamma", "Alpha", "Beta"

  Scenario: Reordering todos with an ID belonging to another user returns 403
    Given another user has a todo with ID belonging to them
    When I send a reorder request that includes that foreign todo ID
    Then the response status is 403

  Scenario: Reordering todos with a non-existent ID returns 403
    When I send a reorder request that includes a non-existent todo ID
    Then the response status is 403

  Scenario: Reordering todos without authentication returns 401
    Given I am not authenticated
    When I send a reorder request with any todo IDs
    Then the response status is 401

  # --- Custom order maintenance on create/delete ---

  Scenario: Creating a new todo in CUSTOM sort mode appends it to the custom order
    Given my sort mode is set to "CUSTOM"
    And the following todos exist in custom order: "Alpha", "Beta"
    When I create a new todo "Gamma"
    Then fetching my todos returns them in the order: "Alpha", "Beta", "Gamma"

  Scenario: Deleting a todo in CUSTOM sort mode removes it from the custom order
    Given my sort mode is set to "CUSTOM"
    And the following todos exist in custom order: "Alpha", "Beta", "Gamma"
    When I delete the todo "Beta"
    Then fetching my todos returns them in the order: "Alpha", "Gamma"

  # --- Sort mode selector UI ---

  Scenario: Sort mode selector shows the active sort mode on page load
    Given my sort mode is set to "DUE_DATE_EARLIEST_FIRST"
    When I open the ToDo app
    Then the sort mode selector displays "Due date (earliest first)"

  Scenario: Selecting a different sort mode calls the API and re-fetches the list
    Given my sort mode is set to "CREATED_ASC"
    And the following todos exist: "Zebra", "Apple"
    When I change the sort mode selector to "Alphabetical (A–Z)"
    Then the todo list is re-ordered alphabetically ascending
    And the sort mode selector displays "Alphabetical (A–Z)"

  Scenario: Sort mode selector is disabled while the sort mode update request is in flight
    When I change the sort mode selector to "Alphabetical (A–Z)"
    Then the sort mode selector is disabled until the request completes
