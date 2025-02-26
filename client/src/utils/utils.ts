export const formatDate = (dateString: string | Date | null) => {
  try {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    // Use UTC to avoid timezone shifts
    return format(new Date(date.toISOString().split('T')[0]), 'MMM d, yyyy');
  } catch {
    return '-';
  }
};