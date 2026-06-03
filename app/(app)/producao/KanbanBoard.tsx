'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { Calendar, GripVertical } from 'lucide-react';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { moveOP } from './kanban/actions';
import type { OPStatus } from '@/lib/types';
import type { ProductionOrderListItem } from '@/lib/production/orders';

const COLUMNS: { status: OPStatus; label: string; tone: string }[] = [
  { status: 'Aberta', label: 'Aberta', tone: 'neutral' },
  { status: 'Aguardando Material', label: 'Ag. Material', tone: 'warning' },
  { status: 'Em Produção', label: 'Em Produção', tone: 'primary' },
  { status: 'Em Bordagem', label: 'Em Bordagem', tone: 'secondary' },
  { status: 'Em Revisão', label: 'Em Revisão', tone: 'warning' },
  { status: 'Finalizada', label: 'Finalizada', tone: 'success' },
];

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(iso));
}

function isOverdue(iso: string, status: OPStatus) {
  if (['Finalizada', 'Vendida', 'Entregue'].includes(status)) return false;
  return new Date(iso) < new Date();
}

// ── Draggable card ────────────────────────────────────────────────
function KanbanCard({ order, isDragging = false }: { order: ProductionOrderListItem; isDragging?: boolean }) {
  const overdue = order.dueDate ? isOverdue(order.dueDate, order.status) : false;

  return (
    <div className={`rounded-[14px] border bg-paper p-3 transition-shadow ${isDragging ? 'shadow-s2 opacity-90 rotate-1' : 'border-line hover:shadow-s1'}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[10px] text-ink-soft">#{order.opNumber}</span>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-2 text-[13px] font-medium leading-tight text-ink line-clamp-2">{order.productName}</p>
      <p className="mt-1 text-[11px] text-ink-soft truncate">{order.clientName}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-ink-soft">{order.qty} {order.qty === 1 ? 'peça' : 'peças'}</span>
        {order.dueDate && (
          <span className={`flex items-center gap-1 text-[10px] ${overdue ? 'text-danger' : 'text-ink-soft'}`}>
            <Calendar size={10} />
            {formatDate(order.dueDate)}
          </span>
        )}
      </div>
      {order.seamstressName && (
        <p className="mt-1.5 truncate text-[10px] text-ink-soft">{order.seamstressName}</p>
      )}
    </div>
  );
}

// ── Draggable wrapper ─────────────────────────────────────────────
function DraggableCard({ order }: { order: ProductionOrderListItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: order.id ?? order.opNumber,
    data: { order },
  });

  return (
    <div ref={setNodeRef} style={{ opacity: isDragging ? 0.4 : 1 }}>
      <Link href={`/producao/${order.id ?? order.opNumber}`} className="block">
        <div className="group relative">
          <button
            {...attributes}
            {...listeners}
            className="absolute right-2 top-2 z-10 hidden cursor-grab rounded p-0.5 text-ink-soft active:cursor-grabbing group-hover:flex"
            aria-label="Arrastar"
            onClick={(e) => e.preventDefault()}
          >
            <GripVertical size={14} />
          </button>
          <KanbanCard order={order} />
        </div>
      </Link>
    </div>
  );
}

// ── Droppable column ──────────────────────────────────────────────
function KanbanColumn({
  status,
  label,
  orders,
  isOver,
}: {
  status: OPStatus;
  label: string;
  orders: ProductionOrderListItem[];
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[200px] w-[220px] shrink-0 flex-col rounded-[18px] border-2 p-3 transition-colors ${
        isOver ? 'border-primary bg-primary-soft/40' : 'border-line bg-surface'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-soft">{label}</span>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-paper text-[10px] font-medium text-ink-soft">
          {orders.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {orders.map((order) => (
          <DraggableCard key={order.id ?? order.opNumber} order={order} />
        ))}
        {orders.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-[10px] border border-dashed border-line py-6">
            <span className="text-[11px] text-ink-soft">Vazio</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main board ────────────────────────────────────────────────────
export function KanbanBoard({ initialOrders }: { initialOrders: ProductionOrderListItem[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [activeOrder, setActiveOrder] = useState<ProductionOrderListItem | null>(null);
  const [overColumn, setOverColumn] = useState<OPStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart({ active }: DragStartEvent) {
    const order = orders.find((o) => (o.id ?? o.opNumber) === active.id);
    setActiveOrder(order ?? null);
  }

  function handleDragOver({ over }: { over: DragEndEvent['over'] }) {
    setOverColumn(over ? (over.id as OPStatus) : null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveOrder(null);
    setOverColumn(null);
    if (!over) return;

    const newStatus = over.id as OPStatus;
    const order = orders.find((o) => (o.id ?? o.opNumber) === active.id);
    if (!order || order.status === newStatus) return;
    if (!order.id) return;

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
    );

    startTransition(async () => {
      try {
        await moveOP(order.id!, newStatus);
      } catch {
        // Revert on error
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, status: order.status } : o))
        );
      }
    });
  }

  const byStatus = (status: OPStatus) => orders.filter((o) => o.status === status);

  return (
    <div className="relative">
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-start justify-end p-2 pointer-events-none">
          <span className="rounded-full bg-primary px-3 py-1 text-[11px] text-paper shadow">Salvando…</span>
        </div>
      )}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              status={col.status}
              label={col.label}
              orders={byStatus(col.status)}
              isOver={overColumn === col.status}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
          {activeOrder && <KanbanCard order={activeOrder} isDragging />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
