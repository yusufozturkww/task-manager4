import { getTasks } from './taskManager.js';
import { getStoredData } from './utils.js';

const completedTasksRatioEl = document.getElementById('completedTasksRatio');
const busiestDayEl = document.getElementById('busiestDay');
const totalWorkHoursEl = document.getElementById('totalWorkHours');

export const calculateStatistics = () => {
    const tasks = getTasks();
    const completedTasks = tasks.filter(task => task.completed);
    const completedTasksDurations = getStoredData('completedTaskDurations') || [];

    const totalTasks = tasks.length;
    const ratio = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

    const taskCountsByDay = {};
    tasks.forEach(task => {
        const date = new Date(task.date);
        const dayOfWeek = date.getDay();
        const dayName = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][dayOfWeek];
        taskCountsByDay[dayName] = (taskCountsByDay[dayName] || 0) + 1;
    });

    let busiestDay = 'Yok';
    let maxTasks = 0;
    for (const day in taskCountsByDay) {
        if (taskCountsByDay[day] > maxTasks) {
            maxTasks = taskCountsByDay[day];
            busiestDay = day;
        }
    }

    let totalHours = 0;
    completedTasksDurations.forEach(item => {
        totalHours += item.durationHours;
    });

    return {
        completedTasksRatio: ratio.toFixed(1),
        busiestDay: busiestDay,
        totalWorkHours: totalHours.toFixed(1)
    };
};

export const updateStatisticsDisplay = () => {
    const stats = calculateStatistics();
    completedTasksRatioEl.textContent = `${stats.completedTasksRatio}%`;
    busiestDayEl.textContent = stats.busiestDay;
    totalWorkHoursEl.textContent = `${stats.totalWorkHours} Saat`;
};