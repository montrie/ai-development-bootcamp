Feature: Complete a ToDo Item
  As a user of the ToDo application
  I want to mark tasks as completed
  So that I can track what I have already done

  Background:
    Given the ToDo app is open with a clean state
    And I have added a todo item with text "Buy milk"

  Scenario: Each todo item has a checkbox
    Then the todo "Buy milk" should have a checkbox

  Scenario: Clicking the checkbox marks the item as completed
    When I mark the todo "Buy milk" as completed
    Then the todo "Buy milk" should be marked as completed

  Scenario: A completed item is visually greyed out with strikethrough text
    When I mark the todo "Buy milk" as completed
    Then the todo "Buy milk" should appear greyed out with strikethrough text

  Scenario: A completed item can be toggled back to not done
    When I mark the todo "Buy milk" as completed
    And I mark the todo "Buy milk" as completed
    Then the todo "Buy milk" should not be marked as completed
