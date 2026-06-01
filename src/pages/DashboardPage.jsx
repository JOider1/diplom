import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMemo, useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useTheme } from '../context/ThemeContext'
import { initialRawStorageKg } from '../data/mockData'
import { WheatIcon, CornIcon, BeakerIcon, ExclamationTriangleIcon } from '../components/common/Icons'

const parseDateTime = (value) => {
  if (!value || typeof value !== 'string') return null
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const STORAGE_META = {
  wheat:  { label: 'Пшениця',   Icon: WheatIcon,  color: 'bg-amber-500',   accent: 'border-l-amber-500',   iconColor: 'text-amber-600' },
  corn:   { label: 'Кукурудза', Icon: CornIcon,   color: 'bg-orange-500',  accent: 'border-l-orange-500',  iconColor: 'text-orange-600' },
  premix: { label: 'Премікси',  Icon: BeakerIcon, color: 'bg-emerald-500', accent: 'border-l-emerald-500', iconColor: 'text-emerald-600' },
}

const toDateKey = (d) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function DashboardPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const axisStroke = isDark ? '#94a3b8' : '#475569'
  const { storageKg, movements, batches, averageDailyConsumptionKg, addRawArrival } = useAppData()
  const [period, setPeriod] = useState('all')
  const todayKey = toDateKey(new Date())
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 14)
    return toDateKey(d)
  })
  const [customTo, setCustomTo] = useState(todayKey)

  const [arrivalForm, setArrivalForm] = useState({
    source: '',
    wheatKg: '',
    cornKg: '',
    premixKg: '',
  })
  const [arrivalError, setArrivalError] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'time', direction: 'desc' })

  const dateRange = useMemo(() => {
    if (period === 'custom') {
      return {
        from: new Date(`${customFrom}T00:00:00`),
        to: new Date(`${customTo}T23:59:59.999`),
      }
    }
    if (period === 'week') {
      const from = new Date()
      from.setDate(from.getDate() - 7)
      return { from, to: null }
    }
    if (period === 'month') {
      const from = new Date()
      from.setMonth(from.getMonth() - 1)
      return { from, to: null }
    }
    return { from: null, to: null }
  }, [period, customFrom, customTo])

  const isInRange = (d) => {
    if (dateRange.from && d < dateRange.from) return false
    if (dateRange.to && d > dateRange.to) return false
    return true
  }

  const chartData = useMemo(() => {
    const byDay = batches.reduce((acc, batch) => {
      const batchDate = parseDateTime(batch.createdAt)
      if (!batchDate) return acc
      if (!isInRange(batchDate)) return acc
      const day = batch.createdAt.slice(0, 10)
      acc[day] = (acc[day] || 0) + (Number(batch.feedProducedKg) || 0)
      return acc
    }, {})
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, producedKg]) => ({ day, tons: Number((producedKg / 1000).toFixed(2)) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batches, dateRange])

  const filteredMovements = useMemo(
    () =>
      movements.filter((movement) => {
        const movementDate = parseDateTime(movement.time)
        if (!movementDate) return false
        return isInRange(movementDate)
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateRange, movements],
  )

  const sortedMovements = useMemo(() => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1
    return [...filteredMovements].sort((a, b) => {
      if (sortConfig.key === 'delta') {
        const aTotal = Math.abs(a.deltaKg.wheat) + Math.abs(a.deltaKg.corn) + Math.abs(a.deltaKg.premix)
        const bTotal = Math.abs(b.deltaKg.wheat) + Math.abs(b.deltaKg.corn) + Math.abs(b.deltaKg.premix)
        return (aTotal - bTotal) * direction
      }
      const aValue = String(a[sortConfig.key] ?? '')
      const bValue = String(b[sortConfig.key] ?? '')
      return aValue.localeCompare(bValue, 'uk') * direction
    })
  }, [filteredMovements, sortConfig])

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }
  const sortArrow = (key) =>
    sortConfig.key === key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'

  const handleArrivalSubmit = async (event) => {
    event.preventDefault()
    const result = await addRawArrival(arrivalForm)
    if (!result.ok) {
      setArrivalError(result.error)
      return
    }
    setArrivalError('')
    setArrivalForm({ source: '', wheatKg: '', cornKg: '', premixKg: '' })
  }

  const lowStockWarnings = useMemo(
    () =>
      Object.keys(storageKg)
        .map((key) => {
          const daily = averageDailyConsumptionKg[key] || 0
          if (!daily) return null
          const daysLeft = Math.round(storageKg[key] / daily)
          if (daysLeft >= 3) return null
          return { key, daysLeft, label: STORAGE_META[key]?.label || key }
        })
        .filter(Boolean),
    [averageDailyConsumptionKg, storageKg],
  )

  return (
    <section className="space-y-5">
      {/* HERO */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-enterprise-700 to-enterprise-800 p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-widest text-blue-200">
          Огляд виробництва
        </p>
        <h2 className="mt-1 text-2xl font-bold text-white">Склад сировини та операції</h2>
        <p className="mt-1 text-sm text-blue-100">
          Прогноз залишків розраховується за середньодобовим списанням сировини за останній тиждень.
        </p>
      </div>

      {/* Low-stock alerts */}
      {lowStockWarnings.length > 0 && (
        <div className="rounded-xl border-l-4 border-l-rose-500 border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 shrink-0 text-rose-600" />
            <div>
              <p className="font-semibold text-rose-900">Критично низькі запаси</p>
              <p className="mt-1 text-sm text-rose-800">
                {lowStockWarnings
                  .map((w) => `${w.label} — ${w.daysLeft} дн.`)
                  .join(' · ')}
              </p>
              <p className="mt-1 text-xs text-rose-700">Зафіксуйте надходження або скоригуйте план виробництва.</p>
            </div>
          </div>
        </div>
      )}

      {/* Storage cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(STORAGE_META).map(([key, meta]) => {
          const current = storageKg[key]
          const initial = initialRawStorageKg[key]
          const percent = Math.round((current / initial) * 100)
          const daily = averageDailyConsumptionKg[key] || 0
          const daysLeft = daily > 0 ? Math.max(1, Math.round(current / daily)) : null
          const isCritical = daysLeft && daysLeft < 3
          const StorageIcon = meta.Icon
          return (
            <div
              key={key}
              className={`relative overflow-hidden rounded-xl border border-slate-200 border-l-4 ${meta.accent} bg-white p-5 shadow-sm transition hover:shadow-md`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    {meta.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {current.toLocaleString('uk-UA')}
                    <span className="ml-1 text-sm font-normal text-slate-500">кг</span>
                  </p>
                </div>
                <div className={`rounded-lg bg-white/70 p-2 shadow-sm dark:bg-slate-700 ${meta.iconColor}`}>
                  <StorageIcon className="w-7 h-7" />
                </div>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-2.5 rounded-full ${meta.color} transition-all`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500">{percent}% від стартового</span>
                <span className={isCritical ? 'font-semibold text-rose-600' : 'text-slate-500'}>
                  {daysLeft ? `≈ ${daysLeft} дн.` : 'немає прогнозу'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Arrival form */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-slate-800">Зафіксувати надходження</h3>
        <form onSubmit={handleArrivalSubmit} className="grid gap-3 md:grid-cols-5">
          <input
            placeholder="Постачальник / джерело"
            value={arrivalForm.source}
            onChange={(event) => setArrivalForm((prev) => ({ ...prev, source: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2"
          />
          <input
            type="number"
            min="0"
            placeholder="Пшениця, кг"
            value={arrivalForm.wheatKg}
            onChange={(event) => setArrivalForm((prev) => ({ ...prev, wheatKg: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            type="number"
            min="0"
            placeholder="Кукурудза, кг"
            value={arrivalForm.cornKg}
            onChange={(event) => setArrivalForm((prev) => ({ ...prev, cornKg: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            type="number"
            min="0"
            placeholder="Премікси, кг"
            value={arrivalForm.premixKg}
            onChange={(event) => setArrivalForm((prev) => ({ ...prev, premixKg: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <button
            type="submit"
            className="rounded-lg bg-enterprise-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-enterprise-800 md:col-span-5"
          >
            + Додати надходження
          </button>
          {arrivalError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-5">
              {arrivalError}
            </p>
          )}
        </form>
      </div>

      {/* Production chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-800">Виробництво кормів (т)</h3>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              {[
                { v: 'week', l: 'Тиждень' },
                { v: 'month', l: 'Місяць' },
                { v: 'all', l: 'Весь час' },
                { v: 'custom', l: 'Період' },
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setPeriod(opt.v)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    period === opt.v
                      ? 'bg-enterprise-700 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
            {period === 'custom' && (
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-xs text-slate-600 dark:text-slate-300">
                  Від
                  <input
                    type="date"
                    value={customFrom}
                    max={customTo}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="mt-1 block rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-xs text-slate-600 dark:text-slate-300">
                  До
                  <input
                    type="date"
                    value={customTo}
                    min={customFrom}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="mt-1 block rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="day" stroke={axisStroke} tick={{ fill: axisStroke }} />
              <YAxis stroke={axisStroke} tick={{ fill: axisStroke }} />
              <Tooltip
                contentStyle={
                  isDark
                    ? { backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }
                    : undefined
                }
              />
              <Legend />
              <Bar dataKey="tons" name="Тонн/день" fill="#2f4d71" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Movements journal */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-slate-800">Журнал рухів сировини</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('time')}>
                  Час {sortArrow('time')}
                </th>
                <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('type')}>
                  Тип {sortArrow('type')}
                </th>
                <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('source')}>
                  Джерело {sortArrow('source')}
                </th>
                <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('delta')}>
                  Рух, кг {sortArrow('delta')}
                </th>
                <th className="px-4 py-3">Залишок, кг</th>
              </tr>
            </thead>
            <tbody>
              {sortedMovements.map((movement) => (
                <tr key={movement.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs text-slate-600">{movement.time}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        movement.type === 'Надходження'
                          ? 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800'
                          : 'rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800'
                      }
                    >
                      {movement.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">{movement.source}</td>
                  <td className="px-4 py-3 text-xs">
                    Пш: {movement.deltaKg.wheat}, Кк: {movement.deltaKg.corn}, Пр:{' '}
                    {movement.deltaKg.premix}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    Пш: {movement.balanceKg.wheat}, Кк: {movement.balanceKg.corn}, Пр:{' '}
                    {movement.balanceKg.premix}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default DashboardPage
