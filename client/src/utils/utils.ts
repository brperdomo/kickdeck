export const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return format(date, 'MMM d, yyyy');
  } catch {
    return '-';
  }
};