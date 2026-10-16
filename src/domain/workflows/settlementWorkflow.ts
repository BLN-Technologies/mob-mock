/**
 * Cargo Mobile V1 - Settlement & Payout Domain Workflow
 * Enforces BR-04 financial invariants, dispute hold gates,
 * and deterministic integer Rwandan Franc settlement records.
 */

import { OrderStatus, UserRole } from '../enums';
import { Order, SettlementRecord } from '../models';
import { calculateSupplierPayout } from '../calculations/feeCalculator';

export function createSettlementsFromOrder(order: Order): SettlementRecord[] {
  return order.allocations.map((alloc, index) => {
    const payoutCalc = calculateSupplierPayout(alloc.subtotalRwf);

    let status: 'PENDING' | 'ELIGIBLE' | 'PAUSED' | 'SETTLED' = 'PENDING';
    if (order.hasActiveDispute || order.status === OrderStatus.DISPUTED) {
      status = 'PAUSED';
    } else if (order.status === OrderStatus.SETTLED) {
      status = 'SETTLED';
    } else if (order.status === OrderStatus.ACCEPTED) {
      status = 'ELIGIBLE';
    }

    return {
      id: `stl-${order.id}-${index}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      supplierOrgId: alloc.supplierOrgId,
      supplierOrgName: alloc.supplierOrgName,
      grossSubtotalRwf: alloc.subtotalRwf,
      supplierFeeRwf: payoutCalc.supplierFeeRwf,
      netPayoutRwf: payoutCalc.netPayoutRwf,
      status,
      createdAt: new Date().toISOString(),
    };
  });
}

export function validateSettlementDisbursement(
  settlement: SettlementRecord,
  order: Order,
  actorRole: UserRole
): { success: boolean; error?: string } {
  // Only authorized operations / administrator can disburse settlement funds
  if (actorRole !== UserRole.ADMINISTRATOR) {
    return {
      success: false,
      error: 'Only Cargo Operations administrators can disburse cooperative settlement payouts.',
    };
  }

  // Active dispute strictly pauses settlement (BR-04, FR-DEL-04)
  if (order.hasActiveDispute || order.status === OrderStatus.DISPUTED) {
    return {
      success: false,
      error: 'Settlement disbursement is blocked: An active trade dispute is unresolved.',
    };
  }

  // Delivery acceptance required before settlement can become eligible
  if (order.status !== OrderStatus.ACCEPTED && order.status !== OrderStatus.SETTLED) {
    return {
      success: false,
      error: `Settlement disbursement is blocked: Order must be Accepted by buyer first (current: ${order.status}).`,
    };
  }

  if (settlement.status === 'SETTLED') {
    return {
      success: false,
      error: 'This settlement has already been disbursed.',
    };
  }

  return { success: true };
}
