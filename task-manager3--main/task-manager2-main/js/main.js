import { renderCalendar } from './calendar.js';
import { setupDragAndDrop } from './dragDrop.js';
import { addTask, updateTask, getTaskById, recordTaskCompletion } from './taskManager.js';
import { showNotification } from './notification.js';
import { updateStatistics } from './stats.js';

const taskForm = document.getElementById('taskForm');
const taskModal = document.getElementById('taskModal');
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

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const taskId = taskIdInput.value;
    const taskName = taskNameInput.value;
    const taskDescription = taskDescriptionInput.value;
    const taskDate = taskDateInput.value;
    const taskStartTime = taskStartTimeInput.value;
    const taskEndTime = taskEndTimeInput.value;
    const taskColor = taskColorInput.value;
    const taskPriority = taskPriorityInput.value;
    const taskRepeat = taskRepeatInput.value;

    if (!taskName || !taskDate || !taskStartTime || !taskEndTime) {
        showNotification('Lütfen tüm zorunlu alanları doldurun: Ad, Tarih, Başlangıç Saati, Bitiş Saati.', 'error');
        return;
    }

    const taskData = {
        name: taskName,
        description: taskDescription,
        date: taskDate,
        startTime: taskStartTime,
        endTime: taskEndTime,
        color: taskColor,
        priority: taskPriority,
        repeat: taskRepeat
    };

    let success;
    if (taskId) {
        success = updateTask(taskId, taskData);
    } else {
        success = addTask(taskData);
    }

    if (success) {
        taskForm.reset();
        taskModal.classList.remove('show');
        document.dispatchEvent(new Event('taskUpdated'));
    }
});

document.addEventListener('DOMContentLoaded', () => {
    renderCalendar();
    setupDragAndDrop();
    updateStatistics();
});