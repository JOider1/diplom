import { useMemo, useState } from 'react'
import ConfirmModal from '../components/common/ConfirmModal'
import IncidentKanbanBoard from '../components/incidents/IncidentKanbanBoard'
import PrintHeader from '../components/common/PrintHeader'
import PageHero from '../components/common/PageHero'
import { ExportPdfButton, ExportXlsxButton } from '../components/common/ExportButtons'
import {
  INCIDENT_CATEGORY_EQUIPMENT,
  INCIDENT_CATEGORY_OPTIONS,
  normalizeIncidentCategory,
} from '../constants/incidentCategories'
import { INCIDENT_STATUSES } from '../constants/incidentStatuses'
import { useAppData } from '../context/AppDataContext'
import { exportRows } from '../utils/xlsxExport'

const defaultIncident = {
  time: '',
  category: INCIDENT_CATEGORY_EQUIPMENT,
  equipment: '',
  description: '',
  status: 'В роботі',
  severity: 'Середня',
}

const equipmentPlaceholder = 'Обладнання (назва з довідника)'
const otherPlaceholders = {
  workplace_safety: 'Місце / ділянка події',
  other: "Об'єкт або зона (за потреби)",
}

function IncidentsPage() {
  const { incidents, addIncident, updateIncidentStatus, updateIncident, deleteIncident } = useAppData()
  const [formData, setFormData] = useState(defaultIncident)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const equipmentFieldPlaceholder = useMemo(() => {
    const cat = normalizeIncidentCategory(formData.category)
    if (cat === INCIDENT_CATEGORY_EQUIPMENT) {
      return equipmentPlaceholder
    }
    return otherPlaceholders[cat] || otherPlaceholders.other
  }, [formData.category])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const payload = {
      ...formData,
      time: formData.time.replace('T', ' '),
      category: normalizeIncidentCategory(formData.category),
    }
    if (editingId) {
      await updateIncident(editingId, payload)
      setEditingId(null)
      setFormData(defaultIncident)
      return
    }
    await addIncident(payload)
    setFormData(defaultIncident)
  }

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const bySearch = `${incident.equipment} ${incident.description}`
        .toLowerCase()
        .includes(search.trim().toLowerCase())
      const byStatus = selectedStatus === 'all' || incident.status === selectedStatus
      const bySeverity = selectedSeverity === 'all' || incident.severity === selectedSeverity
      const byDate = !dateFrom || incident.time.slice(0, 10) >= dateFrom
      const cat = normalizeIncidentCategory(incident.category)
      const byCategory =
        selectedCategory === 'all' ||
        (selectedCategory === 'non_equipment' && cat !== INCIDENT_CATEGORY_EQUIPMENT) ||
        cat === selectedCategory
      return bySearch && byStatus && bySeverity && byDate && byCategory
    })
  }, [dateFrom, incidents, search, selectedCategory, selectedSeverity, selectedStatus])

  const sortedForPrint = useMemo(
    () =>
      [...filteredIncidents].sort((a, b) =>
        String(a.time).localeCompare(String(b.time), 'uk'),
      ),
    [filteredIncidents],
  )

  const buildExportPayload = () => ({
    filename: `incidents-${new Date().toISOString().slice(0, 10)}`,
    sheetName: 'Інциденти',
    rows: filteredIncidents.map((i) => ({
      ID: i.id,
      Час: i.time,
      Категорія: INCIDENT_CATEGORY_OPTIONS.find((o) => o.value === normalizeIncidentCategory(i.category))?.label,
      'Обладнання / місце': i.equipment,
      Опис: i.description,
      Пріоритет: i.severity || 'Середня',
      Статус: i.status,
    })),
    options: {
      docTitle: 'Журнал інцидентів',
      docSubtitle: `Комбікормовий завод · фільтр повернув ${filteredIncidents.length} записів`,
      sheetTitle: 'Деталізований список інцидентів',
      sectionTitle: 'Інциденти',
    },
  })

  const handleExportXlsx = () => {
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
      <PrintHeader title="Журнал інцидентів" />
      <PageHero
        title="Журнал інцидентів"
        subtitle={`${filteredIncidents.length} записів за фільтром`}
      >
        <ExportPdfButton onClick={handleExportPdf} />
        <ExportXlsxButton onClick={handleExportXlsx} />
      </PageHero>

      <form
        onSubmit={handleSubmit}
        className="no-print grid gap-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm md:grid-cols-6"
      >
        <input
          required
          type="datetime-local"
          value={formData.time}
          onChange={(event) => setFormData((prev) => ({ ...prev, time: event.target.value }))}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <select
          value={formData.category}
          onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
          className="rounded-md border border-slate-300 px-3 py-2"
          aria-label="Категорія інциденту"
        >
          {INCIDENT_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          required
          placeholder={equipmentFieldPlaceholder}
          value={formData.equipment}
          onChange={(event) => setFormData((prev) => ({ ...prev, equipment: event.target.value }))}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          required
          placeholder="Опис проблеми"
          value={formData.description}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, description: event.target.value }))
          }
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <select
          value={formData.status}
          onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))}
          className="rounded-md border border-slate-300 px-3 py-2"
        >
          {INCIDENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={formData.severity}
          onChange={(event) => setFormData((prev) => ({ ...prev, severity: event.target.value }))}
          className="rounded-md border border-slate-300 px-3 py-2"
        >
          <option>Критична</option>
          <option>Висока</option>
          <option>Середня</option>
          <option>Низька</option>
        </select>
        <button
          type="submit"
          className="md:col-span-6 rounded-md bg-enterprise-700 px-4 py-2 text-sm font-semibold text-white hover:bg-enterprise-800"
        >
          {editingId ? 'Зберегти зміни' : 'Додати інцидент'}
        </button>
        {editingId && (
          <button
            type="button"
            className="md:col-span-6 rounded-md border border-slate-300 px-4 py-2 text-sm"
            onClick={() => {
              setEditingId(null)
              setFormData(defaultIncident)
            }}
          >
            Скасувати редагування
          </button>
        )}
      </form>

      <div className="no-print grid gap-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm md:grid-cols-5">
        <input
          placeholder="Пошук по обладнанню або опису"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <select
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2"
        >
          <option value="all">Усі статуси (канбан)</option>
          {INCIDENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2"
        >
          <option value="all">Усі категорії</option>
          <option value={INCIDENT_CATEGORY_EQUIPMENT}>Обладнання / виробництво</option>
          <option value="non_equipment">Охорона праці та інше</option>
          {INCIDENT_CATEGORY_OPTIONS.filter((o) => o.value !== INCIDENT_CATEGORY_EQUIPMENT).map((o) => (
            <option key={o.value} value={o.value}>
              Лише: {o.label}
            </option>
          ))}
        </select>
        <select
          value={selectedSeverity}
          onChange={(event) => setSelectedSeverity(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2"
        >
          <option value="all">Усі пріоритети</option>
          <option value="Критична">Критична</option>
          <option value="Висока">Висока</option>
          <option value="Середня">Середня</option>
          <option value="Низька">Низька</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <div className="hidden print:block print-section">
        <h3 className="mb-2 text-lg font-semibold text-slate-800">Інциденти (друк)</h3>
        <table className="print-table min-w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Час</th>
              <th className="px-4 py-3">Категорія</th>
              <th className="px-4 py-3">Обладнання / місце</th>
              <th className="px-4 py-3">Опис</th>
              <th className="px-4 py-3">Пріоритет</th>
              <th className="px-4 py-3">Статус</th>
            </tr>
          </thead>
          <tbody>
            {sortedForPrint.map((incident) => (
              <tr key={incident.id} className="border-t border-slate-200">
                <td className="px-4 py-3">{incident.time}</td>
                <td className="px-4 py-3">
                  {INCIDENT_CATEGORY_OPTIONS.find((o) => o.value === normalizeIncidentCategory(incident.category))
                    ?.label || '—'}
                </td>
                <td className="px-4 py-3">{incident.equipment}</td>
                <td className="px-4 py-3">{incident.description}</td>
                <td className="px-4 py-3">{incident.severity || 'Середня'}</td>
                <td className="px-4 py-3">{incident.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="no-print rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Kanban-дошка інцидентів</h3>
        <p className="mb-4 text-sm text-slate-600">
          Перетягніть картку між колонками, щоб змінити статус: В роботі → На перевірці → Закрито. Категорія
          (обладнання чи охорона праці) задається у формі зверху — на звіт по обладнанню потрапляють лише записи
          категорії «Обладнання / виробництво».
        </p>
        <IncidentKanbanBoard
          incidents={filteredIncidents}
          onStatusChange={updateIncidentStatus}
          onEdit={(incident) => {
            setEditingId(incident.id)
            setFormData({
              time: incident.time.replace(' ', 'T'),
              category: normalizeIncidentCategory(incident.category),
              equipment: incident.equipment,
              description: incident.description,
              status: incident.status,
              severity: incident.severity || 'Середня',
            })
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onDelete={setDeleteId}
        />
      </div>

      {deleteId && (
        <ConfirmModal
          title="Видалити інцидент?"
          message="Запис буде видалено з журналу інцидентів."
          onCancel={() => setDeleteId(null)}
          onConfirm={() => {
            deleteIncident(deleteId)
            setDeleteId(null)
          }}
        />
      )}
    </section>
  )
}

export default IncidentsPage
