Feature: Static HTML Page
  As a user visiting the ToDo application for the first time
  I want to see a complete and correctly structured static HTML page
  So that the visual foundation is established before any JavaScript functionality is added

  Background:
    Given I open "index.html" in a web browser

  Scenario: Page displays the application heading
    Then I should see a heading with the text "To-Do List"

  Scenario: Page sections appear in the correct top-to-bottom order
    Then the page heading appears at the top of the page
    And the new ToDo form appears below the heading
    And the ToDo list appears below the new ToDo form

  Scenario: New ToDo form contains a text input field
    Then I should see a single-line text input field for entering a task description

  Scenario: New ToDo form contains an "Add" button positioned to the right of the input
    Then I should see a button labelled "Add"
    And the "Add" button is positioned to the right of the text input

  Scenario: The new ToDo form has no interactivity
    When I click the "Add" button
    Then no new item is added to the list
    And the text input remains unchanged

  Scenario: Hardcoded ToDo items are visible in the list
    Then I should see at least two ToDo items in the list
    And each item contains a checkbox and task text

  Scenario: At least one ToDo item is shown in a completed state
    Then at least one item has its checkbox checked
    And the text of that completed item appears greyed out with a strikethrough

  Scenario: Page renders correctly with JavaScript disabled
    Given JavaScript is disabled in the browser
    When I open "index.html"
    Then I should see the heading "To-Do List"
    And I should see the new ToDo form
    And I should see hardcoded ToDo items in the list

  Scenario Outline: Page renders correctly in all target browsers
    Given I open "index.html" in <browser>
    Then I should see the heading "To-Do List"
    And I should see the new ToDo form
    And I should see hardcoded ToDo items in the list

    Examples:
      | browser |
      | Chrome  |
      | Firefox |
      | Safari  |
      | Edge    |

  Scenario: Required project files are present
    Then the file "index.html" exists in the project root
    And the file "style.css" exists in the project root
    And "app.js" is either absent or empty
