Feature: Audit Log API
  As an admin
  I want to retrieve and purge audit log entries via the API
  So that I can programmatically inspect and manage the log

  Background:
    Given the login page is open

  # F-36: GET /api/admin/audit-logs

  Scenario: Admin can retrieve all audit log entries via the API
    Given I log in as admin
    When the admin requests the audit log via the API
    Then the response contains a list of audit log entries ordered by timestamp descending

  Scenario: Admin can filter audit log entries by action type via the API
    Given there are audit log entries of different action types
    And I log in as admin
    When the admin requests the audit log filtered by action type "USER_LOGIN"
    Then the response contains only "USER_LOGIN" entries

  Scenario: Admin can filter audit log entries by username via the API
    Given a user "alice" is already registered
    And a user "bob" is already registered
    And I log in as admin
    When the admin requests the audit log filtered by username "alice"
    Then the response contains only entries for "alice"

  Scenario: Admin can filter audit log entries by date range via the API
    Given there are existing audit log entries
    And I log in as admin
    When the admin requests the audit log with startDate "2026-05-11T00:00:00Z" and endDate "2026-05-11T23:59:59Z"
    Then the response contains only entries within that date range

  Scenario: Searching audit logs with an unknown action type returns 400
    Given I log in as admin
    When the admin requests audit logs filtered by an unknown action type
    Then the response status should be 400

  Scenario: Regular user cannot retrieve audit log entries via the API
    Given I am logged in as "alice"
    When a regular user requests the audit log via the API
    Then the response status should be 403

  # F-37: DELETE /api/admin/audit-logs

  Scenario: Admin can delete all audit log entries via the API
    Given there are existing audit log entries
    And I log in as admin
    When the admin clears the audit log via the API
    Then the response status should be 204
    And the audit log is empty

  Scenario: Regular user cannot delete audit log entries via the API
    Given I am logged in as "alice"
    When a regular user requests to clear the audit log via the API
    Then the response status should be 403
