import { getTasks, getTaskById, updateTask, recordTaskCompletion, deleteTask } from './taskManager.js';
import { setupDragAndDrop } from './dragDrop.js';
import { showNotification } from './notification.js';
import { updateStatistics } from './stats.js';

const calendarView = document.getElementById('calendarView');
const currentMonthYear = document.getElementById('currentMonthYear');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const todayTasksList = document.getElementById('todayTasksList');
const todayDateSpan = document.getElementById('todayDate');
const taskModal = document.getElementById('taskModal');
const addTaskBtn = document.getElementById('addTaskBtn');
const closeButton = taskModal.querySelector('.close-button');
const taskForm = document.getElementById('taskForm');
const taskIdInput = document.getElementById('taskId');
const taskNameInput = document.getElementById('taskName');
const taskDescriptionInput = document.getElementById('taskDescription');
const taskDateInput = document.getElementById('taskDate');
const taskStartTimeInput = document.getElementById('taskStartTime');
const taskEndTimeInput = document.getElementById('taskEndTime');
const taskColorInput = document.getElementById('taskColor');
const taskPriorityInput = document.getElementById('taskPriority');
const taskRepeatInput = document.getElementById('taskRepeat');
const smartSuggestionBox = document.getElementById('smartSuggestion');
const suggestedDurationSpan = document.getElementById('suggestedDuration');


let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedTaskForEdit = null;

export const renderCalendar = () => {
    calendarView.innerHTML = '';

    const calendarHeader = document.createElement('div');
    calendarHeader.classList.add('calendar-header');
    const daysOfWeek = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    daysOfWeek.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.textContent = day;
        calendarHeader.appendChild(dayElement);
    });
    calendarView.appendChild(calendarHeader);

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const numDaysInMonth = lastDayOfMonth.getDate();

    let startDayIndex = firstDayOfMonth.getDay();
    if (startDayIndex === 0) {
        startDayIndex = 6;
    } else {
        startDayIndex--;
    }

    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayIndex; i > 0; i--) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell', 'prev-month');
        dayCell.textContent = prevMonthLastDay - i + 1;
        calendarView.appendChild(dayCell);
    }

    for (let i = 1; i <= numDaysInMonth; i++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell', 'current-month');
        const currentDate = new Date(currentYear, currentMonth, i);
        const formattedDate = currentDate.toISOString().split('T')[0];
        dayCell.dataset.date = formattedDate;

        const dayNumber = document.createElement('div');
        dayNumber.classList.add('day-number');
        dayNumber.textContent = i;
        dayCell.appendChild(dayNumber);

        const today = new Date();
        if (currentDate.getDate() === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear()) {
            dayCell.classList.add('today');
        }

        const dailyTasks = getTasks().filter(task => task.date === formattedDate && !task.completed);
        dailyTasks.sort((a, b) => {
            const timeA = new Date(`1970/01/01 ${a.startTime}`);
            const timeB = new Date(`1970/01/01 ${b.startTime}`);
            return timeA - timeB;
        });

        dailyTasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.classList.add('task-item', `priority-${task.priority}`);
            taskItem.dataset.taskId = task.id;
            taskItem.draggable = true;

            if (task.color) {
                taskItem.style.backgroundColor = task.color;
            }

            taskItem.innerHTML = `
                <span>${task.startTime} - ${task.name}</span>
                <input type="checkbox" class="task-completion-checkbox" ${task.completed ? 'checked' : ''} title="Tamamlandı olarak işaretle">
            `;
            dayCell.appendChild(taskItem);

            const checkbox = taskItem.querySelector('.task-completion-checkbox');
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                updateTask(task.id, { completed: e.target.checked });
                document.dispatchEvent(new Event('taskUpdated'));
            });

            taskItem.addEventListener('click', (e) => {
                if (!e.target.classList.contains('task-completion-checkbox')) {
                    openTaskModalForEdit(task.id);
                }
            });
        });

        const addTaskOnHoverBtn = document.createElement('button');
        addTaskOnHoverBtn.classList.add('add-task-on-hover');
        addTaskOnHoverBtn.innerHTML = '<i class="fas fa-plus"></i>';
        addTaskOnHoverBtn.title = `Yeni Görev Ekle: ${formattedDate}`;
        addTaskOnHoverBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openTaskModalForNewTask(formattedDate);
        });
        dayCell.appendChild(addTaskOnHoverBtn);


        calendarView.appendChild(dayCell);
    }

    const totalCells = startDayIndex + numDaysInMonth;
    const remainingCells = 42 - totalCells;

    for (let i = 1; i <= remainingCells; i++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell', 'next-month');
        dayCell.textContent = i;
        calendarView.appendChild(dayCell);
    }

    currentMonthYear.textContent = new Date(currentYear, currentMonth).toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

    setupDragAndDrop();
    updateTodayTasks();
};

