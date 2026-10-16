import {
  SEED_USERS,
  SEED_ORGANIZATIONS,
  SEED_LOTS,
  SEED_OFFERS,
  SEED_ORDERS,
  SEED_NOTIFICATIONS,
} from './seedData';
import {
  User,
  Organization,
  Lot,
  BuyerLotProjection,
  GradingRecord,
  Offer,
  Order,
  Dispute,
  AppNotification,
  OfflineQueueItem,
} from '../../domain/models';
import {
  UserRole,
  OrganizationType,
  VerificationStatus,
  LotStatus,
  OrderStatus,
  QualityGrade,
  OfferStatus,
  PaymentStatus,
  PaymentMethod,
  DisputeStatus,
  DisputeOutcome,
  SyncStatus,
  NotificationType,
} from '../../domain/enums';
import { validateLotDeclaration, LotValidationInput } from '../../domain/validation/lotValidation';
import { isLotBuyerVisible, validateLotTransition } from '../../domain/workflows/lotWorkflow';
import { validateOrderTransition } from '../../domain/workflows/orderWorkflow';
import { projectLotForBuyer } from '../../domain/projections/buyerProjections';
import { localStorage } from '../../data/local/storage';

// In-Memory state initialized from Seed or LocalStorage
let usersState: User[] = [...SEED_USERS];
let organizationsState: Organization[] = [...SEED_ORGANIZATIONS];
let lotsState: Lot[] = [...SEED_LOTS];
let offersState: Offer[] = [...SEED_OFFERS];
let ordersState: Order[] = [...SEED_ORDERS];
let disputesState: Dispute[] = [];
let notificationsState: AppNotification[] = [...SEED_NOTIFICATIONS];
let gradingRecordsState: GradingRecord[] = [];
let isSimulatedOffline = false;

export const mockState = {
  isOffline: () => isSimulatedOffline,
  setOffline: (offline: boolean) => {
    isSimulatedOffline = offline;
  },
  resetAll: async () => {
    usersState = [...SEED_USERS];
    organizationsState = [...SEED_ORGANIZATIONS];
    lotsState = [...SEED_LOTS];
    offersState = [...SEED_OFFERS];
    ordersState = [...SEED_ORDERS];
    disputesState = [];
    notificationsState = [...SEED_NOTIFICATIONS];
    gradingRecordsState = [];
    await localStorage.clearAllData();
  },
};

