// ════════════════════════════════════════════════════════════════════
// Шар даних: мапери snake_case ↔ camelCase + CRUD через Supabase
// ════════════════════════════════════════════════════════════════════
import { supabase } from './supabase'

// ── helpers ────────────────────────────────────────────────────────
export const formatDbTimestamp = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const toIso = (localStr) => {
  if (!localStr) return null
  // приймає "2026-05-24 14:30" або "2026-05-24T14:30"
  const normalized = localStr.includes('T') ? localStr : localStr.replace(' ', 'T')
  const d = new Date(normalized)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

// ── mappers ────────────────────────────────────────────────────────
export const mapRecipe = (row) => ({
  id: row.id,
  name: row.name,
  consumptionKgPerTon: {
    wheat: Number(row.consumption_wheat_kg_per_ton) || 0,
    corn: Number(row.consumption_corn_kg_per_ton) || 0,
    premix: Number(row.consumption_premix_kg_per_ton) || 0,
  },
  supplierPricesPerTonUah: {
    wheat: Number(row.price_wheat_per_ton) || 0,
    corn: Number(row.price_corn_per_ton) || 0,
    premix: Number(row.price_premix_per_ton) || 0,
  },
})

export const mapEquipment = (row) => ({
  id: row.id,
  name: row.name,
  type: row.type || '',
  status: row.status,
  nextMaintenance: row.next_maintenance || '',
})

export const mapShift = (row) => ({
  id: row.id,
  openedAt: formatDbTimestamp(row.opened_at),
  closedAt: row.closed_at ? formatDbTimestamp(row.closed_at) : '',
  status: row.status,
  operator: row.operator || '',
  notes: row.notes || '',
  openingData: row.opening_data || {},
})

export const mapBatch = (row) => ({
  id: row.id,
  createdAt: formatDbTimestamp(row.created_at),
  line: row.line || 'Лінія 1',
  recipe: row.recipe,
  rawSpentKg: Number(row.raw_spent_kg) || 0,
  feedProducedKg: Number(row.feed_produced_kg) || 0,
  batchCostUah: Number(row.batch_cost_uah) || 0,
  shiftId: row.shift_id || null,
})

export const mapIncident = (row) => ({
  id: row.id,
  time: formatDbTimestamp(row.time),
  category: row.category,
  equipment: row.equipment || '',
  description: row.description || '',
  severity: row.severity || 'Середня',
  status: row.status,
})

export const mapMovement = (row) => ({
  id: row.id,
  time: formatDbTimestamp(row.time),
  type: row.type,
  source: row.source || '',
  deltaKg: {
    wheat: Number(row.delta_wheat_kg) || 0,
    corn: Number(row.delta_corn_kg) || 0,
    premix: Number(row.delta_premix_kg) || 0,
  },
  balanceKg: {
    wheat: Number(row.balance_wheat_kg) || 0,
    corn: Number(row.balance_corn_kg) || 0,
    premix: Number(row.balance_premix_kg) || 0,
  },
  batchId: row.batch_id || null,
})

export const mapStorage = (row) => ({
  wheat: Number(row?.wheat_kg) || 0,
  corn: Number(row?.corn_kg) || 0,
  premix: Number(row?.premix_kg) || 0,
})

export const mapAudit = (row) => ({
  id: row.id,
  at: formatDbTimestamp(row.at),
  actor: row.actor || '',
  role: row.role || '',
  action: row.action,
  details: row.details ?? null,
})

// ── fetch all (initial load) ───────────────────────────────────────
// Кожен запит у "ізольованому" блоці з таймаутом, щоб один зависаючий
// запит не блокував весь дашборд. Помилки логуються у console, але
// інші дані повертаються нормально.
const QUERY_TIMEOUT_MS = 8000

const withTimeout = (promise, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`[db] ${label} timeout після ${QUERY_TIMEOUT_MS}мс`)), QUERY_TIMEOUT_MS),
    ),
  ])

