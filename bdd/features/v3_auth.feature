Feature: User Authentication
  As a visitor to the ToDo application
  I want to register and log in
  So that I can access my personal todo list

  Background:
    Given the login page is open

  Scenario: Unauthenticated user sees the login page
    Then I should see the login page

  Scenario: User can register with a new username and password
    When I register with username "alice" and password "secret123"
    Then I should see my todo list

  Scenario: Registration fails when the username is already taken
    Given a user "alice" is already registered
    When I register with username "alice" and password "secret123"
    Then I should see a registration error

  Scenario: Registered user can log in with correct credentials
    Given a user "alice" is already registered with password "secret123"
    When I log in with username "alice" and password "secret123"
    Then I should see my todo list

  Scenario: Login fails with wrong password
    Given a user "alice" is already registered with password "secret123"
    When I log in with username "alice" and password "wrongpass"
    Then I should see a login error

  Scenario: Logged-in user can log out and is returned to the login page
    Given I am logged in as "alice"
    When I log out
    Then I should see the login page
