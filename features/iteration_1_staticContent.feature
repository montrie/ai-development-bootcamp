Feature: Initial Page Appearance
  As a user opening the ToDo application
  I want the page to render correctly with the right initial state
  So that I can start using the app immediately

  Background:
    Given I open "index.html" in a web browser

  Scenario: The page heading and form are visible on load
    Then I should see the heading "To-Do List"
    And I should see the new ToDo form

  Scenario: An empty list shows a placeholder message
    Then I should see the message "No tasks yet — add one above!"
