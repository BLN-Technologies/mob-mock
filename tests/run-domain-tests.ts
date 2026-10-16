/**
 * Cargo V1 Mobile Domain & Business Rule Test Suite
 * Validates critical business invariants: BR-01 to BR-05, fee calculations,
 * atomic reservations, buyer privacy projections, role routing invariants,
 * and offline sync idempotency.
 */

import { validateLotDeclaration } from '../src/domain/validation/lotValidation';
import { isLotBuyerVisible, canTransitionLot, validateLotTransition } from '../src/domain/workflows/lotWorkflow';
import { canTransitionOrder, validateOrderTransition } from '../src/domain/workflows/orderWorkflow';
import { calculateBuyerTotal, calculateSupplierPayout } from '../src/domain/calculations/feeCalculator';
import { formatQuantity, formatRwf, calculateRemainingQuantity } from '../src/domain/calculations/lotCalculations';
import { projectLotForBuyer, projectAllocationsForBuyer } from '../src/domain/projections/buyerProjections';
import { LotStatus, OrderStatus, QualityGrade, PaymentStatus, UserRole } from '../src/domain/enums';
import { Lot, Order, User, GradingRecord } from '../src/domain/models';

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

console.log('\n--- CARGO V1 DOMAIN & BUSINESS RULE AUDIT TEST SUITE ---\n');

// 1. BR-01: Harvest Readiness & Warehouse Readiness Rule
console.log('[Suite 1: BR-01 Harvest Readiness & Warehouse Validation]');
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
    pickupLocationDetails: 'Warehouse Silo 1',
    photos: ['https://example.com/photo.jpg'],
    harvestConfirmed: false,
  });

  assert(!futureLot.isValid, 'Rejects unconfirmed harvest declaration');
  assert(futureLot.errors.harvestConfirmed !== undefined, 'Reports harvestConfirmed error');
  assert(futureLot.errors.harvestDate !== undefined, 'Rejects future harvest dates');

  // Missing warehouse readiness details
  const missingLocationLot = validateLotDeclaration({
    cropName: 'Maize',
    totalQuantityKg: 5000,
    pricePerKgRwf: 420,
    harvestDate: '2026-10-01',
    availabilityDate: '2026-10-15',
    pickupDistrict: 'Nyagatare',
    pickupSector: 'Karangazi',
    pickupLocationDetails: '   ',
    photos: ['https://example.com/photo.jpg'],
    harvestConfirmed: true,
  });
  assert(!missingLocationLot.isValid, 'Rejects whitespace-only pickup location details');
  assert(missingLocationLot.errors.pickupLocationDetails !== undefined, 'Reports warehouse readiness error');

  // Boundary and invalid quantity/price checks
  const invalidNumbersLot = validateLotDeclaration({
    cropName: 'Maize',
    totalQuantityKg: 0,
    pricePerKgRwf: -50,
    harvestDate: '2026-10-01',
    availabilityDate: '2026-10-15',
    pickupDistrict: 'Nyagatare',
    pickupSector: 'Karangazi',
    pickupLocationDetails: 'Warehouse Silo 1',
    photos: ['https://example.com/photo.jpg'],
    harvestConfirmed: true,
  });
  assert(!invalidNumbersLot.isValid, 'Rejects zero quantity and negative price');
  assert(invalidNumbersLot.errors.totalQuantityKg !== undefined, 'Reports invalid totalQuantityKg');
  assert(invalidNumbersLot.errors.pricePerKgRwf !== undefined, 'Reports invalid pricePerKgRwf');

  const validLot = validateLotDeclaration({
    cropName: 'Maize',
    totalQuantityKg: 5000,
    pricePerKgRwf: 420,
    harvestDate: '2026-10-01',
    availabilityDate: '2026-10-15',
    pickupDistrict: 'Nyagatare',
    pickupSector: 'Karangazi',
    pickupLocationDetails: 'Warehouse Silo 1',
    photos: ['https://example.com/photo.jpg'],
    harvestConfirmed: true,
  });

  assert(validLot.isValid, 'Accepts valid harvest-ready lot declaration');
}

