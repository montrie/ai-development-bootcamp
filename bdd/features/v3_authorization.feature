Feature: Authorization and Per-User Todo Isolation
  As a logged-in user
  I want my todos to be private
  So that other users cannot see or modify my tasks

  Scenario: Unauthenticated request to the todo API is rejected
    When an unauthenticated request is made to the todo API
    Then the response status should be 401

  Scenario: Todos are scoped to the logged-in user
    Given "alice" is logged in and has a todo "Alice task"
    And "bob" is logged in
    Then "bob" should not see "Alice task" in their todo list

  Scenario: User cannot delete another user's todo
    Given "alice" is logged in and has a todo "Alice task"
    When "bob" tries to delete "alice"'s todo
    Then the response status should be 403

  Scenario: Accessing a non-existent todo returns 403
    Given "alice" is logged in
    When "alice" tries to update a todo that does not exist
    Then the response status should be 403

  Scenario: Todos created after login are visible only to the creating user
    Given "alice" is logged in
    When "alice" adds a todo "Only mine"
    And "bob" logs in and views their todo list
    Then "bob" should not see "Only mine" in their todo list
