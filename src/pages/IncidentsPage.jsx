import { useMemo, useState } from 'react'
import ConfirmModal from '../components/common/ConfirmModal'
import { useAppData } from '../context/AppDataContext'

const defaultIncident = {
  time: '',
  equipment: '',
  description: '',
  status: 'В роботі',
  severity: 'Середня',
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
  const [sortConfig, setSortConfig] = useState({ key: 'time', direction: 'desc' })

  const handleSubmit = (event) => {
    event.preventDefault()
    const payload = { ...formData, time: formData.time.replace('T', ' ') }
    if (editingId) {
      updateIncident(editingId, payload)
      setEditingId(null)
      setFormData(defaultIncident)
      return
    }
    addIncident(payload)
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
      return bySearch && byStatus && bySeverity && byDate
    })
  }, [dateFrom, incidents, search, selectedSeverity, selectedStatus])

  const sortedIncidents = useMemo(() => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1
    return [...filteredIncidents].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? ''
      const bValue = b[sortConfig.key] ?? ''
      return String(aValue).localeCompare(String(bValue), 'uk') * direction
    })
  }, [filteredIncidents, sortConfig])

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }
  const sortArrow = (key) =>
    sortConfig.key === key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'

  return (
    <section className="space-y-4">
      <div className="no-print flex justify-end">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          Роздрукувати звіт
        </button>
      </div>
      <form
        onSubmit={handleSubmit}
        className="no-print grid gap-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm md:grid-cols-5"
      >
        <input
          required
          type="datetime-local"
          value={formData.time}
          onChange={(event) => setFormData((prev) => ({ ...prev, time: event.target.value }))}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          required
          placeholder="Обладнання"
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
          <option>В роботі</option>
          <option>Закрито</option>
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
          className="md:col-span-5 rounded-md bg-enterprise-700 px-4 py-2 text-sm font-semibold text-white hover:bg-enterprise-800"
        >
          Додати інцидент
        </button>
      </form>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Усього інцидентів</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{incidents.length}</p>
        </div>
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">В роботі</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">
            {incidents.filter((item) => item.status === 'В роботі').length}
          </p>
        </div>
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Критичні</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">
            {incidents.filter((item) => item.severity === 'Критична').length}
          </p>
        </div>
        <div className="print-section rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Закрито</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">
            {incidents.filter((item) => item.status === 'Закрито').length}
          </p>
        </div>
      </div>

      <div className="no-print grid gap-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm md:grid-cols-4">
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
          <option value="all">Усі статуси</option>
          <option value="В роботі">В роботі</option>
          <option value="Закрито">Закрито</option>
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

      <div className="overflow-x-auto rounded-lg border border-slate-300 bg-white shadow-sm print-section">
        <table className="print-table min-w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('time')}>Час {sortArrow('time')}</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('equipment')}>Обладнання {sortArrow('equipment')}</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('description')}>Опис {sortArrow('description')}</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('severity')}>Пріоритет {sortArrow('severity')}</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('status')}>Статус {sortArrow('status')}</th>
              <th className="print-hide-col px-4 py-3">Дії</th>
            </tr>
          </thead>
          <tbody>
            {sortedIncidents.map((incident) => (
              <tr key={incident.id} className="border-t border-slate-200">
                <td className="px-4 py-3">{incident.time}</td>
                <td className="px-4 py-3">{incident.equipment}</td>
                <td className="px-4 py-3">{incident.description}</td>
                <td className="px-4 py-3">{incident.severity || 'Середня'}</td>
                <td className="print-hide-col px-4 py-3">
                  <select
                    value={incident.status}
                    onChange={(event) => updateIncidentStatus(incident.id, event.target.value)}
                    className="rounded-md border border-slate-300 px-2 py-1"
                  >
                    <option value="В роботі">В роботі</option>
                    <option value="Закрито">Закрито</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(incident.id)
                        setFormData({
                          time: incident.time.replace(' ', 'T'),
                          equipment: incident.equipment,
                          description: incident.description,
                          status: incident.status,
                          severity: incident.severity || 'Середня',
                        })
                      }}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    >
                      Редагувати
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(incident.id)}
                      className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700"
                    >
                      Видалити
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
