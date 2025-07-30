const notificationContainer = document.getElementById('notification-container');

export const showNotification = (message, type = 'info', duration = 3000) => {
    if (!notificationContainer) {
        console.warn('Bildirim kapsayıcısı bulunamadı (#notification-container). Bildirim gösterilemiyor.');
        return;
    }

    const notification = document.createElement('div');
    notification.classList.add('notification', type);

    let iconClass = '';
    switch (type) {
        case 'success':
            iconClass = 'fas fa-check-circle';
            break;
        case 'error':
            iconClass = 'fas fa-times-circle';
            break;
        case 'warning':
            iconClass = 'fas fa-exclamation-triangle';
            break;
        case 'info':
            iconClass = 'fas fa-info-circle';
            break;
    }
    notification.innerHTML = `<i class="${iconClass}"></i> <span>${message}</span>`;

    notificationContainer.appendChild(notification);

    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    setTimeout(() => {
        notification.classList.remove('show');
        notification.addEventListener('transitionend', () => {
            notification.remove();
        }, { once: true });
    }, duration);
};