import { useMemo } from 'react'
import { exportWorkbook } from '../utils/xlsxExport'
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
import { INCIDENT_CATEGORY_LABELS, isEquipmentIncident, normalizeIncidentCategory } from '../constants/incidentCategories'
import { INCIDENT_STATUSES } from '../constants/incidentStatuses'
import { useTheme } from '../context/ThemeContext'
import { useAppData } from '../context/AppDataContext'
import { getEquipmentIncidentSummary } from '../utils/equipmentIncidentStatus'

const EQUIP_STATUS_ORDER = ['Робоча', 'Тех. огляд', 'Ремонт']

function ReportsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const axisStroke = isDark ? '#94a3b8' : '#475569'
  const gridStroke = isDark ? '#334155' : '#e2e8f0'

  const { batches, incidents, movements, storageKg, equipment } = useAppData()

  const weeklyTons = useMemo(
    () => (batches.reduce((sum, batch) => sum + batch.feedProducedKg, 0) / 1000).toFixed(1),
    [batches],
  )
  const monthlyTons = useMemo(() => (Number(weeklyTons) * 4).toFixed(1), [weeklyTons])

  const topIncidents = useMemo(() => {
    const equipmentOnly = incidents.filter((item) => isEquipmentIncident(item))
    const counts = equipmentOnly.reduce((acc, item) => {
      const key = (item.equipment || 'Невідомо').trim()
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
  }, [incidents])

  const incidentsByStatus = useMemo(() => {
    return INCIDENT_STATUSES.map((status) => ({
      status,
      count: incidents.filter((i) => i.status === status).length,
    }))
  }, [incidents])

  const equipmentByDirectoryStatus = useMemo(() => {
    return EQUIP_STATUS_ORDER.map((status) => ({
      status,
      count: equipment.filter((e) => e.status === status).length,
    }))
  }, [equipment])

  const nonWorkingEquipmentCount = useMemo(
    () => equipment.filter((e) => e.status !== 'Робоча').length,
    [equipment],
  )

  const equipmentWithJournal = useMemo(
    () =>
      equipment.map((eq) => ({
        ...eq,
        journal: getEquipmentIncidentSummary(eq.name, incidents),
      })),
    [equipment, incidents],
  )

  const recentIncidents = useMemo(() => {
    const parseT = (t) => {
      if (!t || typeof t !== 'string') {
        return 0
      }
      const n = new Date(t.includes('T') ? t : t.replace(' ', 'T')).getTime()
      return Number.isNaN(n) ? 0 : n
    }
    return [...incidents].sort((a, b) => parseT(b.time) - parseT(a.time)).slice(0, 15)
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

  const activeIncidentsCount = useMemo(
    () =>
      incidents.filter((item) => item.status === 'В роботі' || item.status === 'На перевірці').length,
    [incidents],
  )

  const handleExportXlsx = () => {
    const stamp = new Date().toISOString().slice(0, 10)
    exportWorkbook(`analityka-${stamp}.xlsx`, [
      {
        name: 'KPI',
        rows: [
          {
            'Тижн_тонн': weeklyTons,
            'Міс_тонн': monthlyTons,
            Активні_інциденти: activeIncidentsCount,
            Не_робоче_обладнання_довідник: nonWorkingEquipmentCount,
            Пшениця_кг: storageKg.wheat,
            Кукурудза_кг: storageKg.corn,
            Премікси_кг: storageKg.premix,
          },
        ],
      },
      { name: 'Обладнання_довідник', rows: equipment.map((e) => ({ ...e })) },
      {
        name: 'Обладнання_журнал',
        rows: equipmentWithJournal.map((e) => ({
          Назва: e.name,
          Статус_довідник: e.status,
          Стан_з_інцидентів: e.journal.label,
        })),
      },
      { name: 'Інциденти_статуси', rows: incidentsByStatus },
      { name: 'Топ_інциденти', rows: topIncidents.map(([eq, c]) => ({ Обладнання: eq, Кількість: c })) },
      { name: 'Вироб_дата', rows: productionByDate },
      { name: 'Вироб_рецепт', rows: productionByRecipe },
      {
        name: 'Рухи',
        rows: movements.map((m) => ({
          Час: m.time,
          Тип: m.type,
          Джерело: m.source,
          Пш: m.deltaKg.wheat,
          Кк: m.deltaKg.corn,
          Пр: m.deltaKg.premix,
        })),
      },
    ])
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-800">Звіти та аналітика</h3>
        <div className="no-print flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportXlsx}
            className="rounded-md border border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-200"
          >
            Експорт у Excel
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Роздрукувати
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Продуктивність / тиждень</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{weeklyTons} т</p>
        </div>
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Продуктивність / місяць</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{monthlyTons} т</p>
        </div>
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Активні інциденти</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{activeIncidentsCount}</p>
          <p className="mt-1 text-xs text-slate-500">В роботі + на перевірці</p>
        </div>
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Не «Робоча» (довідник)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{nonWorkingEquipmentCount}</p>
          <p className="mt-1 text-xs text-slate-500">Тех. огляд або ремонт</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Інциденти за статусом (усі записи)</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incidentsByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="status" stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 11 }} />
                <YAxis stroke={axisStroke} tick={{ fill: axisStroke }} allowDecimals={false} />
                <Tooltip
                  contentStyle={
                    isDark
                      ? { backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }
                      : undefined
                  }
                />
                <Bar dataKey="count" name="Кількість" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Обладнання за довідником (статус)</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={equipmentByDirectoryStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="status" stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 11 }} />
                <YAxis stroke={axisStroke} tick={{ fill: axisStroke }} allowDecimals={false} />
                <Tooltip
                  contentStyle={
                    isDark
                      ? { backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }
                      : undefined
                  }
                />
                <Bar dataKey="count" name="Одиниць" fill="#2f4d71" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Обладнання: довідник і журнал інцидентів</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-3 py-2">Обладнання</th>
                <th className="px-3 py-2">Статус (довідник)</th>
                <th className="px-3 py-2">Стан з журналу інцидентів</th>
              </tr>
            </thead>
            <tbody>
              {equipmentWithJournal.map((row) => (
                <tr key={row.id} className="border-t border-slate-200 dark:border-slate-600">
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">
                    <span className={row.journal.isDown ? 'font-semibold text-orange-700 dark:text-amber-300' : ''}>
                      {row.journal.label}
                    </span>
                    {row.journal.detail ? (
                      <span className="ml-1 text-xs text-slate-500">({row.journal.detail})</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Останні інциденти (усі в системі)</h3>
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm text-slate-700">
          {recentIncidents.map((i) => (
            <li key={i.id} className="border-b border-slate-100 pb-2 dark:border-slate-600">
              <span className="text-xs text-slate-500">{i.time}</span> ·{' '}
              <span className="text-xs font-medium text-enterprise-800 dark:text-enterprise-300">
                {INCIDENT_CATEGORY_LABELS[normalizeIncidentCategory(i.category)]}
              </span>{' '}
              · <span className="font-medium">{i.equipment}</span> · {i.status}
              <span className="text-slate-500"> — {i.description?.slice(0, 60)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Топ обладнання за кількістю виробничих інцидентів</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {topIncidents.length === 0 && <li className="text-slate-500">Немає даних.</li>}
          {topIncidents.map(([eq, count]) => (
            <li key={eq}>
              {eq}: <span className="font-semibold">{count}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Виробництво по датах, т</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={productionByDate}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 11 }} />
              <YAxis stroke={axisStroke} tick={{ fill: axisStroke }} />
              <Tooltip
                contentStyle={
                  isDark
                    ? { backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }
                    : undefined
                }
              />
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
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="recipe" hide />
                <YAxis stroke={axisStroke} tick={{ fill: axisStroke }} />
                <Tooltip
                  contentStyle={
                    isDark
                      ? { backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }
                      : undefined
                  }
                />
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
                <Tooltip
                  contentStyle={
                    isDark
                      ? { backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }
                      : undefined
                  }
                />
                <Legend wrapperStyle={isDark ? { color: '#e2e8f0' } : undefined} />
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
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="time" stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 10 }} />
              <YAxis stroke={axisStroke} tick={{ fill: axisStroke }} />
              <Tooltip
                contentStyle={
                  isDark
                    ? { backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }
                    : undefined
                }
              />
              <Legend wrapperStyle={isDark ? { color: '#e2e8f0' } : undefined} />
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
