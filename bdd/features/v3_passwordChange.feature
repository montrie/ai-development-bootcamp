Feature: User Password Change
  As a logged-in user
  I want to change my password
  So that I can keep my account secure

  Background:
    Given I am logged in as "alice" with password "secret123"

  Scenario: User can change their password successfully
    When I change my password from "secret123" to "newpass456"
    Then my password change should succeed
    And I can log in with password "newpass456"

  Scenario: Password change fails with wrong current password
    When I try to change my password using current password "wrongpass" and new password "newpass456"
    Then I should see a password change error

  Scenario: Password change fails when new passwords do not match
    When I try to change my password with new password "newpass456" and confirmation "different789"
    Then I should see a password change error
