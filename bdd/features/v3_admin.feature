Feature: Admin User Management
  As an admin
  I want to manage registered users
  So that I can maintain the platform

  Background:
    Given the login page is open

  Scenario: Admin sees the user management panel instead of the todo list
    Given I log in as admin
    Then I should see the user management panel

  Scenario: Admin can see all registered users
    Given a user "alice" is already registered
    And I log in as admin
    Then I should see user "alice" in the user list

  Scenario: Admin can delete a user and their todos are removed
    Given a user "alice" is already registered with a todo "Alice task"
    And I log in as admin
    When I delete user "alice"
    Then I should not see user "alice" in the user list

  Scenario: Admin can reset a user's password
    Given a user "alice" is already registered with password "oldpass"
    And I log in as admin
    When I reset the password for "alice" to "newpass123"
    Then "alice" can log in with password "newpass123"
    And "alice" cannot log in with password "oldpass"

  Scenario: Admin cannot access the todo list
    Given I log in as admin
    When an admin request is made to the todo API
    Then the response status should be 403

  Scenario: Regular user cannot access the admin panel
    Given I am logged in as "alice"
    When a regular user request is made to the admin API
    Then the response status should be 403
