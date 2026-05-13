import { useMemo, useState } from 'react'
import { INCIDENT_CATEGORY_LABELS, normalizeIncidentCategory } from '../constants/incidentCategories'
import { useAppData } from '../context/AppDataContext'

const today = new Date().toISOString().slice(0, 10)

function DailyOverviewPage() {
  const { batches, incidents, shifts, movements } = useAppData()
  const [selectedDate, setSelectedDate] = useState(today)

  const data = useMemo(() => {
    const isSameDate = (value) => value?.slice(0, 10) === selectedDate
    const dayBatches = batches.filter((item) => isSameDate(item.createdAt))
    const dayIncidents = incidents.filter((item) => isSameDate(item.time))
    const dayShifts = shifts.filter((item) => isSameDate(item.openedAt) || isSameDate(item.closedAt))
    const dayMovements = movements.filter((item) => isSameDate(item.time))

    return {
      dayBatches,
      dayIncidents,
      dayShifts,
      dayMovements,
      totalFeedKg: dayBatches.reduce((sum, item) => sum + item.feedProducedKg, 0),
      totalRawSpentKg: dayBatches.reduce((sum, item) => sum + item.rawSpentKg, 0),
      incidentsActive: dayIncidents.filter(
        (item) => item.status === 'В роботі' || item.status === 'На перевірці',
      ).length,
    }
  }, [batches, incidents, movements, selectedDate, shifts])

  return (
    <section className="space-y-4">
      <div className="no-print rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-700">
          Оберіть дату
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="ml-3 rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            Роздрукувати
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Вироблено, кг</p>
          <p className="mt-1 text-xl font-semibold text-slate-800">{data.totalFeedKg.toLocaleString('uk-UA')}</p>
        </div>
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Списано сировини, кг</p>
          <p className="mt-1 text-xl font-semibold text-slate-800">
            {data.totalRawSpentKg.toLocaleString('uk-UA')}
          </p>
        </div>
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Інцидентів за день</p>
          <p className="mt-1 text-xl font-semibold text-slate-800">{data.dayIncidents.length}</p>
        </div>
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Активні інциденти</p>
          <p className="mt-1 text-xl font-semibold text-slate-800">{data.incidentsActive}</p>
          <p className="mt-1 text-xs text-slate-500">В роботі + на перевірці</p>
        </div>
      </div>

      <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Зміни за день</h3>
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {data.dayShifts.length === 0 && <li>Немає записів по змінах.</li>}
          {data.dayShifts.map((shift) => (
            <li key={shift.id}>
              #{shift.id}: {shift.openedAt} - {shift.closedAt || 'ще відкрита'} ({shift.status})
            </li>
          ))}
        </ul>
      </div>

      <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Партії за день</h3>
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {data.dayBatches.length === 0 && <li>Немає партій.</li>}
          {data.dayBatches.map((batch) => (
            <li key={batch.id}>
              {batch.createdAt} | {batch.recipe} | {batch.feedProducedKg} кг
            </li>
          ))}
        </ul>
      </div>

      <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Інциденти за день</h3>
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {data.dayIncidents.length === 0 && <li>Немає інцидентів.</li>}
          {data.dayIncidents.map((incident) => (
            <li key={incident.id}>
              {incident.time} · {INCIDENT_CATEGORY_LABELS[normalizeIncidentCategory(incident.category)]} ·{' '}
              {incident.equipment} · {incident.status}
            </li>
          ))}
        </ul>
      </div>

      <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Рух сировини за день</h3>
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {data.dayMovements.length === 0 && <li>Немає рухів.</li>}
          {data.dayMovements.map((movement) => (
            <li key={movement.id}>
              {movement.time} | {movement.type} | {movement.source}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default DailyOverviewPage