// Чи це помилка "JWT issued at future" / clock skew?
const isClockSkewError = (err) => {
  const msg = String(err?.message || err || '').toLowerCase()
  return msg.includes('issued at future') || msg.includes('jwt') && msg.includes('future')
}

const safeQuery = async (label, builder) => {
  try {
    const res = await withTimeout(builder, label)
    if (res?.error) {
      if (isClockSkewError(res.error)) {
        console.warn(`[db] ${label} clock-skew JWT — спроба refreshSession`)
        try {
          await supabase.auth.refreshSession()
        } catch (e) {
          console.error('[db] refreshSession failed', e)
        }
      }
      console.error(`[db] ${label} error:`, res.error)
      return { data: null, error: res.error }
    }
    return { data: res?.data ?? null, error: null }
  } catch (e) {
    console.error(`[db] ${label} threw:`, e)
    return { data: null, error: e }
  }
}

export async function fetchAll() {
  const [
    usersRes,
    recipesRes,
    equipmentRes,
    shiftsRes,
    batchesRes,
    incidentsRes,
    movementsRes,
    storageRes,
  ] = await Promise.all([
    safeQuery('app_users',     supabase.from('v_app_users').select('*').order('display_name')),
    safeQuery('recipes',       supabase.from('recipes').select('*').order('name')),
    safeQuery('equipment',     supabase.from('equipment').select('*').order('name')),
    safeQuery('shifts',        supabase.from('shifts').select('*').order('opened_at', { ascending: false })),
    safeQuery('batches',       supabase.from('batches').select('*').order('created_at', { ascending: false })),
    safeQuery('incidents',     supabase.from('incidents').select('*').order('time', { ascending: false })),
    safeQuery('raw_movements', supabase.from('raw_movements').select('*').order('time', { ascending: false })),
    safeQuery('storage_state', supabase.from('storage_state').select('*').eq('id', 1).maybeSingle()),
  ])

  const errors = []
  for (const [name, r] of [
    ['app_users', usersRes], ['recipes', recipesRes], ['equipment', equipmentRes],
    ['shifts', shiftsRes], ['batches', batchesRes], ['incidents', incidentsRes],
    ['raw_movements', movementsRes], ['storage_state', storageRes],
  ]) {
    if (r.error) errors.push(`${name}: ${r.error.message || r.error}`)
  }

  const mappedUsers = (usersRes.data || []).map((row) => ({
    id: row.id,
    login: row.login,
    displayName: row.display_name,
    role: row.role,
    active: row.active,
  }))

  return {
    users: mappedUsers,
    recipes: (recipesRes.data || []).map(mapRecipe),
    equipment: (equipmentRes.data || []).map(mapEquipment),
    shifts: (shiftsRes.data || []).map(mapShift),
    batches: (batchesRes.data || []).map(mapBatch),
    incidents: (incidentsRes.data || []).map(mapIncident),
    movements: (movementsRes.data || []).map(mapMovement),
    storageKg: mapStorage(storageRes.data),
    errors,
  }
}

export async function fetchAuditLog() {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('at', { ascending: false })
    .limit(500)
  if (error) return []
  return (data || []).map(mapAudit)
}

// ── audit helper ───────────────────────────────────────────────────
export async function writeAudit({ actor, role, action, details }) {
  await supabase.from('audit_log').insert({
    actor,
    role,
    action,
    details: details ?? null,
  })
}

// ── recipes ────────────────────────────────────────────────────────
export async function insertRecipe(payload) {
  const { data, error } = await supabase
    .from('recipes')
    .insert({
      name: payload.name,
      consumption_wheat_kg_per_ton: payload.consumptionKgPerTon?.wheat || 0,
      consumption_corn_kg_per_ton: payload.consumptionKgPerTon?.corn || 0,
      consumption_premix_kg_per_ton: payload.consumptionKgPerTon?.premix || 0,
      price_wheat_per_ton: payload.supplierPricesPerTonUah?.wheat || 0,
      price_corn_per_ton: payload.supplierPricesPerTonUah?.corn || 0,
      price_premix_per_ton: payload.supplierPricesPerTonUah?.premix || 0,
    })
    .select()
    .single()
  if (error) throw error
  return mapRecipe(data)
}

