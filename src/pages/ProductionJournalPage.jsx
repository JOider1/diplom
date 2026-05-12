import { useMemo, useState } from 'react'
import ConfirmModal from '../components/common/ConfirmModal'
import { useAppData } from '../context/AppDataContext'
import { exportRows } from '../utils/xlsxExport'

const defaultBatch = {
  line: 'Лінія 1',
  recipe: '',
  feedProducedKg: '',
}

function ProductionJournalPage() {
  const { batches, recipes, activeShift, addBatch, updateBatch, deleteBatch } = useAppData()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ ...defaultBatch, recipe: recipes[0]?.name || '' })
  const [search, setSearch] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [error, setError] = useState('')
  const [editingBatchId, setEditingBatchId] = useState(null)
  const [deleteBatchId, setDeleteBatchId] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' })

  const handleSubmit = (event) => {
    event.preventDefault()
    if (editingBatchId) {
      updateBatch(editingBatchId, {
        line: formData.line,
        recipe: formData.recipe,
        feedProducedKg: Number(formData.feedProducedKg),
      })
      setEditingBatchId(null)
      setFormData({ ...defaultBatch, recipe: recipes[0]?.name || '' })
      setShowForm(false)
      return
    }

    const result = addBatch({
      line: formData.line,
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

  const sortedBatches = useMemo(() => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1
    return [...filteredBatches].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? ''
      const bValue = b[sortConfig.key] ?? ''
      if (typeof aValue === 'number' || typeof bValue === 'number') {
        return (Number(aValue) - Number(bValue)) * direction
      }
      return String(aValue).localeCompare(String(bValue), 'uk') * direction
    })
  }, [filteredBatches, sortConfig])

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }
  const sortArrow = (key) =>
    sortConfig.key === key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'

  const totalProducedKg = useMemo(
    () => sortedBatches.reduce((sum, item) => sum + (Number(item.feedProducedKg) || 0), 0),
    [sortedBatches],
  )
  const totalRawSpentKg = useMemo(
    () => sortedBatches.reduce((sum, item) => sum + (Number(item.rawSpentKg) || 0), 0),
    [sortedBatches],
  )
  const totalCostUah = useMemo(
    () => sortedBatches.reduce((sum, item) => sum + (Number(item.batchCostUah) || 0), 0),
    [sortedBatches],
  )

  const handleExportXlsx = () => {
    exportRows(
      `journal-vyrobnytstva-${new Date().toISOString().slice(0, 10)}.xlsx`,
      'Партії',
      sortedBatches.map((b) => ({
        ID: b.id,
        Час: b.createdAt,
        Лінія: b.line || 'Лінія 1',
        Рецепт: b.recipe,
        'Списано_кг': b.rawSpentKg,
        'Вироблено_кг': b.feedProducedKg,
        'Собівартість_грн': b.batchCostUah,
      })),
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-slate-300 bg-white p-4 shadow-sm print-section">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Журнал виробництва</h3>
          <p className="print-muted text-sm">Дата друку: {new Date().toLocaleString('uk-UA')}</p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportXlsx}
            className="rounded-md border border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
          >
            Експорт у Excel
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Роздрукувати звіт
          </button>
          <button
            type="button"
            disabled={!activeShift}
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Додати партію
          </button>
        </div>
      </div>
      {!activeShift && (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Зараз немає відкритої зміни. Щоб додати партію, відкрийте зміну на сторінці управління змінами.
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="no-print grid gap-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm md:grid-cols-3"
        >
          <select
            required
            value={formData.line}
            onChange={(event) => setFormData((prev) => ({ ...prev, line: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="Лінія 1">Лінія 1</option>
            <option value="Лінія 2">Лінія 2</option>
          </select>
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
          {error && <p className="md:col-span-3 text-sm text-red-600">{error}</p>}
        </form>
      )}

      <div className="no-print grid gap-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm md:grid-cols-3">
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm print-section">
          <p className="text-sm text-slate-600">Партій у вибірці</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{sortedBatches.length}</p>
        </div>
        <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm print-section">
          <p className="text-sm text-slate-600">Вироблено, кг</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{totalProducedKg.toLocaleString('uk-UA')}</p>
        </div>
        <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm print-section">
          <p className="text-sm text-slate-600">Собівартість, грн</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{totalCostUah.toLocaleString('uk-UA')}</p>
          <p className="print-muted mt-1 text-xs">Списано сировини: {totalRawSpentKg.toLocaleString('uk-UA')} кг</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-300 bg-white shadow-sm">
        <table className="print-table min-w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('createdAt')}>Час {sortArrow('createdAt')}</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('line')}>Лінія {sortArrow('line')}</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('recipe')}>Рецепт {sortArrow('recipe')}</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('rawSpentKg')}>Витрачено, кг {sortArrow('rawSpentKg')}</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('feedProducedKg')}>Вироблено, кг {sortArrow('feedProducedKg')}</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('batchCostUah')}>Собівартість, грн {sortArrow('batchCostUah')}</th>
              <th className="print-hide-col px-4 py-3">Дії</th>
            </tr>
          </thead>
          <tbody>
            {sortedBatches.map((batch) => (
              <tr key={batch.id} className="border-t border-slate-200">
                <td className="px-4 py-3">{batch.createdAt}</td>
                <td className="px-4 py-3">{batch.line || 'Лінія 1'}</td>
                <td className="px-4 py-3">{batch.recipe}</td>
                <td className="px-4 py-3">{batch.rawSpentKg}</td>
                <td className="px-4 py-3">{batch.feedProducedKg}</td>
                <td className="px-4 py-3">
                  {batch.batchCostUah ? batch.batchCostUah.toLocaleString('uk-UA') : '—'}
                </td>
                <td className="print-hide-col px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBatchId(batch.id)
                        setFormData({
                          line: batch.line || 'Лінія 1',
                          recipe: batch.recipe,
                          feedProducedKg: String(batch.feedProducedKg),
                        })
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
    </section>
  )
}

export default ProductionJournalPage
