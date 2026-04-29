import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { productionByWeek, rawStorageStatus } from '../data/mockData'

const PIE_COLORS = ['#1d4ed8', '#3b82f6', '#f97316']

function DashboardPage() {
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
        </div>
      </div>
    </section>
  )
}

export default DashboardPage
