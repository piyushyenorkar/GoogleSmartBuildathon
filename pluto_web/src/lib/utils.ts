/**
 * Utility functions — full 1:1 port from utils.js
 */



/**
 * Strips seconds from a time string "HH:MM:SS" → "HH:MM".
 * Safely returns '' for null/undefined.
 */
export function stripSeconds(timeStr?: string | null): string {
  if (!timeStr) return ''
  return timeStr.slice(0, 5)
}

/**
 * Formats a date range or single date.
 * If endDate is provided and different from date, returns "Start - End".
 */
export function formatEventDate(dateStr?: string | null, endDateStr?: string | null): string {
  if (!dateStr) return ''
  const start = new Date(dateStr + 'T00:00:00')

  if (!endDateStr || dateStr === endDateStr) {
    return start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const end = new Date(endDateStr + 'T00:00:00')
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
  return `${start.toLocaleDateString('en-IN', opts)} - ${end.toLocaleDateString('en-IN', opts)}`
}

/**
 * Checks if an event is currently active (not in the past).
 * Considers time and end date/time if available.
 * EXACT PORT of isEventActive() from utils.js
 */
export function isEventActive(event: {
  date?: string
  start_date?: string
  time?: string
  start_time?: string
  end_date?: string
  endDate?: string
  end_time?: string
  endTime?: string
  eventDate?: string
  eventTime?: string
}): boolean {
  // Handle both field naming conventions
  const dateStr = event.date || event.start_date || event.eventDate
  if (!dateStr) return false

  const now = new Date()
  const [year, month, day] = dateStr.split('-').map(Number)
  const eventStart = new Date(year, month - 1, day)

  const timeStr = event.time || event.start_time || event.eventTime
  if (timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number)
    eventStart.setHours(hours, minutes, 0, 0)
  }

  // Determine when the event ends
  let eventEnd = new Date(eventStart)

  const endDateStr = event.endDate || event.end_date
  if (endDateStr && endDateStr !== dateStr) {
    const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number)
    eventEnd = new Date(endYear, endMonth - 1, endDay)
    const endTimeStr = event.endTime || event.end_time
    if (!endTimeStr) {
      eventEnd.setHours(23, 59, 59, 999)
    }
  }

  const endTimeStr = event.endTime || event.end_time
  if (endTimeStr) {
    const [endHours, endMinutes] = endTimeStr.split(':').map(Number)

    if (!endDateStr && timeStr) {
      const startH = eventStart.getHours()
      const startM = eventStart.getMinutes()
      if (endHours < startH || (endHours === startH && endMinutes < startM)) {
        eventEnd.setDate(eventEnd.getDate() + 1)
      }
    }

    eventEnd.setHours(endHours, endMinutes, 0, 0)
  } else if (!endDateStr) {
    eventEnd.setHours(23, 59, 59, 999)
  } else {
    eventEnd.setHours(23, 59, 59, 999)
  }

  return eventEnd >= now
}

/**
 * Checks if an event is currently "Live" (happening right now).
 * EXACT PORT of checkIsLive() from utils.js
 */
