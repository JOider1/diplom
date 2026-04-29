import { useState } from 'react'
import { productionBatches } from '../data/mockData'

const defaultBatch = {
  recipe: '',
  rawSpentKg: '',
  feedProducedKg: '',
}

function ProductionJournalPage() {
  const [batches, setBatches] = useState(productionBatches)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(defaultBatch)

  const handleSubmit = (event) => {
    event.preventDefault()
    const now = new Date()
    const newBatch = {
      id: batches.length + 1,
      createdAt: now.toLocaleString('uk-UA'),
      recipe: formData.recipe,
      rawSpentKg: Number(formData.rawSpentKg),
      feedProducedKg: Number(formData.feedProducedKg),
    }
    setBatches((prev) => [newBatch, ...prev])
    setFormData(defaultBatch)
    setShowForm(false)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Журнал виробництва</h3>
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Додати партію
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm md:grid-cols-3"
        >
          <input
            required
            placeholder="Рецепт корму"
            value={formData.recipe}
            onChange={(event) => setFormData((prev) => ({ ...prev, recipe: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            required
            type="number"
            placeholder="Витрачено сировини, кг"
            value={formData.rawSpentKg}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, rawSpentKg: event.target.value }))
            }
            className="rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            required
            type="number"
            placeholder="Вироблено корму, кг"
            value={formData.feedProducedKg}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, feedProducedKg: event.target.value }))
            }
            className="rounded-md border border-slate-300 px-3 py-2"
          />
          <button
            type="submit"
            className="md:col-span-3 rounded-md bg-enterprise-700 px-4 py-2 text-sm font-semibold text-white hover:bg-enterprise-800"
          >
            Зберегти партію
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-300 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Час</th>
              <th className="px-4 py-3">Рецепт</th>
              <th className="px-4 py-3">Витрачено, кг</th>
              <th className="px-4 py-3">Вироблено, кг</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id} className="border-t border-slate-200">
                <td className="px-4 py-3">{batch.createdAt}</td>
                <td className="px-4 py-3">{batch.recipe}</td>
                <td className="px-4 py-3">{batch.rawSpentKg}</td>
                <td className="px-4 py-3">{batch.feedProducedKg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default ProductionJournalPage
