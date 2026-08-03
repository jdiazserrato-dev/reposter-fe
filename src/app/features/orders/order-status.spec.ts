import { STATUS_OPTIONS, ORDER_STATUSES } from './order-status';
import { type OrderStatus } from '../../models';

describe('order-status', () => {
  describe('ORDER_STATUSES', () => {
    it('contiene todos los estados en orden lógico', () => {
      expect(ORDER_STATUSES).toEqual([
        'PENDING',
        'IN_PRODUCTION',
        'READY_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
      ]);
    });
  });

  describe('STATUS_OPTIONS', () => {
    it('tiene una etiqueta y color para cada estado', () => {
      ORDER_STATUSES.forEach((status) => {
        expect(STATUS_OPTIONS[status]).toBeDefined();
        expect(STATUS_OPTIONS[status].label).toBeTruthy();
        expect(STATUS_OPTIONS[status].color).toBeTruthy();
      });
    });

    it('usa labels en español', () => {
      expect(STATUS_OPTIONS.PENDING.label).toBe('Pendiente');
      expect(STATUS_OPTIONS.IN_PRODUCTION.label).toBe('En producción');
      expect(STATUS_OPTIONS.READY_FOR_DELIVERY.label).toBe('Listo para entrega');
      expect(STATUS_OPTIONS.DELIVERED.label).toBe('Entregado');
      expect(STATUS_OPTIONS.CANCELLED.label).toBe('Cancelado');
    });

    it('usa colors de acuerdo al palette del DESIGN.md', () => {
      expect(STATUS_OPTIONS.PENDING.color).toContain('#fff3c4');
      expect(STATUS_OPTIONS.PENDING.color).toContain('#8a6a00');
      expect(STATUS_OPTIONS.CANCELLED.color).toContain('#b3261e');
      expect(STATUS_OPTIONS.DELIVERED.color).toContain('#047857');
    });
  });

  describe('type safety', () => {
    it('STATUS_OPTIONS es indexable por OrderStatus', () => {
      const statuses: OrderStatus[] = ['PENDING', 'IN_PRODUCTION', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
      statuses.forEach((s) => {
        const opt = STATUS_OPTIONS[s];
        expect(opt.label.length).toBeGreaterThan(0);
      });
    });
  });
});
