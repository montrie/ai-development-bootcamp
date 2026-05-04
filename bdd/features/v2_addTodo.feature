Feature: Add a ToDo Item
  As a user of the ToDo application
  I want to add new tasks to my list
  So that I can track things I need to do

  Background:
    Given the ToDo app is open with a clean state

  Scenario: User can type a task description into the todo input
    When I enter "Buy milk" into the todo input
    Then the todo input should contain "Buy milk"

  Scenario: Clicking Add creates a new todo item in the list
    When I enter "Buy milk" into the todo input
    And I click the add button
    Then I should see a todo item with text "Buy milk"

  Scenario: Pressing Enter in the input adds a new todo item
    When I enter "Buy milk" into the todo input
    And I press Enter in the todo input
    Then I should see a todo item with text "Buy milk"

  Scenario: New todo items are appended to the bottom of the list
    When I enter "Buy milk" into the todo input
    And I click the add button
    And I enter "Call dentist" into the todo input
    And I click the add button
    Then "Buy milk" appears before "Call dentist" in the list

  Scenario: The input is cleared after adding a todo item
    When I enter "Buy milk" into the todo input
    And I click the add button
    Then the todo input should be empty

  Scenario: An item cannot be added when the input is empty
    When I click the add button
    Then I should not see any todo items in the list

  Scenario: An item cannot be added when the input contains only whitespace
    When I enter "   " into the todo input
    And I click the add button
    Then I should not see any todo items in the list
