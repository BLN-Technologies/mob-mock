import { Lot, BuyerLotProjection, OrderAllocation } from '../models';

export function projectLotForBuyer(lot: Lot): BuyerLotProjection {
  return {
    id: lot.id,
    lotCode: lot.lotCode,
    cropName: lot.cropName,
    variety: lot.variety,
    availableQuantityKg: lot.remainingQuantityKg,
    pricePerKgRwf: lot.pricePerKgRwf,
    grade: lot.grade!,
    availabilityDate: lot.availabilityDate,
    district: lot.pickupDistrict,
    sector: lot.pickupSector,
    harvestDate: lot.harvestDate,
    notes: lot.notes,
    photos: lot.photos,
    status: lot.status,
    verifiedAt: lot.adminApprovedAt || lot.updatedAt,
  };
}

export function projectAllocationsForBuyer(allocations: OrderAllocation[]): {
  lotCode: string;
  quantityKg: number;
  pricePerKgRwf: number;
  subtotalRwf: number;
}[] {
  // Strips supplierOrgName, supplierOrgId, and supplier payout details
  return allocations.map(a => ({
    lotCode: a.lotCode,
    quantityKg: a.quantityKg,
    pricePerKgRwf: a.pricePerKgRwf,
    subtotalRwf: a.subtotalRwf,
  }));
}
