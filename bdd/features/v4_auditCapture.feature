Feature: Audit Log Capture
  As the system
  I want to record an audit log entry for every significant user action
  So that admins can investigate activity on the platform

  Background:
    Given the login page is open

  # F-31: Todo mutations

  Scenario: Creating a todo produces an audit log entry
    Given I am logged in as "alice"
    When I add a todo "Buy groceries"
    Then the audit log contains a "TODO_CREATED" entry with outcome "SUCCESS" for "alice"

  Scenario: Toggling a todo produces an audit log entry
    Given I am logged in as "alice"
    And "alice" has a todo "Buy groceries"
    When I mark "Buy groceries" as done
    Then the audit log contains a "TODO_TOGGLED" entry with outcome "SUCCESS" for "alice"

  Scenario: Deleting a todo produces an audit log entry
    Given I am logged in as "alice"
    And "alice" has a todo "Buy groceries"
    When I delete the todo "Buy groceries"
    Then the audit log contains a "TODO_DELETED" entry with outcome "SUCCESS" for "alice"

  # F-32: User registration

  Scenario: Registering a new user produces an audit log entry
    When I register with username "alice" and password "secret123"
    Then the audit log contains a "USER_REGISTERED" entry with outcome "SUCCESS" for "alice"

  # F-33: Login attempts

  Scenario: A successful login produces an audit log entry with SUCCESS
    Given a user "alice" is already registered with password "secret123"
    When I log in with username "alice" and password "secret123"
    Then the audit log contains a "USER_LOGIN" entry with outcome "SUCCESS" for "alice"

  Scenario: A failed login attempt produces an audit log entry with FAILURE
    Given a user "alice" is already registered with password "secret123"
    When I log in with username "alice" and password "wrongpass"
    Then the audit log contains a "USER_LOGIN" entry with outcome "FAILURE" for "alice"

  # F-34: Admin user-management actions

  Scenario: Admin deleting a user produces an audit log entry
    Given a user "alice" is already registered
    And I log in as admin
    When I delete user "alice"
    Then the audit log contains an "ADMIN_DELETE_USER" entry with outcome "SUCCESS"

  Scenario: Admin resetting a user's password produces an audit log entry
    Given a user "alice" is already registered with password "oldpass"
    And I log in as admin
    When I reset the password for "alice" to "newpass123"
    Then the audit log contains an "ADMIN_RESET_PASSWORD" entry with outcome "SUCCESS"

  # F-35: Access-denied events

  Scenario: A request without a JWT token to a protected endpoint produces an UNAUTHENTICATED log
    When an unauthenticated request is made to a protected endpoint
    Then the audit log contains an "UNAUTHENTICATED" entry with outcome "FAILURE" for "anonymous"

  Scenario: A regular user accessing an admin endpoint produces an ACCESS_DENIED log with their username
    Given I am logged in as "alice"
    When a regular user request is made to the admin API
    Then the audit log contains an "ACCESS_DENIED" entry with outcome "FAILURE" for "alice"
