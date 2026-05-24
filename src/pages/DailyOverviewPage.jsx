import { useMemo, useState } from 'react'
import PrintHeader from '../components/common/PrintHeader'
import PageHero from '../components/common/PageHero'
import { ExportPdfButton, ExportXlsxButton } from '../components/common/ExportButtons'
import { INCIDENT_CATEGORY_LABELS, normalizeIncidentCategory } from '../constants/incidentCategories'
import { useAppData } from '../context/AppDataContext'
import { exportReportWorkbook } from '../utils/xlsxExport'

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

  const buildReportSections = () => [
    {
      name: 'Зведення',
      title: `Зведення за ${selectedDate}`,
      sections: [
        {
          title: 'Ключові показники',
          kpis: [
            { label: 'Вироблено', value: data.totalFeedKg, unit: 'кг' },
            { label: 'Списано сировини', value: data.totalRawSpentKg, unit: 'кг' },
            { label: 'Інцидентів за день', value: data.dayIncidents.length, unit: 'шт' },
            { label: 'Активні інциденти', value: data.incidentsActive, unit: 'шт' },
            { label: 'Партій', value: data.dayBatches.length, unit: 'шт' },
            { label: 'Змін', value: data.dayShifts.length, unit: 'шт' },
          ],
        },
        {
          title: 'Зміни за день',
          headers: ['ID', 'Відкрито', 'Закрито', 'Статус', 'Оператор'],
          rows: data.dayShifts.map((s) => [s.id, s.openedAt, s.closedAt || '—', s.status, s.operator || '—']),
        },
        {
          title: 'Партії за день',
          headers: ['Час', 'Лінія', 'Рецепт', 'Вироблено, кг', 'Собівартість, грн'],
          rows: data.dayBatches.map((b) => [
            b.createdAt,
            b.line || 'Лінія 1',
            b.recipe,
            Number(b.feedProducedKg) || 0,
            Number(b.batchCostUah) || 0,
          ]),
          totals: [
            'Разом',
            '',
            '',
            data.totalFeedKg,
            data.dayBatches.reduce((s, b) => s + (Number(b.batchCostUah) || 0), 0),
          ],
        },
        {
          title: 'Інциденти за день',
          headers: ['Час', 'Категорія', 'Обладнання', 'Опис', 'Статус'],
          rows: data.dayIncidents.map((i) => [
            i.time,
            INCIDENT_CATEGORY_LABELS[normalizeIncidentCategory(i.category)] || '—',
            i.equipment || '—',
            i.description || '',
            i.status,
          ]),
        },
        {
          title: 'Рух сировини за день',
          headers: ['Час', 'Тип', 'Джерело', 'Пшениця, кг', 'Кукурудза, кг', 'Премікси, кг'],
          rows: data.dayMovements.map((m) => [
            m.time,
            m.type,
            m.source,
            m.deltaKg.wheat,
            m.deltaKg.corn,
            m.deltaKg.premix,
          ]),
        },
      ],
    },
  ]

  const handleExportXlsx = () => {
    exportReportWorkbook({
      filename: `zvedennia-${selectedDate}.xlsx`,
      docTitle: 'Зведення за день',
      docSubtitle: `Комбікормовий завод · ${selectedDate}`,
      generatedAt: new Date().toLocaleString('uk-UA'),
      sheets: buildReportSections(),
    })
  }

  const handleExportPdf = async () => {
    const { exportReportPdf } = await import('../utils/pdfExport')
    exportReportPdf({
      filename: `zvedennia-${selectedDate}.pdf`,
      docTitle: 'Зведення за день',
      docSubtitle: `Комбікормовий завод · ${selectedDate}`,
      generatedAt: new Date().toLocaleString('uk-UA'),
      sheets: buildReportSections(),
    })
  }

  return (
    <section className="space-y-4">
      <PrintHeader title="Зведення за день" subtitle={`Дата: ${selectedDate}`} />
      <PageHero title="Зведення за день" subtitle={`Дата: ${selectedDate}`}>
        <ExportPdfButton onClick={handleExportPdf} />
        <ExportXlsxButton onClick={handleExportXlsx} />
      </PageHero>

      <div className="no-print rounded-lg border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Оберіть дату
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="ml-3 rounded-md border border-slate-300 px-3 py-2 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
          />
        </label>
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
