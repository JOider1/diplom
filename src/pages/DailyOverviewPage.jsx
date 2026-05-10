import { useMemo, useState } from 'react'
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
      incidentsOpen: dayIncidents.filter((item) => item.status === 'В роботі').length,
    }
  }, [batches, incidents, movements, selectedDate, shifts])

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <label className="text-sm font-medium text-slate-700">
          Оберіть дату
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="ml-3 rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Вироблено, кг</p>
          <p className="mt-1 text-xl font-semibold text-slate-800">{data.totalFeedKg.toLocaleString('uk-UA')}</p>
        </div>
        <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Списано сировини, кг</p>
          <p className="mt-1 text-xl font-semibold text-slate-800">
            {data.totalRawSpentKg.toLocaleString('uk-UA')}
          </p>
        </div>
        <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Інцидентів за день</p>
          <p className="mt-1 text-xl font-semibold text-slate-800">{data.dayIncidents.length}</p>
        </div>
        <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">В роботі</p>
          <p className="mt-1 text-xl font-semibold text-slate-800">{data.incidentsOpen}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
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

      <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
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

      <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Інциденти за день</h3>
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {data.dayIncidents.length === 0 && <li>Немає інцидентів.</li>}
          {data.dayIncidents.map((incident) => (
            <li key={incident.id}>
              {incident.time} | {incident.equipment} | {incident.status}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
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
