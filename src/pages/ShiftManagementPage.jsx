import { useEffect, useMemo, useState } from 'react'
import { shiftOpeningDefaults } from '../data/mockData'
import { useAppData } from '../context/AppDataContext'

const initialForm = {
  wheat: shiftOpeningDefaults.wheat,
  corn: shiftOpeningDefaults.corn,
  premix: shiftOpeningDefaults.premix,
  granulationLine1: shiftOpeningDefaults.granulationLine1,
  granulationLine2: shiftOpeningDefaults.granulationLine2,
}

function ShiftManagementPage() {
  const { shifts, batches, activeShift, openShift, closeShift } = useAppData()
  const [formData, setFormData] = useState(initialForm)
  const [notes, setNotes] = useState('')
  const [operator, setOperator] = useState('')
  const [closeNotes, setCloseNotes] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [sortConfig, setSortConfig] = useState({ key: 'openedAt', direction: 'desc' })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const result = openShift({ openingData: formData, notes, operator })
    setToastType(result.ok ? 'success' : 'error')
    setToastMessage(result.ok ? 'Зміну успішно відкрито.' : result.error)
  }

  const handleCloseShift = () => {
    const result = closeShift(closeNotes)
    setToastType(result.ok ? 'success' : 'error')
    setToastMessage(result.ok ? 'Зміну успішно закрито.' : result.error)
    if (result.ok) {
      setCloseNotes('')
    }
  }

  useEffect(() => {
    if (!toastMessage) {
      return
    }
    const timer = setTimeout(() => setToastMessage(''), 3000)
    return () => clearTimeout(timer)
  }, [toastMessage])

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

  const sortedShifts = useMemo(() => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1
    return [...filteredShifts].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? ''
      const bValue = b[sortConfig.key] ?? ''
      if (typeof aValue === 'number' || typeof bValue === 'number') {
        return (Number(aValue) - Number(bValue)) * direction
      }
      return String(aValue).localeCompare(String(bValue), 'uk') * direction
    })
  }, [filteredShifts, sortConfig])

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }
  const sortArrow = (key) =>
    sortConfig.key === key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'

  const shiftStats = useMemo(() => {
    const closedShifts = shifts.filter((shift) => shift.status === 'Закрита' && shift.closedAt)
    if (!closedShifts.length) {
      return { avgHours: 0, avgTonsPerShift: 0 }
    }

    const parseDateTime = (value) => new Date(value.replace(' ', 'T'))
    const totalHours = closedShifts.reduce((sum, shift) => {
      const durationMs = parseDateTime(shift.closedAt) - parseDateTime(shift.openedAt)
      return sum + Math.max(0, durationMs / (1000 * 60 * 60))
    }, 0)
    const totalTons = closedShifts.reduce((sum, shift) => {
      const opened = parseDateTime(shift.openedAt)
      const closed = parseDateTime(shift.closedAt)
      const shiftTons = batches
        .filter((batch) => {
          const created = parseDateTime(batch.createdAt)
          return created >= opened && created <= closed
        })
        .reduce((acc, batch) => acc + (Number(batch.feedProducedKg) || 0), 0)
      return sum + shiftTons / 1000
    }, 0)

    return {
      avgHours: Number((totalHours / closedShifts.length).toFixed(1)),
      avgTonsPerShift: Number((totalTons / closedShifts.length).toFixed(2)),
    }
  }, [batches, shifts])

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
      <div className="no-print flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-800">Управління змінами</h3>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          Роздрукувати
        </button>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Зафіксуйте стартові залишки, відкрийте зміну та закрийте її після завершення.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-sm text-slate-600">Середня тривалість зміни</p>
          <p className="text-xl font-semibold text-slate-800">{shiftStats.avgHours} год</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-sm text-slate-600">Середній випуск за зміну</p>
          <p className="text-xl font-semibold text-slate-800">{shiftStats.avgTonsPerShift} т</p>
        </div>
      </div>

      <form className="no-print mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
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
          Оператор зміни
          <input
            type="text"
            name="operator"
            value={operator}
            onChange={(event) => setOperator(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="ПІБ оператора"
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
            disabled={Boolean(activeShift)}
            className="rounded-md bg-enterprise-700 px-4 py-2 text-sm font-semibold text-white hover:bg-enterprise-800"
          >
            Відкрити зміну
          </button>
          {activeShift && (
            <p className="mt-2 text-sm text-orange-700">
              Є активна зміна від {activeShift.openedAt}. Спочатку закрийте її.
            </p>
          )}
        </div>
      </form>

      <div className="no-print mt-4 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-slate-700">Коментар при відкритті</p>
        <input
          placeholder="Наприклад: Нічна зміна, штат 6 операторів"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <div className="no-print mt-4 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
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

      {toastMessage && (
        <div
          className={`no-print fixed bottom-5 right-5 z-50 rounded-md px-4 py-3 text-sm text-white shadow-lg ${
            toastType === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          {toastMessage}
        </div>
      )}

      <div className="no-print mt-4 grid gap-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm md:grid-cols-3">
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
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('id')}>ID {sortArrow('id')}</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('openedAt')}>Відкрито {sortArrow('openedAt')}</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('closedAt')}>Закрито {sortArrow('closedAt')}</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('status')}>Статус {sortArrow('status')}</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('notes')}>Коментар {sortArrow('notes')}</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('operator')}>Оператор {sortArrow('operator')}</th>
              <th className="px-4 py-3">Стартові дані</th>
            </tr>
          </thead>
          <tbody>
            {sortedShifts.map((shift) => (
              <tr key={shift.id} className="border-t border-slate-200">
                <td className="px-4 py-3">{shift.id}</td>
                <td className="px-4 py-3">{shift.openedAt}</td>
                <td className="px-4 py-3">{shift.closedAt || '—'}</td>
                <td className="px-4 py-3">{shift.status}</td>
                <td className="px-4 py-3">{shift.notes || '—'}</td>
                <td className="px-4 py-3">{shift.operator || '—'}</td>
                <td className="px-4 py-3">
                  Пш {shift.openingData.wheat}т, Кк {shift.openingData.corn}т, Пр {shift.openingData.premix}т
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default ShiftManagementPage
