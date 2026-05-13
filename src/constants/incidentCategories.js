/** Ключі категорій зберігаються в даних і localStorage. */
export const INCIDENT_CATEGORY_EQUIPMENT = 'equipment'
export const INCIDENT_CATEGORY_WORKPLACE = 'workplace_safety'
export const INCIDENT_CATEGORY_OTHER = 'other'

export const INCIDENT_CATEGORY_OPTIONS = [
  { value: INCIDENT_CATEGORY_EQUIPMENT, label: 'Обладнання / виробництво' },
  { value: INCIDENT_CATEGORY_WORKPLACE, label: 'Охорона праці / травма' },
  { value: INCIDENT_CATEGORY_OTHER, label: 'Інше' },
]

export const INCIDENT_CATEGORY_LABELS = INCIDENT_CATEGORY_OPTIONS.reduce((acc, { value, label }) => {
  acc[value] = label
  return acc
}, {})

const LEGACY_VALUES = {
  обладнання: INCIDENT_CATEGORY_EQUIPMENT,
  виробництво: INCIDENT_CATEGORY_EQUIPMENT,
  травма: INCIDENT_CATEGORY_WORKPLACE,
  'охорона праці': INCIDENT_CATEGORY_WORKPLACE,
}

export function normalizeIncidentCategory(value) {
  if (value && INCIDENT_CATEGORY_OPTIONS.some((o) => o.value === value)) {
    return value
  }
  if (typeof value === 'string') {
    const key = value.trim().toLowerCase()
    if (LEGACY_VALUES[key]) {
      return LEGACY_VALUES[key]
    }
  }
  return INCIDENT_CATEGORY_EQUIPMENT
}

/** Для звітів по обладнанню враховуємо лише виробничі інциденти. */
export function isEquipmentIncident(incident) {
  return normalizeIncidentCategory(incident?.category) === INCIDENT_CATEGORY_EQUIPMENT
}
