<<<<<<< HEAD
import { useState } from 'react'
import { incidentRecords } from '../data/mockData'
=======
import { useMemo, useState } from 'react'
import ConfirmModal from '../components/common/ConfirmModal'
import { useAppData } from '../context/AppDataContext'
>>>>>>> 8fb2b64 (first commit)

const defaultIncident = {
  time: '',
  equipment: '',
  description: '',
  status: 'В роботі',
}

function IncidentsPage() {
<<<<<<< HEAD
  const [incidents, setIncidents] = useState(incidentRecords)
  const [formData, setFormData] = useState(defaultIncident)

  const handleSubmit = (event) => {
    event.preventDefault()
    setIncidents((prev) => [{ id: prev.length + 1, ...formData }, ...prev])
    setFormData(defaultIncident)
  }

=======
  const { incidents, addIncident, updateIncidentStatus, updateIncident, deleteIncident } = useAppData()
  const [formData, setFormData] = useState(defaultIncident)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

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
      const byDate = !dateFrom || incident.time.slice(0, 10) >= dateFrom
      return bySearch && byStatus && byDate
    })
  }, [dateFrom, incidents, search, selectedStatus])

>>>>>>> 8fb2b64 (first commit)
  return (
    <section className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="grid gap-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm md:grid-cols-4"
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
        <button
          type="submit"
          className="md:col-span-4 rounded-md bg-enterprise-700 px-4 py-2 text-sm font-semibold text-white hover:bg-enterprise-800"
        >
          Додати інцидент
        </button>
      </form>

<<<<<<< HEAD
=======
      <div className="grid gap-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm md:grid-cols-3">
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
        <input
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

>>>>>>> 8fb2b64 (first commit)
      <div className="overflow-x-auto rounded-lg border border-slate-300 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Час</th>
              <th className="px-4 py-3">Обладнання</th>
              <th className="px-4 py-3">Опис</th>
              <th className="px-4 py-3">Статус</th>
<<<<<<< HEAD
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
=======
              <th className="px-4 py-3">Дії</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncidents.map((incident) => (
>>>>>>> 8fb2b64 (first commit)
              <tr key={incident.id} className="border-t border-slate-200">
                <td className="px-4 py-3">{incident.time}</td>
                <td className="px-4 py-3">{incident.equipment}</td>
                <td className="px-4 py-3">{incident.description}</td>
<<<<<<< HEAD
                <td className="px-4 py-3">{incident.status}</td>
=======
                <td className="px-4 py-3">
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
>>>>>>> 8fb2b64 (first commit)
              </tr>
            ))}
          </tbody>
        </table>
      </div>
<<<<<<< HEAD
=======
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
>>>>>>> 8fb2b64 (first commit)
    </section>
  )
}

export default IncidentsPage
