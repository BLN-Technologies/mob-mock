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
  const buyerFeeRwf = Math.round((subtotalRwf * feeSchedule.buyerFeePercent) / 100);
  const totalAmountRwf = subtotalRwf + buyerFeeRwf;
  return {
    buyerFeeRwf,
    totalAmountRwf,
  };
}

export function calculateSupplierPayout(
  allocationSubtotalRwf: number,
  feeSchedule: FeeSchedule = DEFAULT_FEE_SCHEDULE
): { supplierFeeRwf: number; netPayoutRwf: number } {
  const supplierFeeRwf = Math.round((allocationSubtotalRwf * feeSchedule.supplierFeePercent) / 100);
  const netPayoutRwf = allocationSubtotalRwf - supplierFeeRwf;
  return {
    supplierFeeRwf,
    netPayoutRwf,
  };
}
