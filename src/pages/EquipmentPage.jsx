import { useMemo, useState } from 'react'
import ConfirmModal from '../components/common/ConfirmModal'
import PrintHeader from '../components/common/PrintHeader'
import PageHero from '../components/common/PageHero'
import {
  ExportPdfButton,
  ExportXlsxButton,
  HeroActionButton,
} from '../components/common/ExportButtons'
import { isEquipmentIncident } from '../constants/incidentCategories'
import { useAppData } from '../context/AppDataContext'
import { getEquipmentIncidentSummary } from '../utils/equipmentIncidentStatus'
import { exportRows } from '../utils/xlsxExport'

const defaultForm = { name: '', type: '', status: 'Робоча', nextMaintenance: '' }

const STATUS_BADGE = {
  Робоча: 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800',
  'Тех. огляд': 'rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800',
  Ремонт: 'rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800',
}

function EquipmentPage() {
  const { equipment, incidents, patchEquipment, addEquipment, deleteEquipment } = useAppData()
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(defaultForm)
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const rows = useMemo(
    () =>
      equipment.map((item) => ({
        ...item,
        journal: getEquipmentIncidentSummary(item.name, incidents),
        incidentCount: incidents.filter(
          (i) => isEquipmentIncident(i) && i.equipment === item.name,
        ).length,
      })),
    [equipment, incidents],
  )

  const filtered = useMemo(
    () => (statusFilter === 'all' ? rows : rows.filter((r) => r.status === statusFilter)),
    [rows, statusFilter],
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (editingId !== null) {
      await patchEquipment(editingId, {
        name: formData.name.trim(),
        type: formData.type.trim(),
        status: formData.status,
        nextMaintenance: formData.nextMaintenance,
      })
    } else {
      await addEquipment(formData)
    }
    setShowForm(false)
    setEditingId(null)
    setFormData(defaultForm)
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setFormData({
      name: item.name,
      type: item.type || '',
      status: item.status,
      nextMaintenance: item.nextMaintenance || '',
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const buildExportPayload = () => ({
    filename: `equipment-${new Date().toISOString().slice(0, 10)}`,
    sheetName: 'Обладнання',
    rows: filtered.map((item) => ({
      Назва: item.name,
      Тип: item.type || '—',
      Статус: item.status,
      'Наступне ТО': item.nextMaintenance || '—',
      'З журналу інцидентів': item.journal.label,
      'Інцидентів всього': item.incidentCount,
    })),
    options: {
      docTitle: 'Довідник обладнання',
      docSubtitle: `Комбікормовий завод · ${filtered.length} одиниць`,
      sheetTitle: 'Стан обладнання',
      sectionTitle: 'Перелік',
    },
  })

  const handleExportXlsx = () => {
    const p = buildExportPayload()
    exportRows(`${p.filename}.xlsx`, p.sheetName, p.rows, p.options)
  }

  const handleExportPdf = async () => {
    const { exportRowsPdf } = await import('../utils/pdfExport')
    const p = buildExportPayload()
    exportRowsPdf(`${p.filename}.pdf`, p.sheetName, p.rows, p.options)
  }

  return (
    <section className="space-y-4">
      <PrintHeader title="Довідник обладнання" />

      <PageHero
        title="Довідник обладнання"
        subtitle={`${filtered.length} одиниць у списку`}
      >
        <ExportPdfButton onClick={handleExportPdf} />
        <ExportXlsxButton onClick={handleExportXlsx} />
        <HeroActionButton
          onClick={() => {
            setShowForm(true)
            setEditingId(null)
            setFormData(defaultForm)
          }}
        >
          + Додати обладнання
        </HeroActionButton>
      </PageHero>

      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800">
        <label className="text-sm text-slate-700 dark:text-slate-200">
          Фільтр:
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ml-2 rounded-md border border-slate-300 px-2 py-1 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
          >
            <option value="all">Усі</option>
            <option value="Робоча">Робоча</option>
            <option value="Тех. огляд">Тех. огляд</option>
            <option value="Ремонт">Ремонт</option>
          </select>
        </label>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="no-print rounded-lg border border-slate-300 bg-white p-4 shadow-sm"
        >
          <h4 className="mb-3 font-semibold text-slate-800">
            {editingId !== null ? 'Редагування обладнання' : 'Нове обладнання'}
          </h4>
          <div className="grid gap-3 md:grid-cols-4">
            <input
              required
              placeholder="Назва"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2"
            />
            <input
              placeholder="Тип (напр. Гранулятор)"
              value={formData.type}
              onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2"
            />
            <select
              value={formData.status}
              onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2"
            >
              <option>Робоча</option>
              <option>Тех. огляд</option>
              <option>Ремонт</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
              Наступне ТО:
              <input
                type="date"
                value={formData.nextMaintenance}
                onChange={(e) => setFormData((p) => ({ ...p, nextMaintenance: e.target.value }))}
                className="rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <div className="flex gap-2 md:col-span-4">
              <button
                type="submit"
                className="rounded-md bg-enterprise-700 px-4 py-2 text-sm font-semibold text-white hover:bg-enterprise-800"
              >
                {editingId !== null ? 'Зберегти зміни' : 'Додати'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm"
              >
                Скасувати
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-300 bg-white shadow-sm">
        <table className="print-table min-w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Обладнання</th>
              <th className="px-4 py-3">Тип</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Журнал інцидентів</th>
              <th className="px-4 py-3">Наступне ТО</th>
              <th className="px-4 py-3">Інцидентів</th>
              <th className="print-hide-col px-4 py-3">Дії</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-t border-slate-200">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3">{item.type || '—'}</td>
                <td className="px-4 py-3">
                  <span className={STATUS_BADGE[item.status] ?? STATUS_BADGE['Робоча']}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={item.journal.isDown ? 'font-semibold text-orange-700' : ''}>
                    {item.journal.label}
                  </span>
                </td>
                <td className="px-4 py-3">{item.nextMaintenance || '—'}</td>
                <td className="px-4 py-3">{item.incidentCount}</td>
                <td className="print-hide-col px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    >
                      Редагувати
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(item.id)}
                      className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700"
                    >
                      Видалити
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  Обладнання не знайдено.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {deleteId !== null && (
        <ConfirmModal
          title="Видалити обладнання?"
          message="Запис буде видалено з довідника. Інциденти по ньому залишаться в журналі."
          onCancel={() => setDeleteId(null)}
          onConfirm={() => {
            deleteEquipment(deleteId)
            setDeleteId(null)
          }}
        />
      )}
    </section>
  )
}

export default EquipmentPage
