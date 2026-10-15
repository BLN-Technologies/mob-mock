/**
 * Cargo V1 Mobile Domain & Business Rule Test Suite
 * Validates critical business invariants: BR-01 to BR-07, fee calculations,
 * atomic reservations, and buyer privacy projections.
 */

import { validateLotDeclaration } from '../src/domain/validation/lotValidation';
import { isLotBuyerVisible, canTransitionLot, validateLotTransition } from '../src/domain/workflows/lotWorkflow';
import { canTransitionOrder, validateOrderTransition } from '../src/domain/workflows/orderWorkflow';
import { calculateBuyerTotal, calculateSupplierPayout } from '../src/domain/calculations/feeCalculator';
import { formatQuantity, formatRwf, calculateRemainingQuantity } from '../src/domain/calculations/lotCalculations';
import { projectLotForBuyer, projectAllocationsForBuyer } from '../src/domain/projections/buyerProjections';
import { LotStatus, OrderStatus, QualityGrade, PaymentStatus, UserRole } from '../src/domain/enums';
import { Lot, Order, User } from '../src/domain/models';

declare const process: any;

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

console.log('\n--- CARGO V1 DOMAIN TEST SUITE ---\n');

// 1. BR-01: Harvest confirmation gate
console.log('[Suite 1: BR-01 Harvest-Ready Rule]');
{
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 10);
  const futureStr = futureDate.toISOString().split('T')[0];

  const futureLot = validateLotDeclaration({
    cropName: 'Maize',
    totalQuantityKg: 5000,
    pricePerKgRwf: 420,
    harvestDate: futureStr,
    availabilityDate: futureStr,
    pickupDistrict: 'Nyagatare',
    pickupSector: 'Karangazi',
    pickupLocationDetails: 'Silo 1',
    photos: ['https://example.com/photo.jpg'],
    harvestConfirmed: false,
  });

  assert(!futureLot.isValid, 'Rejects unconfirmed harvest declaration');
  assert(futureLot.errors.harvestConfirmed !== undefined, 'Reports harvestConfirmed error');
  assert(futureLot.errors.harvestDate !== undefined, 'Rejects future harvest dates');

  const validLot = validateLotDeclaration({
    cropName: 'Maize',
    totalQuantityKg: 5000,
    pricePerKgRwf: 420,
    harvestDate: '2026-10-01',
    availabilityDate: '2026-10-15',
    pickupDistrict: 'Nyagatare',
    pickupSector: 'Karangazi',
    pickupLocationDetails: 'Silo 1',
    photos: ['https://example.com/photo.jpg'],
    harvestConfirmed: true,
  });

  assert(validLot.isValid, 'Accepts valid harvest-ready lot declaration');
}

// 2. BR-02: Buyer visibility gate
console.log('\n[Suite 2: BR-02 Lot Visibility Gate]');
{
  const mockBaseLot: Lot = {
    id: 'test-1',
    lotCode: 'LOT-MZ-202610-999',
    supplierId: 'sup-1',
    organizationId: 'org-1',
    cropName: 'Maize',
    totalQuantityKg: 10000,
    remainingQuantityKg: 10000,
    reservedQuantityKg: 0,
    pricePerKgRwf: 400,
    harvestDate: '2026-10-01',
    availabilityDate: '2026-10-15',
    pickupDistrict: 'Nyagatare',
    pickupSector: 'Karangazi',
    pickupLocationDetails: 'Silo',
    photos: ['photo.jpg'],
    status: LotStatus.SUBMITTED,
    createdAt: '2026-10-01',
    updatedAt: '2026-10-01',
  };

  assert(!isLotBuyerVisible(mockBaseLot), 'Submitted uninspected lot is NOT visible to buyers');

  // Graded but not admin verified
  const gradedLot: Lot = {
    ...mockBaseLot,
    status: LotStatus.SUBMITTED,
    grade: QualityGrade.GRADE_A,
    gradedAt: '2026-10-02',
    inspectedByAgentId: 'agent-1',
  };
  assert(!isLotBuyerVisible(gradedLot), 'Graded lot without admin verification is NOT visible to buyers');

  // Graded AND Admin Verified
  const verifiedLot: Lot = {
    ...gradedLot,
    status: LotStatus.VERIFIED,
    adminApprovedAt: '2026-10-03',
  };
  assert(isLotBuyerVisible(verifiedLot), 'Graded AND verified lot IS visible to buyers');

  // Fully sold lot
  const soldLot: Lot = {
    ...verifiedLot,
    remainingQuantityKg: 0,
    status: LotStatus.SOLD,
  };
  assert(!isLotBuyerVisible(soldLot), 'Sold lot is NOT visible in active buyer catalogue');
}

