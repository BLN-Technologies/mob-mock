import { Lot, WarehouseStockGroup } from '../models';
import { LotStatus, QualityGrade } from '../enums';

/**
 * Aggregates eligible supplier lots into authoritative Central Warehouse Stock groups.
 * Enforces BR-02 (only verified lots), BR-05 (supplier privacy), and strict separation
 * of incompatible grades and varieties.
 */
export function aggregateWarehouseStock(lots: Lot[]): WarehouseStockGroup[] {
  // Filter eligible lots: must be VERIFIED or RESERVED and have an assigned non-reject grade
  const eligibleLots = lots.filter(
    l =>
      (l.status === LotStatus.VERIFIED || l.status === LotStatus.RESERVED) &&
      l.grade &&
      l.grade !== QualityGrade.REJECT &&
      (l.remainingQuantityKg > 0 || (l.reservedQuantityKg || 0) > 0)
  );

  const groupsMap = new Map<string, {
    cropName: string;
    variety?: string;
    cropType: 'PERISHABLE' | 'NON_PERISHABLE';
    grade: QualityGrade;
    totalEligibleQuantityKg: number;
    reservedQuantityKg: number;
    availableToOrderKg: number;
    totalValueRwf: number;
    earliestAvailability: string;
    photos: Set<string>;
    districts: Set<string>;
    contributingLotIds: string[];
  }>();

  for (const lot of eligibleLots) {
    const varietyKey = (lot.variety || 'standard').trim().toLowerCase();
    const cropKey = lot.cropName.trim().toLowerCase();
    const gradeKey = lot.grade!;
    const cropType: 'PERISHABLE' | 'NON_PERISHABLE' = lot.cropType || (
      cropKey.includes('tomato') || cropKey.includes('cabbage') || cropKey.includes('onion') || cropKey.includes('fruit') || cropKey.includes('avocado')
        ? 'PERISHABLE'
        : 'NON_PERISHABLE'
    );

    // Grouping key strictly separates crop, variety, and grade
    const groupKey = `${cropKey}__${varietyKey}__${gradeKey}__${cropType}`;

    let entry = groupsMap.get(groupKey);
    if (!entry) {
      entry = {
        cropName: lot.cropName.trim(),
        variety: lot.variety ? lot.variety.trim() : undefined,
        cropType,
        grade: gradeKey,
        totalEligibleQuantityKg: 0,
        reservedQuantityKg: 0,
        availableToOrderKg: 0,
        totalValueRwf: 0,
        earliestAvailability: lot.availabilityDate,
        photos: new Set<string>(),
        districts: new Set<string>(),
        contributingLotIds: [],
      };
      groupsMap.set(groupKey, entry);
    }

    const reserved = lot.reservedQuantityKg || 0;
    // lot.remainingQuantityKg is unallocated available quantity
    const available = Math.max(0, lot.remainingQuantityKg);
    const totalLotEligible = available + reserved;

    entry.totalEligibleQuantityKg += totalLotEligible;
    entry.reservedQuantityKg += reserved;
    entry.availableToOrderKg += available;
    entry.totalValueRwf += available * lot.pricePerKgRwf;

    if (new Date(lot.availabilityDate).getTime() < new Date(entry.earliestAvailability).getTime()) {
      entry.earliestAvailability = lot.availabilityDate;
    }

    if (lot.photos && Array.isArray(lot.photos)) {
      lot.photos.forEach(p => {
        if (p && p.trim()) entry!.photos.add(p);
      });
    }

    if (lot.pickupDistrict) {
      entry.districts.add(lot.pickupDistrict);
    }

    entry.contributingLotIds.push(lot.id);
  }

  const result: WarehouseStockGroup[] = [];

  for (const [key, data] of groupsMap.entries()) {
    const pricePerKgRwf = data.availableToOrderKg > 0
      ? Math.round(data.totalValueRwf / data.availableToOrderKg)
      : 0;

    const districtList = Array.from(data.districts);
    const hubLocation = districtList.length > 0
      ? `Rwanda Central Warehouse (${districtList.slice(0, 2).join(', ')}${districtList.length > 2 ? ' +' + (districtList.length - 2) : ''})`
      : 'Kigali Central Agricultural Hub';

    result.push({
      id: `stock-${key}`,
      cropName: data.cropName,
      variety: data.variety,
      cropType: data.cropType,
      grade: data.grade,
      totalEligibleQuantityKg: data.totalEligibleQuantityKg,
      reservedQuantityKg: data.reservedQuantityKg,
      availableToOrderKg: data.availableToOrderKg,
      pricePerKgRwf,
      availabilityDate: data.earliestAvailability,
      hubLocation,
      photos: Array.from(data.photos),
      contributingLotsCount: data.contributingLotIds.length,
      contributingLotIds: data.contributingLotIds,
    });
  }

  // Sort by available quantity descending
  return result.sort((a, b) => b.availableToOrderKg - a.availableToOrderKg);
}
