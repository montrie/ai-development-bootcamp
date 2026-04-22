'use strict';

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const indexHtmlPath = path.join(srcDir, 'index.html');

let doc;

beforeAll(() => {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  // JSDOM does not execute scripts by default, simulating a JS-disabled browser
  doc = new JSDOM(html).window.document;
});

describe('Hardcoded ToDo items are visible in the list', () => {
  it('has at least two ToDo items in the list', () => {
    expect(doc.querySelectorAll('li').length).toBeGreaterThanOrEqual(2);
  });

  it('each item contains a checkbox and task text', () => {
    const items = doc.querySelectorAll('li');
    items.forEach(item => {
      expect(item.querySelector('input[type="checkbox"]')).not.toBeNull();
      expect(item.textContent.trim().length).toBeGreaterThan(0);
    });
  });
});

describe('At least one ToDo item is shown in a completed state', () => {
  it('at least one item has its checkbox checked', () => {
    const checkboxes = Array.from(doc.querySelectorAll('input[type="checkbox"]'));
    const checked = checkboxes.filter(cb => cb.checked || cb.hasAttribute('checked'));
    expect(checked.length).toBeGreaterThanOrEqual(1);
  });

  it('the text of that completed item appears greyed out with a strikethrough', () => {
    const items = Array.from(doc.querySelectorAll('li'));
    const completedItems = items.filter(item => {
      const cb = item.querySelector('input[type="checkbox"]');
      return cb && (cb.checked || cb.hasAttribute('checked'));
    });
    expect(completedItems.length).toBeGreaterThanOrEqual(1);
    completedItems.forEach(item => {
      const hasCompletedStyling =
        /completed|done/i.test(item.className) ||
        item.querySelector('[class*="completed"], [class*="done"]') !== null ||
        item.style.textDecoration?.includes('line-through');
      expect(hasCompletedStyling).toBe(true);
    });
  });
});

describe('Page content is fully present without JavaScript', () => {
  it('heading "To-Do List" is present in static HTML', () => {
    const heading = doc.querySelector('h1');
    expect(heading).not.toBeNull();
    expect(heading.textContent.trim()).toBe('To-Do List');
  });

  it('new ToDo form is present in static HTML', () => {
    expect(doc.querySelector('form')).not.toBeNull();
  });

  it('hardcoded ToDo items are present in static HTML', () => {
    expect(doc.querySelectorAll('li').length).toBeGreaterThanOrEqual(2);
  });
});
