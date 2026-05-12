import { granulationLineStatusFromIncidents, getEquipmentIncidentSummary } from './equipmentIncidentStatus'

const LINE_1 = 'Лінія грануляції №1'
const LINE_2 = 'Лінія грануляції №2'

/**
 * Дані відкриття зміни: залишки зі складу (т), стан ліній і весь перелік обладнання — з журналу інцидентів.
 */
export function buildShiftOpeningData(storageKg, equipmentList, incidents) {
  const equipmentByIncidents = (equipmentList || []).map((eq) => {
    const summary = getEquipmentIncidentSummary(eq.name, incidents)
    return {
      id: eq.id,
      name: eq.name,
      type: eq.type,
      directoryStatus: eq.status,
      fromIncidents: summary.label,
      lastIncidentTime: summary.lastTime,
      isDownFromIncident: summary.isDown,
    }
  })

  return {
    wheat: Number((storageKg.wheat / 1000).toFixed(2)),
    corn: Number((storageKg.corn / 1000).toFixed(2)),
    premix: Number((storageKg.premix / 1000).toFixed(2)),
    granulationLine1: granulationLineStatusFromIncidents(LINE_1, incidents),
    granulationLine2: granulationLineStatusFromIncidents(LINE_2, incidents),
    equipmentByIncidents,
  }
}