export async function patchRecipe(id, patch) {
  const update = {}
  if (patch.name !== undefined) update.name = patch.name
  if (patch.consumptionKgPerTon) {
    update.consumption_wheat_kg_per_ton = patch.consumptionKgPerTon.wheat
    update.consumption_corn_kg_per_ton = patch.consumptionKgPerTon.corn
    update.consumption_premix_kg_per_ton = patch.consumptionKgPerTon.premix
  }
  if (patch.supplierPricesPerTonUah) {
    update.price_wheat_per_ton = patch.supplierPricesPerTonUah.wheat
    update.price_corn_per_ton = patch.supplierPricesPerTonUah.corn
    update.price_premix_per_ton = patch.supplierPricesPerTonUah.premix
  }
  const { data, error } = await supabase.from('recipes').update(update).eq('id', id).select().single()
  if (error) throw error
  return mapRecipe(data)
}

export async function removeRecipe(id) {
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw error
}

// ── equipment ──────────────────────────────────────────────────────
export async function insertEquipment(payload) {
  const { data, error } = await supabase
    .from('equipment')
    .insert({
      name: (payload.name || '').trim() || 'Нова одиниця',
      type: (payload.type || '').trim() || null,
      status: payload.status || 'Робоча',
      next_maintenance: payload.nextMaintenance || null,
    })
    .select()
    .single()
  if (error) throw error
  return mapEquipment(data)
}

export async function patchEquipmentRow(id, patch) {
  const update = {}
  if (patch.name !== undefined) update.name = patch.name
  if (patch.type !== undefined) update.type = patch.type || null
  if (patch.status !== undefined) update.status = patch.status
  if (patch.nextMaintenance !== undefined) update.next_maintenance = patch.nextMaintenance || null
  const { data, error } = await supabase.from('equipment').update(update).eq('id', id).select().single()
  if (error) throw error
  return mapEquipment(data)
}

export async function removeEquipment(id) {
  const { error } = await supabase.from('equipment').delete().eq('id', id)
  if (error) throw error
}

// ── batches via RPC ────────────────────────────────────────────────
export async function rpcAddBatch({ recipeName, feedProducedKg, line }) {
  const { data, error } = await supabase.rpc('add_batch', {
    p_recipe_name: recipeName,
    p_feed_produced_kg: feedProducedKg,
    p_line: line || 'Лінія 1',
    p_created_at: null,
  })
  if (error) throw error
  return mapBatch(data)
}

export async function rpcUpdateBatch(id, { recipeName, feedProducedKg, line }) {
  const { data, error } = await supabase.rpc('update_batch', {
    p_batch_id: id,
    p_recipe_name: recipeName,
    p_feed_produced_kg: feedProducedKg,
    p_line: line || 'Лінія 1',
  })
  if (error) throw error
  return mapBatch(data)
}

export async function removeBatch(id) {
  const { error } = await supabase.from('batches').delete().eq('id', id)
  if (error) throw error
}

export async function rpcAddRawArrival({ source, wheatKg, cornKg, premixKg }) {
  const { data, error } = await supabase.rpc('add_raw_arrival', {
    p_source: source || 'Постачання',
    p_wheat_kg: Number(wheatKg) || 0,
    p_corn_kg: Number(cornKg) || 0,
    p_premix_kg: Number(premixKg) || 0,
    p_time: null,
  })
  if (error) throw error
  return mapMovement(data)
}

// ── incidents ──────────────────────────────────────────────────────
export async function insertIncident(payload) {
  const { data, error } = await supabase
    .from('incidents')
    .insert({
      time: toIso(payload.time) || new Date().toISOString(),
      category: payload.category || 'equipment',
      equipment: payload.equipment || null,
      description: payload.description || null,
      severity: payload.severity || 'Середня',
      status: payload.status || 'В роботі',
    })
    .select()
    .single()
  if (error) throw error
  return mapIncident(data)
}

