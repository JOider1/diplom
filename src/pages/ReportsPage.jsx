import { useMemo } from 'react'
import { useAppData } from '../context/AppDataContext'

function ReportsPage() {
  const { batches, incidents } = useAppData()

  const weeklyTons = useMemo(
    () => (batches.reduce((sum, batch) => sum + batch.feedProducedKg, 0) / 1000).toFixed(1),
    [batches],
  )
  const monthlyTons = useMemo(() => (Number(weeklyTons) * 4).toFixed(1), [weeklyTons])

  const topIncidents = useMemo(() => {
    const counts = incidents.reduce((acc, item) => {
      acc[item.equipment] = (acc[item.equipment] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
  }, [incidents])

  const lineEfficiency = useMemo(() => {
    const byLine = {
      'Лінія 1': { target: 80, actual: 74 },
      'Лінія 2': { target: 80, actual: 68 },
    }
    return byLine
  }, [])

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Продуктивність / тиждень</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{weeklyTons} т</p>
        </div>
        <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Продуктивність / місяць</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{monthlyTons} т</p>
        </div>
        <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Відкриті інциденти</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">
            {incidents.filter((item) => item.status === 'В роботі').length}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Топ інцидентів по обладнанню</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {topIncidents.map(([equipment, count]) => (
            <li key={equipment}>
              {equipment}: <span className="font-semibold">{count}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Ефективність ліній</h3>
        <div className="mt-3 space-y-3 text-sm">
          {Object.entries(lineEfficiency).map(([line, values]) => (
            <div key={line}>
              <p className="text-slate-700">
                {line}: {values.actual}% / ціль {values.target}%
              </p>
              <div className="h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-enterprise-700"
                  style={{ width: `${Math.min(100, values.actual)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ReportsPage