export const updateTodayTasks = () => {
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];

    todayDateSpan.textContent = today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });

    const tasksForToday = getTasks().filter(task => task.date === formattedToday);
    tasksForToday.sort((a, b) => {
        const timeA = new Date(`1970/01/01 ${a.startTime}`);
        const timeB = new Date(`1970/01/01 ${b.startTime}`);
        return timeA - timeB;
    });

    todayTasksList.innerHTML = '';

    if (tasksForToday.length === 0) {
        const noTaskItem = document.createElement('li');
        noTaskItem.textContent = 'Bugün için görev yok.';
        noTaskItem.style.fontStyle = 'italic';
        noTaskItem.style.color = '#777';
        todayTasksList.appendChild(noTaskItem);
        return;
    }

    tasksForToday.forEach(task => {
        const listItem = document.createElement('li');
        listItem.dataset.taskId = task.id;

        const taskInfo = document.createElement('span');
        taskInfo.textContent = `${task.startTime} - ${task.endTime}: ${task.name}`;
        if (task.completed) {
            taskInfo.style.textDecoration = 'line-through';
            taskInfo.style.color = '#888';
        }
        listItem.appendChild(taskInfo);

        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('today-task-actions');

        const completeBtn = document.createElement('button');
        completeBtn.classList.add('complete-task-btn');
        completeBtn.textContent = task.completed ? 'Tamamlandı' : 'Tamamla';
        completeBtn.style.backgroundColor = task.completed ? '#28a745' : '#007bff';
        completeBtn.style.color = 'white';
        completeBtn.style.border = 'none';
        completeBtn.style.padding = '5px 10px';
        completeBtn.style.borderRadius = '5px';
        completeBtn.style.cursor = 'pointer';
        completeBtn.addEventListener('click', () => {
            updateTask(task.id, { completed: !task.completed });
            document.dispatchEvent(new Event('taskUpdated'));
        });
        actionsDiv.appendChild(completeBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-task-btn-sidebar');
        deleteBtn.textContent = 'Sil';
        deleteBtn.addEventListener('click', () => {
            deleteTask(task.id);
            document.dispatchEvent(new Event('taskUpdated'));
        });
        actionsDiv.appendChild(deleteBtn);

        listItem.appendChild(actionsDiv);
        todayTasksList.appendChild(listItem);
    });
};

const openTaskModalForNewTask = (date) => {
    selectedTaskForEdit = null;
    taskForm.reset();
    taskIdInput.value = '';
    taskDateInput.value = date;
    taskRepeatInput.value = 'none';
    smartSuggestionBox.style.display = 'none';
    taskNameInput.removeEventListener('input', updateSmartSuggestion);

    taskModal.classList.add('show');
};

const openTaskModalForEdit = (taskId) => {
    const task = getTaskById(taskId);
    if (task) {
        selectedTaskForEdit = task.id;
        taskIdInput.value = task.id;
        taskNameInput.value = task.name;
        taskDescriptionInput.value = task.description;
        taskDateInput.value = task.date;
        taskStartTimeInput.value = task.startTime;
        taskEndTimeInput.value = task.endTime;
        taskColorInput.value = task.color;
        taskPriorityInput.value = task.priority;
        taskRepeatInput.value = task.repeat;

        taskNameInput.removeEventListener('input', updateSmartSuggestion);
        taskNameInput.addEventListener('input', updateSmartSuggestion);

        updateSmartSuggestion();
        smartSuggestionBox.style.display = 'flex';

        taskModal.classList.add('show');
    } else {
        showNotification('Hata: Düzenlenecek görev bulunamadı.', 'error');
    }
};

const updateSmartSuggestion = () => {
    import('./taskManager.js').then(({ getAverageDurationForTaskName }) => {
        const currentTaskName = taskNameInput.value.trim();
        if (currentTaskName) {
            const avgDuration = getAverageDurationForTaskName(currentTaskName);
            if (avgDuration > 0) {
                suggestedDurationSpan.textContent = avgDuration.toFixed(1);
                smartSuggestionBox.style.display = 'flex';
            } else {
                suggestedDurationSpan.textContent = 'geçmiş kaydı yok';
            }
        } else {
            suggestedDurationSpan.textContent = 'görev adı girin';
        }
    }).catch(error => console.error("Smart suggestion module load error:", error));
};

const closeTaskModal = () => {
    taskModal.classList.remove('show');
    taskForm.reset();
    selectedTaskForEdit = null;
    taskIdInput.value = '';
    taskNameInput.removeEventListener('input', updateSmartSuggestion);
    smartSuggestionBox.style.display = 'none';
};

prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
});

addTaskBtn.addEventListener('click', () => openTaskModalForNewTask(new Date().toISOString().split('T')[0]));

closeButton.addEventListener('click', closeTaskModal);

window.addEventListener('click', (event) => {
    if (event.target === taskModal) {
        closeTaskModal();
    }
});

document.addEventListener('taskUpdated', () => {
    renderCalendar();
    updateTodayTasks();
    updateStatistics();
});

renderCalendar();