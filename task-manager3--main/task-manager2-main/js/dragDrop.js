import { updateTask, deleteTask } from './taskManager.js';
import { showNotification } from './notification.js';

export const setupDragAndDrop = () => {
    const draggables = document.querySelectorAll('.task-item');
    const dayDropZones = document.querySelectorAll('.day-cell.current-month');
    const trashCan = document.getElementById('trashCan');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', draggable.dataset.taskId);
            e.target.classList.add('dragging');
            if (trashCan) {
                trashCan.style.opacity = '1';
                trashCan.style.pointerEvents = 'auto';
            }
        });

        draggable.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
            if (trashCan) {
                trashCan.classList.remove('drag-over');
                trashCan.style.opacity = '0';
                trashCan.style.pointerEvents = 'none';
            }
            document.dispatchEvent(new Event('taskUpdated'));
        });
    });

    dayDropZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
            if (trashCan) {
                trashCan.classList.remove('drag-over');
            }
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');

            const taskId = e.dataTransfer.getData('text/plain');
            const newDate = zone.dataset.date;
            const draggedTaskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);

            if (taskId && newDate) {
                import('./taskManager.js').then(({ getTaskById }) => {
                    const task = getTaskById(taskId);
                    if (task) {
                        const updatedData = { ...task, date: newDate };

                        const success = updateTask(taskId, updatedData);
                        if (success) {
                            showNotification(`Görev başarıyla ${newDate} tarihine taşındı.`, 'success');
                        }
                    } else {
                        showNotification(`Hata: Taşınacak görev bulunamadı.`, 'error');
                    }
                });
            }
        });
    });

    if (trashCan) {
        trashCan.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            trashCan.classList.add('drag-over');
            dayDropZones.forEach(zone => zone.classList.remove('drag-over'));
        });

        trashCan.addEventListener('dragleave', () => {
            trashCan.classList.remove('drag-over');
        });

        trashCan.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            trashCan.classList.remove('drag-over');

            const taskId = e.dataTransfer.getData('text/plain');
            const draggedTaskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);

            if (taskId) {
                const success = deleteTask(taskId);
                if (success) {
                    if (draggedTaskElement) {
                        draggedTaskElement.remove();
                    }
                }
            }
        });
    }
};