// 1. Authentication Service
export const authService = {
  async login(phoneOrEmail: string, password?: string): Promise<{ user: User; requiresOtp: boolean }> {
    const clean = phoneOrEmail.trim().toLowerCase();
    const user = usersState.find(
      u => u.phone === clean || u.email.toLowerCase() === clean
    );

    if (!user) {
      throw new Error('User not found with provided credentials.');
    }

    if (user.isLocked) {
      throw new Error('Account is temporarily locked due to repeated failed attempts (FR-AUTH-05).');
    }

    if (!user.isActive) {
      throw new Error('This account is suspended (FR-AUTH-07).');
    }

    // In demo mode, require simulated OTP for all first device logins
    await localStorage.setSessionUser(user);
    return { user, requiresOtp: true };
  },

  async register(input: {
    fullName: string;
    phone: string;
    email?: string;
    password?: string;
    role: UserRole;
    organizationName?: string;
    district?: string;
    sector?: string;
    preferredLanguage?: 'en' | 'rw';
  }): Promise<{ user: User; requiresOtp: boolean }> {
    const rawPhone = input.phone.trim();
    // Normalize phone number (handle Rwanda +250 or 07...)
    let cleanPhone = rawPhone.replace(/\s+/g, '');
    if (cleanPhone.startsWith('07')) {
      cleanPhone = `+250${cleanPhone.substring(1)}`;
    } else if (cleanPhone.startsWith('7') && cleanPhone.length === 9) {
      cleanPhone = `+250${cleanPhone}`;
    }

    const cleanEmail = input.email ? input.email.trim().toLowerCase() : undefined;

    // Check for existing account with same phone or email
    const existing = usersState.find(
      u => u.phone === cleanPhone || (cleanEmail && u.email.toLowerCase() === cleanEmail)
    );
    if (existing) {
      throw new Error('An account with this phone number or email already exists.');
    }

    let organizationId = 'org-cargo-operations';
    if (input.role === UserRole.SUPPLIER || input.role === UserRole.BUYER) {
      organizationId = `org-${input.role.toLowerCase()}-${Date.now()}`;
      const newOrg: Organization = {
        id: organizationId,
        name:
          input.organizationName?.trim() ||
          `${input.fullName.trim()}'s ${input.role === UserRole.SUPPLIER ? 'Cooperative' : 'Enterprise'}`,
        type: input.role === UserRole.SUPPLIER ? OrganizationType.SUPPLIER : OrganizationType.BUYER,
        registrationNumber: `RCA/2026/${Math.floor(1000 + Math.random() * 9000)}`,
        district: input.district || 'Kigali',
        sector: input.sector || 'Nyarugenge',
        contactPerson: input.fullName.trim(),
        phone: cleanPhone,
        cropsGrown: input.role === UserRole.SUPPLIER ? ['Maize', 'Dry Beans'] : undefined,
        verificationStatus: VerificationStatus.PENDING,
        createdAt: new Date().toISOString(),
      };
      organizationsState.unshift(newOrg);
    }

    const newUser: User = {
      id: `usr-${input.role.toLowerCase()}-${Date.now()}`,
      fullName: input.fullName.trim(),
      phone: cleanPhone,
      email: cleanEmail || `${input.fullName.trim().toLowerCase().replace(/[^a-z0-9]/g, '.')}@cargo.rw`,
      role: input.role,
      organizationId,
      preferredLanguage: input.preferredLanguage || 'rw',
      isActive: true,
      isLocked: false,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
    };

    usersState.unshift(newUser);
    await localStorage.setSessionUser(newUser);
    return { user: newUser, requiresOtp: true };
  },

  async verifyOtp(code: string): Promise<boolean> {
    // Simulated OTP check: any 6 digit code works
    if (code && code.trim().length === 6) {
      return true;
    }
    throw new Error('Invalid verification code. Please enter 6 digits.');
  },

  async getCurrentUser(): Promise<User | null> {
    return await localStorage.getSessionUser();
  },

  async logout(): Promise<void> {
    await localStorage.setSessionUser(null);
  },

  getUserOrganization(user: User): Organization | undefined {
    return organizationsState.find(o => o.id === user.organizationId);
  },
};

