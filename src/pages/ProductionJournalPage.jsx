<<<<<<< HEAD
import { useState } from 'react'
import { productionBatches } from '../data/mockData'

const defaultBatch = {
  recipe: '',
  rawSpentKg: '',
=======
import { useMemo, useState } from 'react'
import ConfirmModal from '../components/common/ConfirmModal'
import { useAppData } from '../context/AppDataContext'

const defaultBatch = {
  recipe: '',
>>>>>>> 8fb2b64 (first commit)
  feedProducedKg: '',
}

function ProductionJournalPage() {
<<<<<<< HEAD
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

=======
  const { batches, recipes, addBatch, updateBatch, deleteBatch } = useAppData()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ ...defaultBatch, recipe: recipes[0]?.name || '' })
  const [search, setSearch] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [error, setError] = useState('')
  const [editingBatchId, setEditingBatchId] = useState(null)
  const [deleteBatchId, setDeleteBatchId] = useState(null)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (editingBatchId) {
      updateBatch(editingBatchId, {
        recipe: formData.recipe,
        feedProducedKg: Number(formData.feedProducedKg),
      })
      setEditingBatchId(null)
      setFormData({ ...defaultBatch, recipe: recipes[0]?.name || '' })
      setShowForm(false)
      return
    }

    const result = addBatch({
      recipeName: formData.recipe,
      feedProducedKg: Number(formData.feedProducedKg),
    })
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError('')
    setFormData({ ...defaultBatch, recipe: recipes[0]?.name || '' })
    setShowForm(false)
  }

  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      const bySearch = `${batch.recipe} ${batch.createdAt}`
        .toLowerCase()
        .includes(search.trim().toLowerCase())
      const byRecipe = selectedRecipe === 'all' || batch.recipe === selectedRecipe
      const byDate = !dateFrom || batch.createdAt.slice(0, 10) >= dateFrom
      return bySearch && byRecipe && byDate
    })
  }, [batches, dateFrom, search, selectedRecipe])

>>>>>>> 8fb2b64 (first commit)
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
<<<<<<< HEAD
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
=======
          <select
            required
            value={formData.recipe}
            onChange={(event) => setFormData((prev) => ({ ...prev, recipe: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            {recipes.map((recipe) => (
              <option key={recipe.id} value={recipe.name}>
                {recipe.name}
              </option>
            ))}
          </select>
          <input
            required
            type="number"
            min="1"
>>>>>>> 8fb2b64 (first commit)
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
<<<<<<< HEAD
        </form>
      )}

=======
          {error && <p className="md:col-span-3 text-sm text-red-600">{error}</p>}
        </form>
      )}

      <div className="grid gap-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm md:grid-cols-3">
        <input
          placeholder="Пошук за рецептом або датою"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <select
          value={selectedRecipe}
          onChange={(event) => setSelectedRecipe(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2"
        >
          <option value="all">Усі рецепти</option>
          {recipes.map((recipe) => (
            <option key={recipe.id} value={recipe.name}>
              {recipe.name}
            </option>
          ))}
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
              <th className="px-4 py-3">Рецепт</th>
              <th className="px-4 py-3">Витрачено, кг</th>
              <th className="px-4 py-3">Вироблено, кг</th>
<<<<<<< HEAD
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
=======
              <th className="px-4 py-3">Собівартість, грн</th>
              <th className="px-4 py-3">Дії</th>
            </tr>
          </thead>
          <tbody>
            {filteredBatches.map((batch) => (
>>>>>>> 8fb2b64 (first commit)
              <tr key={batch.id} className="border-t border-slate-200">
                <td className="px-4 py-3">{batch.createdAt}</td>
                <td className="px-4 py-3">{batch.recipe}</td>
                <td className="px-4 py-3">{batch.rawSpentKg}</td>
                <td className="px-4 py-3">{batch.feedProducedKg}</td>
<<<<<<< HEAD
=======
                <td className="px-4 py-3">
                  {batch.batchCostUah ? batch.batchCostUah.toLocaleString('uk-UA') : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBatchId(batch.id)
                        setFormData({ recipe: batch.recipe, feedProducedKg: String(batch.feedProducedKg) })
                        setShowForm(true)
                      }}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    >
                      Редагувати
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteBatchId(batch.id)}
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
      {deleteBatchId && (
        <ConfirmModal
          title="Видалити партію?"
          message="Запис партії буде видалено з журналу."
          onCancel={() => setDeleteBatchId(null)}
          onConfirm={() => {
            deleteBatch(deleteBatchId)
            setDeleteBatchId(null)
          }}
        />
      )}
>>>>>>> 8fb2b64 (first commit)
    </section>
  )
}

export default ProductionJournalPage
