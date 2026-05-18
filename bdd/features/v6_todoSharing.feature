Feature: Todo Sharing
  As a user of the ToDo application
  I want to share my todo items with other registered users
  So that we can collaborate on tasks together

  Background:
    Given the ToDo app is open with a clean state
    And I am logged in as a registered user

  # --- F-75 / F-76: Sharing mode toggle ---

  Scenario: Activating and deactivating sharing mode via the navbar
    Then I should see a "Share Todos" button in the navbar
    When I click the "Share Todos" button
    Then the sharing panel should be visible
    And the navbar button should show "Back"
    When I click the "Back" button
    Then the sharing panel should not be visible
    And the navbar button should show "Share Todos"

  # --- F-77 / F-78 / F-79: Sharing panel contents and todo selection ---

  Scenario: Sharing panel shows current todos and own todos become selectable
    Given a todo "Buy milk" exists in the list
    When I click the "Share Todos" button
    Then the sharing panel should show the todo "Buy milk"
    And the todo "Buy milk" should be selectable
    And the sharing panel should contain a username input field
    When I select the todo "Buy milk" for sharing
    Then the todo "Buy milk" should appear selected

  # --- F-80: Share button disabled states ---

  Scenario: Share selected todos button is disabled until both a todo and a username are provided
    Given a todo "Buy milk" exists in the list
    When I click the "Share Todos" button
    Then the "Share selected todos" button should be disabled
    When I select the todo "Buy milk" for sharing
    Then the "Share selected todos" button should be disabled
    When I clear the todo "Buy milk" selection
    And I enter "alice" into the recipient username input
    Then the "Share selected todos" button should be disabled

  # --- F-81 / F-82: Successful share ---

  Scenario: Successfully sharing selected todos clears selection and username and shows a success toast
    Given a todo "Buy milk" exists in the list
    And another registered user exists with username "alice"
    When I click the "Share Todos" button
    And I select the todo "Buy milk" for sharing
    And I enter "alice" into the recipient username input
    And I click the "Share selected todos" button
    Then a success toast should be visible
    And the todo "Buy milk" should appear unselected
    And the recipient username input should be empty

  # --- F-83: Error cases preserve selection and input ---

  Scenario: Sharing with an unknown recipient shows an error toast and preserves state
    Given a todo "Buy milk" exists in the list
    When I click the "Share Todos" button
    And I select the todo "Buy milk" for sharing
    And I enter "unknownuser" into the recipient username input
    And I click the "Share selected todos" button
    Then an error toast should be visible with message "user does not exist"
    And the todo "Buy milk" should appear selected
    And the recipient username input should contain "unknownuser"

  Scenario: Sharing with yourself or an admin shows a cannot-share error
    Given a todo "Buy milk" exists in the list
    And a registered admin user exists with username "adminuser"
    When I click the "Share Todos" button
    And I select the todo "Buy milk" for sharing
    And I enter my own username into the recipient username input
    And I click the "Share selected todos" button
    Then an error toast should be visible with message "cannot share with user"
    When I enter "adminuser" into the recipient username input
    And I click the "Share selected todos" button
    Then an error toast should be visible with message "cannot share with user"

  Scenario: Sharing a todo that is already shared with the same recipient shows a duplicate error
    Given a todo "Buy milk" exists in the list
    And another registered user exists with username "alice"
    And the todo "Buy milk" is already shared with "alice"
    When I click the "Share Todos" button
    And I select the todo "Buy milk" for sharing
    And I enter "alice" into the recipient username input
    And I click the "Share selected todos" button
    Then an error toast should be visible with message "already shared with user"
    And the todo "Buy milk" should appear selected
    And the recipient username input should contain "alice"

  # --- F-84: Received shared todos are visible but not selectable in sharing mode ---

  Scenario: Todos shared with me appear in sharing mode but are not selectable
    Given another registered user exists with username "bob"
    And "bob" has shared a todo "Team standup" with me
    When I click the "Share Todos" button
    Then the todo "Team standup" should be visible in the sharing panel
    And the todo "Team standup" should not be selectable

  # --- F-85 / F-86: Recipient view and full interaction ---

  Scenario: A todo shared with me appears in the main list with a shared-by label
    Given another registered user exists with username "bob"
    And "bob" has shared a todo "Team standup" with me
    Then I should see a todo item with text "Team standup"
    And the todo "Team standup" should display the label "Shared by bob"

  Scenario: A recipient can complete, edit, and unshare a shared todo
    Given another registered user exists with username "bob"
    And "bob" has shared a todo "Team standup" with me
    When I mark the todo "Team standup" as completed
    Then the todo "Team standup" should be marked as done
    When I click the edit button for "Team standup"
    And I change the edit text to "Weekly standup"
    And I click the save button
    Then I should see a todo item with text "Weekly standup"
    When I unshare the todo "Weekly standup"
    Then I should not see a todo item with text "Weekly standup"

  # --- F-74 / F-88: Audit log entries ---

  Scenario: A successful share is recorded in the audit log for each shared todo
    Given a todo "Buy milk" exists in the list
    And another registered user exists with username "alice"
    When I click the "Share Todos" button
    And I select the todo "Buy milk" for sharing
    And I enter "alice" into the recipient username input
    And I click the "Share selected todos" button
    Then the audit log should contain a TODO_SHARED entry for "Buy milk" with outcome "SUCCESS"

  Scenario: An unshare action is recorded in the audit log
    Given another registered user exists with username "bob"
    And "bob" has shared a todo "Team standup" with me
    When I unshare the todo "Team standup"
    Then the audit log should contain a TODO_UNSHARED entry for "Team standup" with outcome "SUCCESS"