export async function patchIncident(id, patch) {
  const update = {}
  if (patch.time !== undefined) update.time = toIso(patch.time)
  if (patch.category !== undefined) update.category = patch.category
  if (patch.equipment !== undefined) update.equipment = patch.equipment || null
  if (patch.description !== undefined) update.description = patch.description || null
  if (patch.severity !== undefined) update.severity = patch.severity
  if (patch.status !== undefined) update.status = patch.status
  const { data, error } = await supabase.from('incidents').update(update).eq('id', id).select().single()
  if (error) throw error
  return mapIncident(data)
}

export async function removeIncident(id) {
  const { error } = await supabase.from('incidents').delete().eq('id', id)
  if (error) throw error
}

// ── shifts ─────────────────────────────────────────────────────────
export async function insertShift({ openingData, notes, operator }) {
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from('shifts')
    .insert({
      opened_at: nowIso,
      status: 'Відкрита',
      operator: operator || 'Невідомо',
      notes: notes || null,
      opening_data: openingData || {},
    })
    .select()
    .single()
  if (error) throw error
  return mapShift(data)
}

export async function patchShiftClose(id, notes) {
  const { data, error } = await supabase
    .from('shifts')
    .update({
      status: 'Закрита',
      closed_at: new Date().toISOString(),
      notes: notes || null,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapShift(data)
}

// ── profiles ───────────────────────────────────────────────────────
export async function patchProfile(id, patch) {
  const update = {}
  if (patch.displayName !== undefined) update.display_name = patch.displayName
  if (patch.role !== undefined) update.role = patch.role
  if (patch.active !== undefined) update.active = patch.active
  if (patch.login !== undefined) update.login = patch.login
  const { data, error } = await supabase.from('profiles').update(update).eq('id', id).select().single()
  if (error) throw error
  return mapProfile(data)
}

// ── проста авторизація без Supabase Auth ───────────────────────────
// Користувач у public.app_users; пароль перевіряється через bcrypt
// у RPC public.app_login. JS-сесія — у localStorage.

export async function rpcAppLogin(login, password) {
  const { data, error } = await supabase.rpc('app_login', {
    p_login: login,
    p_password: password,
  })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error('Невірний логін або пароль')
  return {
    id: row.id,
    login: row.login,
    displayName: row.display_name,
    role: row.role,
    active: row.active,
  }
}

export async function rpcAppCreateUser({ login, password, displayName, role }) {
  const { data, error } = await supabase.rpc('app_create_user', {
    p_login: login,
    p_password: password,
    p_display_name: displayName,
    p_role: role,
  })
  if (error) throw error
  return data // uuid
}

export async function rpcAppUpdateUser(userId, { displayName, role }) {
  const { error } = await supabase.rpc('app_update_user', {
    p_user_id: userId,
    p_display_name: displayName,
    p_role: role,
  })
  if (error) throw error
}

export async function rpcAppSetPassword(userId, newPassword) {
  const { error } = await supabase.rpc('app_set_password', {
    p_user_id: userId,
    p_new_password: newPassword,
  })
  if (error) throw error
}

export async function rpcAppSetActive(userId, active) {
  const { error } = await supabase.rpc('app_set_active', {
    p_user_id: userId,
    p_active: active,
  })
  if (error) throw error
}

export async function rpcAppDeleteUser(userId) {
  const { error } = await supabase.rpc('app_delete_user', { p_user_id: userId })
  if (error) throw error
}

export async function fetchAppUsers() {
  const { data, error } = await supabase
    .from('v_app_users')
    .select('*')
    .order('display_name')
  if (error) {
    console.error('[db] fetchAppUsers error:', error)
    return []
  }
  return (data || []).map((row) => ({
    id: row.id,
    login: row.login,
    displayName: row.display_name,
    role: row.role,
    active: row.active,
  }))
}
