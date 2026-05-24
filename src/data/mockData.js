// Усі реальні дані тепер тримаються у Supabase (таблиці batches, recipes, equipment,
// shifts, incidents, raw_movements, storage_state). Цей файл лишає тільки невеликі
// статичні константи для UI, що не залежать від БД.

// Стартовий обʼєм складу — використовується для розрахунку відсотка наповнення
// на головній сторінці. Реальний поточний залишок завжди тягнеться з storage_state.
export const initialRawStorageKg = {
  wheat: 120000,
  corn: 90000,
  premix: 22000,
}
