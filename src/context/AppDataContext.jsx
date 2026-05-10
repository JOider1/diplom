import { createContext, useContext, useEffect, useState } from 'react'
import {
  equipmentDirectory,
  incidentRecords,
  initialRawStorageKg,
  productionBatches,
  rawMovements,
  recipes,
  shiftRecords,
} from '../data/mockData'

const AppDataContext = createContext(null)
const RAW_KEYS = ['wheat', 'corn', 'premix']
const KG_PER_TON = 1000
const STORAGE_KEY = 'diplom-app-data'

const formatDateTime = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(
    2,
    '0',
  )}`

const safeParseStorage = () => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const normalizePersistedState = (persistedState) => {
  if (!persistedState || typeof persistedState !== 'object') {
    return null
  }

  const safeArray = (value, fallback) => (Array.isArray(value) ? value : fallback)
  const safeObject = (value, fallback) =>
    value && typeof value === 'object' && !Array.isArray(value) ? value : fallback
  const mergeById = (fallback, persisted) => {
    const nextMap = new Map()
    fallback.forEach((item) => nextMap.set(item.id, item))
    persisted.forEach((item) => nextMap.set(item.id, item))
    return Array.from(nextMap.values())
  }

  const persistedRecipes = safeArray(persistedState.recipes, [])
  const persistedBatches = safeArray(persistedState.batches, [])
  const persistedIncidents = safeArray(persistedState.incidents, [])
  const persistedEquipment = safeArray(persistedState.equipment, [])
  const persistedShifts = safeArray(persistedState.shifts, [])
  const persistedMovements = safeArray(persistedState.movements, [])

  return {
    recipes: mergeById(recipes, persistedRecipes),
    batches: mergeById(productionBatches, persistedBatches),
    incidents: mergeById(incidentRecords, persistedIncidents),
    equipment: mergeById(equipmentDirectory, persistedEquipment),
    shifts: mergeById(shiftRecords, persistedShifts),
    storageKg: safeObject(persistedState.storageKg, initialRawStorageKg),
    movements: mergeById(rawMovements, persistedMovements),
  }
}

export function AppDataProvider({ children }) {
  const persistedState = normalizePersistedState(safeParseStorage())
  const [recipesState, setRecipesState] = useState(persistedState?.recipes ?? recipes)
  const [batches, setBatches] = useState(persistedState?.batches ?? productionBatches)
  const [incidents, setIncidents] = useState(persistedState?.incidents ?? incidentRecords)
  const [equipment, setEquipment] = useState(persistedState?.equipment ?? equipmentDirectory)
  const [shifts, setShifts] = useState(persistedState?.shifts ?? shiftRecords)
  const [storageKg, setStorageKg] = useState(persistedState?.storageKg ?? initialRawStorageKg)
  const [movements, setMovements] = useState(persistedState?.movements ?? rawMovements)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        recipes: recipesState,
        batches,
        incidents,
        equipment,
        shifts,
        storageKg,
        movements,
      }),
    )
  }, [batches, equipment, incidents, movements, recipesState, shifts, storageKg])

  const addBatch = ({ recipeName, feedProducedKg, line }) => {
    const matchedRecipe = recipesState.find((recipe) => recipe.name === recipeName)
    if (!matchedRecipe) {
      return { ok: false, error: 'Рецепт не знайдено' }
    }

    const tons = feedProducedKg / KG_PER_TON
    const wheatDelta = Math.round(matchedRecipe.consumptionKgPerTon.wheat * tons)
    const cornDelta = Math.round(matchedRecipe.consumptionKgPerTon.corn * tons)
    const premixDelta = Math.round(matchedRecipe.consumptionKgPerTon.premix * tons)
    const rawSpentKg = wheatDelta + cornDelta + premixDelta
    const costPerTon =
      (matchedRecipe.consumptionKgPerTon.wheat / KG_PER_TON) * matchedRecipe.supplierPricesPerTonUah.wheat +
      (matchedRecipe.consumptionKgPerTon.corn / KG_PER_TON) * matchedRecipe.supplierPricesPerTonUah.corn +
      (matchedRecipe.consumptionKgPerTon.premix / KG_PER_TON) * matchedRecipe.supplierPricesPerTonUah.premix
    const batchCostUah = Math.round(costPerTon * tons)

    const nextStorage = {
      wheat: storageKg.wheat - wheatDelta,
      corn: storageKg.corn - cornDelta,
      premix: storageKg.premix - premixDelta,
    }

    if (Object.values(nextStorage).some((value) => value < 0)) {
      return { ok: false, error: 'Недостатньо сировини на складі для цього обсягу партії' }
    }

    const now = new Date()
    const createdAt = formatDateTime(now)
    const nextBatchId = batches.length ? Math.max(...batches.map((batch) => batch.id)) + 1 : 1

    const newBatch = {
      id: nextBatchId,
      createdAt,
      line: line || 'Лінія 1',
      recipe: recipeName,
      rawSpentKg,
      feedProducedKg,
      batchCostUah,
    }

    const movement = {
      id: movements.length ? Math.max(...movements.map((item) => item.id)) + 1 : 1,
      time: createdAt,
      type: 'Списання',
      source: `Партія #${nextBatchId}`,
      deltaKg: { wheat: -wheatDelta, corn: -cornDelta, premix: -premixDelta },
      balanceKg: nextStorage,
    }

    setBatches((prev) => [newBatch, ...prev])
    setStorageKg(nextStorage)
    setMovements((prev) => [movement, ...prev])
    return { ok: true }
  }

  const addRawArrival = ({ source, wheatKg, cornKg, premixKg }) => {
    const wheatDelta = Number(wheatKg) || 0
    const cornDelta = Number(cornKg) || 0
    const premixDelta = Number(premixKg) || 0
    if (wheatDelta <= 0 && cornDelta <= 0 && premixDelta <= 0) {
      return { ok: false, error: 'Вкажіть обсяг хоча б для однієї позиції сировини' }
    }

    const nextStorage = {
      wheat: storageKg.wheat + wheatDelta,
      corn: storageKg.corn + cornDelta,
      premix: storageKg.premix + premixDelta,
    }
    const now = formatDateTime(new Date())
    const movement = {
      id: movements.length ? Math.max(...movements.map((item) => item.id)) + 1 : 1,
      time: now,
      type: 'Надходження',
      source: source || 'Постачання',
      deltaKg: { wheat: wheatDelta, corn: cornDelta, premix: premixDelta },
      balanceKg: nextStorage,
    }

    setStorageKg(nextStorage)
    setMovements((prev) => [movement, ...prev])
    return { ok: true }
  }

  const updateBatch = (batchId, nextValues) => {
    setBatches((prev) =>
      prev.map((batch) => (batch.id === batchId ? { ...batch, ...nextValues } : batch)),
    )
  }

  const deleteBatch = (batchId) => {
    setBatches((prev) => prev.filter((batch) => batch.id !== batchId))
  }

  const addIncident = (incident) => {
    const nextId = incidents.length ? Math.max(...incidents.map((item) => item.id)) + 1 : 1
    setIncidents((prev) => [{ id: nextId, severity: 'Середня', ...incident }, ...prev])
  }

  const updateIncidentStatus = (incidentId, status) => {
    setIncidents((prev) =>
      prev.map((incident) => (incident.id === incidentId ? { ...incident, status } : incident)),
    )
  }

  const updateIncident = (incidentId, nextValues) => {
    setIncidents((prev) =>
      prev.map((incident) => (incident.id === incidentId ? { ...incident, ...nextValues } : incident)),
    )
  }

  const deleteIncident = (incidentId) => {
    setIncidents((prev) => prev.filter((incident) => incident.id !== incidentId))
  }

  const addRecipe = (recipe) => {
    const nextId = `recipe-${Date.now()}`
    setRecipesState((prev) => [{ id: nextId, ...recipe }, ...prev])
  }

  const updateRecipe = (recipeId, nextValues) => {
    setRecipesState((prev) =>
      prev.map((recipe) => (recipe.id === recipeId ? { ...recipe, ...nextValues } : recipe)),
    )
  }

  const deleteRecipe = (recipeId) => {
    setRecipesState((prev) => prev.filter((recipe) => recipe.id !== recipeId))
  }

  const getRecipeCostPerTon = (recipe) =>
    RAW_KEYS.reduce(
      (sum, key) =>
        sum +
        (recipe.consumptionKgPerTon[key] / KG_PER_TON) * recipe.supplierPricesPerTonUah[key],
      0,
    )

  const averageDailyConsumptionKg = RAW_KEYS.reduce((acc, key) => {
    const spent = movements
      .filter((movement) => movement.type === 'Списання')
      .reduce((sum, movement) => sum + Math.abs(movement.deltaKg[key]), 0)
    acc[key] = spent / 7
    return acc
  }, {})

  const activeShift = shifts.find((shift) => shift.status === 'Відкрита') || null

  const openShift = ({ openingData, notes, operator }) => {
    if (activeShift) {
      return { ok: false, error: 'Спочатку закрийте поточну відкриту зміну' }
    }
    const now = formatDateTime(new Date())
    const nextId = shifts.length ? Math.max(...shifts.map((item) => item.id)) + 1 : 1
    const newShift = {
      id: nextId,
      openedAt: now,
      closedAt: '',
      status: 'Відкрита',
      openingData,
      notes,
      operator: operator || 'Невідомо',
    }
    setShifts((prev) => [newShift, ...prev])
    return { ok: true }
  }

  const closeShift = (notes) => {
    if (!activeShift) {
      return { ok: false, error: 'Немає відкритої зміни' }
    }
    const closedAt = formatDateTime(new Date())
    setShifts((prev) =>
      prev.map((shift) =>
        shift.id === activeShift.id
          ? { ...shift, status: 'Закрита', closedAt, notes: notes || shift.notes }
          : shift,
      ),
    )
    return { ok: true }
  }

  const contextValue = {
    recipes: recipesState,
    batches,
    incidents,
    equipment,
    shifts,
    activeShift,
    storageKg,
    movements,
    averageDailyConsumptionKg,
    getRecipeCostPerTon,
    addBatch,
    updateBatch,
    deleteBatch,
    addIncident,
    updateIncidentStatus,
    updateIncident,
    deleteIncident,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    addRawArrival,
    setEquipment,
    openShift,
    closeShift,
  }

  return <AppDataContext.Provider value={contextValue}>{children}</AppDataContext.Provider>
}

/* eslint-disable-next-line react-refresh/only-export-components */
export const useAppData = () => {
  const context = useContext(AppDataContext)
  if (!context) {
    throw new Error('useAppData must be used inside AppDataProvider')
  }
  return context
}
