import {
  Bar,
  BarChart,
<<<<<<< HEAD
  Cell,
  Legend,
  Pie,
  PieChart,
=======
  Legend,
>>>>>>> 8fb2b64 (first commit)
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
<<<<<<< HEAD
import { productionByWeek, rawStorageStatus } from '../data/mockData'

const PIE_COLORS = ['#1d4ed8', '#3b82f6', '#f97316']

function DashboardPage() {
=======
import { useAppData } from '../context/AppDataContext'
import { initialRawStorageKg, productionByWeek } from '../data/mockData'

function DashboardPage() {
  const { storageKg, movements, averageDailyConsumptionKg } = useAppData()
  const storageCards = [
    { key: 'wheat', label: 'Пшениця' },
    { key: 'corn', label: 'Кукурудза' },
    { key: 'premix', label: 'Премікси' },
  ]

>>>>>>> 8fb2b64 (first commit)
  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">
          Виробництво кормів за тиждень (т)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={productionByWeek}>
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
<<<<<<< HEAD
        <h3 className="mb-4 text-lg font-semibold text-slate-800">
          Завантаженість складів сировиною (%)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rawStorageStatus}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                label
              >
                {rawStorageStatus.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
=======
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Склад сировини та рух</h3>
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
                <th className="px-4 py-3">Час</th>
                <th className="px-4 py-3">Тип</th>
                <th className="px-4 py-3">Джерело</th>
                <th className="px-4 py-3">Рух, кг</th>
                <th className="px-4 py-3">Залишок, кг</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
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
>>>>>>> 8fb2b64 (first commit)
        </div>
      </div>
    </section>
  )
}

export default DashboardPage
