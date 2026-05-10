<<<<<<< HEAD
import { useState } from 'react'
import { shiftOpeningDefaults } from '../data/mockData'
=======
import { useMemo, useState } from 'react'
import { shiftOpeningDefaults } from '../data/mockData'
import { useAppData } from '../context/AppDataContext'
>>>>>>> 8fb2b64 (first commit)

const initialForm = {
  wheat: shiftOpeningDefaults.wheat,
  corn: shiftOpeningDefaults.corn,
  premix: shiftOpeningDefaults.premix,
  granulationLine1: shiftOpeningDefaults.granulationLine1,
  granulationLine2: shiftOpeningDefaults.granulationLine2,
}

function ShiftManagementPage() {
<<<<<<< HEAD
  const [formData, setFormData] = useState(initialForm)
  const [isSubmitted, setIsSubmitted] = useState(false)
=======
  const { shifts, activeShift, openShift, closeShift } = useAppData()
  const [formData, setFormData] = useState(initialForm)
  const [notes, setNotes] = useState('')
  const [closeNotes, setCloseNotes] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [message, setMessage] = useState('')
>>>>>>> 8fb2b64 (first commit)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
<<<<<<< HEAD
    setIsSubmitted(true)
  }

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800">Відкрити зміну</h3>
      <p className="mt-1 text-sm text-slate-600">
        Зафіксуйте стартові залишки сировини та поточний стан ліній грануляції.
=======
    const result = openShift({ openingData: formData, notes })
    setMessage(result.ok ? 'Зміну успішно відкрито.' : result.error)
  }

  const handleCloseShift = () => {
    const result = closeShift(closeNotes)
    setMessage(result.ok ? 'Зміну успішно закрито.' : result.error)
    if (result.ok) {
      setCloseNotes('')
    }
  }

  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      const bySearch = `${shift.openedAt} ${shift.closedAt} ${shift.notes || ''}`
        .toLowerCase()
        .includes(search.trim().toLowerCase())
      const byStatus = statusFilter === 'all' || shift.status === statusFilter
      const byDate = !dateFrom || shift.openedAt.slice(0, 10) >= dateFrom
      return bySearch && byStatus && byDate
    })
  }, [dateFrom, search, shifts, statusFilter])

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800">Управління змінами</h3>
      <p className="mt-1 text-sm text-slate-600">
        Зафіксуйте стартові залишки, відкрийте зміну та закрийте її після завершення.
>>>>>>> 8fb2b64 (first commit)
      </p>

      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="text-sm font-medium text-slate-700">
          Пшениця, т
          <input
            type="number"
            name="wheat"
            value={formData.wheat}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Кукурудза, т
          <input
            type="number"
            name="corn"
            value={formData.corn}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Премікси, т
          <input
            type="number"
            name="premix"
            value={formData.premix}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Лінія грануляції №1
          <select
            name="granulationLine1"
            value={formData.granulationLine1}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option>Робоча</option>
            <option>Тех. огляд</option>
            <option>Ремонт</option>
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Лінія грануляції №2
          <select
            name="granulationLine2"
            value={formData.granulationLine2}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option>Робоча</option>
            <option>Тех. огляд</option>
            <option>Ремонт</option>
          </select>
        </label>

        <div className="md:col-span-2">
          <button
            type="submit"
<<<<<<< HEAD
=======
            disabled={Boolean(activeShift)}
>>>>>>> 8fb2b64 (first commit)
            className="rounded-md bg-enterprise-700 px-4 py-2 text-sm font-semibold text-white hover:bg-enterprise-800"
          >
            Відкрити зміну
          </button>
<<<<<<< HEAD
        </div>
      </form>

      {isSubmitted && (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Зміну успішно відкрито (імітація без збереження в БД).
        </div>
      )}
=======
          {activeShift && (
            <p className="mt-2 text-sm text-orange-700">
              Є активна зміна від {activeShift.openedAt}. Спочатку закрийте її.
            </p>
          )}
        </div>
      </form>

      <div className="mt-4 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-slate-700">Коментар при відкритті</p>
        <input
          placeholder="Наприклад: Нічна зміна, штат 6 операторів"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <div className="mt-4 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-slate-700">
          Закриття зміни {activeShift ? `(відкрита ${activeShift.openedAt})` : ''}
        </p>
        <div className="mt-2 flex flex-col gap-2 md:flex-row">
          <input
            placeholder="Підсумок зміни / примітка"
            value={closeNotes}
            onChange={(event) => setCloseNotes(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <button
            type="button"
            onClick={handleCloseShift}
            disabled={!activeShift}
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Закрити зміну
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <div className="mt-4 grid gap-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm md:grid-cols-3">
        <input
          placeholder="Пошук за часом або приміткою"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2"
        >
          <option value="all">Усі статуси</option>
          <option value="Відкрита">Відкрита</option>
          <option value="Закрита">Закрита</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-300 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Відкрито</th>
              <th className="px-4 py-3">Закрито</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Коментар</th>
              <th className="px-4 py-3">Стартові дані</th>
            </tr>
          </thead>
          <tbody>
            {filteredShifts.map((shift) => (
              <tr key={shift.id} className="border-t border-slate-200">
                <td className="px-4 py-3">{shift.id}</td>
                <td className="px-4 py-3">{shift.openedAt}</td>
                <td className="px-4 py-3">{shift.closedAt || '—'}</td>
                <td className="px-4 py-3">{shift.status}</td>
                <td className="px-4 py-3">{shift.notes || '—'}</td>
                <td className="px-4 py-3">
                  Пш {shift.openingData.wheat}т, Кк {shift.openingData.corn}т, Пр {shift.openingData.premix}т
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
>>>>>>> 8fb2b64 (first commit)
    </section>
  )
}

export default ShiftManagementPage
