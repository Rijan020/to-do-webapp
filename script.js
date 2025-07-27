document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement; // <html> element
  const taskInput = document.getElementById('taskInput');
  const dueDateInput = document.getElementById('dueDateInput');
  const categorySelect = document.getElementById('categorySelect');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const taskList = document.getElementById('taskList');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const darkModeToggle = document.getElementById('darkModeToggle');
  const messageBox = document.getElementById('messageBox');
  const messageText = document.getElementById('messageText');
  const messageBoxCloseBtn = document.getElementById('messageBoxCloseBtn');

  let tasks = [];

  // Show message box
  function showMessageBox(message) {
    messageText.textContent = message;
    messageBox.classList.add('show');
  }

  // Hide message box
  function hideMessageBox() {
    messageBox.classList.remove('show');
  }
  messageBoxCloseBtn.addEventListener('click', hideMessageBox);

  // Save tasks to localStorage
  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  // Load tasks from localStorage
  function loadTasks() {
    const stored = localStorage.getItem('tasks');
    if (stored) {
      tasks = JSON.parse(stored);
    }
  }

  // Render tasks to UI
  function renderTasks() {
    taskList.innerHTML = '';
    const searchTerm = searchInput.value.toLowerCase();
    const sortBy = sortSelect.value;

    let filtered = tasks.filter(task =>
      task.text.toLowerCase().includes(searchTerm) ||
      task.category.toLowerCase().includes(searchTerm)
    );

    // Sort tasks
    filtered.sort((a, b) => {
      if (sortBy === 'dueDateAsc') {
        return new Date(a.dueDate) - new Date(b.dueDate);
      } else if (sortBy === 'dueDateDesc') {
        return new Date(b.dueDate) - new Date(a.dueDate);
      } else if (sortBy === 'category') {
        return a.category.localeCompare(b.category);
      } else {
        return 0;
      }
    });

    filtered.forEach(task => {
      const li = document.createElement('li');
      li.classList.add('task-item');
      if (task.completed) li.classList.add('completed');
      li.dataset.id = task.id;

      const today = new Date().toISOString().split('T')[0];
      let dueClass = '';
      if (task.dueDate && !task.completed) {
        if (task.dueDate < today) dueClass = 'past-due';
        else if (task.dueDate === today) dueClass = 'today-due';
      }

      li.innerHTML = `
        <div class="task-item-content">
          <span class="task-text">${task.text}</span>
          <div class="task-meta">
            ${task.dueDate ? `<span class="task-due-date ${dueClass}">Due: ${task.dueDate}</span>` : ''}
            <span class="category-badge ${task.category}">${task.category}</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="complete-button" aria-label="Mark task complete">${task.completed ? 'Undo' : 'Complete'}</button>
          <button class="delete-button" aria-label="Delete task">Delete</button>
        </div>
      `;

      // Complete task toggle
      li.querySelector('.complete-button').addEventListener('click', () => {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
      });

      // Delete task
      li.querySelector('.delete-button').addEventListener('click', () => {
        tasks = tasks.filter(t => t.id !== task.id);
        saveTasks();
        renderTasks();
      });

      taskList.appendChild(li);
    });
  }

  // Add new task
  function addTask() {
    const text = taskInput.value.trim();
    const dueDate = dueDateInput.value;
    const category = categorySelect.value;

    if (!text) {
      showMessageBox('Please enter a task description.');
      return;
    }

    const newTask = {
      id: Date.now(),
      text,
      dueDate,
      category,
      completed: false,
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();

    // Clear inputs
    taskInput.value = '';
    dueDateInput.value = '';
    categorySelect.value = 'Work';
  }

  // Dark mode toggle
  function toggleDarkMode() {
    const isDark = root.classList.toggle('dark-mode');
    const icon = darkModeToggle.querySelector('i');

    if (isDark) {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
      darkModeToggle.setAttribute('aria-label', 'Toggle light mode');
      localStorage.setItem('darkMode', 'enabled');
    } else {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
      darkModeToggle.setAttribute('aria-label', 'Toggle dark mode');
      localStorage.setItem('darkMode', 'disabled');
    }
  }

  // Initialize dark mode from localStorage
  function initDarkMode() {
    if (localStorage.getItem('darkMode') === 'enabled') {
      root.classList.add('dark-mode');
      const icon = darkModeToggle.querySelector('i');
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
      darkModeToggle.setAttribute('aria-label', 'Toggle light mode');
    }
  }

  addTaskBtn.addEventListener('click', addTask);
  searchInput.addEventListener('input', renderTasks);
  sortSelect.addEventListener('change', renderTasks);
  darkModeToggle.addEventListener('click', toggleDarkMode);

  // Load and render tasks on page load
  loadTasks();
  renderTasks();
  initDarkMode();
});
