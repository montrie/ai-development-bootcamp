Feature: Behaviour Edge Cases
  As a user of the ToDo application
  I want the app to handle unusual inputs and states gracefully
  So that the experience remains consistent and informative

  Background:
    Given the ToDo app is open with a clean state

  Scenario: Submitting an empty input shows a validation cue
    When I click the add button
    Then the todo input should show a validation cue

  Scenario: Submitting whitespace-only input is treated as empty
    When I enter "   " into the todo input
    And I click the add button
    Then the todo input should show a validation cue
    And I should not see any todo items in the list

  Scenario: An empty list on load shows a placeholder message
    Then I should see the message "No tasks yet — add one above!"

  Scenario: Very long task text wraps within the item row without breaking the layout
    When I enter "This is an extremely long task description that goes on and on and should definitely wrap to the next line within the item row and not break the overall page layout in any way" into the todo input
    And I click the add button
    Then I should see a todo item with text "This is an extremely long task description that goes on and on and should definitely wrap to the next line within the item row and not break the overall page layout in any way"
    And the todo list layout should not be broken
