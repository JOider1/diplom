import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAppData } from '../context/AppDataContext'

function ReportsPage() {
  const { batches, incidents, movements, storageKg } = useAppData()

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

  const productionByDate = useMemo(() => {
    const byDate = batches.reduce((acc, batch) => {
      const date = batch.createdAt?.slice(0, 10) || 'Невідома дата'
      acc[date] = (acc[date] || 0) + (Number(batch.feedProducedKg) || 0)
      return acc
    }, {})
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, producedKg]) => ({
        date,
        producedTons: Number((producedKg / 1000).toFixed(2)),
      }))
  }, [batches])

  const productionByRecipe = useMemo(() => {
    const byRecipe = batches.reduce((acc, batch) => {
      acc[batch.recipe] = (acc[batch.recipe] || 0) + (Number(batch.feedProducedKg) || 0)
      return acc
    }, {})
    return Object.entries(byRecipe)
      .map(([recipe, producedKg]) => ({
        recipe,
        producedTons: Number((producedKg / 1000).toFixed(2)),
      }))
      .sort((a, b) => b.producedTons - a.producedTons)
  }, [batches])

  const storagePieData = useMemo(
    () => [
      { name: 'Пшениця', value: storageKg.wheat || 0, color: '#2f4d71' },
      { name: 'Кукурудза', value: storageKg.corn || 0, color: '#ea580c' },
      { name: 'Премікси', value: storageKg.premix || 0, color: '#16a34a' },
    ],
    [storageKg],
  )

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-800">Звіти та аналітика</h3>
        <div className="no-print flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Роздрукувати
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Продуктивність / тиждень</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{weeklyTons} т</p>
        </div>
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Продуктивність / місяць</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{monthlyTons} т</p>
        </div>
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Відкриті інциденти</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">
            {incidents.filter((item) => item.status === 'В роботі').length}
          </p>
        </div>
      </div>

      <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Топ інцидентів по обладнанню</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {topIncidents.map(([equipment, count]) => (
            <li key={equipment}>
              {equipment}: <span className="font-semibold">{count}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Виробництво по датах, т</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={productionByDate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="producedTons" name="Вироблено, т" stroke="#2f4d71" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Виробництво по рецептах, т</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionByRecipe}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="recipe" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="producedTons" name="Вироблено, т" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-slate-700">
            {productionByRecipe.map((item) => (
              <li key={item.recipe}>
                {item.recipe}: <span className="font-semibold">{item.producedTons} т</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Залишки сировини, кг</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={storagePieData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {storagePieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Витяг з рухів сировини</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={movements.map((movement) => ({
                time: movement.time.slice(5),
                wheat: Math.abs(movement.deltaKg.wheat),
                corn: Math.abs(movement.deltaKg.corn),
                premix: Math.abs(movement.deltaKg.premix),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="wheat" name="Пшениця, кг" fill="#2f4d71" />
              <Bar dataKey="corn" name="Кукурудза, кг" fill="#ea580c" />
              <Bar dataKey="premix" name="Премікси, кг" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}

export default ReportsPage
