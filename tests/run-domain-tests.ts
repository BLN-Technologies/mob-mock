/**
 * Cargo V1 Mobile Domain & Business Rule Test Suite
 * Validates critical business invariants: BR-01 to BR-05, fee calculations,
 * atomic reservations, buyer privacy projections, role routing invariants,
 * offline sync idempotency, and Phase 2 authentication & session lifecycle.
 */

import { validateLotDeclaration } from '../src/domain/validation/lotValidation';
import { isLotBuyerVisible, canTransitionLot, validateLotTransition } from '../src/domain/workflows/lotWorkflow';
import { canTransitionOrder, validateOrderTransition } from '../src/domain/workflows/orderWorkflow';
import { canTransitionOffer, validateOfferTransition, validateOfferStockAvailability } from '../src/domain/workflows/offerWorkflow';
import { createSettlementsFromOrder, validateSettlementDisbursement } from '../src/domain/workflows/settlementWorkflow';
import { calculateBuyerTotal, calculateBuyerFee, calculateSupplierPayout, DEFAULT_FEE_SCHEDULE } from '../src/domain/calculations/feeCalculator';
import { formatQuantity, formatRwf, calculateRemainingQuantity } from '../src/domain/calculations/lotCalculations';
import { projectLotForBuyer, projectAllocationsForBuyer } from '../src/domain/projections/buyerProjections';
import { LotStatus, OrderStatus, QualityGrade, PaymentStatus, UserRole, VerificationStatus, OfferStatus, DisputeStatus, DisputeOutcome, PaymentMethod, SyncStatus, SyncErrorCategory } from '../src/domain/enums';
import { Lot, Order, User, Organization, GradingRecord, Offer, SettlementRecord, Dispute, OfflineQueueItem, InspectionDraft } from '../src/domain/models';
import { resolveAuthenticatedRoute, canAccessDestination } from '../src/core/navigation/routingPolicy';
import { authService, normalizeRwandanPhone, isValidEmail, mockState, lotService, gradingService, adminApprovalService, offerService, orderService, disputeService, settlementService, offlineQueueService, warehouseService } from '../src/services/mock/mockServices';
import { aggregateWarehouseStock } from '../src/domain/projections/warehouseStock';
import { RWANDA_DISTRICTS } from '../src/data/locations/rwandaLocations';
import { SEED_USERS } from '../src/services/mock/seedData';
import { inspectionRepository } from '../src/data/local/inspectionRepository';
import { syncCoordinator } from '../src/services/sync/syncCoordinator';
import { mockSyncAdapter } from '../src/services/sync/syncAdapter';
import { localStorage } from '../src/data/local/storage';
import { config, isDemoEnvironment } from '../src/core/config/env';
import { logger } from '../src/core/logging/logger';
import { normalizeError, ErrorCode, AppError } from '../src/core/errors/appError';

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