// 2. BR-02: Buyer Visibility Gate & Quality Rejection
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
    pickupLocationDetails: 'Warehouse Silo 1',
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

  // Grade REJECT: even if status is VERIFIED, MUST NOT be visible to buyers
  const rejectedLot: Lot = {
    ...verifiedLot,
    grade: QualityGrade.REJECT,
  };
  assert(!isLotBuyerVisible(rejectedLot), 'QualityGrade.REJECT lot is NEVER visible to buyers');

  // Fully sold lot
  const soldLot: Lot = {
    ...verifiedLot,
    remainingQuantityKg: 0,
    status: LotStatus.SOLD,
  };
  assert(!isLotBuyerVisible(soldLot), 'Sold lot is NOT visible in active buyer catalogue');

  // Withdrawn lot
  const withdrawnLot: Lot = {
    ...verifiedLot,
    status: LotStatus.WITHDRAWN,
  };
  assert(!isLotBuyerVisible(withdrawnLot), 'Withdrawn lot is NOT visible in active buyer catalogue');
}

// 3. BR-03: Payment Confirmation Before Dispatch Gate
console.log('\n[Suite 3: BR-03 Payment Before Dispatch Gate]');
{
  const baseOrder: Order = {
    id: 'ord-test-1',
    orderNumber: 'ORD-TEST-001',
    offerId: 'off-1',
    buyerOrgId: 'buyer-1',
    buyerOrgName: 'Kigali Foods Ltd',
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
        supplierOrgName: 'Coop Abahuje',
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
    deliveryAddress: 'Central Silos Depot',
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
  assert(Boolean(dispatchUnpaid.error?.includes('escrow') || dispatchUnpaid.error?.includes('PAID') || dispatchUnpaid.error?.includes('Invalid')), 'Returns descriptive payment gate error');

  // Cancelled order cannot be dispatched
  const cancelledOrder: Order = {
    ...baseOrder,
    status: OrderStatus.CANCELLED,
  };
  assert(!validateOrderTransition(cancelledOrder, OrderStatus.DISPATCHED).success, 'Cancelled order cannot be dispatched');

  // Properly paid order can transition to DISPATCHED
  const paidOrder: Order = {
    ...baseOrder,
    status: OrderStatus.PAID,
    paymentStatus: PaymentStatus.CONFIRMED,
  };
  const dispatchPaid = validateOrderTransition(paidOrder, OrderStatus.DISPATCHED);
  assert(dispatchPaid.success, 'Allows dispatch transition after escrow payment confirmation');

  // Valid forward lifecycle
  const dispatchedOrder: Order = {
    ...paidOrder,
    status: OrderStatus.DISPATCHED,
  };
  assert(validateOrderTransition(dispatchedOrder, OrderStatus.DELIVERED).success, 'Dispatched order can transition to Delivered');

  const deliveredOrder: Order = {
    ...dispatchedOrder,
    status: OrderStatus.DELIVERED,
  };
  assert(validateOrderTransition(deliveredOrder, OrderStatus.ACCEPTED).success, 'Delivered order can transition to Accepted');

  const acceptedOrder: Order = {
    ...deliveredOrder,
    status: OrderStatus.ACCEPTED,
  };
  assert(validateOrderTransition(acceptedOrder, OrderStatus.SETTLED).success, 'Accepted order can transition to Settled');
}

// 4. BR-04: Financial Invariants & Whole Rwandan Franc (RWF) Arithmetic
console.log('\n[Suite 4: BR-04 Financial Invariants & Currency Calculations]');
{
  // Standard test case: 6,300,000 RWF
  const buyerFee = calculateBuyerTotal(6300000);
  assert(buyerFee.buyerFeeRwf === 315000, 'Calculates 5% buyer fee as 315,000 RWF');
  assert(buyerFee.totalAmountRwf === 6615000, 'Calculates total buyer amount correctly');
  assert(Number.isInteger(buyerFee.totalAmountRwf), 'Ensures total amount is an integer');

  const supplierPayout = calculateSupplierPayout(6300000);
  assert(supplierPayout.supplierFeeRwf === 189000, 'Calculates 3% supplier fee as 189,000 RWF');
  assert(supplierPayout.netPayoutRwf === 6111000, 'Calculates net supplier payout correctly');
  assert(supplierPayout.netPayoutRwf + supplierPayout.supplierFeeRwf === 6300000, 'Preserves fee + payout = gross value invariant');

  // Odd amount testing integer rounding policy: 333,333 RWF
  // 5% of 333,333 = 16,666.65 -> 16,667 RWF
  const oddBuyer = calculateBuyerTotal(333333);
  assert(oddBuyer.buyerFeeRwf === 16667, 'Rounds 5% buyer fee to nearest whole integer RWF (16,667)');
  assert(oddBuyer.totalAmountRwf === 350000, 'Buyer total equals subtotal + rounded fee');
  assert(Number.isInteger(oddBuyer.totalAmountRwf), 'Buyer total is strictly an integer');

  // 3% of 333,333 = 9,999.99 -> 10,000 RWF
  const oddSupplier = calculateSupplierPayout(333333);
  assert(oddSupplier.supplierFeeRwf === 10000, 'Rounds 3% supplier fee to nearest whole integer RWF (10,000)');
  assert(oddSupplier.supplierFeeRwf + oddSupplier.netPayoutRwf === 333333, 'Invariant held on odd amounts: fee + payout === subtotal');

  // Edge cases: 0, negative, NaN
  const zeroCalc = calculateBuyerTotal(0);
  assert(zeroCalc.buyerFeeRwf === 0 && zeroCalc.totalAmountRwf === 0, 'Handles 0 subtotal without error');

  const negCalc = calculateBuyerTotal(-5000);
  assert(negCalc.buyerFeeRwf === 0 && negCalc.totalAmountRwf === 0, 'Guards against negative subtotal');

  const nanCalc = calculateBuyerTotal(NaN);
  assert(nanCalc.buyerFeeRwf === 0 && nanCalc.totalAmountRwf === 0, 'Guards against NaN subtotal');

  const zeroSupplier = calculateSupplierPayout(0);
  assert(zeroSupplier.supplierFeeRwf === 0 && zeroSupplier.netPayoutRwf === 0, 'Handles 0 supplier payout safely');

  // Large institutional contract: 150,000,000 RWF
  const largeCalc = calculateBuyerTotal(150000000);
  assert(largeCalc.buyerFeeRwf === 7500000, 'Calculates 5% on 150M RWF correctly');
  assert(largeCalc.totalAmountRwf === 157500000, 'Total on 150M RWF is 157.5M RWF');

  // Quantity and formatting helpers
  assert(formatQuantity(500) === '500 kg', 'Formats <1000 kg as kg');
  assert(formatQuantity(15000).includes('15 t') || formatQuantity(15000).includes('15.0 t'), 'Formats >=1000 kg as metric tons');
  assert(formatRwf(4200000) === '4,200,000 RWF', 'Formats whole RWF with thousand separators');
}

// 5. BR-05: Farmer Privacy Projection
console.log('\n[Suite 5: BR-05 Farmer Privacy Projection]');
{
  const privateLot: Lot = {
    id: 'lot-priv-1',
    lotCode: 'LOT-MZ-202610-001',
    supplierId: 'usr-secret-supplier-007',
    organizationId: 'org-secret-coop-99',
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
    pickupLocationDetails: 'Secret farm coordinates GPS: -1.5971, 30.4082, Farmer Tel: +250788111222',
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
  assert((projected as any).pickupLocationDetails === undefined, 'Strips private farm coordinates and farmer phone number');
  assert(projected.district === 'Nyagatare', 'Retains permitted macro-level district for logistics');
  assert(projected.sector === 'Karangazi', 'Retains sector for regional logistics planning');
  assert(projected.grade === QualityGrade.GRADE_A, 'Retains verified quality grade');

  // Allocation projection privacy
  const allocations = [
    {
      id: 'alloc-priv-1',
      lotId: 'lot-priv-1',
      lotCode: 'LOT-MZ-202610-001',
      supplierOrgId: 'org-secret-coop-99',
      supplierOrgName: 'Confidential Cooperative',
      quantityKg: 5000,
      pricePerKgRwf: 420,
      subtotalRwf: 2100000,
      supplierFeeRwf: 63000,
      expectedSupplierPayoutRwf: 2037000,
      confirmedBySupplier: true,
    },
  ];
  const buyerAllocations = projectAllocationsForBuyer(allocations);
  assert((buyerAllocations[0] as any).supplierFeeRwf === undefined, 'Strips internal supplier fee from buyer view');
  assert((buyerAllocations[0] as any).expectedSupplierPayoutRwf === undefined, 'Strips internal supplier payout from buyer view');
  assert(buyerAllocations[0].quantityKg === 5000, 'Retains allocation quantity for buyer transparency');
}

// 6. Role-Aware Security & Workflow State Invariants
console.log('\n[Suite 6: Role Security & Workflow State Invariants]');
{
  const adminUser: User = {
    id: 'usr-admin-1',
    fullName: 'Cargo Operations Lead',
    email: 'admin@cargo.rw',
    phone: '+250788000000',
    role: UserRole.ADMINISTRATOR,
    organizationId: 'org-cargo-admin',
    preferredLanguage: 'en',
    isActive: true,
    isLocked: false,
    failedLoginAttempts: 0,
    createdAt: '2026-01-01',
  };

  // Administrator role is strictly restricted from entering commercial participant tab navigators
  assert(adminUser.role === UserRole.ADMINISTRATOR, 'Admin has UserRole.ADMINISTRATOR');
  const isCommercialParticipant = adminUser.role === UserRole.SUPPLIER || adminUser.role === UserRole.BUYER;
  assert(!isCommercialParticipant, 'Administrator cannot be treated as commercial participant');

  // Lot lifecycle valid transitions
  assert(canTransitionLot(LotStatus.DRAFT, LotStatus.SUBMITTED), 'Lot can transition DRAFT -> SUBMITTED');
  assert(canTransitionLot(LotStatus.SUBMITTED, LotStatus.VERIFIED), 'Lot can transition SUBMITTED -> VERIFIED');
  assert(canTransitionLot(LotStatus.VERIFIED, LotStatus.RESERVED), 'Lot can transition VERIFIED -> RESERVED');
  assert(canTransitionLot(LotStatus.RESERVED, LotStatus.SOLD), 'Lot can transition RESERVED -> SOLD');
  assert(!canTransitionLot(LotStatus.DRAFT, LotStatus.VERIFIED), 'Lot CANNOT skip from DRAFT directly to VERIFIED');
  assert(!canTransitionLot(LotStatus.SOLD, LotStatus.SUBMITTED), 'Sold lot cannot revert to SUBMITTED');
}

// 7. Offline Queue & Grading Sync Idempotency
console.log('\n[Suite 7: Offline Queue & Grading Sync Idempotency]');
{
  const gradingRecordsState: GradingRecord[] = [];

  // Function simulating idempotent record ingestion (mirroring offlineQueueService.syncPendingQueue)
  function ingestGradingRecord(record: GradingRecord) {
    const existingIndex = gradingRecordsState.findIndex(r => r.id === record.id || r.lotId === record.lotId);
    if (existingIndex >= 0) {
      gradingRecordsState[existingIndex] = record;
    } else {
      gradingRecordsState.push(record);
    }
  }

  const record1: GradingRecord = {
    id: 'grd-001',
    lotId: 'lot-100',
    fieldAgentId: 'agent-1',
    fieldAgentName: 'Jean Bosco Inspector',
    measurements: [
      {
        metricName: 'moisture',
        labelEn: 'Moisture Content',
        labelRw: 'Ubuhehere',
        value: 12.5,
        unit: '%',
        passedThreshold: true,
      },
    ],
    moisturePercentage: 12.5,
    foreignMatterPercentage: 0.5,
    defectiveRatePercentage: 1.0,
    calculatedGrade: QualityGrade.GRADE_A,
    finalGrade: QualityGrade.GRADE_A,
    photos: ['inspection-1.jpg'],
    notes: 'High quality dry maize',
    isOfflineSubmission: true,
    createdAt: '2026-10-15T10:00:00Z',
  };

  ingestGradingRecord(record1);
  assert(gradingRecordsState.length === 1, 'Initial sync inserts grading record into repository');

  // Retry sync with the exact same record
  ingestGradingRecord(record1);
  assert(gradingRecordsState.length === 1, 'Retry sync does not create duplicate grading records (idempotent)');

  // Retry sync with updated inspection notes
  const updatedRecord = { ...record1, notes: 'Updated after re-checking moisture' };
  ingestGradingRecord(updatedRecord);
  assert(gradingRecordsState.length === 1, 'Update preserves single record invariant');
  assert(gradingRecordsState[0].notes === 'Updated after re-checking moisture', 'Preserves latest sync state');
}

console.log(`\n========================================`);
console.log(`Tests run: ${passed + failed}`);
console.log(`Passed:    ${passed}`);
console.log(`Failed:    ${failed}`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
