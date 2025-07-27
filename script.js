document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskInput = document.getElementById('taskInput');
    const dueDateInput = document.getElementById('dueDateInput');
    const categorySelect = document.getElementById('categorySelect');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const exportBtn = document.getElementById('exportBtn');
    const importFile = document.getElementById('importFile');
    const importBtn = document.getElementById('importBtn');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const messageBox = document.getElementById('messageBox');
    const messageText = document.getElementById('messageText');
    const messageBoxCloseBtn = document.getElementById('messageBoxCloseBtn');

    // --- Task Data Management ---
    let tasks = []; // Array to store task objects
    let draggedItem = null; // To keep track of the task being dragged

    // Function to show a custom message box
    function showMessageBox(message) {
        messageText.textContent = message;
        messageBox.classList.add('show');
    }

    // Function to hide the custom message box
    function hideMessageBox() {
        messageBox.classList.remove('show');
    }

    // Event listener for closing the message box
    messageBoxCloseBtn.addEventListener('click', hideMessageBox);

    // Load tasks from localStorage
    function loadTasks() {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
            renderTasks();
        }
    }

    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // --- Task Rendering and UI Updates ---
    // Function to render all tasks to the UI
    function renderTasks() {
        taskList.innerHTML = ''; // Clear current list
        const searchTerm = searchInput.value.toLowerCase();
        const sortBy = sortSelect.value;

        // Filter tasks based on search term
        let filteredTasks = tasks.filter(task =>
            task.text.toLowerCase().includes(searchTerm) ||
            task.category.toLowerCase().includes(searchTerm)
        );

        // Sort filtered tasks
        filteredTasks.sort((a, b) => {
            if (sortBy === 'dueDateAsc') {
                // Sort by due date ascending, completed tasks at the end
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1;
                }
                return new Date(a.dueDate) - new Date(b.dueDate);
            } else if (sortBy === 'dueDateDesc') {
                // Sort by due date descending, completed tasks at the end
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1;
                }
                return new Date(b.dueDate) - new Date(a.dueDate);
            } else if (sortBy === 'category') {
                // Sort by category alphabetically, then by due date
                if (a.category < b.category) return -1;
                if (a.category > b.category) return 1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            } else { // Default order (original order, completed at end)
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1;
                }
                return 0; // Maintain original relative order for non-completed
            }
        });

        // Create and append task elements
        filteredTasks.forEach(task => {
            const listItem = document.createElement('li');
            listItem.classList.add('task-item');
            if (task.completed) {
                listItem.classList.add('completed');
            }
            listItem.setAttribute('data-id', task.id);
            listItem.setAttribute('draggable', true); // Make tasks draggable

            // Determine due date status for visual cues
            const today = new Date().toISOString().split('T')[0];
            let dueDateClass = '';
            if (task.dueDate && !task.completed) {
                if (task.dueDate < today) {
                    dueDateClass = 'past-due';
                } else if (task.dueDate === today) {
                    dueDateClass = 'today-due';
                }
            }

            listItem.innerHTML = `
                <div class="task-item-content">
                    <span class="task-text">${task.text}</span>
                    <div class="task-meta">
                        ${task.dueDate ? `<span class="task-due-date ${dueDateClass}"><i class="far fa-calendar-alt"></i> ${task.dueDate}</span>` : ''}
                        <span class="category-badge ${task.category}"><i class="fas fa-tag"></i> ${task.category}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="complete-button" data-id="${task.id}" aria-label="Mark as complete">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="delete-button" data-id="${task.id}" aria-label="Delete task">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;

            taskList.appendChild(listItem);
        });

        addDragAndDropListeners(); // Re-add listeners after re-rendering
    }

    // --- Task Actions ---
    // Add a new task
    addTaskBtn.addEventListener('click', () => {
        const text = taskInput.value.trim();
        const dueDate = dueDateInput.value;
        const category = categorySelect.value;

        if (text) {
            const newTask = {
                id: Date.now().toString(), // Simple unique ID
                text,
                dueDate,
                category,
                completed: false
            };
            tasks.push(newTask);
            saveTasks();
            renderTasks();
            taskInput.value = ''; // Clear input
            dueDateInput.value = ''; // Clear due date
            categorySelect.value = 'Work'; // Reset category
        } else {
            showMessageBox('Please enter a task description!');
        }
    });

    // Event delegation for complete and delete buttons
    taskList.addEventListener('click', (event) => {
        const target = event.target;
        const taskId = target.closest('button')?.dataset.id;

        if (taskId) {
            if (target.closest('.complete-button')) {
                toggleComplete(taskId);
            } else if (target.closest('.delete-button')) {
                deleteTask(taskId);
            }
        }
    });

    // Toggle task completion status
    function toggleComplete(id) {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex > -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks();
            renderTasks();
        }
    }

    // Delete a task
    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }

    // --- Search and Sort ---
    searchInput.addEventListener('input', renderTasks);
    sortSelect.addEventListener('change', renderTasks);

    // --- Drag and Drop Functionality ---
    function addDragAndDropListeners() {
        const taskItems = document.querySelectorAll('.task-item');

        taskItems.forEach(item => {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('dragleave', handleDragLeave);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragend', handleDragEnd);
        });
    }

    function handleDragStart(e) {
        draggedItem = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.dataset.id); // Set data for transfer
        setTimeout(() => this.classList.add('dragging'), 0); // Add class after a tiny delay
    }

    function handleDragOver(e) {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
        const target = e.target.closest('.task-item');
        if (target && target !== draggedItem) {
            // Add a visual cue for where the item will be dropped
            const boundingBox = target.getBoundingClientRect();
            const offset = boundingBox.y + (boundingBox.height / 2);
            if (e.clientY < offset) {
                target.style.borderTop = '2px solid var(--button-bg)';
                target.style.borderBottom = 'none';
            } else {
                target.style.borderBottom = '2px solid var(--button-bg)';
                target.style.borderTop = 'none';
            }
        }
    }

    function handleDragLeave() {
        this.style.borderTop = 'none';
        this.style.borderBottom = 'none';
    }

    function handleDrop(e) {
        e.preventDefault();
        const dropTarget = e.target.closest('.task-item');

        if (dropTarget && draggedItem && dropTarget !== draggedItem) {
            const draggedId = draggedItem.dataset.id;
            const droppedId = dropTarget.dataset.id;

            const draggedIndex = tasks.findIndex(task => task.id === draggedId);
            const droppedIndex = tasks.findIndex(task => task.id === droppedId);

            if (draggedIndex > -1 && droppedIndex > -1) {
                const [removed] = tasks.splice(draggedIndex, 1);

                const boundingBox = dropTarget.getBoundingClientRect();
                const offset = boundingBox.y + (boundingBox.height / 2);

                if (e.clientY < offset) {
                    // Drop above the target
                    tasks.splice(droppedIndex, 0, removed);
                } else {
                    // Drop below the target
                    tasks.splice(droppedIndex + 1, 0, removed);
                }
                saveTasks();
                renderTasks(); // Re-render to reflect new order
            }
        }
    }

    function handleDragEnd() {
        this.classList.remove('dragging');
        // Remove any temporary borders from all items
        document.querySelectorAll('.task-item').forEach(item => {
            item.style.borderTop = 'none';
            item.style.borderBottom = 'none';
        });
        draggedItem = null;
    }

    // --- Data Export/Import ---
    exportBtn.addEventListener('click', () => {
        const tasksJson = localStorage.getItem('tasks') || '[]';
        const blob = new Blob([tasksJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'todo_tasks.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showMessageBox('Tasks exported successfully as todo_tasks.json!');
    });

    importBtn.addEventListener('click', () => {
        importFile.click(); // Trigger the hidden file input click
    });

    importFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedTasks = JSON.parse(e.target.result);
                    // Option: Replace existing tasks
                    tasks = importedTasks;
                    // Option: Merge with existing tasks (uncomment if preferred)
                    // const existingTaskIds = new Set(tasks.map(t => t.id));
                    // importedTasks.forEach(newTask => {
                    //     if (!existingTaskIds.has(newTask.id)) {
                    //         tasks.push(newTask);
                    //     }
                    // });

                    saveTasks();
                    renderTasks();
                    showMessageBox('Tasks imported successfully!');
                } catch (error) {
                    showMessageBox('Error importing tasks: Invalid JSON file.');
                    console.error('Import error:', error);
                }
            };
            reader.readAsText(file);
        }
    });

    // --- Dark Mode Toggle ---
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        // Save user preference
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>'; // Change icon to sun
            darkModeToggle.setAttribute('aria-label', 'Toggle light mode');
        } else {
            localStorage.setItem('darkMode', 'disabled');
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>'; // Change icon to moon
            darkModeToggle.setAttribute('aria-label', 'Toggle dark mode');
        }
    });

    // Apply dark mode preference on load
    function applyDarkModePreference() {
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            darkModeToggle.setAttribute('aria-label', 'Toggle light mode');
        } else {
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            darkModeToggle.setAttribute('aria-label', 'Toggle dark mode');
        }
    }

    // --- Notifications ---
    function requestNotificationPermission() {
        if (!("Notification" in window)) {
            console.log("This browser does not support desktop notification");
        } else if (Notification.permission === "default") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    console.log("Notification permission granted.");
                } else {
                    console.log("Notification permission denied.");
                }
            });
        }
    }

    function checkDailyNotifications() {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const tasksDueToday = tasks.filter(task =>
            task.dueDate === today && !task.completed
        );

        if (tasksDueToday.length > 0 && Notification.permission === "granted") {
            tasksDueToday.forEach(task => {
                new Notification('To-Do Reminder: Task Due Today!', {
                    body: `${task.text} (${task.category})`,
                    icon: 'https://placehold.co/64x64/3498db/ffffff?text=TD' // Placeholder icon
                });
            });
        }
    }

    // --- Initialization ---
    // Set min date for due date input to today
    dueDateInput.min = new Date().toISOString().split('T')[0];

    applyDarkModePreference();
    loadTasks(); // Load tasks on page load
    requestNotificationPermission(); // Request notification permission

    // Check for notifications every hour (adjust as needed)
    // Note: Browser tabs might suspend background timers.
    setInterval(checkDailyNotifications, 60 * 60 * 1000); // Every hour
    // Also check once on load to catch tasks due today that were already loaded
    checkDailyNotifications();
});
