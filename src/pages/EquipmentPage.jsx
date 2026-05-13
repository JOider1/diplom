import { useMemo, useState } from 'react'
import { isEquipmentIncident } from '../constants/incidentCategories'
import { useAppData } from '../context/AppDataContext'
import { getEquipmentIncidentSummary } from '../utils/equipmentIncidentStatus'

function EquipmentPage() {
  const { equipment, incidents, patchEquipment } = useAppData()
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = useMemo(
    () =>
      equipment.map((item) => ({
        ...item,
        journal: getEquipmentIncidentSummary(item.name, incidents),
      })),
    [equipment, incidents],
  )

  const filtered = useMemo(
    () =>
      rows.filter((item) => {
        if (statusFilter === 'all') return true
        return item.status === statusFilter
      }),
    [rows, statusFilter],
  )

  const updateStatus = (id, status) => {
    patchEquipment(id, { status })
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <label className="text-sm text-slate-700 dark:text-slate-200">
          Фільтр статусу
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="ml-2 rounded-md border border-slate-300 px-2 py-1"
          >
            <option value="all">Усі</option>
            <option value="Робоча">Робоча</option>
            <option value="Тех. огляд">Тех. огляд</option>
            <option value="Ремонт">Ремонт</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-300 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Обладнання</th>
              <th className="px-4 py-3">Тип</th>
              <th className="px-4 py-3">Статус (довідник)</th>
              <th className="px-4 py-3">Журнал інцидентів</th>
              <th className="px-4 py-3">Наступне ТО</th>
              <th className="px-4 py-3">Інцидентів (обладнання)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-t border-slate-200">
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{item.type}</td>
                <td className="px-4 py-3">
                  <select
                    value={item.status}
                    onChange={(event) => updateStatus(item.id, event.target.value)}
                    className="rounded-md border border-slate-300 px-2 py-1"
                  >
                    <option value="Робоча">Робоча</option>
                    <option value="Тех. огляд">Тех. огляд</option>
                    <option value="Ремонт">Ремонт</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      item.journal.isDown ? 'font-semibold text-orange-700 dark:text-amber-300' : ''
                    }
                  >
                    {item.journal.label}
                  </span>
                </td>
                <td className="px-4 py-3">{item.nextMaintenance}</td>
                <td className="px-4 py-3">
                  {
                    incidents.filter(
                      (incident) =>
                        isEquipmentIncident(incident) && incident.equipment === item.name,
                    ).length
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default EquipmentPage
