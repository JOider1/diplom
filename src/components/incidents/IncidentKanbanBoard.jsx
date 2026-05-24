import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { INCIDENT_CATEGORY_LABELS, normalizeIncidentCategory } from '../../constants/incidentCategories'
import { INCIDENT_STATUSES } from '../../constants/incidentStatuses'

function KanbanColumn({ status, count, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[300px] min-w-[260px] flex-1 flex-col gap-2 rounded-lg border-2 border-dashed p-3 transition-colors lg:min-w-0 ${
        isOver
          ? 'border-enterprise-600 bg-enterprise-50/50 dark:border-enterprise-500 dark:bg-slate-800/80'
          : 'border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/50'
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-600">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{status}</h4>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 shadow-sm dark:bg-slate-700 dark:text-slate-200">
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

function IncidentCard({ incident, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `incident-${incident.id}`,
    data: { incident },
  })
  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-600 dark:bg-slate-800 ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-xs text-slate-500 active:cursor-grabbing dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
          aria-label="Перетягнути картку"
          {...listeners}
          {...attributes}
        >
          ⠿
        </button>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">{incident.time}</p>
          <p className="text-[11px] font-medium text-enterprise-800 dark:text-enterprise-300">
            {INCIDENT_CATEGORY_LABELS[normalizeIncidentCategory(incident.category)]}
          </p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{incident.equipment}</p>
          <p className="text-sm text-slate-700 dark:text-slate-200">{incident.description}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Пріоритет: {incident.severity || 'Середня'}</p>
          <div className="no-print flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => onEdit(incident)}
              className="rounded border border-slate-300 px-2 py-1 text-xs"
            >
              Редагувати
            </button>
            <button
              type="button"
              onClick={() => onDelete(incident.id)}
              className="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
            >
              Видалити
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function IncidentCardPreview({ incident }) {
  return (
    <div className="max-w-[280px] rounded-lg border-2 border-enterprise-600 bg-white p-3 shadow-lg dark:border-enterprise-500 dark:bg-slate-800">
      <p className="text-xs text-slate-500 dark:text-slate-400">{incident.time}</p>
      <p className="text-[11px] font-medium text-enterprise-800 dark:text-enterprise-300">
        {INCIDENT_CATEGORY_LABELS[normalizeIncidentCategory(incident.category)]}
      </p>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{incident.equipment}</p>
      <p className="line-clamp-3 text-sm text-slate-700 dark:text-slate-200">{incident.description}</p>
    </div>
  )
}

export default function IncidentKanbanBoard({ incidents, onStatusChange, onEdit, onDelete }) {
  const [activeIncident, setActiveIncident] = useState(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  const byColumn = INCIDENT_STATUSES.map((status) => ({
    status,
    items: incidents.filter((i) => i.status === status),
  }))

  const resolveDropStatus = (overId) => {
    if (!overId) {
      return null
    }
    const id = String(overId)
    if (INCIDENT_STATUSES.includes(id)) {
      return id
    }
    if (id.startsWith('incident-')) {
      // ID інциденту — UUID-рядок, НЕ число
      const incidentId = id.slice('incident-'.length)
      const target = incidents.find((i) => String(i.id) === incidentId)
      return target?.status ?? null
    }
    return null
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => {
        const id = String(active.id)
        if (id.startsWith('incident-')) {
          const incidentId = id.slice('incident-'.length)
          setActiveIncident(incidents.find((i) => String(i.id) === incidentId) ?? null)
        }
      }}
      onDragEnd={({ active, over }) => {
        setActiveIncident(null)
        if (!over) {
          return
        }
        const nextStatus = resolveDropStatus(over.id)
        if (!nextStatus) {
          return
        }
        const id = String(active.id)
        if (!id.startsWith('incident-')) {
          return
        }
        const incidentId = id.slice('incident-'.length)
        const current = incidents.find((i) => String(i.id) === incidentId)
        if (current && current.status !== nextStatus) {
          // передаємо ORIGINAL id (UUID-рядок або число — як було)
          onStatusChange(current.id, nextStatus)
        }
      }}
      onDragCancel={() => setActiveIncident(null)}
    >
      <div className="kanban-mobile-stack flex flex-col gap-4 lg:flex-row lg:items-start">
        {byColumn.map(({ status, items }) => (
          <KanbanColumn key={status} status={status} count={items.length}>
            {items.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </KanbanColumn>
        ))}
      </div>
      <DragOverlay>{activeIncident ? <IncidentCardPreview incident={activeIncident} /> : null}</DragOverlay>
    </DndContext>
  )
}
