import { useMemo, useState } from 'react'
import {
  FactoryIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  WrenchIcon,
  CubeIcon,
  DocumentArrowDownIcon,
  SpreadsheetIcon,
} from '../components/common/Icons'
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
  isWithinPeriod,
  REPORT_PERIOD_OPTIONS,
  toDateKey,
} from '../utils/reportPeriod'
import { exportReportWorkbook } from '../utils/xlsxExport'

const EQUIP_STATUS_ORDER = ['Робоча', 'Тех. огляд', 'Ремонт']

const KPI_ACCENTS = {
  blue: 'from-blue-500/10 to-blue-500/0 border-l-blue-500',
  emerald: 'from-emerald-500/10 to-emerald-500/0 border-l-emerald-500',
  orange: 'from-orange-500/10 to-orange-500/0 border-l-orange-500',
  rose: 'from-rose-500/10 to-rose-500/0 border-l-rose-500',
  amber: 'from-amber-500/10 to-amber-500/0 border-l-amber-500',
}

function KpiCard({ accent = 'blue', label, value, hint, icon }) {
  return (
    <div
      className={`print-section relative overflow-hidden rounded-xl border border-slate-200 border-l-4 bg-gradient-to-br ${KPI_ACCENTS[accent]} bg-white p-4 shadow-sm transition hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {icon && (
          <div className="rounded-lg bg-white/70 p-2 text-lg shadow-sm dark:bg-slate-700">{icon}</div>
        )}
      </div>
    </div>
  )
}

function SectionCard({ title, action, children }) {
  return (
    <div className="print-section rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function ReportsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const axisStroke = isDark ? '#94a3b8' : '#475569'
  const gridStroke = isDark ? '#334155' : '#e2e8f0'

  const { batches, incidents, movements, storageKg, equipment } = useAppData()
  const [period, setPeriod] = useState('week')
  const todayKey = toDateKey(new Date())
  const [referenceDate, setReferenceDate] = useState(todayKey)
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 14)
    return toDateKey(d)
  })
  const [customTo, setCustomTo] = useState(todayKey)

  const customRange = useMemo(() => ({ from: customFrom, to: customTo }), [customFrom, customTo])

  const periodMeta = useMemo(
    () => getPeriodBounds(period, referenceDate, customRange),
    [period, referenceDate, customRange],
  )

  const filteredBatches = useMemo(
    () => batches.filter((batch) => isWithinPeriod(batch.createdAt, period, referenceDate, customRange)),
    [batches, period, referenceDate, customRange],
  )

  const filteredIncidents = useMemo(
    () => incidents.filter((item) => isWithinPeriod(item.time, period, referenceDate, customRange)),
    [incidents, period, referenceDate, customRange],
  )

  const filteredMovements = useMemo(
    () => movements.filter((item) => isWithinPeriod(item.time, period, referenceDate, customRange)),
    [movements, period, referenceDate, customRange],
  )

  const periodTons = useMemo(
    () => Number((filteredBatches.reduce((sum, batch) => sum + batch.feedProducedKg, 0) / 1000).toFixed(2)),
    [filteredBatches],
  )

  const periodRawSpentKg = useMemo(
    () => filteredBatches.reduce((sum, b) => sum + (Number(b.rawSpentKg) || 0), 0),
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
      if (!time || typeof time !== 'string') return 0
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

  const totalCostUah = useMemo(
    () => filteredBatches.reduce((sum, b) => sum + (Number(b.batchCostUah) || 0), 0),
    [filteredBatches],
  )

  const costByRecipe = useMemo(() => {
    const map = filteredBatches.reduce((acc, b) => {
      if (!acc[b.recipe]) acc[b.recipe] = { recipe: b.recipe, totalCostUah: 0, producedTons: 0 }
      acc[b.recipe].totalCostUah += Number(b.batchCostUah) || 0
      acc[b.recipe].producedTons += (Number(b.feedProducedKg) || 0) / 1000
      return acc
    }, {})
    return Object.values(map).map((r) => ({
      ...r,
      producedTons: Number(r.producedTons.toFixed(2)),
      costPerTon: r.producedTons > 0 ? Math.round(r.totalCostUah / r.producedTons) : 0,
    }))
  }, [filteredBatches])

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

  const periodFilenameStamp =
    period === 'custom' ? `${customFrom}_${customTo}` : `${period}-${referenceDate}`

  const buildReportConfig = () => {
    const avgCostPerTon = periodTons > 0 ? Math.round(totalCostUah / periodTons) : 0
    return {
      docTitle: 'Звіт з аналітики виробництва',
      docSubtitle: `Комбікормовий завод · ${periodMeta.label}`,
      generatedAt: new Date().toLocaleString('uk-UA'),
      avgCostPerTon,
      sheets: [
        {
          name: 'Огляд',
          title: 'Загальний огляд за період',
          sections: [
            {
              title: 'Ключові показники',
              kpis: [
                { label: 'Період', value: periodMeta.label },
                { label: 'Вироблено', value: periodTons, unit: 'т' },
                { label: 'Витрачено сировини', value: periodRawSpentKg, unit: 'кг' },
                { label: 'Кількість партій', value: filteredBatches.length, unit: 'шт' },
                { label: 'Загальна собівартість', value: totalCostUah, unit: 'грн' },
                { label: 'Середня собівартість', value: avgCostPerTon, unit: 'грн/т' },
                { label: 'Активні інциденти', value: activeIncidentsCount, unit: 'шт' },
                { label: 'Усього інцидентів', value: filteredIncidents.length, unit: 'шт' },
                { label: 'Не «Робоча» (довідник)', value: nonWorkingEquipmentCount, unit: 'шт' },
              ],
            },
            {
              title: 'Залишки сировини на складі',
              headers: ['Сировина', 'Залишок, кг', 'Частка'],
              rows: storagePieData.map((s) => {
                const total = storagePieData.reduce((sum, x) => sum + x.value, 0)
                const pct = total > 0 ? ((s.value / total) * 100).toFixed(1) + '%' : '—'
                return [s.name, s.value, pct]
              }),
              totals: [
                'Разом',
                storagePieData.reduce((sum, s) => sum + s.value, 0),
                '100%',
              ],
            },
          ],
        },
        {
          name: 'Виробництво',
          title: 'Виробництво продукції',
          sections: [
            {
              title: 'Виробництво за днями',
              headers: ['Дата', 'Вироблено, т'],
              rows: productionByDate.map((r) => [r.date, r.producedTons]),
              totals: ['Разом', productionByDate.reduce((sum, r) => sum + r.producedTons, 0)],
            },
            {
              title: 'Виробництво за рецептами',
              headers: ['Рецепт', 'Вироблено, т', 'Частка, %'],
              rows: productionByRecipe.map((r) => {
                const total = productionByRecipe.reduce((s, x) => s + x.producedTons, 0)
                const pct = total > 0 ? Number(((r.producedTons / total) * 100).toFixed(1)) : 0
                return [r.recipe, r.producedTons, pct]
              }),
              totals: [
                'Разом',
                productionByRecipe.reduce((s, r) => s + r.producedTons, 0),
                100,
              ],
            },
            {
              title: 'Деталізація партій',
              headers: ['Час', 'Лінія', 'Рецепт', 'Витрачено, кг', 'Вироблено, кг', 'Собівартість, грн'],
              rows: filteredBatches.map((b) => [
                b.createdAt,
                b.line || 'Лінія 1',
                b.recipe,
                Number(b.rawSpentKg) || 0,
                Number(b.feedProducedKg) || 0,
                Number(b.batchCostUah) || 0,
              ]),
              totals: [
                'Разом',
                '',
                '',
                periodRawSpentKg,
                periodTons * 1000,
                totalCostUah,
              ],
            },
          ],
        },
        {
          name: 'Собівартість',
          title: 'Аналіз собівартості',
          sections: [
            {
              title: 'Зведений підсумок',
              kpis: [
                { label: 'Загальна собівартість', value: totalCostUah, unit: 'грн' },
                { label: 'Середня по партії', value: filteredBatches.length > 0 ? Math.round(totalCostUah / filteredBatches.length) : 0, unit: 'грн' },
                { label: 'Середня на тонну', value: avgCostPerTon, unit: 'грн/т' },
              ],
            },
            {
              title: 'Собівартість за рецептами',
              headers: ['Рецепт', 'Вироблено, т', 'Загальна вартість, грн', 'Собівартість, грн/т'],
              rows: costByRecipe.map((r) => [
                r.recipe,
                r.producedTons,
                r.totalCostUah,
                r.costPerTon,
              ]),
              totals: [
                'Разом',
                costByRecipe.reduce((s, r) => s + r.producedTons, 0),
                totalCostUah,
                avgCostPerTon,
              ],
            },
          ],
        },
        {
          name: 'Інциденти',
          title: 'Журнал інцидентів',
          sections: [
            {
              title: 'Розподіл за статусами',
              headers: ['Статус', 'Кількість'],
              rows: incidentsByStatus.map((r) => [r.status, r.count]),
              totals: ['Разом', filteredIncidents.length],
            },
            {
              title: 'Деталізований список (до 20 останніх)',
              headers: ['Час', 'Категорія', 'Обладнання / місце', 'Опис', 'Пріоритет', 'Статус'],
              rows: recentIncidents.map((i) => [
                i.time,
                INCIDENT_CATEGORY_LABELS[normalizeIncidentCategory(i.category)] || '—',
                i.equipment || '—',
                i.description || '',
                i.severity || 'Середня',
                i.status,
              ]),
            },
          ],
        },
        {
          name: 'Обладнання',
          title: 'Стан обладнання',
          sections: [
            {
              title: 'Розподіл за статусами (довідник)',
              headers: ['Статус', 'Одиниць'],
              rows: equipmentByDirectoryStatus.map((r) => [r.status, r.count]),
              totals: ['Разом', equipment.length],
            },
            {
              title: 'Деталі по обладнанню',
              headers: ['Назва', 'Тип', 'Статус (довідник)', 'З журналу інцидентів', 'Наступне ТО'],
              rows: equipmentWithJournal.map((row) => [
                row.name,
                row.type || '—',
                row.status,
                row.journal.label,
                row.nextMaintenance || '—',
              ]),
            },
          ],
        },
        {
          name: 'Рух сировини',
          title: 'Рух сировини за період',
          sections: [
            {
              title: 'Список операцій',
              headers: ['Час', 'Тип', 'Джерело', 'Пшениця, кг', 'Кукурудза, кг', 'Премікси, кг'],
              rows: filteredMovements.map((m) => [
                m.time,
                m.type,
                m.source,
                m.deltaKg.wheat,
                m.deltaKg.corn,
                m.deltaKg.premix,
              ]),
              totals: [
                'Разом',
                '',
                '',
                filteredMovements.reduce((s, m) => s + Math.abs(m.deltaKg.wheat), 0),
                filteredMovements.reduce((s, m) => s + Math.abs(m.deltaKg.corn), 0),
                filteredMovements.reduce((s, m) => s + Math.abs(m.deltaKg.premix), 0),
              ],
            },
          ],
        },
      ],
    }
  }

  const handleExportXlsx = () => {
    const cfg = buildReportConfig()
    exportReportWorkbook({
      filename: `zvit-vyrobnytstva-${periodFilenameStamp}.xlsx`,
      docTitle: cfg.docTitle,
      docSubtitle: cfg.docSubtitle,
      generatedAt: cfg.generatedAt,
      sheets: cfg.sheets,
    })
  }

  const handleExportPdf = async () => {
    const { exportReportPdf } = await import('../utils/pdfExport')
    const cfg = buildReportConfig()
    exportReportPdf({
      filename: `zvit-vyrobnytstva-${periodFilenameStamp}.pdf`,
      docTitle: cfg.docTitle,
      docSubtitle: cfg.docSubtitle,
      generatedAt: cfg.generatedAt,
      sheets: cfg.sheets,
    })
  }

  return (
    <section className="space-y-5">
      {/* ── HEADER ── */}
      <div className="no-print rounded-xl border border-slate-200 bg-gradient-to-br from-enterprise-700 to-enterprise-800 p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-blue-200">
              Комбікормовий завод
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">Звіти та аналітика</h2>
            <p className="mt-1 text-sm text-blue-100">{periodMeta.label}</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-rose-600 hover:shadow-lg"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              Експорт у PDF
            </button>
            <button
              type="button"
              onClick={handleExportXlsx}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600 hover:shadow-lg"
            >
              <SpreadsheetIcon className="w-4 h-4" />
              Експорт у Excel
            </button>
          </div>
        </div>
      </div>

      {/* ── PERIOD PICKER ── */}
      <div className="no-print rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            {REPORT_PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  period === option.value
                    ? 'bg-enterprise-700 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {period === 'custom' ? (
            <>
              <label className="text-sm text-slate-700">
                Від
                <input
                  type="date"
                  value={customFrom}
                  max={customTo}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="mt-1 block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-slate-700">
                До
                <input
                  type="date"
                  value={customTo}
                  min={customFrom}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="mt-1 block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </label>
            </>
          ) : (
            <label className="text-sm text-slate-700">
              {period === 'day' ? 'Дата' : 'Опорна дата'}
              <input
                type="date"
                value={referenceDate}
                onChange={(e) => setReferenceDate(e.target.value)}
                className="mt-1 block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </label>
          )}

          <div className="ml-auto rounded-md bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">
            {filteredBatches.length} партій · {filteredIncidents.length} інцидентів
          </div>
        </div>
      </div>

      {/* ── PRINT HEADER ── */}
      <div className="report-print-header hidden print:block">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="print-company-name">Комбікормовий завод</p>
            <h1>Звіт з аналітики виробництва</h1>
            <p className="print-doc-subtitle">{periodMeta.label}</p>
          </div>
          <div className="print-logo-block">
            <div className="print-logo">DSJ</div>
            <p className="print-generated">Digital Shift Journal</p>
            <p className="print-generated">Сформовано: {new Date().toLocaleString('uk-UA')}</p>
          </div>
        </div>
      </div>

      {/* ── KPI GRID ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          accent="blue"
          label="Вироблено"
          value={`${periodTons} т`}
          hint="за обраний період"
          icon={<FactoryIcon className="w-5 h-5" />}
        />
        <KpiCard
          accent="emerald"
          label="Собівартість"
          value={`${totalCostUah.toLocaleString('uk-UA')} ₴`}
          hint={periodTons > 0 ? `${Math.round(totalCostUah / periodTons).toLocaleString('uk-UA')} ₴/т` : '—'}
          icon={<BanknotesIcon className="w-5 h-5" />}
        />
        <KpiCard
          accent="orange"
          label="Активні інциденти"
          value={activeIncidentsCount}
          hint="в роботі + на перевірці"
          icon={<ExclamationTriangleIcon className="w-5 h-5" />}
        />
        <KpiCard
          accent="rose"
          label="Не «Робоча»"
          value={nonWorkingEquipmentCount}
          hint="одиниць обладнання"
          icon={<WrenchIcon className="w-5 h-5" />}
        />
        <KpiCard
          accent="amber"
          label="Партій"
          value={filteredBatches.length}
          hint="за обраний період"
          icon={<CubeIcon className="w-5 h-5" />}
        />
      </div>

      {/* ── CHARTS ── */}
      <div className="grid gap-4 lg:grid-cols-2 screen-only-charts">
        <SectionCard title="Інциденти за статусом">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incidentsByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="status" stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 11 }} />
                <YAxis stroke={axisStroke} tick={{ fill: axisStroke }} allowDecimals={false} />
                <Tooltip
                  contentStyle={
                    isDark ? { backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' } : undefined
                  }
                />
                <Bar dataKey="count" name="Кількість" fill="#ea580c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Обладнання за статусом">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={equipmentByDirectoryStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="status" stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 11 }} />
                <YAxis stroke={axisStroke} tick={{ fill: axisStroke }} allowDecimals={false} />
                <Tooltip
                  contentStyle={
                    isDark ? { backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' } : undefined
                  }
                />
                <Bar dataKey="count" name="Одиниць" fill="#2f4d71" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* PRINT incidents-by-status table */}
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

      {/* ── Equipment table ── */}
      <SectionCard title="Обладнання: довідник і журнал">
        <div className="overflow-x-auto screen-only-table">
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
      </SectionCard>

      {/* ── Cost analysis ── */}
      <SectionCard title="Аналіз собівартості">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Загальна вартість за рецептами, ₴</p>
            <div className="screen-only-charts h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costByRecipe} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                  <XAxis
                    type="number"
                    stroke={axisStroke}
                    tick={{ fill: axisStroke, fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="recipe"
                    width={170}
                    stroke={axisStroke}
                    tick={{ fill: axisStroke, fontSize: 10 }}
                  />
                  <Tooltip
                    formatter={(v) => `${v.toLocaleString('uk-UA')} ₴`}
                    contentStyle={
                      isDark
                        ? { backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }
                        : undefined
                    }
                  />
                  <Bar dataKey="totalCostUah" name="Вартість, ₴" fill="#2f4d71" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Собівартість на тонну, ₴/т</p>
            <div className="screen-only-charts h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costByRecipe} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                  <XAxis type="number" stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="recipe"
                    width={170}
                    stroke={axisStroke}
                    tick={{ fill: axisStroke, fontSize: 10 }}
                  />
                  <Tooltip
                    formatter={(v) => `${v.toLocaleString('uk-UA')} ₴/т`}
                    contentStyle={
                      isDark
                        ? { backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }
                        : undefined
                    }
                  />
                  <Bar dataKey="costPerTon" name="₴/т" fill="#ea580c" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <table className="print-table mt-4">
          <thead>
            <tr>
              <th>Рецепт</th>
              <th>Вироблено, т</th>
              <th>Загальна вартість, ₴</th>
              <th>Собівартість, ₴/т</th>
            </tr>
          </thead>
          <tbody>
            {costByRecipe.map((row) => (
              <tr key={row.recipe}>
                <td>{row.recipe}</td>
                <td>{row.producedTons}</td>
                <td>{row.totalCostUah.toLocaleString('uk-UA')}</td>
                <td>{row.costPerTon.toLocaleString('uk-UA')}</td>
              </tr>
            ))}
            {costByRecipe.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>
                  Немає даних за обраний період.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </SectionCard>

      {/* ── Incidents list ── */}
      <SectionCard title="Інциденти за період">
        <ul className="max-h-64 space-y-2 overflow-y-auto text-sm text-slate-700 screen-only-table">
          {recentIncidents.length === 0 && (
            <li className="text-slate-500">Немає записів за обраний період.</li>
          )}
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
      </SectionCard>

      {/* ── Production charts ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Виробництво по датах, т">
          <div className="screen-only-charts h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={productionByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 11 }} />
                <YAxis stroke={axisStroke} tick={{ fill: axisStroke }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="producedTons"
                  name="Вироблено, т"
                  stroke="#2f4d71"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#2f4d71' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <table className="print-table mt-3 hidden print:table">
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
        </SectionCard>

        <SectionCard title="Виробництво по рецептах, т">
          <div className="screen-only-charts h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionByRecipe}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="recipe" hide />
                <YAxis stroke={axisStroke} tick={{ fill: axisStroke }} />
                <Tooltip />
                <Bar dataKey="producedTons" name="Вироблено, т" fill="#ea580c" radius={[6, 6, 0, 0]} />
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
        </SectionCard>
      </div>

      {/* ── Storage & movements ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Залишки сировини, кг">
          <div className="screen-only-charts h-72">
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
        </SectionCard>

        <SectionCard title="Рухи сировини за період">
          <div className="screen-only-charts h-64">
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
        </SectionCard>
      </div>
    </section>
  )
}

export default ReportsPage
