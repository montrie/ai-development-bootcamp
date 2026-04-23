Feature: Static Content
  As a user visiting the ToDo application for the first time
  I want to see hardcoded sample content on the page
  So that the visual design is demonstrated before any JavaScript functionality is added

  Background:
    Given I open "index.html" in a web browser

  Scenario: Hardcoded ToDo items are visible in the list
    Then I should see at least two ToDo items in the list
    And each item contains a checkbox and task text

  Scenario: At least one ToDo item is shown in a completed state
    Then at least one item has its checkbox checked
    And the text of that completed item appears greyed out with a strikethrough

  Scenario: Page content is fully present without JavaScript
    Given JavaScript is disabled in the browser
    When I open "index.html"
    Then I should see the heading "To-Do List"
    And I should see the new ToDo form
    And I should see hardcoded ToDo items in the list
