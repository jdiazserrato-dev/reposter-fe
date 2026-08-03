import { type OrderStatus } from '../../models';

export interface StatusOption {
  label: string;
  color: string;
}

export const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'IN_PRODUCTION',
  'READY_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

export const STATUS_OPTIONS: Record<OrderStatus, StatusOption> = {
  PENDING: { label: 'Pendiente', color: 'bg-[#fff3c4] text-[#8a6a00]' },
  IN_PRODUCTION: { label: 'En producción', color: 'bg-[#dbeafe] text-[#1d4ed8]' },
  READY_FOR_DELIVERY: { label: 'Listo para entrega', color: 'bg-[#ede9fe] text-[#6d28d9]' },
  DELIVERED: { label: 'Entregado', color: 'bg-[#d1fae5] text-[#047857]' },
  CANCELLED: { label: 'Cancelado', color: 'bg-[#fee2e2] text-[#b3261e]' },
};