// 2. Lots Service
export const lotService = {
  async getLotsForSupplier(supplierOrgId: string): Promise<Lot[]> {
    return lotsState.filter(l => l.organizationId === supplierOrgId);
  },

  async getLotById(id: string): Promise<Lot | undefined> {
    return lotsState.find(l => l.id === id);
  },

  async createLot(input: LotValidationInput, user: User): Promise<Lot> {
    const validation = validateLotDeclaration(input);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      throw new Error(firstError);
    }

    const org = organizationsState.find(o => o.id === user.organizationId);
    if (!org) throw new Error('Supplier organization not found');

    const lotCount = lotsState.length + 1;
    const prefix = input.cropName.substring(0, 2).toUpperCase();
    const lotCode = `LOT-${prefix}-202610-${String(lotCount).padStart(3, '0')}`;

    const newLot: Lot = {
      id: `lot-${Date.now()}`,
      lotCode,
      supplierId: user.id,
      organizationId: user.organizationId,
      cropName: input.cropName,
      variety: input.variety,
      totalQuantityKg: input.totalQuantityKg,
      remainingQuantityKg: input.totalQuantityKg,
      reservedQuantityKg: 0,
      pricePerKgRwf: input.pricePerKgRwf,
      harvestDate: input.harvestDate,
      availabilityDate: input.availabilityDate,
      pickupDistrict: input.pickupDistrict,
      pickupSector: input.pickupSector,
      pickupLocationDetails: input.pickupLocationDetails,
      photos: input.photos,
      status: LotStatus.SUBMITTED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    lotsState.unshift(newLot);

    // Notify agent that new lot is ready for inspection
    notificationsState.unshift({
      id: `ntf-${Date.now()}`,
      userId: 'usr-agent-01',
      type: NotificationType.LOT,
      titleEn: `New Lot Submitted: ${lotCode}`,
      titleRw: `Umusaruro mushya woherejwe: ${lotCode}`,
      messageEn: `${input.cropName} (${input.totalQuantityKg.toLocaleString()} kg) is ready for inspection in ${input.pickupDistrict}.`,
      messageRw: `${input.cropName} (${input.totalQuantityKg.toLocaleString()} kg) witeguye gusurwa muri ${input.pickupDistrict}.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return newLot;
  },

  async getBuyerCatalogue(
    cropFilter?: string,
    gradeFilter?: string,
    districtFilter?: string,
    searchQuery?: string,
    categoryFilter?: string,
    sortBy?: string
  ): Promise<BuyerLotProjection[]> {
    // BR-02: ONLY lots that are verified and approved by admin & graded by agent
    let filtered = lotsState.filter(l => isLotBuyerVisible(l));

    if (cropFilter && cropFilter !== 'All' && cropFilter !== 'ALL') {
      filtered = filtered.filter(l => l.cropName.toLowerCase() === cropFilter.toLowerCase());
    }

    if (gradeFilter && gradeFilter !== 'All' && gradeFilter !== 'ALL') {
      filtered = filtered.filter(l => l.grade === gradeFilter);
    }

    if (districtFilter && districtFilter !== 'All' && districtFilter !== 'ALL') {
      filtered = filtered.filter(l => l.pickupDistrict.toLowerCase() === districtFilter.toLowerCase());
    }

    if (categoryFilter && categoryFilter !== 'ALL') {
      const cat = categoryFilter.toUpperCase();
      filtered = filtered.filter(l => {
        const name = l.cropName.toLowerCase();
        if (cat === 'GRAINS') return name.includes('maize') || name.includes('rice') || name.includes('wheat') || name.includes('corn');
        if (cat === 'LEGUMES') return name.includes('bean') || name.includes('soy') || name.includes('peas');
        if (cat === 'ROOTS') return name.includes('potato') || name.includes('cassava');
        if (cat === 'VEGETABLES') return name.includes('tomato') || name.includes('onion') || name.includes('pepper') || name.includes('cabbage');
        if (cat === 'FRUITS') return name.includes('avocado') || name.includes('banana') || name.includes('mango');
        if (cat === 'CASH_CROPS') return name.includes('coffee') || name.includes('tea');
        return true;
      });
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(l => {
        return (
          l.cropName.toLowerCase().includes(q) ||
          (l.variety && l.variety.toLowerCase().includes(q)) ||
          l.pickupDistrict.toLowerCase().includes(q) ||
          l.pickupSector.toLowerCase().includes(q) ||
          l.lotCode.toLowerCase().includes(q)
        );
      });
    }

    if (sortBy === 'PRICE_ASC') {
      filtered.sort((a, b) => a.pricePerKgRwf - b.pricePerKgRwf);
    } else if (sortBy === 'PRICE_DESC') {
      filtered.sort((a, b) => b.pricePerKgRwf - a.pricePerKgRwf);
    } else if (sortBy === 'QTY_DESC') {
      filtered.sort((a, b) => b.remainingQuantityKg - a.remainingQuantityKg);
    } else {
      // Default: NEWEST
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered.map(l => projectLotForBuyer(l));
  },
};

// 3. Quality & Grading Service
export const gradingService = {
  async getAgentTasks(): Promise<{ lot: Lot; org?: Organization }[]> {
    const pendingLots = lotsState.filter(l => l.status === LotStatus.SUBMITTED);
    return pendingLots.map(lot => ({
      lot,
      org: organizationsState.find(o => o.id === lot.organizationId),
    }));
  },

  async submitGrading(
    lotId: string,
    agent: User,
    measurements: { moisture: number; foreignMatter: number; defects: number },
    photos: string[],
    notes: string,
    gps?: { lat: number; lng: number }
  ): Promise<GradingRecord> {
    const lot = lotsState.find(l => l.id === lotId);
    if (!lot) throw new Error('Lot not found');

    // Deterministic grade calculation based on agricultural thresholds
    let calculatedGrade = QualityGrade.GRADE_A;
    if (measurements.moisture > 14.5 || measurements.foreignMatter > 2.0 || measurements.defects > 4.0) {
      calculatedGrade = QualityGrade.GRADE_C;
    } else if (measurements.moisture > 13.5 || measurements.foreignMatter > 1.0 || measurements.defects > 2.0) {
      calculatedGrade = QualityGrade.GRADE_B;
    }

    const gradingRecord: GradingRecord = {
      id: `grd-${Date.now()}`,
      lotId,
      fieldAgentId: agent.id,
      fieldAgentName: agent.fullName,
      measurements: [
        { metricName: 'moisture', labelEn: 'Moisture', labelRw: 'Ubuhehere', value: measurements.moisture, unit: '%', passedThreshold: measurements.moisture <= 14.0 },
        { metricName: 'foreignMatter', labelEn: 'Foreign Matter', labelRw: 'Ibintu bitarimo', value: measurements.foreignMatter, unit: '%', passedThreshold: measurements.foreignMatter <= 1.5 },
        { metricName: 'defects', labelEn: 'Defective Grain', labelRw: 'Ibyangiritse', value: measurements.defects, unit: '%', passedThreshold: measurements.defects <= 3.0 },
      ],
      moisturePercentage: measurements.moisture,
      foreignMatterPercentage: measurements.foreignMatter,
      defectiveRatePercentage: measurements.defects,
      calculatedGrade,
      finalGrade: calculatedGrade,
      photos,
      gpsLatitude: gps?.lat,
      gpsLongitude: gps?.lng,
      notes,
      isOfflineSubmission: isSimulatedOffline,
      createdAt: new Date().toISOString(),
    };

    gradingRecordsState.push(gradingRecord);

    if (isSimulatedOffline) {
      // Enqueue to persistent offline queue
      await localStorage.enqueueOfflineItem({
        id: `op-${Date.now()}`,
        type: 'SUBMIT_GRADING',
        payload: { lotId, gradingRecord },
        status: SyncStatus.QUEUED,
        retryCount: 0,
        createdAt: new Date().toISOString(),
      });
      return gradingRecord;
    }

    // Server authoritative update
    lot.grade = calculatedGrade;
    lot.gradedAt = new Date().toISOString();
    lot.inspectedByAgentId = agent.id;
    // In demo flow, admin approves graded lot so it becomes buyer-visible
    lot.status = LotStatus.VERIFIED;
    lot.adminApprovedAt = new Date().toISOString();
    lot.updatedAt = new Date().toISOString();

    // Notify supplier
    notificationsState.unshift({
      id: `ntf-${Date.now()}`,
      userId: lot.supplierId,
      type: NotificationType.LOT,
      titleEn: `Lot Graded: ${lot.lotCode}`,
      titleRw: `Umusaruro wagenzuwe: ${lot.lotCode}`,
      messageEn: `Your lot was graded ${calculatedGrade} and is now visible to institutional buyers.`,
      messageRw: `Umusaruro wawe wabonye ${calculatedGrade} ukaba ugaragara ku isoko ry'abaguzi.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return gradingRecord;
  },
};

// 4. Offers & Negotiation Service
export const offerService = {
  async getOffersForBuyer(buyerOrgId: string): Promise<Offer[]> {
    return offersState.filter(o => o.buyerOrgId === buyerOrgId);
  },

  async respondToOffer(
    offerId: string,
    action: 'ACCEPT' | 'DECLINE' | 'COUNTER',
    notes?: string,
    counterPricePerKgRwf?: number
  ): Promise<Offer> {
    const offer = offersState.find(o => o.id === offerId);
    if (!offer) throw new Error('Offer not found');

    if (offer.status !== OfferStatus.PROPOSED && offer.status !== OfferStatus.COUNTERED) {
      throw new Error(`Cannot respond to offer in ${offer.status} status`);
    }

    if (action === 'ACCEPT') {
      // Atomic reservation across ALL allocations (FR-REQ-06)
      for (const line of offer.lines) {
        const lot = lotsState.find(l => l.id === line.lotId);
        if (!lot || lot.remainingQuantityKg < line.quantityKg) {
          throw new Error(`Stock allocation for lot ${line.lotCode} is no longer available. Cannot accept offer.`);
        }
      }

      // Reserve stock atomically
      for (const line of offer.lines) {
        const lot = lotsState.find(l => l.id === line.lotId)!;
        lot.remainingQuantityKg -= line.quantityKg;
        lot.reservedQuantityKg += line.quantityKg;
        lot.status = LotStatus.RESERVED;
      }

      offer.status = OfferStatus.ACCEPTED;
      offer.negotiationTimeline.push({
        id: `neg-${Date.now()}`,
        senderRole: UserRole.BUYER,
        senderName: 'David (Buyer)',
        timestamp: new Date().toISOString(),
        action: 'ACCEPT',
        notes: notes || 'Offer accepted. Please prepare order confirmation.',
      });

      // Create new Order automatically from accepted offer (FR-ORD-01)
      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: `ORD-202610-${String(ordersState.length + 1).padStart(3, '0')}`,
        offerId: offer.id,
        buyerOrgId: offer.buyerOrgId,
        buyerOrgName: 'Kigali Institutional Foods Ltd',
        cropName: offer.lines[0]?.lotCode.includes('MZ') ? 'Maize' : 'Dry Beans',
        grade: offer.lines[0]?.grade || QualityGrade.GRADE_A,
        totalQuantityKg: offer.totalQuantityKg,
        pricePerKgRwf: offer.averagePricePerKgRwf,
        subtotalRwf: offer.subtotalRwf,
        buyerFeeRwf: offer.platformFeeRwf,
        totalAmountRwf: offer.totalPriceRwf,
        allocations: offer.lines.map((l, i) => ({
          id: `alloc-${Date.now()}-${i}`,
          lotId: l.lotId,
          lotCode: l.lotCode,
          supplierOrgId: l.supplierOrgId,
          supplierOrgName: 'Twizamure Maize Cooperative',
          quantityKg: l.quantityKg,
          pricePerKgRwf: l.unitPriceRwf,
          subtotalRwf: l.subtotalRwf,
          supplierFeeRwf: Math.round((l.subtotalRwf * 3) / 100),
          expectedSupplierPayoutRwf: l.subtotalRwf - Math.round((l.subtotalRwf * 3) / 100),
          confirmedBySupplier: true,
          confirmedAt: new Date().toISOString(),
        })),
        deliveryDistrict: offer.deliveryDistrict,
        deliverySector: 'Gisozi',
        deliveryAddress: 'Central Receiving Facility, Kigali',
        agreedDeliveryDate: offer.deliveryDate,
        status: OrderStatus.CONFIRMED,
        termsAcceptedByBuyer: true,
        termsAcceptedByBuyerAt: new Date().toISOString(),
        paymentStatus: PaymentStatus.PENDING,
        hasActiveDispute: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      ordersState.unshift(newOrder);
      return offer;
    }

    if (action === 'DECLINE') {
      offer.status = OfferStatus.DECLINED;
      offer.negotiationTimeline.push({
        id: `neg-${Date.now()}`,
        senderRole: UserRole.BUYER,
        senderName: 'David (Buyer)',
        timestamp: new Date().toISOString(),
        action: 'DECLINE',
        notes: notes || 'Offer declined.',
      });
      return offer;
    }

    if (action === 'COUNTER') {
      offer.status = OfferStatus.COUNTERED;
      offer.negotiationTimeline.push({
        id: `neg-${Date.now()}`,
        senderRole: UserRole.BUYER,
        senderName: 'David (Buyer)',
        timestamp: new Date().toISOString(),
        action: 'COUNTER',
        notes: notes || 'Counter proposal submitted',
        counterPricePerKgRwf,
      });
      return offer;
    }

    return offer;
  },
};

// 5. Orders & Trade Management Service
export const orderService = {
  async getOrders(user: User): Promise<Order[]> {
    if (user.role === UserRole.BUYER) {
      return ordersState.filter(o => o.buyerOrgId === user.organizationId);
    }
    if (user.role === UserRole.SUPPLIER) {
      return ordersState.filter(o =>
        o.allocations.some(a => a.supplierOrgId === user.organizationId)
      );
    }
    return ordersState;
  },

  async simulatePayment(orderId: string, method: PaymentMethod): Promise<Order> {
    const order = ordersState.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.PAYMENT_PENDING) {
      throw new Error(`Cannot pay order in ${order.status} status`);
    }

    // Realistic simulated payment confirmation
    order.status = OrderStatus.PAID;
    order.paymentStatus = PaymentStatus.CONFIRMED;
    order.paymentReference = method === PaymentMethod.MOBILE_MONEY ? `MOMO-RW-${Date.now().toString().slice(-6)}` : `BK-RW-${Date.now().toString().slice(-6)}`;
    order.paidAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    // Auto trigger dispatch in demo mode
    order.status = OrderStatus.DISPATCHED;
    order.dispatchedAt = new Date().toISOString();

    return order;
  },

  async recordDeliveryReceipt(
    orderId: string,
    buyerUserId: string,
    receivedKg: number,
    receivedGrade: QualityGrade,
    action: 'ACCEPT_FULL' | 'ACCEPT_ADJUSTED' | 'DISPUTED',
    notes?: string
  ): Promise<Order> {
    const order = ordersState.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    if (order.status !== OrderStatus.DISPATCHED && order.status !== OrderStatus.DELIVERED) {
      throw new Error(`Cannot record delivery for order in ${order.status} status`);
    }

    if (action === 'DISPUTED') {
      order.status = OrderStatus.DISPUTED;
      order.hasActiveDispute = true;
      order.updatedAt = new Date().toISOString();

      // Create linked dispute record
      disputesState.unshift({
        id: `dsp-${Date.now()}`,
        disputeCode: `DSP-202610-${String(disputesState.length + 1).padStart(3, '0')}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        openedByUserId: buyerUserId,
        openedByRole: UserRole.BUYER,
        reason: 'Quantity or quality discrepancy upon delivery (FR-DEL-04)',
        description: notes || 'Delivery discrepancy reported',
        evidencePhotos: [],
        amountOnHoldRwf: order.totalAmountRwf,
        status: DisputeStatus.OPEN,
        createdAt: new Date().toISOString(),
      });

      return order;
    }

    // Acceptance triggers settlement eligibility
    order.status = OrderStatus.ACCEPTED;
    order.acceptedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    // In demo flow, mark settled
    order.status = OrderStatus.SETTLED;

    // Mark constituent lots as SOLD
    for (const alloc of order.allocations) {
      const lot = lotsState.find(l => l.id === alloc.lotId);
      if (lot) {
        lot.reservedQuantityKg -= alloc.quantityKg;
        if (lot.remainingQuantityKg === 0 && lot.reservedQuantityKg === 0) {
          lot.status = LotStatus.SOLD;
        }
      }
    }

    return order;
  },
};

// 6. Disputes Service
export const disputeService = {
  async getDisputes(user: User): Promise<Dispute[]> {
    return disputesState;
  },

  async openDispute(
    orderId: string,
    user: User,
    reason: string,
    description: string,
    photos: string[]
  ): Promise<Dispute> {
    const order = ordersState.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    order.status = OrderStatus.DISPUTED;
    order.hasActiveDispute = true;

    const newDispute: Dispute = {
      id: `dsp-${Date.now()}`,
      disputeCode: `DSP-202610-${String(disputesState.length + 1).padStart(3, '0')}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      openedByUserId: user.id,
      openedByRole: user.role,
      reason,
      description,
      evidencePhotos: photos,
      amountOnHoldRwf: order.totalAmountRwf,
      status: DisputeStatus.OPEN,
      createdAt: new Date().toISOString(),
    };

    disputesState.unshift(newDispute);
    return newDispute;
  },
};

// 7. Offline Queue Synchronization Service
export const offlineQueueService = {
  async syncPendingQueue(): Promise<{ syncedCount: number; errors: string[] }> {
    const queue = await localStorage.getOfflineQueue();
    const pending = queue.filter(q => q.status === SyncStatus.QUEUED || q.status === SyncStatus.FAILED);
    const errors: string[] = [];
    let syncedCount = 0;

    for (const item of pending) {
      try {
        if (item.type === 'SUBMIT_GRADING') {
          const { lotId, gradingRecord } = item.payload;
          const lot = lotsState.find(l => l.id === lotId);
          if (lot) {
            lot.grade = gradingRecord.finalGrade;
            lot.gradedAt = gradingRecord.createdAt;
            lot.status = LotStatus.VERIFIED;
            lot.adminApprovedAt = new Date().toISOString();
          }
        }
        await localStorage.updateOfflineItem(item.id, { status: SyncStatus.SYNCED });
        syncedCount++;
      } catch (err: any) {
        errors.push(`Failed syncing item ${item.id}: ${err.message}`);
        await localStorage.updateOfflineItem(item.id, {
          status: SyncStatus.FAILED,
          errorMessage: err.message,
          retryCount: item.retryCount + 1,
        });
      }
    }

    return { syncedCount, errors };
  },
};
