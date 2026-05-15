import { useMemo, useState } from 'react'
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
import { INCIDENT_CATEGORY_LABELS, normalizeIncidentCategory } from '../constants/incidentCategories'
import { INCIDENT_STATUSES } from '../constants/incidentStatuses'
import { useTheme } from '../context/ThemeContext'
import { useAppData } from '../context/AppDataContext'
import { getEquipmentIncidentSummary } from '../utils/equipmentIncidentStatus'
import {
  getPeriodBounds,
  getPeriodLabel,
  isWithinPeriod,
  REPORT_PERIOD_OPTIONS,
  toDateKey,
} from '../utils/reportPeriod'
import { exportWorkbook } from '../utils/xlsxExport'

const EQUIP_STATUS_ORDER = ['Робоча', 'Тех. огляд', 'Ремонт']

function ReportsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const axisStroke = isDark ? '#94a3b8' : '#475569'
  const gridStroke = isDark ? '#334155' : '#e2e8f0'

  const { batches, incidents, movements, storageKg, equipment } = useAppData()
  const [period, setPeriod] = useState('week')
  const [referenceDate, setReferenceDate] = useState(() => toDateKey(new Date()))

  const periodMeta = useMemo(() => getPeriodBounds(period, referenceDate), [period, referenceDate])

  const filteredBatches = useMemo(
    () => batches.filter((batch) => isWithinPeriod(batch.createdAt, period, referenceDate)),
    [batches, period, referenceDate],
  )

  const filteredIncidents = useMemo(
    () => incidents.filter((item) => isWithinPeriod(item.time, period, referenceDate)),
    [incidents, period, referenceDate],
  )

  const filteredMovements = useMemo(
    () => movements.filter((item) => isWithinPeriod(item.time, period, referenceDate)),
    [movements, period, referenceDate],
  )

  const periodTons = useMemo(
    () => (filteredBatches.reduce((sum, batch) => sum + batch.feedProducedKg, 0) / 1000).toFixed(1),
    [filteredBatches],
  )

  const incidentsByStatus = useMemo(
    () =>
      INCIDENT_STATUSES.map((status) => ({
        status,
        count: filteredIncidents.filter((item) => item.status === status).length,
      })),
    [filteredIncidents],
  )

  const equipmentByDirectoryStatus = useMemo(
    () =>
      EQUIP_STATUS_ORDER.map((status) => ({
        status,
        count: equipment.filter((item) => item.status === status).length,
      })),
    [equipment],
  )

  const nonWorkingEquipmentCount = useMemo(
    () => equipment.filter((item) => item.status !== 'Робоча').length,
    [equipment],
  )

  const equipmentWithJournal = useMemo(
    () =>
      equipment.map((eq) => ({
        ...eq,
        journal: getEquipmentIncidentSummary(eq.name, filteredIncidents),
      })),
    [equipment, filteredIncidents],
  )

  const recentIncidents = useMemo(() => {
    const parseT = (time) => {
      if (!time || typeof time !== 'string') {
        return 0
      }
      const normalized = time.includes('T') ? time : time.replace(' ', 'T')
      const value = new Date(normalized).getTime()
      return Number.isNaN(value) ? 0 : value
    }
    return [...filteredIncidents].sort((a, b) => parseT(b.time) - parseT(a.time)).slice(0, 20)
  }, [filteredIncidents])

  const productionByDate = useMemo(() => {
    const byDate = filteredBatches.reduce((acc, batch) => {
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
  }, [filteredBatches])

  const productionByRecipe = useMemo(() => {
    const byRecipe = filteredBatches.reduce((acc, batch) => {
      acc[batch.recipe] = (acc[batch.recipe] || 0) + (Number(batch.feedProducedKg) || 0)
      return acc
    }, {})
    return Object.entries(byRecipe)
      .map(([recipe, producedKg]) => ({
        recipe,
        producedTons: Number((producedKg / 1000).toFixed(2)),
      }))
      .sort((a, b) => b.producedTons - a.producedTons)
  }, [filteredBatches])

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
      filteredIncidents.filter((item) => item.status === 'В роботі' || item.status === 'На перевірці')
        .length,
    [filteredIncidents],
  )

  const movementsChartData = useMemo(
    () =>
      filteredMovements.map((movement) => ({
        time: movement.time.slice(5, 16),
        wheat: Math.abs(movement.deltaKg.wheat),
        corn: Math.abs(movement.deltaKg.corn),
        premix: Math.abs(movement.deltaKg.premix),
      })),
    [filteredMovements],
  )

  const handleExportXlsx = () => {
    const stamp = referenceDate
    exportWorkbook(`analityka-${period}-${stamp}.xlsx`, [
      {
        name: 'Параметри',
        rows: [
          {
            Період: getPeriodLabel(period),
            Діапазон: periodMeta.label,
            'Вироблено_т': periodTons,
          },
        ],
      },
      {
        name: 'KPI',
        rows: [
          {
            Вироблено_т: periodTons,
            Активні_інциденти: activeIncidentsCount,
            Не_робоче_обладнання: nonWorkingEquipmentCount,
            Пшениця_кг: storageKg.wheat,
            Кукурудза_кг: storageKg.corn,
            Премікси_кг: storageKg.premix,
          },
        ],
      },
      { name: 'Інциденти_статуси', rows: incidentsByStatus },
      { name: 'Обладнання_довідник', rows: equipment.map((row) => ({ ...row })) },
      {
        name: 'Обладнання_журнал',
        rows: equipmentWithJournal.map((row) => ({
          Назва: row.name,
          Статус_довідник: row.status,
          Стан_з_інцидентів: row.journal.label,
        })),
      },
      { name: 'Вироб_дата', rows: productionByDate },
      { name: 'Вироб_рецепт', rows: productionByRecipe },
      {
        name: 'Інциденти',
        rows: recentIncidents.map((row) => ({
          Час: row.time,
          Обладнання: row.equipment,
          Статус: row.status,
          Опис: row.description,
        })),
      },
      {
        name: 'Рухи',
        rows: filteredMovements.map((row) => ({
          Час: row.time,
          Тип: row.type,
          Джерело: row.source,
          Пш: row.deltaKg.wheat,
          Кк: row.deltaKg.corn,
          Пр: row.deltaKg.premix,
        })),
      },
    ])
  }

  return (
    <section className="space-y-4">
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Звіти та аналітика</h3>
          <p className="mt-1 text-sm text-slate-600">{periodMeta.label}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm text-slate-700">
            Період
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="mt-1 block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {REPORT_PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            {period === 'day' ? 'Дата' : 'Опорна дата'}
            <input
              type="date"
              value={referenceDate}
              onChange={(event) => setReferenceDate(event.target.value)}
              className="mt-1 block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={handleExportXlsx}
            className="rounded-md border border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-200"
          >
            Excel
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Друк
          </button>
        </div>
      </div>

      <div className="report-print-header hidden print:block">
        <h1 className="text-xl font-bold text-slate-900">Звіт з аналітики виробництва</h1>
        <p className="mt-1 text-sm text-slate-700">
          Період: {getPeriodLabel(period)} · {periodMeta.label}
        </p>
        <p className="text-xs text-slate-500">Сформовано: {new Date().toLocaleString('uk-UA')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Вироблено за період</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{periodTons} т</p>
        </div>
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Активні інциденти</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{activeIncidentsCount}</p>
          <p className="mt-1 text-xs text-slate-500">У межах обраного періоду</p>
        </div>
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Не «Робоча» (довідник)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{nonWorkingEquipmentCount}</p>
        </div>
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Партій за період</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{filteredBatches.length}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 screen-only-charts">
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Інциденти за статусом</h3>
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
          <h3 className="text-lg font-semibold text-slate-800">Обладнання за довідником</h3>
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

      <div className="hidden print:block print-section">
        <h3 className="mb-2 text-base font-semibold">Інциденти за статусом</h3>
        <table className="print-table">
          <thead>
            <tr>
              <th>Статус</th>
              <th>Кількість</th>
            </tr>
          </thead>
          <tbody>
            {incidentsByStatus.map((row) => (
              <tr key={row.status}>
                <td>{row.status}</td>
                <td>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Обладнання: довідник і журнал</h3>
        <div className="mt-3 overflow-x-auto screen-only-table">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-3 py-2">Обладнання</th>
                <th className="px-3 py-2">Статус (довідник)</th>
                <th className="px-3 py-2">Стан з журналу інцидентів</th>
              </tr>
            </thead>
            <tbody>
              {equipmentWithJournal.map((row) => (
                <tr key={row.id} className="border-t border-slate-200">
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">
                    <span className={row.journal.isDown ? 'font-semibold text-orange-700' : ''}>
                      {row.journal.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <table className="print-table hidden print:table">
          <thead>
            <tr>
              <th>Обладнання</th>
              <th>Довідник</th>
              <th>Журнал</th>
            </tr>
          </thead>
          <tbody>
            {equipmentWithJournal.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.status}</td>
                <td>{row.journal.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Інциденти за період</h3>
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm text-slate-700 screen-only-table">
          {recentIncidents.length === 0 && <li className="text-slate-500">Немає записів за обраний період.</li>}
          {recentIncidents.map((item) => (
            <li key={item.id} className="border-b border-slate-100 pb-2">
              <span className="text-xs text-slate-500">{item.time}</span> ·{' '}
              <span className="text-xs font-medium text-enterprise-800">
                {INCIDENT_CATEGORY_LABELS[normalizeIncidentCategory(item.category)]}
              </span>{' '}
              · <span className="font-medium">{item.equipment}</span> · {item.status}
            </li>
          ))}
        </ul>
        <table className="print-table hidden print:table">
          <thead>
            <tr>
              <th>Час</th>
              <th>Категорія</th>
              <th>Обладнання</th>
              <th>Статус</th>
              <th>Опис</th>
            </tr>
          </thead>
          <tbody>
            {recentIncidents.map((item) => (
              <tr key={item.id}>
                <td>{item.time}</td>
                <td>{INCIDENT_CATEGORY_LABELS[normalizeIncidentCategory(item.category)]}</td>
                <td>{item.equipment}</td>
                <td>{item.status}</td>
                <td>{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm screen-only-charts">
          <h3 className="text-lg font-semibold text-slate-800">Виробництво по датах, т</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={productionByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 11 }} />
                <YAxis stroke={axisStroke} tick={{ fill: axisStroke }} />
                <Tooltip />
                <Line type="monotone" dataKey="producedTons" name="Вироблено, т" stroke="#2f4d71" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="hidden print:block print-section">
          <h3 className="mb-2 text-base font-semibold">Виробництво по датах, т</h3>
          <table className="print-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Вироблено, т</th>
              </tr>
            </thead>
            <tbody>
              {productionByDate.map((row) => (
                <tr key={row.date}>
                  <td>{row.date}</td>
                  <td>{row.producedTons}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Виробництво по рецептах, т</h3>
          <div className="screen-only-charts mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionByRecipe}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="recipe" hide />
                <YAxis stroke={axisStroke} tick={{ fill: axisStroke }} />
                <Tooltip />
                <Bar dataKey="producedTons" name="Вироблено, т" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="print-table mt-3">
            <thead>
              <tr>
                <th>Рецепт</th>
                <th>Вироблено, т</th>
              </tr>
            </thead>
            <tbody>
              {productionByRecipe.map((row) => (
                <tr key={row.recipe}>
                  <td>{row.recipe}</td>
                  <td>{row.producedTons}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Залишки сировини, кг</h3>
          <div className="screen-only-charts mt-4 h-72">
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
          <table className="print-table mt-3">
            <thead>
              <tr>
                <th>Сировина</th>
                <th>Залишок, кг</th>
              </tr>
            </thead>
            <tbody>
              {storagePieData.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Рухи сировини за період</h3>
          <div className="screen-only-charts mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movementsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="time" stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 10 }} />
                <YAxis stroke={axisStroke} tick={{ fill: axisStroke }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="wheat" name="Пшениця, кг" fill="#2f4d71" />
                <Bar dataKey="corn" name="Кукурудза, кг" fill="#ea580c" />
                <Bar dataKey="premix" name="Премікси, кг" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="print-table mt-3 hidden print:table">
            <thead>
              <tr>
                <th>Час</th>
                <th>Тип</th>
                <th>Джерело</th>
                <th>Пш</th>
                <th>Кк</th>
                <th>Пр</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map((row) => (
                <tr key={row.id}>
                  <td>{row.time}</td>
                  <td>{row.type}</td>
                  <td>{row.source}</td>
                  <td>{row.deltaKg.wheat}</td>
                  <td>{row.deltaKg.corn}</td>
                  <td>{row.deltaKg.premix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default ReportsPage
