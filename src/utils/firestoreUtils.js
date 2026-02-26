/**
 * Normalize Firestore values for consistent rendering (Timestamp vs string).
 * Use these when reading from Firestore so UI always gets strings/numbers.
 */

/**
 * Get a YYYY-MM-DD date string from prescription or appointment date field.
 * Handles: Firestore Timestamp, ISO string, or date object.
 */
export function getDateString(value) {
  if (!value) return ''
  if (typeof value.toDate === 'function') return value.toDate().toISOString().split('T')[0]
  if (typeof value === 'string') return value.split('T')[0]
  try {
    const d = new Date(value)
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

/**
 * Get a Date object from a Firestore date field (Timestamp or string).
 */
export function getDateObject(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

/**
 * Get display-friendly date string (e.g. for table/card).
 */
export function getDisplayDate(value) {
  const d = getDateObject(value)
  return d ? d.toLocaleDateString() : ''
}

/**
 * Get display-friendly time string (preserves existing string like "10:00" or from Timestamp).
 */
export function getDisplayTime(value) {
  if (!value) return ''
  if (typeof value === 'string' && /^\d{1,2}:\d{2}/.test(value)) return value
  if (typeof value.toDate === 'function') return value.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  try {
    const d = new Date(value)
    return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

/**
 * Normalize prescription for UI: ensure date is string, handle optional fields.
 */
export function normalizePrescription(doc) {
  const data = typeof doc.data === 'function' ? { id: doc.id, ...doc.data() } : doc
  const dateStr = getDateString(data.date ?? data.prescriptionDate)
  return {
    ...data,
    id: data.id || doc.id,
    prescriptionDate: dateStr || data.prescriptionDate || '',
    dateDisplay: dateStr ? getDisplayDate(data.date ?? data.prescriptionDate) : (data.prescriptionDate || '')
  }
}

/**
 * Normalize appointment for UI: ensure appointmentDate and time are display-ready.
 */
export function normalizeAppointment(doc) {
  const data = typeof doc.data === 'function' ? { id: doc.id, ...doc.data() } : doc
  const dateStr = getDateString(data.date ?? data.appointmentDate)
  return {
    ...data,
    id: data.id || doc.id,
    appointmentDate: dateStr || data.appointmentDate || '',
    appointmentDateDisplay: dateStr ? getDisplayDate(data.date ?? data.appointmentDate) : (data.appointmentDate || ''),
    appointmentTimeDisplay: getDisplayTime(data.appointmentTime ?? data.time) || data.appointmentTime || ''
  }
}

/**
 * Safe string for display (avoid [object Object] for Timestamps).
 */
export function safeString(value, fallback = '') {
  if (value == null) return fallback
  if (typeof value === 'string') return value
  if (typeof value.toDate === 'function') return value.toDate().toLocaleString()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}
