import { useMemo, useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { exportRows } from '../utils/xlsxExport'

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
  const { auditLog } = useAppData()
  const [search, setSearch] = useState('')

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

  const handleExport = () => {
    exportRows(
      `audit-log-${new Date().toISOString().slice(0, 10)}.xlsx`,
      'Audit',
      filtered.map((e) => ({
        Час: e.at,
        Хто: e.actor,
        Роль: e.role,
        Дія: e.action,
        Деталі: formatDetails(e.details),
      })),
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Audit Log</h3>
          <p className="text-sm text-slate-600">Історія дій у системі: хто, коли, що змінив.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="rounded-md border border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
        >
          Експорт у Excel
        </button>
      </div>

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
