import { useMemo, useState } from 'react'
import ConfirmModal from '../components/common/ConfirmModal'
import { useAppData } from '../context/AppDataContext'

const defaultRecipe = {
  name: '',
  consumptionKgPerTon: { wheat: 0, corn: 0, premix: 0 },
  supplierPricesPerTonUah: { wheat: 9800, corn: 9200, premix: 46000 },
}

function RecipesPage() {
  const { recipes, getRecipeCostPerTon, addRecipe, updateRecipe, deleteRecipe } = useAppData()
  const [formData, setFormData] = useState(defaultRecipe)
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const sortedRecipes = useMemo(
    () => [...recipes].sort((a, b) => a.name.localeCompare(b.name, 'uk-UA')),
    [recipes],
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    if (editingId) {
      updateRecipe(editingId, formData)
      setEditingId(null)
    } else {
      addRecipe(formData)
    }
    setFormData(defaultRecipe)
  }

  const startEdit = (recipe) => {
    setEditingId(recipe.id)
    setFormData(recipe)
  }

  return (
    <section className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="grid gap-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm md:grid-cols-4"
      >
        <input
          required
          placeholder="Назва рецепту"
          value={formData.name}
          onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
          className="rounded-md border border-slate-300 px-3 py-2 md:col-span-4"
        />
        <input
          type="number"
          placeholder="Пшениця кг/т"
          value={formData.consumptionKgPerTon.wheat}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              consumptionKgPerTon: { ...prev.consumptionKgPerTon, wheat: Number(event.target.value) },
            }))
          }
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          type="number"
          placeholder="Кукурудза кг/т"
          value={formData.consumptionKgPerTon.corn}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              consumptionKgPerTon: { ...prev.consumptionKgPerTon, corn: Number(event.target.value) },
            }))
          }
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          type="number"
          placeholder="Премікси кг/т"
          value={formData.consumptionKgPerTon.premix}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              consumptionKgPerTon: { ...prev.consumptionKgPerTon, premix: Number(event.target.value) },
            }))
          }
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          type="number"
          placeholder="Ціна пшениці, грн/т"
          value={formData.supplierPricesPerTonUah.wheat}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              supplierPricesPerTonUah: {
                ...prev.supplierPricesPerTonUah,
                wheat: Number(event.target.value),
              },
            }))
          }
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          type="number"
          placeholder="Ціна кукурудзи, грн/т"
          value={formData.supplierPricesPerTonUah.corn}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              supplierPricesPerTonUah: {
                ...prev.supplierPricesPerTonUah,
                corn: Number(event.target.value),
              },
            }))
          }
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          type="number"
          placeholder="Ціна преміксу, грн/т"
          value={formData.supplierPricesPerTonUah.premix}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              supplierPricesPerTonUah: {
                ...prev.supplierPricesPerTonUah,
                premix: Number(event.target.value),
              },
            }))
          }
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-md bg-enterprise-700 px-4 py-2 text-sm font-semibold text-white hover:bg-enterprise-800 md:col-span-4"
        >
          {editingId ? 'Оновити рецепт' : 'Додати рецепт'}
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-300 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Рецепт</th>
              <th className="px-4 py-3">Собівартість, грн/т</th>
              <th className="px-4 py-3">Кг на 1 т</th>
              <th className="px-4 py-3">Дія</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecipes.map((recipe) => (
              <tr key={recipe.id} className="border-t border-slate-200">
                <td className="px-4 py-3">{recipe.name}</td>
                <td className="px-4 py-3">{Math.round(getRecipeCostPerTon(recipe)).toLocaleString('uk-UA')}</td>
                <td className="px-4 py-3">
                  Пш {recipe.consumptionKgPerTon.wheat}, Кк {recipe.consumptionKgPerTon.corn}, Пр{' '}
                  {recipe.consumptionKgPerTon.premix}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(recipe)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    >
                      Редагувати
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(recipe.id)}
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
          title="Видалити рецепт?"
          message="Цю дію не можна скасувати."
          onCancel={() => setDeleteId(null)}
          onConfirm={() => {
            deleteRecipe(deleteId)
            setDeleteId(null)
          }}
        />
      )}
    </section>
  )
}

export default RecipesPage
