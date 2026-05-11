Feature: Due Dates on ToDo Items
  As a user of the ToDo application
  I want to optionally assign a due date to my todo items
  So that I can track deadlines and see which tasks are overdue

  Background:
    Given the ToDo app is open with a clean state
    And I am logged in as a registered user

  Scenario: A todo item can be created with a due date
    When I enter "Submit report" into the todo input
    And I select a due date of "2027-06-15"
    And I click the add button
    Then I should see a todo item with text "Submit report"
    And the todo "Submit report" should display the due date "15 Jun 2027"

  Scenario: Due date in the current year is displayed without the year
    When I enter "Call dentist" into the todo input
    And I select a due date in the current year
    And I click the add button
    Then the due date label for "Call dentist" should not include the year

  Scenario: Due date in a different year is displayed with the year
    When I enter "Renew passport" into the todo input
    And I select a due date of "2027-03-10"
    And I click the add button
    Then the due date label for "Renew passport" should include the year "2027"

  Scenario: An overdue incomplete item shows the due date label in red
    Given a todo "Pay taxes" exists with a due date in the past
    Then the due date label for "Pay taxes" should be marked as overdue

  Scenario: A completed item does not show the overdue indicator even when past due
    Given a todo "Pay taxes" exists with a due date in the past
    When I mark the todo "Pay taxes" as completed
    Then the due date label for "Pay taxes" should not be marked as overdue

  Scenario: A todo with a future due date does not show the overdue indicator
    When I enter "Plan holiday" into the todo input
    And I select a due date of "2099-12-31"
    And I click the add button
    Then the due date label for "Plan holiday" should not be marked as overdue

  Scenario: Due date is persisted and visible after a page reload
    When I enter "File taxes" into the todo input
    And I select a due date of "2027-04-30"
    And I click the add button
    And I reload the page
    Then the todo "File taxes" should display the due date "30 Apr 2027"

