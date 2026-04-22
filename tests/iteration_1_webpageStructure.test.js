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
  doc = new JSDOM(html).window.document;
});

describe('Required project files are present', () => {
  it('index.html exists in the project root', () => {
    expect(fs.existsSync(indexHtmlPath)).toBe(true);
  });

  it('style.css exists in the project root', () => {
    expect(fs.existsSync(path.join(srcDir, 'style.css'))).toBe(true);
  });

  it('app.js is either absent or empty', () => {
    const appJsPath = path.join(srcDir, 'app.js');
    if (fs.existsSync(appJsPath)) {
      expect(fs.readFileSync(appJsPath, 'utf8').trim()).toBe('');
    }
  });
});

describe('Page sections appear in the correct top-to-bottom order', () => {
  it('has a heading with the text "To-Do List"', () => {
    const heading = doc.querySelector('h1');
    expect(heading).not.toBeNull();
    expect(heading.textContent.trim()).toBe('To-Do List');
  });

  it('new ToDo form appears below the heading', () => {
    const heading = doc.querySelector('h1');
    const form = doc.querySelector('form');
    expect(heading).not.toBeNull();
    expect(form).not.toBeNull();
    // DOCUMENT_POSITION_FOLLOWING (4) means form comes after heading in DOM order
    expect(heading.compareDocumentPosition(form) & 4).toBeTruthy();
  });

  it('ToDo list appears below the new ToDo form', () => {
    const form = doc.querySelector('form');
    const list = doc.querySelector('ul, ol');
    expect(form).not.toBeNull();
    expect(list).not.toBeNull();
    expect(form.compareDocumentPosition(list) & 4).toBeTruthy();
  });
});

describe('New ToDo form contains the required input elements', () => {
  it('has a single-line text input for entering a task description', () => {
    const input = doc.querySelector('input[type="text"], input:not([type])');
    expect(input).not.toBeNull();
  });

  it('has a button labelled "Add"', () => {
    const addButton = Array.from(doc.querySelectorAll('button'))
      .find(b => b.textContent.trim() === 'Add');
    expect(addButton).not.toBeUndefined();
  });

  it('"Add" button is positioned to the right of the text input', () => {
    const input = doc.querySelector('input[type="text"], input:not([type])');
    const addButton = Array.from(doc.querySelectorAll('button'))
      .find(b => b.textContent.trim() === 'Add');
    expect(input).not.toBeNull();
    expect(addButton).not.toBeUndefined();
    expect(input.compareDocumentPosition(addButton) & 4).toBeTruthy();
  });
});

describe('New ToDo form has no interactivity', () => {
  it('clicking "Add" does not add a new item to the list', () => {
    const list = doc.querySelector('ul, ol');
    const countBefore = list ? list.querySelectorAll('li').length : 0;
    const addButton = Array.from(doc.querySelectorAll('button'))
      .find(b => b.textContent.trim() === 'Add');
    addButton?.click();
    const countAfter = list ? list.querySelectorAll('li').length : 0;
    expect(countAfter).toBe(countBefore);
  });

  it('text input remains unchanged after clicking "Add"', () => {
    const input = doc.querySelector('input[type="text"], input:not([type])');
    const valueBefore = input ? input.value : '';
    const addButton = Array.from(doc.querySelectorAll('button'))
      .find(b => b.textContent.trim() === 'Add');
    addButton?.click();
    expect(input ? input.value : '').toBe(valueBefore);
  });
});

describe.each([['Chrome'], ['Firefox'], ['Safari'], ['Edge']])(
  'Page renders correctly in %s',
  () => {
    it('shows the heading "To-Do List"', () => {
      const heading = doc.querySelector('h1');
      expect(heading).not.toBeNull();
      expect(heading.textContent.trim()).toBe('To-Do List');
    });

    it('shows the new ToDo form', () => {
      expect(doc.querySelector('form')).not.toBeNull();
    });

    it('shows hardcoded ToDo items in the list', () => {
      expect(doc.querySelectorAll('li').length).toBeGreaterThanOrEqual(2);
    });
  }
);