async function runAllTests() {
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
    const buyerFee = calculateBuyerTotal(6300000);
    assert(buyerFee.buyerFeeRwf === 315000, 'Calculates 5% buyer fee as 315,000 RWF');
    assert(buyerFee.totalAmountRwf === 6615000, 'Calculates total buyer amount correctly');
    assert(Number.isInteger(buyerFee.totalAmountRwf), 'Ensures total amount is an integer');

    const supplierPayout = calculateSupplierPayout(6300000);
    assert(supplierPayout.supplierFeeRwf === 189000, 'Calculates 3% supplier fee as 189,000 RWF');
    assert(supplierPayout.netPayoutRwf === 6111000, 'Calculates net supplier payout correctly');
    assert(supplierPayout.netPayoutRwf + supplierPayout.supplierFeeRwf === 6300000, 'Preserves fee + payout = gross value invariant');

    // Odd amount testing integer rounding policy: 333,333 RWF
    const oddBuyer = calculateBuyerTotal(333333);
    assert(oddBuyer.buyerFeeRwf === 16667, 'Rounds 5% buyer fee to nearest whole integer RWF (16,667)');
    assert(oddBuyer.totalAmountRwf === 350000, 'Buyer total equals subtotal + rounded fee');
    assert(Number.isInteger(oddBuyer.totalAmountRwf), 'Buyer total is strictly an integer');

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

    ingestGradingRecord(record1);
    assert(gradingRecordsState.length === 1, 'Retry sync does not create duplicate grading records (idempotent)');

    const updatedRecord = { ...record1, notes: 'Updated after re-checking moisture' };
    ingestGradingRecord(updatedRecord);
    assert(gradingRecordsState.length === 1, 'Update preserves single record invariant');
    assert(gradingRecordsState[0].notes === 'Updated after re-checking moisture', 'Preserves latest sync state');
  }

  // 8. Phase 2: Authentication Service & Session Operations
  console.log('\n[Suite 8: Phase 2 Authentication & Session Operations]');
  {
    // Seed logins
    const supplierLogin = await authService.login('+250788111222');
    assert(supplierLogin.user.role === UserRole.SUPPLIER, 'Logs in seed supplier by phone');
    assert(supplierLogin.requiresOtp === true, 'Requires simulated OTP verification in prototype');

    const emailLogin = await authService.login('jean.coop@cargo.rw');
    assert(emailLogin.user.id === 'usr-supplier-01', 'Logs in seed supplier by email');

    const normalizedLogin = await authService.login('0788111222');
    assert(normalizedLogin.user.id === 'usr-supplier-01', 'Normalizes 0788... phone to +250788...');

    // Unknown credentials
    try {
      await authService.login('+250788999999');
      assert(false, 'Should throw on unknown credentials');
    } catch (err: any) {
      assert(err.message.includes('not found'), 'Rejects unknown credentials with descriptive error');
    }

    // Session restoration
    const restored = await authService.restoreSession();
    assert(restored.isValid === true && restored.user?.id === 'usr-supplier-01', 'Restores active valid session from storage');

    // Logout & Session Clearing
    await authService.logout();
    const currentUser = await authService.getCurrentUser();
    assert(currentUser === null, 'Clears current user on logout');

    const postLogoutRestored = await authService.restoreSession();
    assert(postLogoutRestored.isValid === false, 'Session restoration returns invalid after logout');
  }

  // 9. Phase 2: Role-Aware Registration & Phone Normalization
  console.log('\n[Suite 9: Phase 2 Registration & Form Validation]');
  {
    assert(normalizeRwandanPhone('0788123456') === '+250788123456', 'Normalizes 07... to +250...');
    assert(normalizeRwandanPhone('788123456') === '+250788123456', 'Normalizes 7... (9 digits) to +250...');
    assert(normalizeRwandanPhone('+250788123456') === '+250788123456', 'Preserves canonical +250...');

    assert(isValidEmail('buyer@procurement.rw'), 'Validates correct email format');
    assert(!isValidEmail('invalid-email-address'), 'Rejects invalid email format');

    // Supplier Registration
    const newSupplier = await authService.registerSupplier({
      fullName: 'Emmanuel Habimana',
      phone: '0788777888',
      organizationName: 'Koperative Dutezimbere Ubuhinzi',
      district: 'Nyagatare',
      sector: 'Karangazi',
      password: 'password123',
    });

    assert(newSupplier.user.role === UserRole.SUPPLIER, 'Registers new supplier user');
    assert(newSupplier.user.onboardingCompleted === false, 'New supplier starts with onboardingCompleted: false');
    assert(newSupplier.organization?.verificationStatus === VerificationStatus.PENDING, 'New cooperative starts with VerificationStatus.PENDING');

    // Duplicate Supplier Phone rejection
    try {
      await authService.registerSupplier({
        fullName: 'Another Person',
        phone: '0788777888',
        organizationName: 'Another Coop',
        district: 'Huye',
      });
      assert(false, 'Should reject duplicate supplier phone');
    } catch (err: any) {
      assert(err.message.includes('already exists'), 'Rejects duplicate phone number registration');
    }

    // Buyer Registration
    const newBuyer = await authService.registerBuyer({
      fullName: 'Diane Uwase',
      phone: '0788444555',
      enterpriseName: 'Kigali Mills Ltd',
      district: 'Gasabo (Kigali)',
      email: 'diane@kigalimills.rw',
      password: 'password123',
    });

    assert(newBuyer.user.role === UserRole.BUYER, 'Registers new institutional buyer user');
    assert(newBuyer.user.email === 'diane@kigalimills.rw', 'Saves buyer email address');
    assert(newBuyer.user.onboardingCompleted === false, 'New buyer starts with onboardingCompleted: false');

    // Duplicate Buyer Email rejection
    try {
      await authService.registerBuyer({
        fullName: 'Second Buyer',
        phone: '0788999888',
        enterpriseName: 'Second Mills',
        district: 'Kicukiro (Kigali)',
        email: 'diane@kigalimills.rw',
      });
      assert(false, 'Should reject duplicate buyer email');
    } catch (err: any) {
      assert(err.message.includes('already exists'), 'Rejects duplicate email registration');
    }
  }

  // 10. Phase 2: Field Agent Invitation Lifecycle & Single-Use Enforcement
  console.log('\n[Suite 10: Authorized Agent Invitation Lifecycle]');
  {
    // Valid invitation
    const activeInvite = await authService.validateAgentInvitation('AGENT-2026-RW');
    assert(activeInvite.status === 'ACTIVE', 'Validates active agent invitation code');
    assert(activeInvite.district === 'Nyagatare', 'Returns assigned district from invitation fixture');

    // Empty invitation
    try {
      await authService.validateAgentInvitation('');
      assert(false, 'Should reject empty invite code');
    } catch (err: any) {
      assert(err.message.includes('enter your invitation code'), 'Rejects empty invitation code');
    }

    // Invalid invitation
    try {
      await authService.validateAgentInvitation('UNKNOWN-CODE-999');
      assert(false, 'Should reject unknown invite code');
    } catch (err: any) {
      assert(err.message.includes('Invalid invitation code'), 'Rejects unassigned invitation code');
    }

    // Expired invitation
    try {
      await authService.validateAgentInvitation('AGENT-EXP-2025');
      assert(false, 'Should reject expired invite code');
    } catch (err: any) {
      assert(err.message.includes('expired'), 'Rejects expired invitation code');
    }

    // Already-used invitation
    try {
      await authService.validateAgentInvitation('AGENT-USED-999');
      assert(false, 'Should reject used invite code');
    } catch (err: any) {
      assert(err.message.includes('already been redeemed'), 'Rejects already-used invitation code');
    }

    // Redeem active invitation INV-AG-HUYE
    const agentReg = await authService.registerFieldAgentWithInvite({
      code: 'INV-AG-HUYE',
      fullName: 'Patrick Gasore',
      phone: '0788666777',
      nationalId: '1199080011223344',
      password: 'password123',
    });

    assert(agentReg.user.role === UserRole.FIELD_AGENT, 'Creates authenticated field agent');
    assert(agentReg.user.agentAssignment?.district === 'Huye', 'Binds assigned district from invitation');
    assert(agentReg.user.agentAssignment?.sector === 'Ngoma', 'Binds assigned sector from invitation');

    // Single-use enforcement: Attempting to redeem INV-AG-HUYE a second time MUST fail
    try {
      await authService.registerFieldAgentWithInvite({
        code: 'INV-AG-HUYE',
        fullName: 'Impostor Agent',
        phone: '0788555444',
        nationalId: '1199080099887766',
      });
      assert(false, 'Should reject second redemption of single-use invite');
    } catch (err: any) {
      assert(err.message.includes('already been redeemed'), 'Enforces single-use invite constraint on retry');
    }
  }

  // 11. Phase 2: Centralized Role- & Status-Aware Routing Policy
  console.log('\n[Suite 11: Centralized Role- & Status-Aware Routing Policy]');
  {
    // Unauthenticated
    assert(resolveAuthenticatedRoute(null).destination === 'WELCOME', 'Null user routes to WELCOME');

    // Locked or suspended accounts
    const lockedUser: User = {
      id: 'usr-locked',
      fullName: 'Locked User',
      phone: '+250788000001',
      email: 'locked@cargo.rw',
      role: UserRole.SUPPLIER,
      organizationId: 'org-1',
      preferredLanguage: 'rw',
      isActive: true,
      isLocked: true,
      failedLoginAttempts: 5,
      createdAt: '2026-01-01',
    };
    assert(resolveAuthenticatedRoute(lockedUser).destination === 'UNAUTHORIZED', 'Locked account routes to UNAUTHORIZED');

    // Administrator
    const adminUser: User = {
      id: 'usr-admin',
      fullName: 'Admin User',
      phone: '+250788000002',
      email: 'admin@cargo.rw',
      role: UserRole.ADMINISTRATOR,
      organizationId: 'org-cargo-admin',
      preferredLanguage: 'en',
      isActive: true,
      isLocked: false,
      failedLoginAttempts: 0,
      createdAt: '2026-01-01',
    };
    assert(resolveAuthenticatedRoute(adminUser).destination === 'ADMIN_HANDOFF', 'Administrator routes strictly to ADMIN_HANDOFF');

    // Supplier onboarding pending vs complete
    const pendingSupplier: User = {
      id: 'usr-sup-new',
      fullName: 'New Supplier',
      phone: '+250788000003',
      email: 'sup@cargo.rw',
      role: UserRole.SUPPLIER,
      organizationId: 'org-sup-1',
      preferredLanguage: 'rw',
      isActive: true,
      isLocked: false,
      failedLoginAttempts: 0,
      onboardingCompleted: false,
      createdAt: '2026-01-01',
    };
    assert(resolveAuthenticatedRoute(pendingSupplier).destination === 'ONBOARDING_SUPPLIER', 'Incomplete onboarding supplier routes to ONBOARDING_SUPPLIER');

    const completedSupplier: User = {
      ...pendingSupplier,
      onboardingCompleted: true,
    };
    const supRoute = resolveAuthenticatedRoute(completedSupplier);
    assert(supRoute.destination === 'SUPPLIER_WORKSPACE' && supRoute.initialTab === 'home', 'Completed onboarding supplier routes to SUPPLIER_WORKSPACE');

    // Buyer onboarding pending vs complete
    const pendingBuyer: User = {
      ...pendingSupplier,
      id: 'usr-buy-new',
      role: UserRole.BUYER,
      onboardingCompleted: false,
    };
    assert(resolveAuthenticatedRoute(pendingBuyer).destination === 'ONBOARDING_BUYER', 'Incomplete onboarding buyer routes to ONBOARDING_BUYER');

    const completedBuyer: User = {
      ...pendingBuyer,
      onboardingCompleted: true,
    };
    const buyRoute = resolveAuthenticatedRoute(completedBuyer);
    assert(buyRoute.destination === 'BUYER_WORKSPACE' && buyRoute.initialTab === 'catalogue', 'Completed onboarding buyer routes to BUYER_WORKSPACE');

    // Agent onboarding pending vs complete
    const pendingAgent: User = {
      ...pendingSupplier,
      id: 'usr-agt-new',
      role: UserRole.FIELD_AGENT,
      onboardingCompleted: false,
    };
    assert(resolveAuthenticatedRoute(pendingAgent).destination === 'ONBOARDING_AGENT', 'Incomplete onboarding agent routes to ONBOARDING_AGENT');

    const completedAgent: User = {
      ...pendingAgent,
      onboardingCompleted: true,
    };
    const agtRoute = resolveAuthenticatedRoute(completedAgent);
    assert(agtRoute.destination === 'AGENT_WORKSPACE' && agtRoute.initialTab === 'tasks', 'Completed onboarding agent routes to AGENT_WORKSPACE');

    // Access control guards
    assert(canAccessDestination('SUPPLIER_WORKSPACE', completedSupplier), 'Supplier can access SUPPLIER_WORKSPACE');
    assert(!canAccessDestination('SUPPLIER_WORKSPACE', completedBuyer), 'Buyer CANNOT access SUPPLIER_WORKSPACE');
    assert(!canAccessDestination('BUYER_WORKSPACE', completedSupplier), 'Supplier CANNOT access BUYER_WORKSPACE');
    assert(!canAccessDestination('AGENT_WORKSPACE', completedSupplier), 'Supplier CANNOT access AGENT_WORKSPACE');
    assert(!canAccessDestination('SUPPLIER_WORKSPACE', null), 'Unauthenticated user CANNOT access SUPPLIER_WORKSPACE');
  }

  // 12. Phase 2: Onboarding State Transitions & Profile Updates
  console.log('\n[Suite 12: Onboarding Completion & Profile Management]');
  {
    // Register temporary supplier
    const sup = await authService.registerSupplier({
      fullName: 'Koperative Test Onboarding',
      phone: '0788123999',
      organizationName: 'Test Coop',
      district: 'Bugesera',
    });
    assert(sup.user.onboardingCompleted === false, 'Starts as onboarding incomplete');

    const statusBefore = await authService.getOnboardingStatus(sup.user);
    assert(statusBefore.onboardingCompleted === false, 'getOnboardingStatus reports false before completion');
    assert(statusBefore.pendingRequirements.length > 0, 'Lists pending requirements');

    // Complete onboarding transition
    const completedUser = await authService.completeOnboarding(sup.user.id);
    assert(completedUser.onboardingCompleted === true, 'completeOnboarding transitions onboardingCompleted to true');

    const statusAfter = await authService.getOnboardingStatus(completedUser);
    assert(statusAfter.onboardingCompleted === true, 'getOnboardingStatus reports true after completion');

    // Profile update
    const updated = await authService.updateProfile(sup.user.id, {
      fullName: 'Updated Cooperative Lead',
      preferredLanguage: 'en',
    });
    assert(updated.fullName === 'Updated Cooperative Lead', 'Updates profile full name');
    assert(updated.preferredLanguage === 'en', 'Updates preferred language');
  }

  function createTestUser(overrides: Partial<User> & { id: string; role: UserRole; organizationId: string }): User {
    return {
      fullName: 'Test User',
      phone: '+250788111222',
      email: 'test@cargo.rw',
      preferredLanguage: 'en',
      isActive: true,
      isLocked: false,
      failedLoginAttempts: 0,
      onboardingCompleted: true,
      verificationStatus: VerificationStatus.VERIFIED,
      createdAt: new Date().toISOString(),
      ...overrides,
    };
  }

  // 13. Phase 3: Administrative Approval & Buyer Visibility Decoupling (BR-02)
  console.log('\n[Suite 13: Administrative Approval & Buyer Visibility Decoupling (BR-02)]');
  {
    await mockState.resetAll();

    const supplierUser = createTestUser({
      id: 'usr-sup-test-p3',
      fullName: 'Jean Bosco Test',
      phone: '+250788111222',
      email: 'jean@coop.rw',
      role: UserRole.SUPPLIER,
      organizationId: 'org-supplier-01',
    });

    const agentUser = createTestUser({
      id: 'usr-agent-test-p3',
      fullName: 'Patrick Gasore Inspector',
      phone: '+250788333444',
      email: 'patrick@cargo.rw',
      role: UserRole.FIELD_AGENT,
      organizationId: 'org-cargo-rw',
      agentAssignment: {
        district: 'Nyagatare',
        sector: 'Karangazi',
        supervisorName: 'Cargo Agronomy Operations',
      },
    });

    const adminUser = createTestUser({
      id: 'usr-admin-p3',
      fullName: 'Cargo Ops Administrator',
      phone: '+250788000111',
      email: 'ops@cargo.rw',
      role: UserRole.ADMINISTRATOR,
      organizationId: 'org-cargo-admin',
    });

    // 1. Supplier creates harvest lot
    const lot = await lotService.createLot({
      cropName: 'Maize',
      variety: 'Nyirakaragaza (White)',
      totalQuantityKg: 12000,
      pricePerKgRwf: 410,
      harvestDate: '2026-10-01',
      availabilityDate: '2026-10-15',
      pickupDistrict: 'Nyagatare',
      pickupSector: 'Karangazi',
      pickupLocationDetails: 'Solar Silo 3, Karangazi Agro Facility',
      harvestConfirmed: true,
      photos: ['https://example.com/photo1.jpg'],
    }, supplierUser);

    assert(lot.status === LotStatus.SUBMITTED, 'Declared lot starts in SUBMITTED state');
    assert(!isLotBuyerVisible(lot), 'Declared lot is NOT visible in buyer catalogue (BR-02)');

    // 2. Field Agent inspects lot
    const grading = await gradingService.submitGrading(
      lot.id,
      agentUser,
      { moisture: 13.0, foreignMatter: 0.9, defects: 1.8 },
      ['https://example.com/inspection.jpg'],
      'High grade grain, moisture optimal'
    );

    assert(grading.finalGrade === QualityGrade.GRADE_A, 'Calculates Grade A based on threshold criteria');
    assert(lot.grade === QualityGrade.GRADE_A, 'Lot record reflects assigned QualityGrade');
    assert(lot.inspectedByAgentId === agentUser.id, 'Lot references authorized field inspector');
    assert(!lot.adminApprovedAt, 'Inspection does NOT fabricate administrative approval (BR-02 decoupled)');
    assert(!isLotBuyerVisible(lot), 'Graded lot without admin approval remains invisible to buyers');

    // Safe denial on direct buyer retrieval
    const directBuyerFetch = await lotService.getBuyerLotById(lot.id);
    assert(directBuyerFetch === undefined, 'Direct buyer fetch of unapproved lot safely returns undefined');

    // Pending lots query for admin operations
    const pendingReviewLots = await adminApprovalService.getPendingLots();
    assert(pendingReviewLots.some(l => l.id === lot.id), 'Graded lot appears in administrative review queue');

    // Non-admin cannot approve lot
    try {
      await adminApprovalService.approveLot(lot.id, supplierUser);
      assert(false, 'Should reject approval by non-administrator');
    } catch (err: any) {
      assert(err.message.includes('Only an authorized Cargo Administrator'), 'Guards admin approval authorization');
    }

    // Authorized admin approves lot
    const approvedLot = await adminApprovalService.approveLot(lot.id, adminUser);
    assert(approvedLot.status === LotStatus.VERIFIED, 'Transitions lot to VERIFIED upon admin approval');
    assert(!!approvedLot.adminApprovedAt, 'Records administrative verification timestamp');
    assert(isLotBuyerVisible(approvedLot), 'Lot is now visible to buyers after grading AND admin verification (BR-02)');

    // Now direct buyer fetch succeeds with privacy projection
    const buyerLot = await lotService.getBuyerLotById(lot.id);
    assert(buyerLot !== undefined, 'Direct buyer fetch succeeds for approved lot');
    assert((buyerLot as any).supplierId === undefined, 'Privacy: Strips supplierId from buyer view (BR-05)');
    assert((buyerLot as any).pickupLocationDetails === undefined, 'Privacy: Strips private warehouse details (BR-05)');
    assert(buyerLot?.district === 'Nyagatare', 'Retains regional district for logistics planning');
  }

  // 14. Phase 3: Buyer Offer Negotiation, Atomic Stock Reservation & Order Creation
  console.log('\n[Suite 14: Buyer Offer Negotiation, Atomic Stock Reservation & Order Confirmation]');
  {
    const buyerUser = createTestUser({
      id: 'usr-buyer-p3',
      fullName: 'David Gasana Buyer',
      phone: '+250788555666',
      email: 'david@kigalifoods.rw',
      role: UserRole.BUYER,
      organizationId: 'org-buyer-01',
    });

    const supplierUser = createTestUser({
      id: 'usr-supplier-01',
      fullName: 'Twizamure Cooperative Lead',
      phone: '+250788111222',
      email: 'twizamure@coop.rw',
      role: UserRole.SUPPLIER,
      organizationId: 'org-supplier-01',
    });

    // Use seed lot lot-001 (Maize, 15,000 kg, verified and approved)
    const seedLot = (await lotService.getLotById('lot-001'))!;
    assert(seedLot && isLotBuyerVisible(seedLot), 'Seed lot-001 is active and buyer-visible');

    // Reject offer exceeding available quantity
    try {
      await offerService.createOffer(buyerUser, {
        lotId: seedLot.id,
        quantityKg: 20000, // available is 15000
        deliveryDistrict: 'Kigali (Gasabo)',
        deliveryDate: '2026-10-25',
      });
      assert(false, 'Should reject offer exceeding available quantity');
    } catch (err: any) {
      assert(err.message.includes('exceeds remaining available stock'), 'Rejects offer exceeding remaining lot quantity');
    }

    // Reject non-buyer creating offer
    try {
      await offerService.createOffer(supplierUser, {
        lotId: seedLot.id,
        quantityKg: 5000,
        deliveryDistrict: 'Kigali (Gasabo)',
        deliveryDate: '2026-10-25',
      });
      assert(false, 'Should reject offer created by supplier');
    } catch (err: any) {
      assert(err.message.includes('Only authorized institutional buyers'), 'Guards offer creation role permissions');
    }

    // Buyer creates valid purchase offer
    const offer = await offerService.createOffer(buyerUser, {
      lotId: seedLot.id,
      quantityKg: 6000,
      unitPriceRwf: 400,
      deliveryDistrict: 'Kigali (Gasabo)',
      deliveryDate: '2026-10-25',
      notes: 'Initial institutional procurement offer',
    });

    assert(offer.status === OfferStatus.PROPOSED, 'Offer created in PROPOSED status');
    assert(offer.subtotalRwf === 2400000, 'Subtotal is 6000 kg * 400 RWF = 2,400,000 RWF');
    assert(offer.platformFeeRwf === 120000, '5% Buyer platform fee is 120,000 RWF (BR-04)');
    assert(offer.totalPriceRwf === 2520000, 'Total buyer payable is 2,520,000 RWF (subtotal + fee)');

    // Supplier counters offer price
    const counteredOffer = await offerService.respondToOffer(
      offer.id,
      'COUNTER',
      'Can meet at 415 RWF/kg for premium Grade A',
      415,
      supplierUser
    );
    assert(counteredOffer.status === OfferStatus.COUNTERED, 'Transitions offer to COUNTERED status');
    assert(counteredOffer.negotiationTimeline.length === 2, 'Timeline records proposal and counteroffer entries');

    // Buyer accepts counteroffer
    const initialRemaining = seedLot.remainingQuantityKg;
    const initialReserved = seedLot.reservedQuantityKg;

    const acceptedOffer = await offerService.respondToOffer(
      offer.id,
      'ACCEPT',
      'Agreed at 415 RWF/kg',
      undefined,
      buyerUser
    );

    assert(acceptedOffer.status === OfferStatus.ACCEPTED, 'Transitions offer to ACCEPTED');
    assert(seedLot.remainingQuantityKg === initialRemaining - 6000, 'Atomically decrements remaining lot quantity');
    assert(seedLot.reservedQuantityKg === initialReserved + 6000, 'Atomically increments reserved lot quantity');

    // Confirm that Order was automatically generated
    const orders = await orderService.getOrders(buyerUser);
    const linkedOrder = orders.find(o => o.offerId === offer.id);
    assert(linkedOrder !== undefined, 'Automatically creates linked Order from accepted offer (FR-ORD-01)');
    assert(linkedOrder?.status === OrderStatus.CONFIRMED, 'Generated order starts in CONFIRMED state');
    assert(linkedOrder?.paymentStatus === PaymentStatus.PENDING, 'Generated order payment is initially PENDING');

    // Confirm that linked SettlementRecord was automatically generated
    const settlements = await settlementService.getSettlements();
    const linkedSettlement = settlements.find(s => s.orderId === linkedOrder?.id);
    assert(linkedSettlement !== undefined, 'Automatically creates linked settlement record for suppliers (BR-04)');
    assert(linkedSettlement?.status === 'PENDING', 'Settlement record starts in PENDING status before delivery');
    assert(linkedSettlement?.supplierFeeRwf === Math.round((linkedOrder!.subtotalRwf * 3) / 100), 'Calculates 3% supplier fee on gross subtotal');
    assert(linkedSettlement!.supplierFeeRwf + linkedSettlement!.netPayoutRwf === linkedOrder!.subtotalRwf, 'Preserves fee + payout === gross subtotal invariant');
  }

  // 15. Phase 3: Payment Gate (BR-03), Delivery Receipts & Dispute Settlement Holds (BR-04)
  console.log('\n[Suite 15: Payment Gate (BR-03), Delivery Receipts & Dispute Settlement Holds (BR-04)]');
  {
    const buyerUser = createTestUser({
      id: 'usr-buyer-01',
      fullName: 'David Gasana',
      phone: '+250788555666',
      email: 'david@buyer.rw',
      role: UserRole.BUYER,
      organizationId: 'org-buyer-01',
    });

    const supplierUser = createTestUser({
      id: 'usr-supplier-01',
      fullName: 'Twizamure Cooperative Lead',
      phone: '+250788111222',
      email: 'twizamure@coop.rw',
      role: UserRole.SUPPLIER,
      organizationId: 'org-supplier-01',
    });

    const adminUser = createTestUser({
      id: 'usr-admin-p3',
      fullName: 'Cargo Ops Administrator',
      phone: '+250788000111',
      email: 'ops@cargo.rw',
      role: UserRole.ADMINISTRATOR,
      organizationId: 'org-cargo-admin',
    });

    // Find seed order ord-001 (CONFIRMED, payment PENDING)
    const order01 = (await orderService.getOrderById('ord-001'))!;
    assert(order01.status === OrderStatus.CONFIRMED && order01.paymentStatus === PaymentStatus.PENDING, 'Order ord-001 is pending payment');

    // 1. Strict Payment Gate (BR-03): Attempting dispatch while payment is pending must fail
    try {
      await orderService.dispatchOrder(order01.id, supplierUser);
      assert(false, 'Should reject dispatch of unpaid order');
    } catch (err: any) {
      assert(err.message.includes('Escrow payment is required before dispatch (BR-03)'), 'Rejects dispatch when escrow payment unconfirmed (BR-03)');
    }

    // 2. Simulate Buyer Mobile Money Payment
    const paidOrder = await orderService.simulatePayment(order01.id, PaymentMethod.MOBILE_MONEY, buyerUser);
    assert(paidOrder.status === OrderStatus.PAID, 'Transitions order to PAID status');
    assert(paidOrder.paymentStatus === PaymentStatus.CONFIRMED, 'Marks paymentStatus as CONFIRMED in escrow');
    assert(!!paidOrder.paymentReference, 'Generates realistic escrow payment reference');

    // 3. Dispatch is now authorized
    const dispatchedOrder = await orderService.dispatchOrder(order01.id, supplierUser);
    assert(dispatchedOrder.status === OrderStatus.DISPATCHED, 'Transitions order to DISPATCHED once paid');
    assert(!!dispatchedOrder.dispatchedAt, 'Records dispatch timestamp');

    // 4. Delivery arrival
    const deliveredOrder = await orderService.recordDelivery(order01.id, supplierUser, 'Delivered at Central Silos');
    assert(deliveredOrder.status === OrderStatus.DELIVERED, 'Transitions order to DELIVERED');

    // 5. Buyer triggers quality dispute on delivered shipment
    const disputedOrder = await orderService.recordDeliveryReceipt(
      deliveredOrder.id,
      buyerUser.id,
      14000,
      QualityGrade.GRADE_B,
      'DISPUTED',
      'Moisture test at receiving was 15.2% (exceeds Grade A threshold)'
    );

    assert(disputedOrder.status === OrderStatus.DISPUTED, 'Transitions order to DISPUTED');
    assert(disputedOrder.hasActiveDispute === true, 'Sets hasActiveDispute flag on order');

    // 6. Dispute Hold Invariant (BR-04): Linked settlements are strictly PAUSED
    const settlements = await settlementService.getSettlements();
    const orderSettlement = settlements.find(s => s.orderId === disputedOrder.id);
    assert(orderSettlement !== undefined, 'Linked settlement record exists');
    assert(orderSettlement?.status === 'PAUSED', 'Active dispute strictly pauses settlement disbursement (BR-04)');

    // Attempting to disburse paused settlement must fail
    try {
      await settlementService.disburseSettlement(orderSettlement!.id, adminUser);
      assert(false, 'Should reject disbursement of paused settlement');
    } catch (err: any) {
      assert(err.message.includes('active trade dispute is unresolved'), 'Rejects disbursement during active dispute hold (BR-04)');
    }

    // 7. Operations Admin adjudicates dispute
    const openDisputes = await disputeService.getDisputes(adminUser);
    const orderDispute = openDisputes.find(d => d.orderId === disputedOrder.id)!;
    assert(orderDispute !== undefined, 'Dispute record found in operations dispute register');

    const resolvedDispute = await disputeService.resolveDispute(
      orderDispute.id,
      adminUser,
      DisputeOutcome.ADJUSTED_PAYOUT,
      'Settled with 2% allowance agreed by cooperative'
    );

    assert(resolvedDispute.status === DisputeStatus.RESOLVED, 'Marks dispute as RESOLVED');
    assert(disputedOrder.hasActiveDispute === false, 'Clears hasActiveDispute flag on order');
    assert(disputedOrder.status === OrderStatus.ACCEPTED, 'Transitions order to ACCEPTED upon resolution');
    assert(orderSettlement?.status === 'ELIGIBLE', 'Unpauses settlement and marks it ELIGIBLE for payout');

    // 8. Admin disburses eligible settlement
    const disbursed = await settlementService.disburseSettlement(orderSettlement!.id, adminUser);
    assert(disbursed.status === 'SETTLED', 'Disburses settlement and marks status SETTLED');
    assert(!!disbursed.disbursedAt, 'Records disbursement timestamp');
    assert(disputedOrder.status === OrderStatus.SETTLED, 'Transitions order to SETTLED once all payouts complete');
  }

  // 16. Phase 3: Complete End-to-End Multi-Party Agricultural Trading Lifecycle Scenario
  console.log('\n[Suite 16: Complete End-to-End Multi-Party Trading Lifecycle Scenario]');
  {
    await mockState.resetAll();

    const supplier = createTestUser({
      id: 'usr-sup-e2e',
      fullName: 'Cooperative Tuzamurane Rep',
      phone: '+250788777888',
      email: 'tuzamurane@agri.rw',
      role: UserRole.SUPPLIER,
      organizationId: 'org-supplier-05',
    });

    const inspector = createTestUser({
      id: 'usr-agent-e2e',
      fullName: 'Ines Uwase Inspector',
      phone: '+250788333222',
      email: 'ines@cargo.rw',
      role: UserRole.FIELD_AGENT,
      organizationId: 'org-cargo-ops',
      agentAssignment: {
        district: 'Nyagatare',
        sector: 'Karangazi',
        supervisorName: 'Cargo Agronomy Operations',
      },
    });

    const admin = createTestUser({
      id: 'usr-admin-e2e',
      fullName: 'Cargo Central Operations',
      phone: '+250788000999',
      email: 'ops@cargo.rw',
      role: UserRole.ADMINISTRATOR,
      organizationId: 'org-cargo-admin',
    });

    const buyer = createTestUser({
      id: 'usr-buyer-e2e',
      fullName: 'Rwanda Grain Processors Ltd Buyer',
      phone: '+250788444555',
      email: 'procurement@rwandagrain.rw',
      role: UserRole.BUYER,
      organizationId: 'org-buyer-01',
    });

    // Step 1: Supplier declares 10,000 kg harvest lot
    const newLot = await lotService.createLot({
      cropName: 'Maize',
      variety: 'Nyirakaragaza (White)',
      totalQuantityKg: 10000,
      pricePerKgRwf: 450,
      harvestDate: '2026-10-02',
      availabilityDate: '2026-10-18',
      pickupDistrict: 'Nyagatare',
      pickupSector: 'Karangazi',
      pickupLocationDetails: 'Warehouse Bay 4, Karangazi Agro Hub',
      harvestConfirmed: true,
      photos: ['https://example.com/maize-lot.jpg'],
    }, supplier);

    assert(newLot.status === LotStatus.SUBMITTED, 'Step 1: Supplier declares lot in SUBMITTED status');

    // Step 2: Field agent inspects and records quality measurements
    const grading = await gradingService.submitGrading(
      newLot.id,
      inspector,
      { moisture: 12.8, foreignMatter: 0.6, defects: 1.2 },
      ['https://example.com/inspection-photos.jpg'],
      'Grade A certified'
    );
    assert(grading.finalGrade === QualityGrade.GRADE_A, 'Step 2: Inspector records measurements -> Grade A calculated');
    assert(!isLotBuyerVisible(newLot), 'Step 2: Lot remains invisible to buyers pending admin approval (BR-02)');

    // Step 3: Administrator reviews and approves lot
    const verifiedLot = await adminApprovalService.approveLot(newLot.id, admin);
    assert(verifiedLot.status === LotStatus.VERIFIED, 'Step 3: Administrator approves lot -> VERIFIED');
    assert(isLotBuyerVisible(verifiedLot), 'Step 3: Lot is now live in Buyer Discover catalogue');

    // Step 4: Buyer discovers lot and submits offer for 4,000 kg
    const offer = await offerService.createOffer(buyer, {
      lotId: verifiedLot.id,
      quantityKg: 4000,
      unitPriceRwf: 450,
      deliveryDistrict: 'Kigali (Gasabo)',
      deliveryDate: '2026-10-26',
      notes: 'Commercial procurement for processing plant',
    });
    assert(offer.status === OfferStatus.PROPOSED, 'Step 4: Buyer creates purchase offer (4,000 kg @ 450 RWF/kg)');
    assert(offer.subtotalRwf === 1800000, 'Step 4: Subtotal is 1,800,000 RWF');
    assert(offer.platformFeeRwf === 90000, 'Step 4: 5% Buyer platform fee is 90,000 RWF');
    assert(offer.totalPriceRwf === 1890000, 'Step 4: Total payable in escrow is 1,890,000 RWF');

    // Step 5: Supplier accepts offer -> Atomic stock reservation and Order creation
    await offerService.respondToOffer(offer.id, 'ACCEPT', 'Offer accepted', undefined, supplier);
    assert(verifiedLot.remainingQuantityKg === 6000, 'Step 5: Lot remaining stock reduced to 6,000 kg');
    assert(verifiedLot.reservedQuantityKg === 4000, 'Step 5: Lot reserved quantity increased to 4,000 kg');

    const orders = await orderService.getOrders(buyer);
    const order = orders.find(o => o.offerId === offer.id)!;
    assert(order !== undefined && order.status === OrderStatus.CONFIRMED, 'Step 5: Order automatically created in CONFIRMED state');

    // Step 6: Payment gate enforces escrow before dispatch
    try {
      await orderService.dispatchOrder(order.id, supplier);
      assert(false, 'Should fail dispatch before payment');
    } catch (err: any) {
      assert(err.message.includes('Escrow payment is required before dispatch (BR-03)'), 'Step 6: Dispatch blocked before payment (BR-03 gate)');
    }

    // Step 7: Buyer confirms payment into escrow
    await orderService.simulatePayment(order.id, PaymentMethod.MOBILE_MONEY, buyer);
    assert(order.status === OrderStatus.PAID && order.paymentStatus === PaymentStatus.CONFIRMED, 'Step 7: Payment confirmed in escrow -> Order PAID');

    // Step 8: Supplier dispatches shipment
    await orderService.dispatchOrder(order.id, supplier);
    assert(order.status === OrderStatus.DISPATCHED, 'Step 8: Supplier dispatches consignment -> Order DISPATCHED');

    // Step 9: Logistics delivery arrival
    await orderService.recordDelivery(order.id, supplier, 'Arrived at Kigali processing hub');
    assert(order.status === OrderStatus.DELIVERED, 'Step 9: Consignment arrives at warehouse -> Order DELIVERED');

    // Step 10: Buyer inspects and accepts delivery
    await orderService.acceptOrder(order.id, buyer);
    assert(order.status === OrderStatus.ACCEPTED, 'Step 10: Buyer accepts delivery -> Order ACCEPTED');

    // Step 11: Settlement eligibility and financial invariants
    const settlements = await settlementService.getSettlements(supplier);
    const orderStl = settlements.find(s => s.orderId === order.id)!;
    assert(orderStl !== undefined && orderStl.status === 'ELIGIBLE', 'Step 11: Supplier settlement status transitions to ELIGIBLE');
    assert(orderStl.grossSubtotalRwf === 1800000, 'Step 11: Gross trade value is 1,800,000 RWF');
    assert(orderStl.supplierFeeRwf === 54000, 'Step 11: 3% Supplier fee is exactly 54,000 RWF');
    assert(orderStl.netPayoutRwf === 1746000, 'Step 11: Net supplier payout is 1,746,000 RWF');
    assert(orderStl.supplierFeeRwf + orderStl.netPayoutRwf === orderStl.grossSubtotalRwf, 'Step 11: Gross value invariant 54,000 + 1,746,000 === 1,800,000 RWF holds');

    // Step 12: Operations Admin disburses settlement funds
    await settlementService.disburseSettlement(orderStl.id, admin);
    assert(orderStl.status === 'SETTLED', 'Step 12: Settlement payout completed -> Status SETTLED');
    assert(order.status === OrderStatus.SETTLED, 'Step 12: Order lifecycle successfully fulfilled -> Status SETTLED');
  }

  // 17. Local Inspection Storage & Draft Lifecycle
  console.log('[Suite 17: Local Inspection Storage & Draft Lifecycle]');
  {
    await mockState.resetAll();

    // 1. Save draft
    const draft: InspectionDraft = {
      id: 'draft-lot-offline-01',
      lotId: 'lot-offline-01',
      agentId: 'usr-agent-01',
      moisture: '12.8',
      foreignMatter: '0.6',
      defects: '1.2',
      notes: 'Grain stored in dry hermetic bags. Clean aroma.',
      photos: ['https://example.com/lot-offline.jpg'],
      gps: { lat: -1.9441, lng: 30.0619 },
      updatedAt: new Date().toISOString(),
    };
    await inspectionRepository.saveDraft(draft);

    // 2. Retrieve draft
    const retrievedDraft = await inspectionRepository.getDraft('lot-offline-01');
    assert(retrievedDraft !== null, 'Persists draft in local repository');
    assert(retrievedDraft?.moisture === '12.8', 'Preserves draft moisture measurement');
    assert(retrievedDraft?.gps?.lat === -1.9441, 'Preserves draft GPS location');

    // 3. Update draft
    await inspectionRepository.saveDraft({
      ...draft,
      moisture: '13.0',
      notes: 'Updated field notes with supervisor confirmation',
    });
    const updatedDraft = await inspectionRepository.getDraft('lot-offline-01');
    assert(updatedDraft?.moisture === '13.0', 'Updates existing draft without duplication');
    assert(updatedDraft?.notes.includes('supervisor confirmation') === true, 'Preserves updated draft notes');

    // 4. Save completed local inspection
    const gradingRecord: GradingRecord = {
      id: 'grd-offline-test-01',
      lotId: 'lot-offline-01',
      fieldAgentId: 'usr-agent-01',
      fieldAgentName: 'Claude Nzaramba',
      measurements: [
        { metricName: 'moisture', labelEn: 'Moisture', labelRw: 'Ubuhehere', value: 13.0, unit: '%', passedThreshold: true },
        { metricName: 'foreignMatter', labelEn: 'Foreign Matter', labelRw: 'Ibintu bitarimo', value: 0.6, unit: '%', passedThreshold: true },
        { metricName: 'defects', labelEn: 'Defective Grain', labelRw: 'Ibyangiritse', value: 1.2, unit: '%', passedThreshold: true },
      ],
      moisturePercentage: 13.0,
      foreignMatterPercentage: 0.6,
      defectiveRatePercentage: 1.2,
      calculatedGrade: QualityGrade.GRADE_A,
      finalGrade: QualityGrade.GRADE_A,
      photos: ['https://example.com/photo-01.jpg'],
      notes: 'Final local inspection recorded.',
      isOfflineSubmission: true,
      createdAt: new Date().toISOString(),
    };
    await inspectionRepository.saveInspection(gradingRecord);

    const savedRecord = await inspectionRepository.getInspectionById('grd-offline-test-01');
    assert(savedRecord !== null, 'Durable local repository saves completed inspection');
    assert(savedRecord?.finalGrade === QualityGrade.GRADE_A, 'Persists calculated final grade');

    // 5. Draft cleanup on submission
    await inspectionRepository.removeDraft('lot-offline-01');
    const clearedDraft = await inspectionRepository.getDraft('lot-offline-01');
    assert(clearedDraft === null, 'Clears draft once inspection submitted');

    // 6. Multi-inspection query
    const allLocal = await inspectionRepository.getInspections();
    assert(allLocal.some(r => r.id === 'grd-offline-test-01'), 'getInspections returns locally stored record');
  }

  // 18. Queue Concurrency Lock & Idempotent Retries
  console.log('[Suite 18: Queue Concurrency Lock & Idempotent Retries]');
  {
    await mockState.resetAll();
    const agent = SEED_USERS.find(u => u.role === UserRole.FIELD_AGENT)!;

    // 1. Enqueue inspection creates stable idempotency key
    const record: GradingRecord = {
      id: 'grd-idem-001',
      lotId: 'lot-001',
      fieldAgentId: 'usr-agent-01',
      fieldAgentName: 'Claude Nzaramba',
      measurements: [],
      moisturePercentage: 12.5,
      foreignMatterPercentage: 0.8,
      defectiveRatePercentage: 1.0,
      calculatedGrade: QualityGrade.GRADE_A,
      finalGrade: QualityGrade.GRADE_A,
      photos: [],
      notes: 'Idempotency test lot',
      isOfflineSubmission: true,
      createdAt: new Date().toISOString(),
    };

    const queueItem = await syncCoordinator.enqueueInspection('lot-001', record, agent);
    assert(queueItem.idempotencyKey === 'idem-grd-idem-001', 'Assigns stable deterministic client idempotency key');
    assert(queueItem.status === SyncStatus.QUEUED, 'Enqueued item starts in QUEUED state');

    // 2. Concurrency Lock: multiple rapid sync calls do not double-process
    mockState.setOffline(false);
    const syncPromise1 = syncCoordinator.processQueue();
    const syncPromise2 = syncCoordinator.processQueue(); // Concurrent trigger
    const [res1, res2] = await Promise.all([syncPromise1, syncPromise2]);

    assert(res1.syncedCount === 1 || res2.syncedCount === 1, 'One worker processes the queued item');
    assert(res1.inProgress === true || res2.inProgress === true, 'Second concurrent call blocked by isSyncInProgress lock');

    // 3. Duplicate submission prevention via mockSyncAdapter idempotency token cache
    const duplicateRes = await mockSyncAdapter.submitGrading({
      lotId: 'lot-001',
      gradingRecord: record,
      idempotencyKey: 'idem-grd-idem-001',
    });
    assert(duplicateRes.success === true, 'Duplicate submission returns success');
    assert(duplicateRes.isDuplicate === true, 'Recognizes existing idempotency key and marks isDuplicate: true');

    // 4. Retry preserves same stable operation ID and idempotency key
    const retryItem = await syncCoordinator.enqueueInspection('lot-002', {
      ...record,
      id: 'grd-idem-002',
      lotId: 'lot-002',
    }, agent);
    assert(retryItem.id === 'op-grd-idem-002', 'Reuses operation ID on retry');
    assert(retryItem.idempotencyKey === 'idem-grd-idem-002', 'Reuses client idempotency token on retry');
  }

  // 19. Error Classification, Bounded Backoff & Conflict Handling
  console.log('[Suite 19: Error Classification, Bounded Backoff & Conflict Handling]');
  {
    await mockState.resetAll();
    const agent = SEED_USERS.find(u => u.role === UserRole.FIELD_AGENT)!;

    // 1. Transient network failure -> RETRY_SCHEDULED with exponential backoff
    mockState.setOffline(true);
    const record1: GradingRecord = {
      id: 'grd-transient-01',
      lotId: 'lot-001',
      fieldAgentId: 'usr-agent-01',
      fieldAgentName: 'Claude Nzaramba',
      measurements: [],
      moisturePercentage: 13.0,
      foreignMatterPercentage: 0.5,
      defectiveRatePercentage: 1.0,
      calculatedGrade: QualityGrade.GRADE_A,
      finalGrade: QualityGrade.GRADE_A,
      photos: [],
      notes: 'Transient network failure test',
      isOfflineSubmission: true,
      createdAt: new Date().toISOString(),
    };
    const queued1 = await syncCoordinator.enqueueInspection('lot-001', record1, agent);
    const syncRes1 = await syncCoordinator.processQueue();
    assert(syncRes1.syncedCount === 0, 'No items synced while offline');

    const queueAfter1 = await localStorage.getOfflineQueue();
    const item1 = queueAfter1.find(q => q.id === queued1.id)!;
    assert(item1.status === SyncStatus.RETRY_SCHEDULED, 'Transient network failure transitions to RETRY_SCHEDULED');
    assert(item1.errorCategory === SyncErrorCategory.TRANSIENT, 'Classifies network failure as TRANSIENT');
    assert(item1.retryCount === 1, 'Increments retry attempt counter to 1');
    assert(new Date(item1.nextRetryAt!).getTime() > Date.now(), 'Schedules next retry timestamp into the future');

    // 2. Permanent validation error: Measurements out of agricultural bounds
    mockState.setOffline(false);
    const recordBad: GradingRecord = {
      id: 'grd-permanent-bad-01',
      lotId: 'lot-001',
      fieldAgentId: 'usr-agent-01',
      fieldAgentName: 'Claude Nzaramba',
      measurements: [],
      moisturePercentage: 95.0, // Impossible physical moisture (> 50%)
      foreignMatterPercentage: 0.5,
      defectiveRatePercentage: 1.0,
      calculatedGrade: QualityGrade.GRADE_C,
      finalGrade: QualityGrade.GRADE_C,
      photos: [],
      notes: 'Bad measurements payload',
      isOfflineSubmission: true,
      createdAt: new Date().toISOString(),
    };
    const queuedBad = await syncCoordinator.enqueueInspection('lot-001', recordBad, agent);
    await syncCoordinator.processQueue();
    const queueAfterBad = await localStorage.getOfflineQueue();
    const itemBad = queueAfterBad.find(q => q.id === queuedBad.id)!;
    assert(itemBad.status === SyncStatus.FAILED_PERMANENT, 'Physical validation failure transitions to FAILED_PERMANENT');
    assert(itemBad.errorCategory === SyncErrorCategory.PERMANENT, 'Classifies invalid measurements as PERMANENT error');

    // 3. Conflict: Referenced lot is rejected or sold while agent was offline
    const rejectedLot = await lotService.getLotById('lot-003');
    if (rejectedLot) {
      rejectedLot.status = LotStatus.REJECTED;
    }
    const recordConflict: GradingRecord = {
      id: 'grd-conflict-01',
      lotId: 'lot-003',
      fieldAgentId: 'usr-agent-01',
      fieldAgentName: 'Claude Nzaramba',
      measurements: [],
      moisturePercentage: 13.0,
      foreignMatterPercentage: 0.5,
      defectiveRatePercentage: 1.0,
      calculatedGrade: QualityGrade.GRADE_A,
      finalGrade: QualityGrade.GRADE_A,
      photos: [],
      notes: 'Conflict inspection on rejected lot',
      isOfflineSubmission: true,
      createdAt: new Date().toISOString(),
    };
    const queuedConflict = await syncCoordinator.enqueueInspection('lot-003', recordConflict, agent);
    await syncCoordinator.processQueue();
    const queueAfterConflict = await localStorage.getOfflineQueue();
    const itemConflict = queueAfterConflict.find(q => q.id === queuedConflict.id)!;
    assert(itemConflict.status === SyncStatus.CONFLICT, 'Closed/rejected lot detected as CONFLICT');
    assert(itemConflict.errorCategory === SyncErrorCategory.CONFLICT, 'Classifies closed lot as CONFLICT category');
    assert(itemConflict.errorMessage?.includes('Synchronization conflict') === true, 'Preserves actionable conflict message');

    // Conflict does NOT delete local inspection record
    const localConflictRecord = await inspectionRepository.getInspectionById('grd-conflict-01');
    assert(localConflictRecord !== null, 'Local inspection strictly preserved after conflict for supervisor review');
  }

  // 20. Startup Recovery & Crash Reconciliation
  console.log('[Suite 20: Startup Recovery & Crash Reconciliation]');
  {
    await mockState.resetAll();

    // 1. Simulate interrupted sync operation left in 'SYNCING' state due to app kill
    await localStorage.enqueueOfflineItem({
      id: 'op-crashed-worker-01',
      type: 'SUBMIT_GRADING',
      entityId: 'lot-001',
      payload: { lotId: 'lot-001' },
      status: SyncStatus.SYNCING,
      retryCount: 1,
      createdAt: new Date(Date.now() - 60000).toISOString(),
    });

    // 2. Run Startup Reconciler
    const reconcileResult = await inspectionRepository.reconcileStartupState();
    assert(reconcileResult.recoveredCount === 1, 'Reconciler recovers 1 abandoned SYNCING operation');

    // 3. Verify item recovered to RETRY_SCHEDULED with explanatory message
    const queue = await localStorage.getOfflineQueue();
    const recoveredItem = queue.find(q => q.id === 'op-crashed-worker-01')!;
    assert(recoveredItem.status === SyncStatus.RETRY_SCHEDULED, 'Recovered item safely moved to RETRY_SCHEDULED');
    assert(recoveredItem.errorMessage?.includes('interrupted by app termination') === true, 'Attaches safe recovery explanation');
    assert(recoveredItem.retryCount === 2, 'Increments retry attempt counter on recovery');
  }

  // 21. Full Field Agent Offline-First Multi-Scenario Journey
  console.log('[Suite 21: Full Field Agent Offline-First Multi-Scenario Journey]');
  {
    await mockState.resetAll();
    const supplier = SEED_USERS.find(u => u.role === UserRole.SUPPLIER)!;
    const agent = SEED_USERS.find(u => u.role === UserRole.FIELD_AGENT)!;
    const admin = SEED_USERS.find(u => u.role === UserRole.ADMINISTRATOR)!;

    // Supplier declares new harvest lot
    const declaredLot = await lotService.createLot({
      cropName: 'Maize',
      variety: 'Nyirakaragaza',
      totalQuantityKg: 8000,
      pricePerKgRwf: 410,
      harvestDate: '2026-10-01',
      availabilityDate: '2026-10-15',
      pickupDistrict: 'Nyagatare',
      pickupSector: 'Karangazi',
      pickupLocationDetails: 'Warehouse Section C',
      photos: ['https://example.com/maize-fresh.jpg'],
      harvestConfirmed: true,
    }, supplier);
    const testLotId = declaredLot.id;

    // Step 1: Agent goes to remote sector with zero connectivity
    mockState.setOffline(true);
    assert(mockState.isOffline() === true, 'Step 1: Agent is offline in remote rural area');

    // Step 2: Agent captures partial draft in the field
    await inspectionRepository.saveDraft({
      id: `draft-${testLotId}`,
      lotId: testLotId,
      agentId: agent.id,
      moisture: '13.1',
      foreignMatter: '0.9',
      defects: '1.4',
      notes: `Inspecting ${testLotId} at Nyagatare collection center`,
      photos: [],
      updatedAt: new Date().toISOString(),
    });
    const draftStep2 = await inspectionRepository.getDraft(testLotId);
    assert(draftStep2 !== null && draftStep2.moisture === '13.1', 'Step 2: Draft safely persisted locally in field');

    // Step 3: Agent completes inspection and submits while STILL OFFLINE
    const record = await gradingService.submitGrading(
      testLotId,
      agent,
      { moisture: 13.1, foreignMatter: 0.9, defects: 1.4 },
      [],
      'Sample verified dry and clean. Ready for Cargo listing.',
      { lat: -1.5973, lng: 30.4082 }
    );
    assert(record.isOfflineSubmission === true, 'Step 3: Submission recognized as offline submission');

    // Step 4: Verify durable queue state
    const summaryOffline = await syncCoordinator.getQueueSummary();
    assert(summaryOffline.pending === 1, 'Step 4: Queue summary shows 1 pending inspection');
    assert(summaryOffline.synced === 0, 'Step 4: Zero synced inspections while offline');

    // Step 5: Lot remains invisible to buyers (BR-02)
    const lotPreSync = await lotService.getLotById(testLotId);
    assert(!isLotBuyerVisible(lotPreSync!), 'Step 5: Lot remains invisible to buyers while pending sync');

    // Step 6: Agent travels back to town and connectivity returns
    mockState.setOffline(false);
    assert(mockState.isOffline() === false, 'Step 6: Network connection restored');

    // Step 7: Synchronization coordinator runs
    const syncResult = await syncCoordinator.processQueue();
    assert(syncResult.syncedCount === 1, 'Step 7: Synchronized 1 inspection record successfully');

    // Step 8: Verify Queue updated to SYNCED
    const summaryOnline = await syncCoordinator.getQueueSummary();
    assert(summaryOnline.pending === 0, 'Step 8: Queue pending count is now 0');
    assert(summaryOnline.synced === 1, 'Step 8: Queue synced count is now 1');
    assert(summaryOnline.lastSyncAt !== null, 'Step 8: Last sync timestamp recorded');

    // Step 9: Invariant check (BR-02 decoupling)
    const lotPostSync = await lotService.getLotById(testLotId);
    assert(lotPostSync?.grade === QualityGrade.GRADE_A, 'Step 9: Lot reflects QualityGrade.GRADE_A');
    assert(lotPostSync?.inspectedByAgentId === agent.id, 'Step 9: Lot records field agent accreditation ID');
    assert(lotPostSync?.adminApprovedAt === undefined, 'Step 9: Sync strictly does NOT fabricate admin approval (BR-02 decoupled)');
    assert(!isLotBuyerVisible(lotPostSync!), 'Step 9: Lot remains hidden from buyers until administrative operations approval (BR-02)');

    // Step 10: Cargo Administrator reviews inspection and approves lot
    const approvedLot = await adminApprovalService.approveLot(testLotId, admin);
    assert(approvedLot.status === LotStatus.VERIFIED, 'Step 10: Admin approves lot -> VERIFIED');
    assert(isLotBuyerVisible(approvedLot), 'Step 10: Approved lot is now live in Buyer Discover catalogue (BR-02 unlocked)');

    // Step 11: Buyer projection checks (BR-05)
    const buyerLot = await lotService.getBuyerLotById(testLotId);
    assert(buyerLot !== undefined, 'Step 11: Buyer can view verified lot');
    assert((buyerLot as any).supplierId === undefined, 'Step 11: Direct supplier identity protected (BR-05)');
    assert((buyerLot as any).pickupLocationDetails === undefined, 'Step 11: Private warehouse location protected (BR-05)');
  }

  // 22. Phase 5 Financial Invariants & Arithmetic Bounds
  console.log('[Suite 22: Phase 5 Financial Invariants & Arithmetic Bounds]');
  {
    // 1. Standard 5% buyer fee and 3% supplier fee
    const standardBuyer = calculateBuyerTotal(2000000);
    assert(standardBuyer.buyerFeeRwf === 100000, 'Calculates exact 5% buyer fee on 2,000,000 RWF (100,000 RWF)');
    assert(standardBuyer.totalAmountRwf === 2100000, 'Calculates total buyer payable as 2,100,000 RWF');

    const standardSupplier = calculateSupplierPayout(2000000);
    assert(standardSupplier.supplierFeeRwf === 60000, 'Calculates exact 3% supplier fee on 2,000,000 RWF (60,000 RWF)');
    assert(standardSupplier.netPayoutRwf === 1940000, 'Calculates net supplier payout as 1,940,000 RWF');
    assert(standardSupplier.supplierFeeRwf + standardSupplier.netPayoutRwf === 2000000, 'Preserves gross value conservation on standard volume');

    // 2. Zero boundary condition
    const zeroBuyer = calculateBuyerTotal(0);
    assert(zeroBuyer.buyerFeeRwf === 0 && zeroBuyer.totalAmountRwf === 0, 'Zero subtotal yields 0 buyer fee and 0 total');
    const zeroSupplier = calculateSupplierPayout(0);
    assert(zeroSupplier.supplierFeeRwf === 0 && zeroSupplier.netPayoutRwf === 0, 'Zero subtotal yields 0 supplier fee and 0 payout');

    // 3. Negative and NaN defensive handling
    const negBuyer = calculateBuyerTotal(-5000);
    assert(negBuyer.buyerFeeRwf === 0 && negBuyer.totalAmountRwf === 0, 'Defensive arithmetic: negative subtotal safely returns 0');
    const nanSupplier = calculateSupplierPayout(NaN);
    assert(nanSupplier.supplierFeeRwf === 0 && nanSupplier.netPayoutRwf === 0, 'Defensive arithmetic: NaN safely returns 0');

    // 4. Non-fractional integer rounding on odd numbers
    const oddSubtotal = 33333;
    const oddBuyer = calculateBuyerTotal(oddSubtotal);
    // 33333 * 0.05 = 1666.65 -> Math.round -> 1667
    assert(oddBuyer.buyerFeeRwf === 1667, 'Rounds 5% fee on 33,333 to integer 1,667 RWF');
    assert(oddBuyer.totalAmountRwf === 35000, 'Total buyer payable rounds cleanly to 35,000 RWF');

    const oddSupplier = calculateSupplierPayout(oddSubtotal);
    // 33333 * 0.03 = 999.99 -> Math.round -> 1000
    assert(oddSupplier.supplierFeeRwf === 1000, 'Rounds 3% fee on 33,333 to integer 1,000 RWF');
    assert(oddSupplier.netPayoutRwf === 32333, 'Net supplier payout is integer 32,333 RWF');
    assert(oddSupplier.supplierFeeRwf + oddSupplier.netPayoutRwf === oddSubtotal, 'Odd subtotal preserves exact gross conservation (1,000 + 32,333 === 33,333)');

    // 5. Massive wholesale trade (100 Million RWF)
    const largeTrade = 100000000;
    const largeBuyer = calculateBuyerTotal(largeTrade);
    assert(largeBuyer.buyerFeeRwf === 5000000, 'Calculates 5,000,000 RWF fee on 100M RWF wholesale order');
    const largeSupplier = calculateSupplierPayout(largeTrade);
    assert(largeSupplier.supplierFeeRwf === 3000000, 'Calculates 3,000,000 RWF fee on 100M RWF wholesale order');
    assert(largeSupplier.supplierFeeRwf + largeSupplier.netPayoutRwf === largeTrade, 'Massive volume preserves exact conservation');

    // 6. Consistency between calculateBuyerFee and calculateBuyerTotal
    const feeDirect = calculateBuyerFee(500000);
    assert(feeDirect.buyerFeeRwf === 25000 && feeDirect.totalBuyerPayableRwf === 525000, 'calculateBuyerFee matches calculateBuyerTotal output');
  }

  // 23. Phase 5 Security Hardening, Role Routing & Session Isolation
  console.log('[Suite 23: Phase 5 Security Hardening, Role Routing & Session Isolation]');
  {
    await mockState.resetAll();

    // 1. Unauthenticated route protection
    assert(canAccessDestination('SUPPLIER_WORKSPACE', null) === false, 'Blocks unauthenticated access to SUPPLIER_WORKSPACE');
    assert(canAccessDestination('BUYER_WORKSPACE', null) === false, 'Blocks unauthenticated access to BUYER_WORKSPACE');
    assert(canAccessDestination('AGENT_WORKSPACE', null) === false, 'Blocks unauthenticated access to AGENT_WORKSPACE');
    assert(canAccessDestination('ADMIN_HANDOFF', null) === false, 'Blocks unauthenticated access to ADMIN_HANDOFF');

    // 2. Account lock security policy
    const lockedUser: User = {
      ...SEED_USERS[0],
      isLocked: true,
    };
    const lockedResolution = resolveAuthenticatedRoute(lockedUser);
    assert(lockedResolution.destination === 'UNAUTHORIZED', 'Locked account resolves to UNAUTHORIZED');
    assert(lockedResolution.statusNotice?.includes('locked') === true, 'Provides security policy lockout notice');

    // 3. Suspended account security policy
    const suspendedUser: User = {
      ...SEED_USERS[0],
      isLocked: false,
      isActive: false,
    };
    const suspendedResolution = resolveAuthenticatedRoute(suspendedUser);
    assert(suspendedResolution.destination === 'UNAUTHORIZED', 'Suspended account resolves to UNAUTHORIZED');

    // 4. Role boundaries
    const supplierUser = SEED_USERS.find(u => u.role === UserRole.SUPPLIER)!;
    const buyerUser = SEED_USERS.find(u => u.role === UserRole.BUYER)!;
    const agentUser = SEED_USERS.find(u => u.role === UserRole.FIELD_AGENT)!;

    assert(canAccessDestination('SUPPLIER_WORKSPACE', supplierUser) === true, 'Supplier can access SUPPLIER_WORKSPACE');
    assert(canAccessDestination('BUYER_WORKSPACE', supplierUser) === false, 'Supplier cannot access BUYER_WORKSPACE');
    assert(canAccessDestination('AGENT_WORKSPACE', supplierUser) === false, 'Supplier cannot access AGENT_WORKSPACE');

    assert(canAccessDestination('BUYER_WORKSPACE', buyerUser) === true, 'Buyer can access BUYER_WORKSPACE');
    assert(canAccessDestination('SUPPLIER_WORKSPACE', buyerUser) === false, 'Buyer cannot access SUPPLIER_WORKSPACE');

    assert(canAccessDestination('AGENT_WORKSPACE', agentUser) === true, 'Agent can access AGENT_WORKSPACE');
    assert(canAccessDestination('ADMIN_HANDOFF', agentUser) === false, 'Agent cannot access ADMIN_HANDOFF');

    // 5. Logout preserves offline inspection queue items (Section 5.4 invariant)
    await localStorage.enqueueOfflineItem({
      id: 'op-preserve-test-01',
      type: 'SUBMIT_GRADING',
      entityId: 'lot-001',
      payload: { lotId: 'lot-001' },
      status: SyncStatus.QUEUED,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    });
    await authService.logout();
    const sessionAfterLogout = await localStorage.getSessionUser();
    assert(sessionAfterLogout === null, 'Logout clears active session user');
    const queueAfterLogout = await localStorage.getOfflineQueue();
    assert(queueAfterLogout.some(q => q.id === 'op-preserve-test-01'), 'Logout preserves unsynced offline queue items in local storage');
  }

  // 24. Phase 5 End-to-End Edge Cases, Stress & Dispute Isolation
  console.log('[Suite 24: Phase 5 End-to-End Edge Cases, Stress & Dispute Isolation]');
  {
    await mockState.resetAll();
    const buyer = SEED_USERS.find(u => u.role === UserRole.BUYER)!;
    const supplier = SEED_USERS.find(u => u.role === UserRole.SUPPLIER)!;
    const admin = SEED_USERS.find(u => u.role === UserRole.ADMINISTRATOR)!;
    const inspector = SEED_USERS.find(u => u.role === UserRole.FIELD_AGENT)!;

    // 1. Environment configuration sanity check
    assert(isDemoEnvironment() === true, 'Recognizes current environment as Demo/Mock environment');
    assert(config.isProduction === false, 'Production mode flag is false in demo environment');

    // 2. Sensitive log redaction check
    const logResult = logger.writeLog('INFO', 'User login attempt', 'AuthModule', {
      phone: '+250788111222',
      password: 'SuperSecretPassword123!',
      token: 'jwt.sample.token',
    });
    assert(logResult.data?.password === '[REDACTED]', 'Logger automatically redacts password from log output');
    assert(logResult.data?.token === '[REDACTED]', 'Logger automatically redacts authorization tokens');
    assert(logResult.data?.phone === '+250788111222', 'Preserves non-sensitive operational identifiers');

    // 3. Centralized error normalization
    const br01Norm = normalizeError(new Error('Validation failed under BR-01 readiness'));
    assert(br01Norm.code === ErrorCode.BR_VIOLATION, 'Normalizes BR-01 violation to ErrorCode.BR_VIOLATION');
    assert(br01Norm.messageEn.includes('BR-01') && br01Norm.messageRw.includes('BR-01'), 'Provides bilingual normalized message for BR-01');

    const netNorm = normalizeError(new Error('Network connection timeout'));
    assert(netNorm.code === ErrorCode.NETWORK_ERROR, 'Normalizes network timeout to ErrorCode.NETWORK_ERROR');

    // 4. Dispute isolation: Opening a dispute on Order 1 pauses Order 1's settlement while Order 2 is unaffected
    const lotDispute = await lotService.createLot({
      cropName: 'Maize',
      variety: 'Yellow Feed Maize',
      totalQuantityKg: 10000,
      pricePerKgRwf: 400,
      harvestDate: '2026-10-01',
      availabilityDate: '2026-10-15',
      pickupDistrict: 'Bugesera',
      pickupSector: 'Nyamata',
      pickupLocationDetails: 'Bugesera Central Depot Bay 1',
      harvestConfirmed: true,
      photos: ['https://example.com/maize.jpg'],
    }, supplier);

    await gradingService.submitGrading(
      lotDispute.id,
      inspector,
      { moisture: 12.0, foreignMatter: 0.5, defects: 1.0 },
      ['https://example.com/photo.jpg'],
      'Passed grading'
    );

    await adminApprovalService.approveLot(lotDispute.id, admin);

    const off1 = await offerService.createOffer(buyer, {
      lotId: lotDispute.id,
      quantityKg: 1000,
      unitPriceRwf: 400,
      deliveryDistrict: 'Kigali (Gasabo)',
      deliveryDate: '2026-10-28',
    });
    await offerService.respondToOffer(off1.id, 'ACCEPT', 'Offer 1 accepted', undefined, supplier);

    const off2 = await offerService.createOffer(buyer, {
      lotId: lotDispute.id,
      quantityKg: 1000,
      unitPriceRwf: 400,
      deliveryDistrict: 'Kigali (Gasabo)',
      deliveryDate: '2026-10-29',
    });
    await offerService.respondToOffer(off2.id, 'ACCEPT', 'Offer 2 accepted', undefined, supplier);

    const allOrders = await orderService.getOrders(buyer);
    const order1 = allOrders.find(o => o.offerId === off1.id)!;
    const order2 = allOrders.find(o => o.offerId === off2.id)!;
    assert(order1 !== undefined && order2 !== undefined, 'Created 2 distinct test orders for dispute isolation');

    // Pay both orders into escrow (BR-03)
    await orderService.simulatePayment(order1.id, PaymentMethod.MOBILE_MONEY, buyer);
    await orderService.simulatePayment(order2.id, PaymentMethod.MOBILE_MONEY, buyer);

    // Dispatch, deliver, and accept both orders
    await orderService.dispatchOrder(order1.id, supplier);
    await orderService.recordDelivery(order1.id, supplier, 'Delivered order 1 to warehouse');
    await orderService.acceptOrder(order1.id, buyer);

    await orderService.dispatchOrder(order2.id, supplier);
    await orderService.recordDelivery(order2.id, supplier, 'Delivered order 2 to warehouse');
    await orderService.acceptOrder(order2.id, buyer);

    // Open dispute specifically on Order 1
    await disputeService.openDispute(
      order1.id,
      buyer,
      'Damaged packaging in transit',
      'Moisture spotted on 3 sacks',
      []
    );
    assert(order1.status === OrderStatus.DISPUTED && order1.hasActiveDispute === true, 'Order 1 is in DISPUTED status');
    assert(order2.status === OrderStatus.ACCEPTED && order2.hasActiveDispute === false, 'Order 2 remains in ACCEPTED status without dispute');

    // Verify settlements: Order 1 settlements are PAUSED, Order 2 settlements remain ELIGIBLE
    const settlementsSupplier = await settlementService.getSettlements(supplier);
    const order1Settlements = settlementsSupplier.filter(s => s.orderId === order1.id);
    const order2Settlements = settlementsSupplier.filter(s => s.orderId === order2.id);

    assert(order1Settlements.every(s => s.status === 'PAUSED'), 'All Order 1 settlements are strictly PAUSED under dispute (BR-04)');
    assert(order2Settlements.every(s => s.status === 'ELIGIBLE'), 'Order 2 settlements remain completely ELIGIBLE for disbursement');

    // Order 2 can be disbursed while Order 1 is frozen
    const stl2 = order2Settlements[0];
    await settlementService.disburseSettlement(stl2.id, admin);
    assert(stl2.status === 'SETTLED', 'Order 2 settlement successfully disbursed during independent Order 1 dispute');

    // Resolve Order 1 dispute
    const openDisputes = await disputeService.getDisputes(buyer);
    const dsp1 = openDisputes.find(d => d.orderId === order1.id)!;
    await disputeService.resolveDispute(dsp1.id, admin, DisputeOutcome.FULL_PAYOUT, 'Inspected and certified compliant');

    assert(order1.hasActiveDispute === false, 'Order 1 active dispute flag cleared');
    assert(order1Settlements.every(s => s.status === 'ELIGIBLE'), 'Order 1 settlements unpaused and now ELIGIBLE');
  }

  // 25. Phase 6.5 Approval-Based Authentication & Role Independence
  console.log('[Suite 25: Phase 6.5 Approval-Based Authentication & Role Independence]');
  {
    // Registration without self-assigned role
    const regRes = await authService.registerAccount({
      fullName: 'Emmanuel Rutayisire',
      phone: '0789111222',
      password: 'SecurePassword123',
      acceptedTerms: true,
    });

    assert(Boolean(regRes.user), 'Registration succeeds without public role selection');
    assert(regRes.user.contactVerified === false, 'New account requires contact verification (contactVerified=false)');
    assert(regRes.user.approvalStatus === 'PENDING', 'New account requires Cargo Operations approval (approvalStatus=PENDING)');

    // Routing policy blocks dashboard access before verification and approval
    const unverifiedRoute = resolveAuthenticatedRoute(regRes.user);
    assert(unverifiedRoute.destination === 'VERIFICATION', 'Unverified user routes to VERIFICATION');
    assert(canAccessDestination('BUYER_WORKSPACE', regRes.user) === false, 'Unverified user cannot access BUYER_WORKSPACE');
    assert(canAccessDestination('SUPPLIER_WORKSPACE', regRes.user) === false, 'Unverified user cannot access SUPPLIER_WORKSPACE');

    // Reject wrong verification code
    const badCodeRes = await authService.verifyContact('000000', regRes.user.id);
    assert(badCodeRes.success === false, 'Rejects invalid verification code');

    // Confirm with correct code
    const correctCode = regRes.user.verificationCode || '123456';
    const verifyRes = await authService.verifyContact(correctCode, regRes.user.id);
    assert(verifyRes.success === true, 'Accepts valid verification code');
    assert(verifyRes.user.contactVerified === true, 'User contact is now verified');
    assert(verifyRes.user.approvalStatus === 'PENDING', 'Account remains in PENDING approval after contact verification');

    // Routing policy holds verified user in APPROVAL_PENDING before role assignment
    const pendingRoute = resolveAuthenticatedRoute(verifyRes.user);
    assert(pendingRoute.destination === 'APPROVAL_PENDING', 'Verified user awaits Cargo Operations approval');
    assert(canAccessDestination('BUYER_WORKSPACE', verifyRes.user) === false, 'Pending approval user cannot access dashboard');

    // Operations assigns role: BUYER
    const approvedBuyer = await authService.simulateCargoApproval(verifyRes.user.id, UserRole.BUYER);
    assert(approvedBuyer.approvalStatus === 'APPROVED', 'Account approvalStatus is now APPROVED');
    assert(approvedBuyer.role === UserRole.BUYER, 'Backend assigns role BUYER');

    const buyerOnboardRoute = resolveAuthenticatedRoute(approvedBuyer);
    assert(buyerOnboardRoute.destination === 'ONBOARDING_BUYER', 'Approved Buyer routes to business onboarding for TIN');

    // Operations assigns role: FIELD_AGENT
    const inspectorUser = await authService.simulateCargoApproval(verifyRes.user.id, UserRole.FIELD_AGENT);
    assert(inspectorUser.role === UserRole.FIELD_AGENT, 'Backend authorizes Field Inspector');
  }

  // 26. Phase 6.5 Central Warehouse Stock Aggregation & Atomic Allocation
  console.log('[Suite 26: Phase 6.5 Central Warehouse Stock Aggregation & Atomic Allocation]');
  {
    // Aggregate warehouse stock across existing eligible lots
    const allStock = await warehouseService.getAggregatedStock();
    assert(allStock.length > 0, 'Returns aggregated central warehouse stock groups');

    for (const group of allStock) {
      assert(group.totalEligibleQuantityKg >= group.availableToOrderKg, 'Total eligible quantity >= available to order');
      assert(group.totalEligibleQuantityKg === group.availableToOrderKg + group.reservedQuantityKg, 'Total = available + reserved');
      assert(group.grade !== QualityGrade.REJECT, 'Aggregated warehouse stock strictly excludes rejected lots (BR-02)');
      assert(Boolean(group.hubLocation), 'Aggregated stock provides macro hub location');
      // Farmer privacy: No private supplier IDs or phones leaked in group
      assert((group as any).supplierId === undefined, 'Stock group strips supplierId (BR-05)');
      assert((group as any).supplierPhone === undefined, 'Stock group strips supplierPhone (BR-05)');
    }

    // Atomic order placement across aggregated stock
    const targetGroup = allStock.find(g => g.availableToOrderKg >= 500);
    if (targetGroup) {
      const orderQty = 500;
      const initialAvailable = targetGroup.availableToOrderKg;
      const buyerUser = SEED_USERS.find(u => u.role === UserRole.BUYER)!;

      const order = await warehouseService.placeOrderFromStock(buyerUser, {
        stockGroupId: targetGroup.id,
        quantityKg: orderQty,
        deliveryDistrict: 'Gasabo',
        deliveryAddress: 'Kigali Central Receiving Facility',
      });

      assert(Boolean(order), 'Atomic order placement from central warehouse stock succeeds');
      assert(order.status === OrderStatus.CONFIRMED, 'Generated order starts in CONFIRMED state');
      assert(order.totalQuantityKg === orderQty, 'Allocated order quantity matches requested quantity');
      assert(order.buyerFeeRwf === Math.round(order.subtotalRwf * 0.05), 'Buyer platform fee is exactly 5% (BR-04)');

      // Verify stock group available quantity is reduced atomically
      const updatedGroup = await warehouseService.getStockGroupById(targetGroup.id);
      assert(updatedGroup!.availableToOrderKg === initialAvailable - orderQty, 'Available stock reduced by order quantity');
      assert(updatedGroup!.reservedQuantityKg === targetGroup.reservedQuantityKg + orderQty, 'Reserved stock increased by order quantity');
    }
  }

  // 27. Phase 6.5 Supplier Flow & Lot Status Lifecycle
  console.log('[Suite 27: Phase 6.5 Supplier Flow & Lot Status Lifecycle]');
  {
    const supplierUser = SEED_USERS.find(u => u.role === UserRole.SUPPLIER)!;

    // Lot declaration without harvest date input (today's date passed internally while asserting harvest readiness)
    const newLot = await lotService.createLot(
      {
        cropName: 'Dry Beans',
        cropType: 'NON_PERISHABLE',
        variety: 'Colta',
        totalQuantityKg: 3500,
        pricePerKgRwf: 680,
        harvestDate: new Date().toISOString().split('T')[0],
        availabilityDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        pickupDistrict: 'Nyagatare',
        pickupSector: 'Katabagemu',
        pickupLocationDetails: 'Cooperative Central Warehouse',
        photos: ['https://example.com/lot-beans-01.jpg'],
        harvestConfirmed: true,
      },
      supplierUser
    );

    assert(newLot.status === LotStatus.SUBMITTED, 'New lot starts in SUBMITTED status');
    assert(newLot.cropType === 'NON_PERISHABLE', 'Preserves perishable/non-perishable crop type');

    // Transitions through full Phase 6.5 lifecycle: SUBMITTED -> INSPECTION -> VERIFIED -> RESERVED -> DELIVERY -> DELIVERED
    assert(canTransitionLot(LotStatus.SUBMITTED, LotStatus.INSPECTION), 'Can transition SUBMITTED -> INSPECTION');
    assert(canTransitionLot(LotStatus.INSPECTION, LotStatus.VERIFIED), 'Can transition INSPECTION -> VERIFIED');
    assert(canTransitionLot(LotStatus.VERIFIED, LotStatus.RESERVED), 'Can transition VERIFIED -> RESERVED');
    assert(canTransitionLot(LotStatus.RESERVED, LotStatus.DELIVERY), 'Can transition RESERVED -> DELIVERY');
    assert(canTransitionLot(LotStatus.DELIVERY, LotStatus.DELIVERED), 'Can transition DELIVERY -> DELIVERED');
  }

  // 28. Phase 6.5 Field Inspector District Tasks, 5-Minute Edit Window & Checklists
  console.log('[Suite 28: Phase 6.5 Field Inspector District Tasks, 5-Minute Edit Window & Checklists]');
  {
    const agentUser = SEED_USERS.find(u => u.role === UserRole.FIELD_AGENT)!;

    // District-based task filtering
    const nyagatareTasks = await gradingService.getAgentTasks({
      district: 'Nyagatare',
      statusFilter: 'ALL',
    });
    assert(nyagatareTasks.every(t => t.lot.pickupDistrict.toLowerCase() === 'nyagatare'), 'Filters tasks strictly by authorized district');

    // Authoritative Rwanda locations
    assert(RWANDA_DISTRICTS.includes('Nyagatare'), 'Authoritative locations contain Nyagatare');
    assert(RWANDA_DISTRICTS.includes('Gasabo'), 'Authoritative locations contain Gasabo');
    assert(RWANDA_DISTRICTS.length === 30, 'Authoritative locations contains all 30 Rwandan districts');

    // Submit grading with checklist
    const pendingTasks = await gradingService.getAgentTasks({ statusFilter: 'PENDING' });
    const lotToGrade = pendingTasks[0]?.lot;
    if (lotToGrade) {
      const grading = await gradingService.submitGrading(
        lotToGrade.id,
        agentUser,
        { moisture: 13.0, foreignMatter: 0.8, defects: 1.2 },
        [],
        'Complies with standard jute bags and dry depot.',
        { lat: -1.298, lng: 30.334 },
        {
          identity_match: true,
          variety_verified: true,
          packaging_intact: true,
          contamination_check: true,
          storage_dryness: true,
        }
      );

      assert(grading.calculatedGrade === QualityGrade.GRADE_A, 'Calculates Grade A based on threshold criteria');
      assert(grading.submissionTimestamp !== undefined, 'Records submissionTimestamp');
      assert(grading.editDeadline !== undefined, 'Sets 5-minute editDeadline');

      // 5-minute post-submission editing window eligibility check
      const eligibility = gradingService.checkEditEligibility(grading);
      assert(eligibility.canEdit === true, 'Permits post-submission editing within 5 minutes');
      assert(eligibility.remainingSeconds > 0 && eligibility.remainingSeconds <= 300, 'Remaining time is <= 300 seconds');

      // Update inspection within the 5-minute window
      const updated = await gradingService.updateGrading(grading.id, agentUser, {
        moisture: 13.8, // Should shift grade to Grade B (>13.5)
        foreignMatter: 0.8,
        defects: 1.2,
        notes: 'Adjusted moisture meter calibration readings.',
      });

      assert(updated.calculatedGrade === QualityGrade.GRADE_B, 'Recalculates grade dynamically to Grade B upon updated moisture');
      assert(updated.editHistory !== undefined && updated.editHistory.length > 0, 'Maintains tamper-evident audit history of permitted edits');

      // Expired deadline rejects editing
      const expiredRecord = { ...grading, editDeadline: new Date(Date.now() - 60000).toISOString() };
      const expiredCheck = gradingService.checkEditEligibility(expiredRecord);
      assert(expiredCheck.canEdit === false, 'Locks editing once 5-minute deadline has expired');
    }
  }

  console.log(`\n========================================`);
  console.log(`Tests run: ${passed + failed}`);
  console.log(`Passed:    ${passed}`);
  console.log(`Failed:    ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test execution failure:', err);
  process.exit(1);
});
