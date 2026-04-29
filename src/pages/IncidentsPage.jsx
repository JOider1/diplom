import { useState } from 'react'
import { incidentRecords } from '../data/mockData'

const defaultIncident = {
  time: '',
  equipment: '',
  description: '',
  status: 'В роботі',
}

function IncidentsPage() {
  const [incidents, setIncidents] = useState(incidentRecords)
  const [formData, setFormData] = useState(defaultIncident)

  const handleSubmit = (event) => {
    event.preventDefault()
    setIncidents((prev) => [{ id: prev.length + 1, ...formData }, ...prev])
    setFormData(defaultIncident)
  }

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

      <div className="overflow-x-auto rounded-lg border border-slate-300 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Час</th>
              <th className="px-4 py-3">Обладнання</th>
              <th className="px-4 py-3">Опис</th>
              <th className="px-4 py-3">Статус</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.id} className="border-t border-slate-200">
                <td className="px-4 py-3">{incident.time}</td>
                <td className="px-4 py-3">{incident.equipment}</td>
                <td className="px-4 py-3">{incident.description}</td>
                <td className="px-4 py-3">{incident.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default IncidentsPage
