import { OrderStatus, PaymentStatus } from '../enums';
import { Order } from '../models';

export function canTransitionOrder(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  switch (currentStatus) {
    case OrderStatus.CREATED:
      return targetStatus === OrderStatus.CONFIRMED || targetStatus === OrderStatus.CANCELLED;

    case OrderStatus.CONFIRMED:
      return targetStatus === OrderStatus.PAYMENT_PENDING || targetStatus === OrderStatus.CANCELLED;

    case OrderStatus.PAYMENT_PENDING:
      return targetStatus === OrderStatus.PAID || targetStatus === OrderStatus.CANCELLED;

    case OrderStatus.PAID:
      return targetStatus === OrderStatus.DISPATCHED || targetStatus === OrderStatus.CANCELLED;

    case OrderStatus.DISPATCHED:
      return targetStatus === OrderStatus.DELIVERED;

    case OrderStatus.DELIVERED:
      return targetStatus === OrderStatus.ACCEPTED || targetStatus === OrderStatus.DISPUTED;

    case OrderStatus.ACCEPTED:
      return targetStatus === OrderStatus.SETTLED || targetStatus === OrderStatus.DISPUTED;

    case OrderStatus.DISPUTED:
      return targetStatus === OrderStatus.SETTLED || targetStatus === OrderStatus.CANCELLED;

    case OrderStatus.SETTLED:
    case OrderStatus.CANCELLED:
      return false; // Terminal states

    default:
      return false;
  }
}

export function validateOrderTransition(order: Order, targetStatus: OrderStatus): { success: boolean; error?: string } {
  if (!canTransitionOrder(order.status, targetStatus)) {
    return {
      success: false,
      error: `Invalid order state transition from ${order.status} to ${targetStatus}`,
    };
  }

  // BR-03: Payment must be confirmed before goods are dispatched
  if (targetStatus === OrderStatus.DISPATCHED) {
    if (order.status !== OrderStatus.PAID || order.paymentStatus !== PaymentStatus.CONFIRMED) {
      return {
        success: false,
        error: 'Payment confirmation is strictly required before an order can be dispatched (BR-03, FR-PAY-01).',
      };
    }
  }

  // Terms acceptance required before moving to Confirmed/Payment Pending
  if (targetStatus === OrderStatus.CONFIRMED || targetStatus === OrderStatus.PAYMENT_PENDING) {
    if (!order.termsAcceptedByBuyer) {
      return {
        success: false,
        error: 'Buyer must accept terms before the order can be confirmed (FR-ORD-05).',
      };
    }
    const allSuppliersConfirmed = order.allocations.every(a => a.confirmedBySupplier);
    if (!allSuppliersConfirmed) {
      return {
        success: false,
        error: 'All allocated suppliers must confirm their lots before payment can proceed (FR-ORD-04).',
      };
    }
  }

  return { success: true };
}
