Feature: Database Persistence
  As a user of the ToDo application
  I want my tasks to be saved to the server
  So that I don't lose my task list when I close or reload the browser tab

  Background:
    Given the ToDo app is open with a clean state

  Scenario: An added todo item persists after page reload
    Given a todo item "Buy milk" exists in the list
    When I reload the page
    Then I should see a todo item with text "Buy milk"

  Scenario: The completed state of a todo item persists after page reload
    Given a todo item "Buy milk" has been completed
    When I reload the page
    Then the todo "Buy milk" should be marked as completed

  Scenario: A deleted todo item does not reappear after page reload
    Given a todo item "Buy milk" exists in the list
    When I delete the todo "Buy milk"
    And I reload the page
    Then I should not see a todo item with text "Buy milk"

  Scenario: An empty list on load shows the placeholder when no items are stored
    When I reload the page
    Then I should see the empty list placeholder

  Scenario: A notice is shown when the API is unreachable
    Given the API is unreachable
    When I reload the page
    Then I should see a server unavailable notice
