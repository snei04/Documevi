function addBusinessDays(startDate, days) {
    let currentDate = new Date(startDate);
    let added = 0;
    // Mientras no se hayan añadido los días hábiles requeridos
    while (added < days) {
        currentDate.setDate(currentDate.getDate() + 1);
        const dayOfWeek = currentDate.getDay();
        // 0 = Domingo, 6 = Sábado
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            added++;
        }
    }
    return currentDate;
}

module.exports = { addBusinessDays };