Feature: Delete a ToDo Item
  As a user of the ToDo application
  I want to delete tasks from my list
  So that I can remove items I no longer need

  Background:
    Given the ToDo app is open with a clean state

  Scenario: Each todo item has a delete button
    Given a todo item "Buy milk" exists in the list
    Then the todo "Buy milk" should have a delete button

  Scenario: Clicking the delete button removes the item from the list
    Given a todo item "Buy milk" exists in the list
    When I delete the todo "Buy milk"
    Then I should not see a todo item with text "Buy milk"

  Scenario: Deleted item does not reappear after adding a new item
    Given a todo item "Buy milk" exists in the list
    When I delete the todo "Buy milk"
    And I enter "Call dentist" into the todo input
    And I click the add button
    Then I should not see a todo item with text "Buy milk"
    And I should see a todo item with text "Call dentist"

  Scenario: Deleting the last item shows the empty placeholder
    Given a todo item "Buy milk" exists in the list
    When I delete the todo "Buy milk"
    Then I should see the empty list placeholder
