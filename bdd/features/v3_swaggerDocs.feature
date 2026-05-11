Feature: API Documentation
  As a developer
  I want to access the Swagger UI and OpenAPI specification
  So that I can explore the REST API without needing credentials

  Scenario: OpenAPI specification is publicly accessible
    When I request the OpenAPI specification
    Then I should receive a valid OpenAPI 3 document

  Scenario: Swagger UI is publicly accessible
    When I request the Swagger UI
    Then I should receive the Swagger UI page
