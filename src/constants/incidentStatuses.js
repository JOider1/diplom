export const INCIDENT_STATUSES = ['В роботі', 'На перевірці', 'Закрито']

export function normalizeIncidentStatus(status) {
  if (INCIDENT_STATUSES.includes(status)) {
    return status
  }
  const s = String(status || '').toLowerCase()
  if (s.includes('закрит')) {
    return 'Закрито'
  }
  if (s.includes('перевір')) {
    return 'На перевірці'
  }
  return 'В роботі'
}
