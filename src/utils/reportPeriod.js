export const REPORT_PERIOD_OPTIONS = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Тиждень' },
  { value: 'month', label: 'Місяць' },
  { value: 'custom', label: 'Період (від — до)' },
]

export function parseDateTime(value) {
  if (!value || typeof value !== 'string') {
    return null
  }
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const MONTH_NAMES = [
  'січень',
  'лютий',
  'березень',
  'квітень',
  'травень',
  'червень',
  'липень',
  'серпень',
  'вересень',
  'жовтень',
  'листопад',
  'грудень',
]

function formatUaDate(dateKey) {
  const [y, m, d] = dateKey.split('-')
  return `${d}.${m}.${y}`
}

/**
 * @param {'day'|'week'|'month'|'custom'} period
 * @param {string} referenceDate - YYYY-MM-DD
 * @param {{from?:string, to?:string}} customRange - used when period === 'custom'
 */
export function getPeriodBounds(period, referenceDate, customRange) {
  if (period === 'custom') {
    const fromKey = customRange?.from || referenceDate
    const toKey = customRange?.to || referenceDate
    const start = new Date(`${fromKey}T00:00:00`)
    const end = new Date(`${toKey}T23:59:59.999`)
    return {
      start,
      end,
      label: `за ${formatUaDate(fromKey)} — ${formatUaDate(toKey)}`,
    }
  }

  const ref = referenceDate ? new Date(`${referenceDate}T12:00:00`) : new Date()
  const end = new Date(ref)
  end.setHours(23, 59, 59, 999)

  if (period === 'day') {
    const start = new Date(ref)
    start.setHours(0, 0, 0, 0)
    return { start, end, label: `за ${formatUaDate(toDateKey(start))}` }
  }

  if (period === 'week') {
    const start = new Date(ref)
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    return {
      start,
      end,
      label: `за ${formatUaDate(toDateKey(start))} — ${formatUaDate(toDateKey(end))}`,
    }
  }

  const start = new Date(ref.getFullYear(), ref.getMonth(), 1)
  start.setHours(0, 0, 0, 0)
  const monthEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0)
  monthEnd.setHours(23, 59, 59, 999)
  return {
    start,
    end: monthEnd,
    label: `за ${MONTH_NAMES[ref.getMonth()]} ${ref.getFullYear()}`,
  }
}

export function isWithinPeriod(dateTimeValue, period, referenceDate, customRange) {
  const parsed = parseDateTime(dateTimeValue)
  if (!parsed) {
    return false
  }
  const { start, end } = getPeriodBounds(period, referenceDate, customRange)
  return parsed >= start && parsed <= end
}

export function getPeriodLabel(period) {
  return REPORT_PERIOD_OPTIONS.find((item) => item.value === period)?.label ?? period
}
