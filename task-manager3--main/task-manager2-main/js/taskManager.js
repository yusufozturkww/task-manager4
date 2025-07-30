import { generateUniqueId, getStoredData, saveStoredData } from './utils.js';
import { showNotification } from './notification.js';

let tasks = getStoredData('tasks') || [];

export const getTasks = () => {
    return tasks;
};

const checkOverlap = (newTaskData, excludeTaskId = null) => {
    if (!newTaskData.date || !newTaskData.startTime || !newTaskData.endTime) {
        showNotification('Hata: Görev tarihi veya saat bilgileri eksik. Lütfen kontrol edin.', 'error');
        return true;
    }

    const newStartTime = new Date(`${newTaskData.date}T${newTaskData.startTime}`);
    const newEndTime = new Date(`${newTaskData.date}T${newTaskData.endTime}`);

    if (newEndTime <= newStartTime) {
        showNotification('Hata: Bitiş saati başlangıç saatinden sonra olmalıdır.', 'error');
        return true;
    }

    return tasks.some(existingTask => {
        if (existingTask.id === excludeTaskId) {
            return false;
        }

        if (!existingTask.date || !existingTask.startTime || !existingTask.endTime) {
            return false;
        }

        if (existingTask.date === newTaskData.date) {
            const existingStartTime = new Date(`${existingTask.date}T${existingTask.startTime}`);
            const existingEndTime = new Date(`${existingTask.date}T${existingTask.endTime}`);

            const overlaps = (newStartTime < existingEndTime && newEndTime > existingStartTime);

            if (overlaps) {
                showNotification(`Uyarı: '${newTaskData.name}' görevi, '${existingTask.name}' görevi ile çakışıyor (${existingTask.startTime}-${existingTask.endTime}). Lütfen farklı bir saat aralığı seçin.`, 'warning', 5000);
                return true;
            }
        }
        return false;
    });
};

const _addSingleTask = (taskData, skipOverlapCheck = false) => {
    if (!skipOverlapCheck && checkOverlap(taskData)) {
        return null;
    }

    const newTask = {
        id: generateUniqueId(),
        name: taskData.name,
        description: taskData.description,
        date: taskData.date,
        startTime: taskData.startTime,
        endTime: taskData.endTime,
        color: taskData.color,
        priority: taskData.priority,
        repeat: taskData.repeat,
        completed: false,
        creationDate: new Date().toISOString().split('T')[0],
        completionDate: null
    };
    tasks.push(newTask);
    return newTask;
};

const _generateAndAddRecurringTasks = (originalTask) => {
    const originalDate = new Date(originalTask.date);
    let occurrencesToAdd = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (originalTask.repeat === 'weekly') {
        occurrencesToAdd = 52;
    } else if (originalTask.repeat === 'monthly') {
        occurrencesToAdd = 12;
    } else {
        return;
    }

    let addedCount = 0;
    let skippedCount = 0;

    for (let i = 1; i <= occurrencesToAdd; i++) {
        const nextDate = new Date(originalDate);

        if (originalTask.repeat === 'weekly') {
            nextDate.setDate(originalDate.getDate() + (i * 7));
        } else if (originalTask.repeat === 'monthly') {
            nextDate.setMonth(originalDate.getMonth() + i);
            const originalDay = originalDate.getDate();
            const lastDayOfNextMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
            if (originalDay > lastDayOfNextMonth) {
                nextDate.setDate(lastDayOfNextMonth);
            } else {
                nextDate.setDate(originalDay);
            }
        }

        if (nextDate < today) {
            continue;
        }

        const recurringTaskData = {
            ...originalTask,
            id: generateUniqueId(),
            date: nextDate.toISOString().split('T')[0],
            completed: false,
            completionDate: null,
            repeat: 'none'
        };

        if (_addSingleTask(recurringTaskData, false)) {
            addedCount++;
        } else {
            skippedCount++;
        }
    }

    if (addedCount > 0) {
        showNotification(`${originalTask.name} görevi için ${addedCount} adet tekrarlayan görev oluşturuldu.`, 'success', 5000);
    }
    if (skippedCount > 0) {
        showNotification(`${originalTask.name} görevinin ${skippedCount} adet tekrarı, çakışma nedeniyle eklenemedi.`, 'warning', 7000);
    }
    saveTasks();
    document.dispatchEvent(new Event('taskUpdated'));
};

