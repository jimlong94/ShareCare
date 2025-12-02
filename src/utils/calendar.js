// src/utils/calendar.js

export const generateCalendarLinks = (task) => {
  if (!task.dueDate) return null;

  // Handle Firestore Timestamps or standard Date strings
  const startDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
  
  // Default to 1 hour duration
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const title = encodeURIComponent(`[Zen Planner] ${task.title}`);
  const details = encodeURIComponent(`Assigned to: ${task.assignee || 'Family Member'}\nCategory: ${task.category}\n\nView Task: https://sharecare-app.web.app/tasks`);
  const location = encodeURIComponent("Family Hub");
  
  // Format dates as YYYYMMDDTHHmmssZ (UTC) for maximum compatibility
  const formatDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  // 1. Google Calendar Link
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;

  // 2. ICS File (for Apple/Outlook/Mobile)
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
URL:${googleUrl}
DTSTART:${start}
DTEND:${end}
SUMMARY:[Zen Planner] ${task.title}
DESCRIPTION:${decodeURIComponent(details)}
LOCATION:Family Hub
END:VEVENT
END:VCALENDAR`;

  const icsUrl = `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;

  return { googleUrl, icsUrl };
};