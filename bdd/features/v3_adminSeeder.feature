Feature: Admin Account Seeding on Startup
  As a system operator
  I want an admin account to be created automatically on first startup
  So that the application is immediately accessible without manual setup

  Scenario: Admin can log in after first startup with no existing admin
    Given the application has started with no admin user in the database
    And the environment provides username "admin" and password "changeme"
    When I log in with username "admin" and password "changeme"
    Then I should see the user management panel

  Scenario: A second startup does not create a duplicate admin when one already exists
    Given the application has started with no admin user in the database
    And the environment provides username "admin" and password "changeme"
    And the application restarts
    When I log in with username "admin" and password "changeme"
    Then I should see the user management panel
    And only one admin user exists in the database