export const addTask = (taskData) => {
    const addedTask = _addSingleTask(taskData);

    if (addedTask) {
        showNotification(`'${addedTask.name}' görevi başarıyla eklendi!`, 'success');
        if (addedTask.repeat !== 'none') {
            _generateAndAddRecurringTasks(addedTask);
        }
        saveTasks();
        return addedTask;
    } else {
        return null;
    }
};

export const getTaskById = (id) => {
    return tasks.find(task => task.id === id);
};

export const updateTask = (id, updatedData) => {
    const taskIndex = tasks.findIndex(task => task.id === id);

    if (taskIndex > -1) {
        const originalTask = tasks[taskIndex];

        const isTimeOrDateChanged = updatedData.date !== originalTask.date ||
                                   updatedData.startTime !== originalTask.startTime ||
                                   updatedData.endTime !== originalTask.endTime;

        if (isTimeOrDateChanged) {
            const prospectiveTaskData = { ...originalTask, ...updatedData };

            if (checkOverlap(prospectiveTaskData, id)) {
                return false;
            }
        }

        if (updatedData.completed === true && !originalTask.completed) {
            updatedData.completionDate = new Date().toISOString().split('T')[0];
            showNotification(`'${originalTask.name}' görevi tamamlandı! Harika iş!`, 'success');
            recordTaskCompletion(tasks[taskIndex]);
        } else if (updatedData.completed === false && originalTask.completed) {
            updatedData.completionDate = null;
            showNotification(`'${originalTask.name}' görevi tamamlanmadı olarak işaretlendi.`, 'info');
        }

        tasks[taskIndex] = { ...originalTask, ...updatedData };
        saveTasks();
        showNotification(`'${tasks[taskIndex].name}' görevi başarıyla güncellendi!`, 'success');
        return true;
    }
    showNotification('Hata: Görev güncellenemedi, bulunamadı.', 'error');
    return false;
};

export const deleteTask = (id) => {
    const taskIndex = tasks.findIndex(task => task.id === id);

    if (taskIndex > -1) {
        tasks.splice(taskIndex, 1);
        saveTasks();
        showNotification('Görev başarıyla silindi!', 'success');
        return true;
    }

    return false;
};

export const saveTasks = () => {
    saveStoredData('tasks', tasks);
};

export const recordTaskCompletion = (task) => {
    let completedTaskDurations = getStoredData('completedTaskDurations') || [];

    const start = new Date(`${task.date}T${task.startTime}`);
    const end = new Date(`${task.date}T${task.endTime}`);
    const durationMs = end - start;

    const durationHours = durationMs / (1000 * 60 * 60);

    if (!isNaN(durationHours) && durationHours > 0) {
        completedTaskDurations.push({
            taskName: task.name,
            date: new Date().toISOString().split('T')[0],
            durationHours: durationHours
        });
        saveStoredData('completedTaskDurations', completedTaskDurations);
    } else {
        console.warn(`Geçersiz süre hesaplaması için görev: ${task.name}. Süre: ${durationHours} saat.`);
    }
};

export const getAverageDurationForTaskName = (taskName) => {
    const completedTaskDurations = getStoredData('completedTaskDurations') || [];
    const relevantCompletions = completedTaskDurations.filter(c => c.taskName === taskName);

    if (relevantCompletions.length === 0) {
        return 0;
    }

    const totalDuration = relevantCompletions.reduce((sum, current) => sum + current.durationHours, 0);
    return totalDuration / relevantCompletions.length;
};