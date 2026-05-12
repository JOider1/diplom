const parseIncidentTime = (time) => {
  if (!time || typeof time !== 'string') {
    return 0
  }
  const normalized = time.includes('T') ? time : time.replace(' ', 'T')
  const ms = new Date(normalized).getTime()
  return Number.isNaN(ms) ? 0 : ms
}

/** Активний інцидент — не в колонці «Закрито». */
export function isIncidentActive(status) {
  return status === 'В роботі' || status === 'На перевірці'
}

/**
 * Останній запис по обладнанню та узагальнений стан з журналу інцидентів.
 */
export function getEquipmentIncidentSummary(equipmentName, incidents) {
  const list = incidents
    .filter((i) => (i.equipment || '').trim() === (equipmentName || '').trim())
    .sort((a, b) => parseIncidentTime(b.time) - parseIncidentTime(a.time))

  const latest = list[0] || null
  const active = list.find((i) => isIncidentActive(i.status)) || null

  if (active) {
    return {
      label: `${active.status} · ${active.severity || '—'}`,
      detail: active.description?.slice(0, 80) || '',
      lastTime: active.time,
      isDown: true,
    }
  }
  if (latest) {
    return {
      label: 'Робоча (інциденти закриті)',
      detail: `Останній: ${latest.time}`,
      lastTime: latest.time,
      isDown: false,
    }
  }
  return {
    label: 'Немає записів у журналі',
    detail: '',
    lastTime: null,
    isDown: false,
  }
}

/**
 * Значення для полів openingData.granulationLine* (рядок у зміні).
 */
export function granulationLineStatusFromIncidents(lineName, incidents) {
  const s = getEquipmentIncidentSummary(lineName, incidents)
  if (s.isDown) {
    return `Не в роботі (${s.label})`
  }
  return s.label
}
