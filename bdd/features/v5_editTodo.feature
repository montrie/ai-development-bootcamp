Feature: Inline Editing of ToDo Items
  As a user of the ToDo application
  I want to edit the text and due date of an existing todo item
  So that I can correct mistakes or update task details without deleting and re-creating items

  Background:
    Given the ToDo app is open with a clean state
    And I am logged in as a registered user
    And a todo "Buy milk" exists in the list

  Scenario: Every todo item has an Edit button
    Then the todo "Buy milk" should have an edit button

  Scenario: Completed todo items also have an Edit button
    Given the todo "Buy milk" has been completed
    Then the todo "Buy milk" should have an edit button

  Scenario: Clicking Edit enters inline edit mode with the text pre-populated
    When I click the edit button for "Buy milk"
    Then the inline editor for "Buy milk" should be open
    And the edit text input should contain "Buy milk"

  Scenario: Clicking Edit pre-populates the date picker with the existing due date
    Given a todo "Submit report" with due date "2027-06-15" exists in the list
    When I click the edit button for "Submit report"
    Then the edit date picker should show "2027-06-15"

  Scenario: Saving with updated text changes the item in the list
    When I click the edit button for "Buy milk"
    And I change the edit text to "Buy oat milk"
    And I click the save button
    Then I should see a todo item with text "Buy oat milk"
    And I should not see a todo item with text "Buy milk"

  Scenario: Pressing Enter while editing saves the changes
    When I click the edit button for "Buy milk"
    And I change the edit text to "Buy oat milk"
    And I press Enter in the edit input
    Then I should see a todo item with text "Buy oat milk"
    And I should not see a todo item with text "Buy milk"

  Scenario: Saving updates the due date on the item
    When I click the edit button for "Buy milk"
    And I set the edit due date to "2027-08-20"
    And I click the save button
    Then the todo "Buy milk" should display the due date "20 Aug 2027"

  Scenario: Saving clears the due date when the date is removed
    Given a todo "Submit report" with due date "2027-06-15" exists in the list
    When I click the edit button for "Submit report"
    And I clear the edit due date
    And I click the save button
    Then the todo "Submit report" should not display a due date

  Scenario: Clicking Cancel discards text changes
    When I click the edit button for "Buy milk"
    And I change the edit text to "Buy oat milk"
    And I click the cancel button
    Then I should see a todo item with text "Buy milk"
    And I should not see a todo item with text "Buy oat milk"

  Scenario: Pressing Escape while editing discards changes
    When I click the edit button for "Buy milk"
    And I change the edit text to "Buy oat milk"
    And I press Escape in the edit input
    Then I should see a todo item with text "Buy milk"
    And I should not see a todo item with text "Buy oat milk"

  Scenario: Cannot save an edit when the text is empty
    When I click the edit button for "Buy milk"
    And I clear the edit text input
    And I click the save button
    Then the edit text input should be marked as invalid
    And I should see a todo item with text "Buy milk"

  Scenario: Cannot save an edit when the text is whitespace only
    When I click the edit button for "Buy milk"
    And I change the edit text to "   "
    And I click the save button
    Then the edit text input should be marked as invalid
    And I should see a todo item with text "Buy milk"

  Scenario: Opening a second item's editor silently closes the first
    Given a todo "Call dentist" also exists in the list
    When I click the edit button for "Buy milk"
    And I click the edit button for "Call dentist"
    Then the inline editor for "Buy milk" should not be open
    And the inline editor for "Call dentist" should be open

  Scenario: Only one item is in edit mode at a time
    Given a todo "Call dentist" also exists in the list
    When I click the edit button for "Buy milk"
    And I click the edit button for "Call dentist"
    Then I should see exactly one edit text input in the list
