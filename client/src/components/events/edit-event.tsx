applicationDeadline: event.applicationDeadline 
  ? (event.applicationDeadline.includes('T') 
      ? event.applicationDeadline.split('T')[0] 
      : event.applicationDeadline)
  : '',