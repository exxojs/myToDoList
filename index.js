// index.js (updated)

// Get the todo list elements
const todoListDesktop = document.getElementById('todo-list');
const todoListMobile = document.getElementById('todo-list-mobile');

// Get the new task input element
const newTaskInput = document.getElementById('new-task');

// Get the add task button element
const addTaskButton = document.getElementById('add-task');

// Get the clear all button element
const clearAllButton = document.getElementById('clear-all');

// Initialize an empty array to store tasks
let tasks = [];

// Function to add a new task
function addTask() {
    const taskText = newTaskInput.value.trim();
    if (taskText) {
        tasks.push(taskText);
        newTaskInput.value = '';
        renderTasksDesktop();
        renderTasksMobile();
    }
}

// Function to render tasks for desktop
function renderTasksDesktop() {
    todoListDesktop.innerHTML = '';
    tasks.forEach((task, index) => {
        const taskElement = document.createElement('li');
        taskElement.setAttribute('draggable', true);
        taskElement.dataset.index = index;
        const taskTextElement = document.createElement('span');
        taskTextElement.textContent = task;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.dataset.index = index;
        taskElement.appendChild(taskTextElement);
        taskElement.appendChild(deleteButton);
        todoListDesktop.appendChild(taskElement);
    });
}

// Function to render tasks for mobile
function renderTasksMobile() {
    todoListMobile.innerHTML = '';
    tasks.forEach((task, index) => {
        const taskElement = document.createElement('li');
        const taskTextElement = document.createElement('span');
        taskTextElement.textContent = task;
        const upButton = document.createElement('button');
        upButton.textContent = 'Up';
        upButton.dataset.index = index;
        upButton.onclick = () => moveTaskUp(index);
        const downButton = document.createElement('button');
        downButton.textContent = 'Down';
        downButton.dataset.index = index;
        downButton.onclick = () => moveTaskDown(index);
        taskElement.appendChild(taskTextElement);
        taskElement.appendChild(upButton);
        taskElement.appendChild(downButton);
        todoListMobile.appendChild(taskElement);
    });
}

// Function to handle task deletion
function deleteTask(event) {
    if (event.target.tagName === 'BUTTON') {
        const taskIndex = event.target.dataset.index;
        tasks.splice(taskIndex, 1);
        renderTasksDesktop();
        renderTasksMobile();
    }
}

// Function to clear all tasks
function clearAllTasks() {
    tasks = [];
    renderTasksDesktop();
    renderTasksMobile();
}

// Function to handle drag start
function handleDragStart(event) {
    event.dataTransfer.setData('text', event.target.dataset.index);
    event.dataTransfer.effectAllowed = 'move';
}

// Function to handle drag over
function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}

// Function to handle drop
function handleDrop(event) {
    event.preventDefault();
    const taskIndex = event.dataTransfer.getData('text');
    const targetIndex = event.target.dataset.index;
    if (taskIndex !== targetIndex) {
        const task = tasks[taskIndex];
        tasks.splice(taskIndex, 1);
        tasks.splice(targetIndex, 0, task);
        renderTasksDesktop();
        renderTasksMobile();
    }
}

// Function to move a task up
function moveTaskUp(index) {
    if (index > 0) {
        const task = tasks[index];
        tasks.splice(index, 1);
        tasks.splice(index - 1, 0, task);
        renderTasksDesktop();
        renderTasksMobile();
    }
}

// Function to move a task down
function moveTaskDown(index) {
    if (index < tasks.length - 1) {
        const task = tasks[index];
        tasks.splice(index, 1);
        tasks.splice(index + 1, 0, task);
        renderTasksDesktop();
        renderTasksMobile();
    }
}

// Add event listeners
addTaskButton.addEventListener('click', addTask);
clearAllButton.addEventListener('click', clearAllTasks);
todoListDesktop.addEventListener('click', deleteTask);

// Add event listener to input field to add task on press of Enter key
newTaskInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        addTask();
    }
});

// Add event listeners for drag and drop
todoListDesktop.addEventListener('dragstart', handleDragStart);
todoListDesktop.addEventListener('dragover', handleDragOver);
todoListDesktop.addEventListener('drop', handleDrop);