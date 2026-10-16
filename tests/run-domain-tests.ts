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
import { calculateBuyerTotal, calculateSupplierPayout } from '../src/domain/calculations/feeCalculator';
import { formatQuantity, formatRwf, calculateRemainingQuantity } from '../src/domain/calculations/lotCalculations';
import { projectLotForBuyer, projectAllocationsForBuyer } from '../src/domain/projections/buyerProjections';
import { LotStatus, OrderStatus, QualityGrade, PaymentStatus, UserRole, VerificationStatus, OfferStatus, DisputeStatus, DisputeOutcome, PaymentMethod } from '../src/domain/enums';
import { Lot, Order, User, Organization, GradingRecord, Offer, SettlementRecord, Dispute } from '../src/domain/models';
import { resolveAuthenticatedRoute, canAccessDestination } from '../src/core/navigation/routingPolicy';
import { authService, normalizeRwandanPhone, isValidEmail, mockState, lotService, gradingService, adminApprovalService, offerService, orderService, disputeService, settlementService } from '../src/services/mock/mockServices';

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
