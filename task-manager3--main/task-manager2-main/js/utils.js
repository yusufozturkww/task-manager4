export const generateUniqueId = () => {
    return '_' + Math.random().toString(36).substr(2, 9);
};

export const getStoredData = (key) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`localStorage'dan veri alınırken hata oluştu (${key}):`, error);
        return null;
    }
};

export const saveStoredData = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`localStorage'a veri kaydedilirken hata oluştu (${key}):`, error);
    }
};