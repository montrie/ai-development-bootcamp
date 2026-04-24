import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..', 'src');

test.describe('Required project files are present', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'File checks run once');

  test('index.html exists in /src', () => {
    expect(fs.existsSync(path.join(srcDir, 'index.html'))).toBe(true);
  });
  test('style.css exists in /src', () => {
    expect(fs.existsSync(path.join(srcDir, 'style.css'))).toBe(true);
  });
  test('app.js exists and contains JavaScript', () => {
    const p = path.join(srcDir, 'app.js');
    expect(fs.existsSync(p)).toBe(true);
    expect(fs.readFileSync(p, 'utf8').trim().length).toBeGreaterThan(0);
  });
});

test.describe('Page sections appear in the correct top-to-bottom order', () => {
  test('has a heading with the text "To-Do List"', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('To-Do List');
  });
  test('form appears below the heading', async ({ page }) => {
    await page.goto('/');
    const ok = await page.evaluate(() => {
      const h1 = document.querySelector('h1'), form = document.querySelector('form');
      return !!(h1 && form && (h1.compareDocumentPosition(form) & 4));
    });
    expect(ok).toBe(true);
  });
  test('list appears below the form', async ({ page }) => {
    await page.goto('/');
    const ok = await page.evaluate(() => {
      const form = document.querySelector('form'), list = document.querySelector('ul, ol');
      return !!(form && list && (form.compareDocumentPosition(list) & 4));
    });
    expect(ok).toBe(true);
  });
});

test.describe('New ToDo form elements', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('has a text input', async ({ page }) => {
    await expect(page.locator('input[type="text"], input:not([type])')).toBeVisible();
  });
  test('has a button labelled "Add"', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();
  });
  test('"Add" button is to the right of the input', async ({ page }) => {
    const inputBox = await page.locator('input[type="text"], input:not([type])').boundingBox();
    const btnBox   = await page.getByRole('button', { name: 'Add' }).boundingBox();
    expect(btnBox.x).toBeGreaterThan(inputBox.x);
  });
});

