import { getStoredData, saveStoredData } from './utils.js';
import { getTasks } from './taskManager.js';

const completedTasksCountSpan = document.getElementById('completedTasksCount');
const totalWorkHoursSpan = document.getElementById('totalWorkHours');
const busiestDaySpan = document.getElementById('busiestDay');

export const updateStatistics = () => {
    const tasks = getTasks();
    const completedTaskDurations = getStoredData('completedTaskDurations') || [];

    const completedTasks = tasks.filter(task => task.completed);
    completedTasksCountSpan.textContent = completedTasks.length;

    const totalHours = completedTaskDurations.reduce((sum, entry) => sum + entry.durationHours, 0);
    totalWorkHoursSpan.textContent = totalHours.toFixed(1);

    const dailyTaskCounts = {};
    tasks.forEach(task => {
        if (!task.completed) {
            dailyTaskCounts[task.date] = (dailyTaskCounts[task.date] || 0) + 1;
        }
    });

    let maxTasks = 0;
    let busiestDay = 'Yok';

    for (const date in dailyTaskCounts) {
        if (dailyTaskCounts[date] > maxTasks) {
            maxTasks = dailyTaskCounts[date];
            busiestDay = new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        }
    }
    busiestDaySpan.textContent = busiestDay;
};