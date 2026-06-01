import { useEffect, useMemo, useState } from 'react'
import PageHero from '../components/common/PageHero'
import { ExportPdfButton, ExportXlsxButton } from '../components/common/ExportButtons'
import { useAppData } from '../context/AppDataContext'
import { exportRows } from '../utils/xlsxExport'
import { ArrowPathIcon } from '../components/common/Icons'

function formatDetails(details) {
  if (details == null) {
    return '—'
  }
  try {
    return JSON.stringify(details, null, 2)
  } catch {
    return String(details)
  }
}

function AuditLogPage() {
  const { auditLog, refreshAuditLog } = useAppData()
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // підтягуємо свіжий журнал при відкритті сторінки
  useEffect(() => {
    let cancelled = false
    setRefreshing(true)
    Promise.resolve(refreshAuditLog())
      .finally(() => {
        if (!cancelled) setRefreshing(false)
      })
    return () => {
      cancelled = true
    }
  }, [refreshAuditLog])

  const handleManualRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshAuditLog()
    } finally {
      setRefreshing(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) {
      return auditLog
    }
    return auditLog.filter((entry) => {
      const blob = `${entry.at} ${entry.actor} ${entry.role} ${entry.action} ${formatDetails(entry.details)}`.toLowerCase()
      return blob.includes(q)
    })
  }, [auditLog, search])

  const buildExportPayload = () => ({
    filename: `audit-log-${new Date().toISOString().slice(0, 10)}`,
    sheetName: 'Аудит',
    rows: filtered.map((e) => ({
      Час: e.at,
      Хто: e.actor,
      Роль: e.role,
      Дія: e.action,
      Деталі: formatDetails(e.details),
    })),
    options: {
      docTitle: 'Журнал аудиту дій користувачів',
      docSubtitle: `Комбікормовий завод · ${filtered.length} записів`,
      sheetTitle: 'Audit Log',
      sectionTitle: 'Список дій',
    },
  })

  const handleExport = () => {
    const p = buildExportPayload()
    exportRows(`${p.filename}.xlsx`, p.sheetName, p.rows, p.options)
  }

  const handleExportPdf = async () => {
    const { exportRowsPdf } = await import('../utils/pdfExport')
    const p = buildExportPayload()
    exportRowsPdf(`${p.filename}.pdf`, p.sheetName, p.rows, { ...p.options, orientation: 'landscape' })
  }

  return (
    <section className="space-y-4">
      <PageHero title="Журнал аудиту" subtitle="Історія дій у системі — хто, коли, що змінив">
        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="rounded-lg border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-white/20 hover:shadow-lg disabled:opacity-60"
        >
          <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Оновлення…' : 'Оновити'}
        </button>
        <ExportPdfButton onClick={handleExportPdf} />
        <ExportXlsxButton onClick={handleExport} />
      </PageHero>

      <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <input
          placeholder="Пошук по дії, користувачу, деталях…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 md:max-w-md"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-300 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">Час</th>
              <th className="px-4 py-3">Хто</th>
              <th className="px-4 py-3">Роль</th>
              <th className="px-4 py-3">Дія</th>
              <th className="min-w-[240px] px-4 py-3">Деталі</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Записів не знайдено.
                </td>
              </tr>
            )}
            {filtered.map((entry) => (
              <tr key={entry.id} className="border-t border-slate-200 align-top">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{entry.at}</td>
                <td className="px-4 py-3 font-medium">{entry.actor}</td>
                <td className="px-4 py-3 text-slate-600">{entry.role}</td>
                <td className="px-4 py-3 font-mono text-xs">{entry.action}</td>
                <td className="px-4 py-3">
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded bg-slate-50 p-2 text-xs text-slate-700">
                    {formatDetails(entry.details)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default AuditLogPage
