export const formatDate = (dateString: string | Date | null) => {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return '-';
    return format(new Date(date.toISOString().split('T')[0]), 'MMM d, yyyy');
  } catch {
    return '-';
  }
};