export function checkIsLive(event: {
  date?: string
  start_date?: string
  time?: string
  start_time?: string
  end_date?: string
  endDate?: string
  end_time?: string
  endTime?: string
}): boolean {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`

  const eventDate = event.date || event.start_date || ''
  const eventEndDate = event.endDate || event.end_date || ''
  const eventTime = event.time || event.start_time || ''
  const eventEndTime = event.endTime || event.end_time || ''

  // Multi-day event
  if (eventEndDate && eventEndDate !== eventDate) {
    if (eventDate > todayStr) return false // Future
    if (eventEndDate < todayStr) return false // Past

    // Middle days — always live
    if (eventDate < todayStr && eventEndDate > todayStr) return true

    // Start day — check start time
    if (eventDate === todayStr) {
      if (!eventTime) return true
      const [h, m] = eventTime.split(':').map(Number)
      const start = new Date()
      start.setHours(h, m, 0)
      return now >= start
    }

    // End day — check end time
    if (eventEndDate === todayStr) {
      if (!eventEndTime) return true
      const [eh, em] = eventEndTime.split(':').map(Number)
      const end = new Date()
      end.setHours(eh, em, 0)
      return now <= end
    }
  } else {
    // Single Day Event
    if (eventDate !== todayStr) return false

    if (!eventTime) return true

    const [h, m] = eventTime.split(':').map(Number)
    const start = new Date()
    start.setHours(h, m, 0)

    const end = new Date()
    if (eventEndTime) {
      const [eh, em] = eventEndTime.split(':').map(Number)
      end.setHours(eh, em, 0)
    } else {
      end.setHours(23, 59, 59)
    }

    return now >= start && now <= end
  }
  return false
}

/**
 * Checks if a competition is currently active (registration deadline not passed).
 */
export function isCompetitionActive(competition: { registration_deadline?: string | null }): boolean {
  if (!competition.registration_deadline) return true;

  const dl = new Date(competition.registration_deadline);
  const now = new Date();
  const diffDays = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return diffDays >= 0;
}

/** Format date for display */
export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const safeStr = dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00'
  const date = new Date(safeStr)
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Format time for display (HH:MM → 12h format) */
export function formatTime(timeStr: string): string {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

/** Format price in INR */
export function formatPrice(amount: number): string {
  if (typeof amount !== 'number') return '₹0'
  return `₹${amount.toLocaleString('en-IN')}`
}

/**
 * Formats a number compactly (e.g. 1500 -> 1.5k)
 */
export function formatCompactNumber(num: number): string {
  if (!num) return '0'
  if (num >= 10000000) return (num / 10000000).toFixed(1).replace(/\.0$/, '') + 'Cr'
  if (num >= 100000) return (num / 100000).toFixed(1).replace(/\.0$/, '') + 'L'
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return num.toString()
}

/**
 * Format price in INR compactly (e.g. ₹1.5k)
 */
export function formatCompactPrice(amount: number): string {
  if (amount === 0) return '₹0'
  return `₹${formatCompactNumber(amount)}`
}

/** Format currency strictly without 'Free' fallback for balances/ledgers */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

/** Get user initials from name */
export function getInitials(name?: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/** Truncate text with ellipsis */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/** Format target years and sections into a readable string */
export function formatTargetAudience(item: any): string | null {
  if (!item) return null;
  if (item.is_universal || item.department === 'ALL') return null; // College wide

  let parsedYears: string[] = []
  if (Array.isArray(item.target_years)) {
    parsedYears = item.target_years.map(String)
  } else if (typeof item.target_years === 'string') {
    try {
      parsedYears = JSON.parse(item.target_years).map(String)
    } catch {
      const clean = item.target_years.replace(/[{}]/g, '')
      if (clean) parsedYears = clean.split(',').map((s: string) => s.trim())
    }
  }

  if (parsedYears.length === 0) return null;

  const audience = parsedYears.sort().map(y => {
    return formatYearLabel(y, item.course)
  }).join(' • ')

  return audience
}

export async function getCroppedImage(file: File, zoom: number): Promise<File> {
  if (zoom <= 1) return file;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);

      const targetWidth = img.width / zoom;
      const targetHeight = img.height / zoom;
      const startX = (img.width - targetWidth) / 2;
      const startY = (img.height - targetHeight) / 2;

      ctx.drawImage(
        img,
        startX, startY, targetWidth, targetHeight,
        0, 0, canvas.width, canvas.height
      );

      canvas.toBlob((blob) => {
        if (!blob) return resolve(file);
        const newFile = new File([blob], file.name, { type: file.type || 'image/jpeg' });
        resolve(newFile);
      }, file.type || 'image/jpeg', 0.9);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

export function isTeamActive(team: {
  event_date?: string | null;
  event_time?: string | null;
}): boolean {
  if (!team.event_date) return true; // Assume active if no date specified

  let startDateStr = team.event_date;
  if (team.event_date.includes(' to ')) {
    startDateStr = team.event_date.split(' to ')[0].trim();
  }

  let startTimeStr = team.event_time || '';
  if (team.event_time?.includes(' to ')) {
    startTimeStr = team.event_time.split(' to ')[0].trim();
  }

  const now = new Date();
  const [year, month, day] = startDateStr.split('-').map(Number);
  if (!year || !month || !day) return true;

  const eventStart = new Date(year, month - 1, day);

  if (startTimeStr) {
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      eventStart.setHours(hours, minutes, 0, 0);
    }
  } else {
    eventStart.setHours(23, 59, 59, 999);
  }

  // Active if the current time is strictly less than the event's start time
  return now.getTime() < eventStart.getTime();
}

export function sortTeamsByPriority(teams: any[]): any[] {
  return [...teams].sort((a, b) => {
    const aApproved = a.team_members?.filter((m: any) => m.status === 'approved').length || 0;
    const bApproved = b.team_members?.filter((m: any) => m.status === 'approved').length || 0;
    const aTotal = a.team_size || 4;
    const bTotal = b.team_size || 4;

    const aIsFull = (aApproved + 1) >= aTotal ? 1 : 0;
    const bIsFull = (bApproved + 1) >= bTotal ? 1 : 0;

    if (aIsFull !== bIsFull) {
      return aIsFull - bIsFull;
    }

    return 0;
  });
}

export function formatYearLabel(year: string | number, course?: string | null): string {
  const n = typeof year === 'string' ? parseInt(year.replace(/\D/g, ''), 10) : year;
  if (isNaN(n)) return String(year);

  const isEng = course ? /B\.?E|B\.?Tech/i.test(course) : false;
  if (isEng) {
    if (n === 1) return 'FE';
    if (n === 2) return 'SE';
    if (n === 3) return 'TE';
    if (n === 4) return 'BE';
  }

  if (n === 1) return '1st Year';
  if (n === 2) return '2nd Year';
  if (n === 3) return '3rd Year';
  return `${n}th Year`;
}
