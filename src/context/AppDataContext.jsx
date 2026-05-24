import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { normalizeIncidentCategory } from '../constants/incidentCategories'
import { normalizeIncidentStatus } from '../constants/incidentStatuses'
import {
  fetchAll,
  fetchAuditLog,
  writeAudit,
  insertRecipe,
  patchRecipe,
  removeRecipe,
  insertEquipment,
  patchEquipmentRow,
  removeEquipment,
  rpcAddBatch,
  rpcUpdateBatch,
  removeBatch,
  rpcAddRawArrival,
  insertIncident,
  patchIncident,
  removeIncident,
  insertShift,
  patchShiftClose,
  rpcAppCreateUser,
  rpcAppUpdateUser,
  rpcAppSetPassword,
  rpcAppSetActive,
  rpcAppDeleteUser,
} from '../lib/db'

const AppDataContext = createContext(null)
const RAW_KEYS = ['wheat', 'corn', 'premix']
const KG_PER_TON = 1000

export function AppDataProvider({ children }) {
  const { role, roleLabel, displayName, isAuthenticated, authReady } = useAuth()
  const [recipesState, setRecipesState] = useState([])
  const [batches, setBatches] = useState([])
  const [incidents, setIncidents] = useState([])
  const [equipment, setEquipment] = useState([])
  const [shifts, setShifts] = useState([])
  const [storageKg, setStorageKg] = useState({ wheat: 0, corn: 0, premix: 0 })
  const [movements, setMovements] = useState([])
  const [users, setUsers] = useState([])
  const [auditLog, setAuditLog] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── initial load з Supabase ──
  const refreshAll = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchAll()
      setRecipesState(data.recipes)
      setEquipment(data.equipment)
      setShifts(data.shifts)
      setBatches(data.batches)
      setIncidents(
        data.incidents.map((i) => ({
          ...i,
          status: normalizeIncidentStatus(i.status),
          category: normalizeIncidentCategory(i.category),
        })),
      )
      setMovements(data.movements)
      setStorageKg(data.storageKg)
      setUsers(data.users)
      if (data.errors && data.errors.length) {
        setError(data.errors.join(' · '))
      }
    } catch (e) {
      console.error('[AppData] fetchAll failed', e)
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // audit log завантажуємо окремо (admin only)
  const refreshAuditLog = useCallback(async () => {
    if (!isAuthenticated || role !== 'admin') return
    try {
      const log = await fetchAuditLog()
      setAuditLog(log)
    } catch (e) {
      console.error('[AppData] fetchAuditLog failed', e)
    }
  }, [isAuthenticated, role])

  useEffect(() => {
    if (authReady && isAuthenticated) {
      refreshAll()
    }
    if (!isAuthenticated) {
      setRecipesState([])
      setBatches([])
      setIncidents([])
      setEquipment([])
      setShifts([])
      setStorageKg({ wheat: 0, corn: 0, premix: 0 })
      setMovements([])
      setUsers([])
      setAuditLog([])
    }
  }, [authReady, isAuthenticated, refreshAll])

  useEffect(() => {
    refreshAuditLog()
  }, [refreshAuditLog])

  // ── audit helper ──
  // Пише в БД + оптимістично пушить у локальний state, щоб admin одразу
  // бачив свою дію в журналі без ручного refresh.
  const appendAudit = useCallback(
    (action, details = {}) => {
      const actor = displayName || roleLabel
      const optimistic = {
        id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: new Date().toLocaleString('sv-SE').slice(0, 16), // "YYYY-MM-DD HH:MM"
        actor,
        role,
        action,
        details,
      }
      if (role === 'admin') {
        setAuditLog((prev) => [optimistic, ...prev].slice(0, 500))
      }
      writeAudit({ actor, role, action, details }).catch((e) =>
        console.warn('[audit] insert failed', e),
      )
    },
    [displayName, role, roleLabel],
  )

  // ── recipes ──
  const addRecipe = async (recipe) => {
    try {
      const created = await insertRecipe(recipe)
      setRecipesState((prev) => [created, ...prev])
      appendAudit('ADD_RECIPE', { id: created.id, name: created.name })
      return { ok: true, recipe: created }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }

  const updateRecipe = async (recipeId, nextValues) => {
    try {
      const updated = await patchRecipe(recipeId, nextValues)
      setRecipesState((prev) => prev.map((r) => (r.id === recipeId ? updated : r)))
      appendAudit('UPDATE_RECIPE', { recipeId, patch: nextValues })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }

  const deleteRecipe = async (recipeId) => {
    const removed = recipesState.find((r) => r.id === recipeId)
    try {
      await removeRecipe(recipeId)
      setRecipesState((prev) => prev.filter((r) => r.id !== recipeId))
      if (removed) appendAudit('DELETE_RECIPE', { recipeId, name: removed.name })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }

  const getRecipeCostPerTon = (recipe) =>
    RAW_KEYS.reduce(
      (sum, key) =>
        sum +
        (recipe.consumptionKgPerTon[key] / KG_PER_TON) * recipe.supplierPricesPerTonUah[key],
      0,
    )

  // ── batches ──
  const addBatch = async ({ recipeName, feedProducedKg, line }) => {
    try {
      const created = await rpcAddBatch({ recipeName, feedProducedKg, line })
      // підтягнути зміни складу і рух — простіше зробити повний refresh
      await refreshAll()
      appendAudit('ADD_BATCH', { batchId: created.id, recipe: recipeName, feedProducedKg, line })
      return { ok: true }
    } catch (e) {
      const msg = e?.message || String(e)
      return { ok: false, error: msg.includes('Недостатньо') ? msg : msg }
    }
  }

  const updateBatch = async (batchId, nextValues) => {
    const old = batches.find((b) => b.id === batchId)
    if (!old) return { ok: false, error: 'Партію не знайдено' }
    try {
      await rpcUpdateBatch(batchId, {
        recipeName: nextValues.recipe ?? old.recipe,
        feedProducedKg: nextValues.feedProducedKg ?? old.feedProducedKg,
        line: nextValues.line ?? old.line,
      })
      await refreshAll()
      appendAudit('UPDATE_BATCH', { batchId, patch: nextValues })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }

  const deleteBatch = async (batchId) => {
    const removed = batches.find((b) => b.id === batchId)
    try {
      await removeBatch(batchId)
      setBatches((prev) => prev.filter((b) => b.id !== batchId))
      if (removed) appendAudit('DELETE_BATCH', { batchId, snapshot: removed })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }

  // ── raw arrival ──
  const addRawArrival = async ({ source, wheatKg, cornKg, premixKg }) => {
    try {
      await rpcAddRawArrival({ source, wheatKg, cornKg, premixKg })
      await refreshAll()
      appendAudit('ADD_RAW_ARRIVAL', {
        source: source || 'Постачання',
        wheatKg: Number(wheatKg) || 0,
        cornKg: Number(cornKg) || 0,
        premixKg: Number(premixKg) || 0,
      })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }

  // ── incidents ──
  const addIncident = async (incident) => {
    try {
      const created = await insertIncident(incident)
      const normalized = {
        ...created,
        status: normalizeIncidentStatus(created.status),
        category: normalizeIncidentCategory(created.category),
      }
      setIncidents((prev) => [normalized, ...prev])
      appendAudit('ADD_INCIDENT', { id: created.id, ...incident, status: normalized.status })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }

  const updateIncidentStatus = async (incidentId, status) => {
    const next = normalizeIncidentStatus(status)
    const prevRow = incidents.find((i) => i.id === incidentId)
    if (!prevRow) return
    if (prevRow.status === next) return

    // 1) Оптимістично оновлюємо UI одразу — щоб картка одразу переїхала
    setIncidents((prev) =>
      prev.map((i) => (i.id === incidentId ? { ...i, status: next } : i)),
    )
    appendAudit('UPDATE_INCIDENT_STATUS', { incidentId, from: prevRow.status, to: next })

    // 2) Намагаємось зберегти у БД; при помилці — відкочуємо
    try {
      const updated = await patchIncident(incidentId, { status: next })
      setIncidents((prev) =>
        prev.map((i) =>
          i.id === incidentId
            ? {
                ...updated,
                status: normalizeIncidentStatus(updated.status),
                category: normalizeIncidentCategory(updated.category),
              }
            : i,
        ),
      )
    } catch (e) {
      console.error('[incidents] оновлення статусу не вдалося, відкат:', e)
      setIncidents((prev) =>
        prev.map((i) => (i.id === incidentId ? { ...i, status: prevRow.status } : i)),
      )
      setError(
        `Не вдалося оновити статус інциденту: ${e?.message || e}. ` +
          'Якщо повідомлення містить "JWT issued at future" — синхронізуй годинник Windows.',
      )
    }
  }

  const updateIncident = async (incidentId, nextValues) => {
    try {
      const updated = await patchIncident(incidentId, {
        ...nextValues,
        status: normalizeIncidentStatus(nextValues.status ?? 'В роботі'),
        category: normalizeIncidentCategory(nextValues.category ?? 'equipment'),
      })
      setIncidents((prev) =>
        prev.map((i) =>
          i.id === incidentId
            ? {
                ...updated,
                status: normalizeIncidentStatus(updated.status),
                category: normalizeIncidentCategory(updated.category),
              }
            : i,
        ),
      )
      appendAudit('UPDATE_INCIDENT', { incidentId, patch: nextValues })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }

  const deleteIncident = async (incidentId) => {
    const removed = incidents.find((i) => i.id === incidentId)
    try {
      await removeIncident(incidentId)
      setIncidents((prev) => prev.filter((i) => i.id !== incidentId))
      if (removed) appendAudit('DELETE_INCIDENT', { incidentId, snapshot: removed })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }

  // ── equipment ──
  const patchEquipment = async (equipmentId, patch) => {
    const old = equipment.find((e) => e.id === equipmentId)
    try {
      const updated = await patchEquipmentRow(equipmentId, patch)
      setEquipment((prev) => prev.map((e) => (e.id === equipmentId ? updated : e)))
      if (old) appendAudit('UPDATE_EQUIPMENT', { equipmentId, name: old.name, patch })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }

  const addEquipment = async (payload) => {
    try {
      const created = await insertEquipment(payload)
      setEquipment((prev) => [...prev, created])
      appendAudit('ADD_EQUIPMENT', { equipmentId: created.id, name: created.name })
      return { ok: true, equipment: created }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }

  const deleteEquipment = async (equipmentId) => {
    const removed = equipment.find((e) => e.id === equipmentId)
    try {
      await removeEquipment(equipmentId)
      setEquipment((prev) => prev.filter((e) => e.id !== equipmentId))
      if (removed) appendAudit('DELETE_EQUIPMENT', { equipmentId, name: removed.name })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }

  // ── shifts ──
  const activeShift = shifts.find((s) => s.status === 'Відкрита') || null

  const openShift = async ({ openingData, notes, operator }) => {
    if (activeShift) return { ok: false, error: 'Спочатку закрийте поточну відкриту зміну' }
    try {
      const created = await insertShift({ openingData, notes, operator })
      setShifts((prev) => [created, ...prev])
      appendAudit('OPEN_SHIFT', {
        shiftId: created.id,
        operator: operator || 'Невідомо',
        notes,
        openingData,
      })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }

  const closeShift = async (notes) => {
    if (!activeShift) return { ok: false, error: 'Немає відкритої зміни' }
    try {
      const updated = await patchShiftClose(activeShift.id, notes)
      setShifts((prev) => prev.map((s) => (s.id === activeShift.id ? updated : s)))
      appendAudit('CLOSE_SHIFT', { shiftId: activeShift.id, notes })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }

  // ── users (app_users) ──
  const updateUser = async (userId, patch) => {
    try {
      await rpcAppUpdateUser(userId, {
        displayName: patch.displayName,
        role: patch.role,
      })
      await refreshAll()
      appendAudit('UPDATE_USER', { userId, patch })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }

  const setUserActive = async (userId, active) => {
    try {
      await rpcAppSetActive(userId, active)
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, active } : u)))
      appendAudit(active ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', { userId })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }

  // створення нового користувача (login + password + role)
  const addUser = async (payload) => {
    try {
      const newUserId = await rpcAppCreateUser({
        login: (payload.login || '').trim(),
        password: payload.password || '',
        displayName: (payload.displayName || '').trim() || payload.login,
        role: payload.role || 'operator',
      })
      await refreshAll()
      appendAudit('ADD_USER', {
        userId: newUserId,
        login: payload.login,
        role: payload.role,
      })
      return { ok: true, userId: newUserId }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }

  const setUserPassword = async (userId, newPassword) => {
    try {
      await rpcAppSetPassword(userId, newPassword)
      appendAudit('SET_USER_PASSWORD', { userId })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }

  const deleteUser = async (userId) => {
    const removed = users.find((u) => u.id === userId)
    try {
      await rpcAppDeleteUser(userId)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      if (removed) appendAudit('DELETE_USER', { userId, login: removed.login })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }

  // ── averages, etc. ──
  const averageDailyConsumptionKg = RAW_KEYS.reduce((acc, key) => {
    const spent = movements
      .filter((m) => m.type === 'Списання')
      .reduce((sum, m) => sum + Math.abs(m.deltaKg[key]), 0)
    acc[key] = spent / 7
    return acc
  }, {})

  const contextValue = {
    loading,
    error,
    refreshAll,
    refreshAuditLog,
    users,
    addUser,
    updateUser,
    setUserActive,
    setUserPassword,
    deleteUser,
    recipes: recipesState,
    batches,
    incidents,
    equipment,
    shifts,
    activeShift,
    storageKg,
    movements,
    auditLog,
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
    patchEquipment,
    addEquipment,
    deleteEquipment,
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
