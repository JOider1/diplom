export const productionByWeek = [
  { day: 'Пн', tons: 142 },
  { day: 'Вт', tons: 155 },
  { day: 'Ср', tons: 133 },
  { day: 'Чт', tons: 164 },
  { day: 'Пт', tons: 172 },
  { day: 'Сб', tons: 128 },
  { day: 'Нд', tons: 118 },
]

export const rawStorageStatus = [
  { name: 'Пшениця', value: 58 },
  { name: 'Кукурудза', value: 27 },
  { name: 'Премікси', value: 15 },
]

<<<<<<< HEAD
=======
export const recipes = [
  {
    id: 'starter-broiler',
    name: 'Стартовий комбікорм для бройлерів',
    consumptionKgPerTon: { wheat: 620, corn: 330, premix: 50 },
    supplierPricesPerTonUah: { wheat: 9800, corn: 9200, premix: 46000 },
  },
  {
    id: 'finisher-pigs',
    name: 'Комбікорм для свиней, фініш',
    consumptionKgPerTon: { wheat: 500, corn: 430, premix: 70 },
    supplierPricesPerTonUah: { wheat: 9800, corn: 9200, premix: 46000 },
  },
]

export const initialRawStorageKg = {
  wheat: 92000,
  corn: 71000,
  premix: 18000,
}

>>>>>>> 8fb2b64 (first commit)
export const shiftOpeningDefaults = {
  wheat: 92,
  corn: 71,
  premix: 18,
  granulationLine1: 'Робоча',
  granulationLine2: 'Тех. огляд',
}

<<<<<<< HEAD
=======
export const shiftRecords = [
  {
    id: 1,
    openedAt: '2026-04-27 08:00',
    closedAt: '2026-04-27 20:00',
    status: 'Закрита',
    openingData: {
      wheat: 92,
      corn: 71,
      premix: 18,
      granulationLine1: 'Робоча',
      granulationLine2: 'Робоча',
    },
    notes: 'Планова денна зміна',
  },
]

>>>>>>> 8fb2b64 (first commit)
export const productionBatches = [
  {
    id: 1,
    createdAt: '2026-04-27 08:20',
    recipe: 'Стартовий комбікорм для бройлерів',
    rawSpentKg: 7800,
    feedProducedKg: 7500,
  },
  {
    id: 2,
    createdAt: '2026-04-27 12:40',
    recipe: 'Комбікорм для свиней, фініш',
    rawSpentKg: 6400,
    feedProducedKg: 6150,
  },
]

<<<<<<< HEAD
=======
export const rawMovements = [
  {
    id: 1,
    time: '2026-04-27 08:20',
    type: 'Списання',
    source: 'Партія #1',
    deltaKg: { wheat: -4650, corn: -2475, premix: -375 },
    balanceKg: { wheat: 87350, corn: 68525, premix: 17625 },
  },
  {
    id: 2,
    time: '2026-04-27 12:40',
    type: 'Списання',
    source: 'Партія #2',
    deltaKg: { wheat: -3075, corn: -2645, premix: -430 },
    balanceKg: { wheat: 84275, corn: 65880, premix: 17195 },
  },
]

>>>>>>> 8fb2b64 (first commit)
export const incidentRecords = [
  {
    id: 1,
    time: '2026-04-27 09:15',
    equipment: 'Гранулятор ГР-2',
    description: 'Перегрів підшипника приводного вузла',
    status: 'В роботі',
  },
  {
    id: 2,
    time: '2026-04-27 14:05',
    equipment: 'Дозатор мікрокомпонентів',
    description: 'Нестабільна подача преміксу',
    status: 'Закрито',
  },
]
<<<<<<< HEAD
=======

export const equipmentDirectory = [
  { id: 1, name: 'Лінія грануляції №1', type: 'Лінія', status: 'Робоча', nextMaintenance: '2026-05-12' },
  { id: 2, name: 'Лінія грануляції №2', type: 'Лінія', status: 'Тех. огляд', nextMaintenance: '2026-05-03' },
  { id: 3, name: 'Гранулятор ГР-2', type: 'Гранулятор', status: 'Робоча', nextMaintenance: '2026-05-08' },
  { id: 4, name: 'Елеватор ЕЛ-1', type: 'Елеватор', status: 'Робоча', nextMaintenance: '2026-05-18' },
]
>>>>>>> 8fb2b64 (first commit)
