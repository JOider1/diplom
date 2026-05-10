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
import { initialRawStorageKg } from '../data/mockData'

function DashboardPage() {
  const { storageKg, movements, batches, averageDailyConsumptionKg, addRawArrival } = useAppData()
  const [period, setPeriod] = useState('all')
  const [arrivalForm, setArrivalForm] = useState({
    source: '',
    wheatKg: '',
    cornKg: '',
    premixKg: '',
  })
  const [arrivalError, setArrivalError] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'time', direction: 'desc' })

  const cutoffDate = useMemo(() => {
    const now = new Date()
    if (period === 'week') {
      now.setDate(now.getDate() - 7)
      return now
    }
    if (period === 'month') {
      now.setMonth(now.getMonth() - 1)
      return now
    }
    return null
  }, [period])

  const chartData = useMemo(() => {
    const byDay = batches.reduce((acc, batch) => {
      if (cutoffDate && new Date(batch.createdAt.replace(' ', 'T')) < cutoffDate) {
        return acc
      }
      const day = batch.createdAt.slice(5, 10)
      acc[day] = (acc[day] || 0) + (Number(batch.feedProducedKg) || 0)
      return acc
    }, {})
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, producedKg]) => ({ day, tons: Number((producedKg / 1000).toFixed(2)) }))
  }, [batches, cutoffDate])

  const filteredMovements = useMemo(
    () =>
      movements.filter(
        (movement) => !cutoffDate || new Date(movement.time.replace(' ', 'T')) >= cutoffDate,
      ),
    [cutoffDate, movements],
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

  const handleArrivalSubmit = (event) => {
    event.preventDefault()
    const result = addRawArrival(arrivalForm)
    if (!result.ok) {
      setArrivalError(result.error)
      return
    }
    setArrivalError('')
    setArrivalForm({ source: '', wheatKg: '', cornKg: '', premixKg: '' })
  }
  const storageCards = [
    { key: 'wheat', label: 'Пшениця' },
    { key: 'corn', label: 'Кукурудза' },
    { key: 'premix', label: 'Премікси' },
  ]

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-800">Виробництво кормів (т)</h3>
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="week">За тиждень</option>
            <option value="month">За місяць</option>
            <option value="all">За весь час</option>
          </select>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="day" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip />
              <Legend />
              <Bar dataKey="tons" name="Тонн/день" fill="#2f4d71" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Склад сировини та рух</h3>
        <form onSubmit={handleArrivalSubmit} className="mb-4 grid gap-3 md:grid-cols-5">
          <input
            placeholder="Постачальник / джерело"
            value={arrivalForm.source}
            onChange={(event) => setArrivalForm((prev) => ({ ...prev, source: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            type="number"
            min="0"
            placeholder="Пшениця, кг"
            value={arrivalForm.wheatKg}
            onChange={(event) => setArrivalForm((prev) => ({ ...prev, wheatKg: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            type="number"
            min="0"
            placeholder="Кукурудза, кг"
            value={arrivalForm.cornKg}
            onChange={(event) => setArrivalForm((prev) => ({ ...prev, cornKg: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            type="number"
            min="0"
            placeholder="Премікси, кг"
            value={arrivalForm.premixKg}
            onChange={(event) => setArrivalForm((prev) => ({ ...prev, premixKg: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
          <button
            type="submit"
            className="rounded-md bg-enterprise-700 px-4 py-2 text-sm font-semibold text-white hover:bg-enterprise-800"
          >
            Додати надходження
          </button>
          {arrivalError && <p className="md:col-span-5 text-sm text-red-600">{arrivalError}</p>}
        </form>
        <div className="grid gap-4 md:grid-cols-3">
          {storageCards.map((item) => {
            const current = storageKg[item.key]
            const initial = initialRawStorageKg[item.key]
            const percent = Math.round((current / initial) * 100)
            const daily = averageDailyConsumptionKg[item.key] || 0
            const daysLeft = daily > 0 ? Math.max(1, Math.round(current / daily)) : null
            return (
              <div key={item.key} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-700">{item.label}</p>
                <p className="mt-1 text-sm text-slate-600">{current.toLocaleString('uk-UA')} кг</p>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-enterprise-700"
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">{percent}% від стартового запасу</p>
                <p className="mt-1 text-xs text-orange-600">
                  {daysLeft ? `Залишилось приблизно на ${daysLeft} дн.` : 'Недостатньо даних для прогнозу'}
                </p>
              </div>
            )
          })}
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('time')}>Час {sortArrow('time')}</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('type')}>Тип {sortArrow('type')}</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('source')}>Джерело {sortArrow('source')}</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('delta')}>Рух, кг {sortArrow('delta')}</th>
                <th className="px-4 py-3">Залишок, кг</th>
              </tr>
            </thead>
            <tbody>
              {sortedMovements.map((movement) => (
                <tr key={movement.id} className="border-t border-slate-200">
                  <td className="px-4 py-3">{movement.time}</td>
                  <td className="px-4 py-3">{movement.type}</td>
                  <td className="px-4 py-3">{movement.source}</td>
                  <td className="px-4 py-3">
                    Пш: {movement.deltaKg.wheat}, Кк: {movement.deltaKg.corn}, Пр: {movement.deltaKg.premix}
                  </td>
                  <td className="px-4 py-3">
                    Пш: {movement.balanceKg.wheat}, Кк: {movement.balanceKg.corn}, Пр: {movement.balanceKg.premix}
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
