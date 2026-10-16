/**
 * BR-04: Deterministic fee calculations and financial invariants.
 *
 * Commercial Formula & Rounding Policy:
 * - Currency: Rwandan Franc (RWF) is non-fractional; all amounts are rounded to the nearest whole integer using Math.round.
 * - Buyer Fee: Exactly 5% (default) added to commodity subtotal.
 * - Supplier Fee: Exactly 3% (default) deducted from allocation subtotal.
 * - Invariant: supplierFeeRwf + netPayoutRwf === allocationSubtotalRwf (preserving gross value).
 */

export interface FeeSchedule {
  buyerFeePercent: number; // e.g. 5%
  supplierFeePercent: number; // e.g. 3%
  inspectionFeeRwf: number; // flat fee, e.g. 10000 RWF
}

export const DEFAULT_FEE_SCHEDULE: FeeSchedule = {
  buyerFeePercent: 5,
  supplierFeePercent: 3,
  inspectionFeeRwf: 10000,
};

export function calculateBuyerTotal(
  subtotalRwf: number,
  feeSchedule: FeeSchedule = DEFAULT_FEE_SCHEDULE
): { buyerFeeRwf: number; totalAmountRwf: number } {
  if (typeof subtotalRwf !== 'number' || isNaN(subtotalRwf) || subtotalRwf < 0) {
    return { buyerFeeRwf: 0, totalAmountRwf: 0 };
  }
  const cleanSubtotal = Math.round(subtotalRwf);
  const buyerFeeRwf = Math.round((cleanSubtotal * feeSchedule.buyerFeePercent) / 100);
  const totalAmountRwf = cleanSubtotal + buyerFeeRwf;
  return {
    buyerFeeRwf,
    totalAmountRwf,
  };
}

export function calculateBuyerFee(
  subtotalRwf: number,
  feeSchedule: FeeSchedule = DEFAULT_FEE_SCHEDULE
): { buyerFeeRwf: number; totalBuyerPayableRwf: number } {
  const result = calculateBuyerTotal(subtotalRwf, feeSchedule);
  return {
    buyerFeeRwf: result.buyerFeeRwf,
    totalBuyerPayableRwf: result.totalAmountRwf,
  };
}

export function calculateSupplierPayout(
  allocationSubtotalRwf: number,
  feeSchedule: FeeSchedule = DEFAULT_FEE_SCHEDULE
): { supplierFeeRwf: number; netPayoutRwf: number } {
  if (typeof allocationSubtotalRwf !== 'number' || isNaN(allocationSubtotalRwf) || allocationSubtotalRwf < 0) {
    return { supplierFeeRwf: 0, netPayoutRwf: 0 };
  }
  const cleanSubtotal = Math.round(allocationSubtotalRwf);
  const supplierFeeRwf = Math.round((cleanSubtotal * feeSchedule.supplierFeePercent) / 100);
  const netPayoutRwf = cleanSubtotal - supplierFeeRwf;
  return {
    supplierFeeRwf,
    netPayoutRwf,
  };
}
