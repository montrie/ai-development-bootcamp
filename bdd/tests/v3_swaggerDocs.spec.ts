import { test, expect } from '@playwright/test';

// Feature: API Documentation (v3_swaggerDocs)
// Swagger UI and /v3/api-docs are served by the backend directly and are not
// proxied through Vite, so these tests target the backend URL explicitly.
const BACKEND_URL = process.env['BACKEND_URL'] ?? 'http://localhost:8080';

test('OpenAPI specification is publicly accessible', async ({ request }) => {
  const response = await request.get(`${BACKEND_URL}/v3/api-docs`);
  expect(response.status()).toBe(200);
  // Verify the response is a real OpenAPI 3.x document, not just any 200 response
  const body = await response.json();
  expect(body.openapi).toMatch(/^3\./);
});

test('Swagger UI is publicly accessible', async ({ request }) => {
  const response = await request.get(`${BACKEND_URL}/swagger-ui/index.html`);
  expect(response.status()).toBe(200);
});
