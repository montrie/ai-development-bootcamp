Feature: Audit Log UI
  As an admin
  I want a dedicated Audit Logs page in the admin panel
  So that I can inspect and clear the log through the UI

  Background:
    Given the login page is open

  # F-38: Audit Logs page table

  Scenario: Admin can navigate to the Audit Logs page and see entries in a table
    Given a user "alice" is already registered
    And I log in as admin
    When I navigate to the Audit Logs view in the admin panel
    Then I should see the audit log table
    And the table should contain a row for the "USER_REGISTERED" action

  # F-39: Filter controls

  Scenario: Admin can filter audit log entries by action type in the UI
    Given there are audit log entries of different action types
    And I log in as admin
    And I navigate to the Audit Logs view in the admin panel
    When I select "USER_LOGIN" from the action type filter
    And I click the Apply Filters button
    Then the audit log table should only show "USER_LOGIN" entries

  Scenario: Admin can filter audit log entries by username in the UI
    Given a user "alice" is already registered
    And a user "bob" is already registered
    And I log in as admin
    And I navigate to the Audit Logs view in the admin panel
    When I enter "alice" in the username filter
    And I click the Apply Filters button
    Then the audit log table should only show entries for "alice"

  Scenario: Admin can filter audit log entries by date range in the UI
    Given there are audit log entries from multiple dates
    And I log in as admin
    And I navigate to the Audit Logs view in the admin panel
    When I set the start date filter to "2026-05-11T00:00:00Z"
    And I set the end date filter to "2026-05-11T23:59:59Z"
    And I click the Apply Filters button
    Then the audit log table should only show entries within that date range

  # F-40: Clear All Logs button

  Scenario: Admin can clear all audit log entries using the Clear All Logs button
    Given there are existing audit log entries
    And I log in as admin
    And I navigate to the Audit Logs view in the admin panel
    When I click the clear audit logs button
    And I confirm the action in the confirmation dialog
    Then the audit log table should be empty
