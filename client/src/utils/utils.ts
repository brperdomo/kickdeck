export const formatDate = (dateString: string | Date | null) => {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return '-';
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return format(utcDate, 'MMM d, yyyy');
  } catch {
    return '-';
  }
};