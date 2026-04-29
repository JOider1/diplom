import { useState } from 'react'
import { shiftOpeningDefaults } from '../data/mockData'

const initialForm = {
  wheat: shiftOpeningDefaults.wheat,
  corn: shiftOpeningDefaults.corn,
  premix: shiftOpeningDefaults.premix,
  granulationLine1: shiftOpeningDefaults.granulationLine1,
  granulationLine2: shiftOpeningDefaults.granulationLine2,
}

function ShiftManagementPage() {
  const [formData, setFormData] = useState(initialForm)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setIsSubmitted(true)
  }

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800">Відкрити зміну</h3>
      <p className="mt-1 text-sm text-slate-600">
        Зафіксуйте стартові залишки сировини та поточний стан ліній грануляції.
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
            className="rounded-md bg-enterprise-700 px-4 py-2 text-sm font-semibold text-white hover:bg-enterprise-800"
          >
            Відкрити зміну
          </button>
        </div>
      </form>

      {isSubmitted && (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Зміну успішно відкрито (імітація без збереження в БД).
        </div>
      )}
    </section>
  )
}

export default ShiftManagementPage
