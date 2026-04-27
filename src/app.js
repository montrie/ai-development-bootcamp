let todos = [];
let nextId = 1;

function init() {
  const input = document.getElementById('todo-input');
  const addButton = document.getElementById('add-button');
  const list = document.querySelector('.todo-list');

  const loaded = loadState();
  if (loaded === null) {
    document.getElementById('storage-notice').removeAttribute('hidden');
  } else {
    todos = loaded;
    if (todos.length > 0) nextId = Math.max(...todos.map((t) => t.id)) + 1;
  }

  addButton.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) {
      input.classList.add('invalid');
      return;
    }
    input.classList.remove('invalid');
    addTodo(text);
    input.value = '';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addButton.click();
    }
  });

  input.addEventListener('input', () => {
    input.classList.remove('invalid');
  });

  list.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
      const li = e.target.closest('[data-id]');
      if (li) toggleTodo(Number(li.dataset.id));
    }
  });

  list.addEventListener('click', (e) => {
    if (e.target.classList.contains('todo-delete-btn')) {
      const li = e.target.closest('[data-id]');
      if (li) deleteTodo(Number(li.dataset.id));
    }
  });

  render();
}

function render() {
  const list = document.querySelector('.todo-list');
  list.innerHTML = '';

  if (todos.length === 0) {
    const placeholder = document.createElement('li');
    placeholder.className = 'todo-placeholder';
    placeholder.textContent = 'No tasks yet — add one above!';
    list.appendChild(placeholder);
    return;
  }

  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' completed' : '');
    li.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `todo-${todo.id}`;
    checkbox.checked = todo.done;

    const label = document.createElement('label');
    label.htmlFor = `todo-${todo.id}`;
    label.textContent = todo.text;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'todo-delete-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.setAttribute('aria-label', `Delete ${todo.text}`);

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

function addTodo(text) {
  todos.push({ id: nextId++, text, done: false });
  saveState();
  render();
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.done = !todo.done;
    saveState();
    render();
  }
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  saveState();
  render();
}

function saveState() {
  try {
    localStorage.setItem('todo-items', JSON.stringify(todos));
  } catch {
    document.getElementById('storage-notice').removeAttribute('hidden');
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem('todo-items');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return null;
  }
}

document.addEventListener('DOMContentLoaded', init);
