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

export const shiftOpeningDefaults = {
  wheat: 92,
  corn: 71,
  premix: 18,
  granulationLine1: 'Робоча',
  granulationLine2: 'Тех. огляд',
}

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
