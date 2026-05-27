export const isShopOpenNow = (date = new Date()) => {
  const day = date.getDay();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const currentMinutes = hour * 60 + minute;
  const openMinutes = 9 * 60;
  const closeMinutes = 17 * 60;

  const isWeekday = day >= 1 && day <= 5;
  const isWithinHours = currentMinutes >= openMinutes && currentMinutes < closeMinutes;

  return isWeekday && isWithinHours;
};

export const getShopHoursLabel = (date = new Date()) => {
  if (isShopOpenNow(date)) {
    return 'Open now · Mon-Fri 9:00 AM to 5:00 PM';
  }

  return 'Closed now · Mon-Fri 9:00 AM to 5:00 PM';
};

export const getShopHoursBadge = (date = new Date()) => {
  const open = isShopOpenNow(date);

  return {
    open,
    label: open ? 'Open now' : 'Closed now',
    accent: open ? '#10B981' : '#EF4444',
    background: open ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
  };
};