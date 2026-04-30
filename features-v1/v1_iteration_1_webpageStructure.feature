Feature: Webpage Structure
  As a user visiting the ToDo application
  I want the page to have a well-defined and consistent structure
  So that the layout is predictable and navigable across all browsers

  Background:
    Given I open "index.html" in a web browser

  Scenario: Required project files are present
    Then the file "index.html" exists in the project root
    And the file "style.css" exists in the project root
    And "app.js" exists and contains JavaScript

  Scenario: Page sections appear in the correct top-to-bottom order
    Then I should see a heading with the text "To-Do List"
    And the new ToDo form appears below the heading
    And the ToDo list appears below the new ToDo form

  Scenario: New ToDo form contains the required input elements
    Then I should see a single-line text input field for entering a task description
    And I should see a button labelled "Add"
    And the "Add" button is positioned to the right of the text input

  Scenario Outline: Page renders correctly in all target browsers
    Given I open "index.html" in <browser>
    Then I should see the heading "To-Do List"
    And I should see the new ToDo form
    And I should see the ToDo list

    Examples:
      | browser |
      | Chrome  |
      | Firefox |
      | Safari  |
      | Edge    |