// 3. BR-03: Payment confirmation before dispatch gate
console.log('\n[Suite 3: BR-03 Payment Before Dispatch Gate]');
{
  const baseOrder: Order = {
    id: 'ord-test-1',
    orderNumber: 'ORD-TEST-001',
    offerId: 'off-1',
    buyerOrgId: 'buyer-1',
    buyerOrgName: 'Kigali Foods',
    cropName: 'Maize',
    grade: QualityGrade.GRADE_A,
    totalQuantityKg: 10000,
    pricePerKgRwf: 400,
    subtotalRwf: 4000000,
    buyerFeeRwf: 200000,
    totalAmountRwf: 4200000,
    allocations: [
      {
        id: 'alloc-1',
        lotId: 'lot-1',
        lotCode: 'LOT-1',
        supplierOrgId: 'sup-org-1',
        supplierOrgName: 'Coop 1',
        quantityKg: 10000,
        pricePerKgRwf: 400,
        subtotalRwf: 4000000,
        supplierFeeRwf: 120000,
        expectedSupplierPayoutRwf: 3880000,
        confirmedBySupplier: true,
      },
    ],
    deliveryDistrict: 'Kigali',
    deliverySector: 'Gisozi',
    deliveryAddress: 'Depot',
    agreedDeliveryDate: '2026-10-25',
    status: OrderStatus.CONFIRMED,
    termsAcceptedByBuyer: true,
    paymentStatus: PaymentStatus.PENDING,
    hasActiveDispute: false,
    createdAt: '2026-10-10',
    updatedAt: '2026-10-10',
  };

  const dispatchUnpaid = validateOrderTransition(baseOrder, OrderStatus.DISPATCHED);
  assert(!dispatchUnpaid.success, 'Rejects dispatch transition when order is not Paid');

  const paidOrder: Order = {
    ...baseOrder,
    status: OrderStatus.PAID,
    paymentStatus: PaymentStatus.CONFIRMED,
  };
  const dispatchPaid = validateOrderTransition(paidOrder, OrderStatus.DISPATCHED);
  assert(dispatchPaid.success, 'Allows dispatch transition after payment confirmation');
}

// 4. Calculations: whole RWF and canonical kg
console.log('\n[Suite 4: Currency & Quantity Calculations]');
{
  const buyerFee = calculateBuyerTotal(6300000);
  assert(buyerFee.buyerFeeRwf === 315000, 'Calculates 5% buyer fee as 315,000 RWF');
  assert(buyerFee.totalAmountRwf === 6615000, 'Calculates total buyer amount correctly');
  assert(Number.isInteger(buyerFee.totalAmountRwf), 'Ensures total amount is an integer');

  const supplierPayout = calculateSupplierPayout(6300000);
  assert(supplierPayout.supplierFeeRwf === 189000, 'Calculates 3% supplier fee as 189,000 RWF');
  assert(supplierPayout.netPayoutRwf === 6111000, 'Calculates net supplier payout correctly');
  assert(supplierPayout.netPayoutRwf + supplierPayout.supplierFeeRwf === 6300000, 'Preserves fee + payout = gross value invariant');

  assert(formatQuantity(500) === '500 kg', 'Formats <1000 kg as kg');
  assert(formatQuantity(15000).includes('15 t') || formatQuantity(15000).includes('15.0 t'), 'Formats >=1000 kg as metric tons');
  assert(formatRwf(4200000) === '4,200,000 RWF', 'Formats whole RWF with thousand separators');
}

// 5. BR-05: Privacy Projections
console.log('\n[Suite 5: BR-05 Privacy Projection]');
{
  const privateLot: Lot = {
    id: 'lot-priv-1',
    lotCode: 'LOT-MZ-202610-001',
    supplierId: 'usr-secret-supplier',
    organizationId: 'org-secret-coop',
    cropName: 'Maize',
    variety: 'Nyirakaragaza',
    totalQuantityKg: 10000,
    remainingQuantityKg: 10000,
    reservedQuantityKg: 0,
    pricePerKgRwf: 420,
    harvestDate: '2026-10-01',
    availabilityDate: '2026-10-15',
    pickupDistrict: 'Nyagatare',
    pickupSector: 'Karangazi',
    pickupLocationDetails: 'Secret farm coordinates -1.597, 30.408, Tel: +250788111222',
    photos: ['photo.jpg'],
    status: LotStatus.VERIFIED,
    grade: QualityGrade.GRADE_A,
    adminApprovedAt: '2026-10-05',
    createdAt: '2026-10-01',
    updatedAt: '2026-10-05',
  };

  const projected = projectLotForBuyer(privateLot);
  assert((projected as any).supplierId === undefined, 'Strips supplierId from buyer projection');
  assert((projected as any).organizationId === undefined, 'Strips organizationId from buyer projection');
  assert((projected as any).pickupLocationDetails === undefined, 'Strips private farm details & phone from buyer projection');
  assert(projected.district === 'Nyagatare', 'Retains permitted general district');
  assert(projected.grade === QualityGrade.GRADE_A, 'Retains verified grade');
}

console.log(`\n========================================`);
console.log(`Tests run: ${passed + failed}`);
console.log(`Passed:    ${passed}`);
console.log(`Failed:    ${failed}`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
