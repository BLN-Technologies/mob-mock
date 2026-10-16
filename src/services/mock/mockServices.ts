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
  SettlementRecord,
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
import {
  canTransitionOffer,
  validateOfferTransition,
  validateOfferStockAvailability,
} from '../../domain/workflows/offerWorkflow';
import {
  createSettlementsFromOrder,
  validateSettlementDisbursement,
} from '../../domain/workflows/settlementWorkflow';
import { calculateBuyerFee, calculateSupplierPayout } from '../../domain/calculations/feeCalculator';
import { projectLotForBuyer } from '../../domain/projections/buyerProjections';
import { localStorage } from '../../data/local/storage';
import { syncCoordinator } from '../sync/syncCoordinator';
import { mockSyncAdapter } from '../sync/syncAdapter';
import {
  IAuthService,
  SupplierRegistrationInput,
  BuyerRegistrationInput,
  AgentInviteRegistrationInput,
  LoginInput,
  AuthResult,
  SessionValidationResult,
  AccountOnboardingStatus,
  ProfileUpdateInput,
} from '../auth/authInterface';

// In-Memory state initialized from Seed or LocalStorage
let usersState: User[] = [...SEED_USERS];
let organizationsState: Organization[] = [...SEED_ORGANIZATIONS];
let lotsState: Lot[] = [...SEED_LOTS];
let offersState: Offer[] = [...SEED_OFFERS];
let ordersState: Order[] = [...SEED_ORDERS];
let settlementsState: SettlementRecord[] = SEED_ORDERS.flatMap(o => createSettlementsFromOrder(o));
let disputesState: Dispute[] = [];
let notificationsState: AppNotification[] = [...SEED_NOTIFICATIONS];
let gradingRecordsState: GradingRecord[] = [];
// Agent Invitation Interface and Initial State
export interface AgentInvitation {
  code: string;
  district: string;
  sector: string;
  supervisorName: string;
  status: 'ACTIVE' | 'EXPIRED' | 'USED';
  expiresAt: string;
}

const INITIAL_AGENT_INVITATIONS: AgentInvitation[] = [
  {
    code: 'AGENT-2026-RW',
    district: 'Nyagatare',
    sector: 'Nyagatare',
    supervisorName: 'Cargo Agronomy Operations',
    status: 'ACTIVE',
    expiresAt: '2026-12-31T23:59:59Z',
  },
  {
    code: 'INV-AG-HUYE',
    district: 'Huye',
    sector: 'Ngoma',
    supervisorName: 'Southern Province Operations',
    status: 'ACTIVE',
    expiresAt: '2026-12-31T23:59:59Z',
  },
  {
    code: 'AGENT-EXP-2025',
    district: 'Musanze',
    sector: 'Muhoza',
    supervisorName: 'Northern Operations',
    status: 'EXPIRED',
    expiresAt: '2025-12-31T23:59:59Z',
  },
  {
    code: 'AGENT-USED-999',
    district: 'Bugesera',
    sector: 'Nyamata',
    supervisorName: 'Eastern Operations',
    status: 'USED',
    expiresAt: '2026-12-31T23:59:59Z',
  },
];

let isSimulatedOffline = false;
let agentInvitationsState: AgentInvitation[] = [...INITIAL_AGENT_INVITATIONS];

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
    settlementsState = SEED_ORDERS.flatMap(o => createSettlementsFromOrder(o));
    disputesState = [];
    notificationsState = [...SEED_NOTIFICATIONS];
    gradingRecordsState = [];
    agentInvitationsState = [...INITIAL_AGENT_INVITATIONS];
    mockSyncAdapter.resetIdempotencyRegistry?.();
    await localStorage.clearAllData();
  },
};

// Phone and Email Normalization Helpers
export function normalizeRwandanPhone(phone: string): string {
  const clean = phone.trim().replace(/\s+/g, '');
  if (clean.startsWith('07')) {
    return `+250${clean.substring(1)}`;
  } else if (clean.startsWith('7') && clean.length === 9) {
    return `+250${clean}`;
  }
  return clean;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// 1. Authentication Service
export const authService: IAuthService & {
  register: (input: {
    fullName: string;
    phone: string;
    email?: string;
    password?: string;
    role: UserRole;
    organizationName?: string;
    district?: string;
    sector?: string;
    preferredLanguage?: 'en' | 'rw';
  }) => Promise<{ user: User; requiresOtp: boolean }>;
} = {
  async login(phoneOrEmailOrInput: string | LoginInput, password?: string): Promise<AuthResult> {
    const identifier = typeof phoneOrEmailOrInput === 'string'
      ? phoneOrEmailOrInput
      : phoneOrEmailOrInput.identifier;
    const clean = identifier.trim().toLowerCase();
    const cleanPhone = normalizeRwandanPhone(clean);

    const user = usersState.find(
      u => u.phone === cleanPhone || u.email.toLowerCase() === clean
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

    const org = organizationsState.find(o => o.id === user.organizationId);

    // In demo mode, require simulated OTP for all first device logins
    await localStorage.setSessionUser(user);
    return { user, requiresOtp: true, organization: org };
  },

  async registerSupplier(input: SupplierRegistrationInput): Promise<AuthResult> {
    if (!input.fullName.trim()) {
      throw new Error('Full name is required.');
    }
    const cleanPhone = normalizeRwandanPhone(input.phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error('A valid Rwandan phone number is required.');
    }
    if (!input.organizationName.trim()) {
      throw new Error('Cooperative or organization name is required.');
    }
    if (!input.district.trim()) {
      throw new Error('District is required.');
    }

    const cleanEmail = input.email ? input.email.trim().toLowerCase() : undefined;
    if (cleanEmail && !isValidEmail(cleanEmail)) {
      throw new Error('Please enter a valid email address.');
    }

    // Check duplicate
    const existing = usersState.find(
      u => u.phone === cleanPhone || (cleanEmail && u.email.toLowerCase() === cleanEmail)
    );
    if (existing) {
      throw new Error('An account with this phone number or email already exists.');
    }

    const orgId = `org-supplier-${Date.now()}`;
    const newOrg: Organization = {
      id: orgId,
      name: input.organizationName.trim(),
      type: OrganizationType.SUPPLIER,
      registrationNumber: `RCA/2026/${Math.floor(1000 + Math.random() * 9000)}`,
      district: input.district.trim(),
      sector: input.sector?.trim() || 'Sector',
      contactPerson: input.fullName.trim(),
      phone: cleanPhone,
      cropsGrown: ['Maize', 'Dry Beans'],
      verificationStatus: VerificationStatus.PENDING,
      createdAt: new Date().toISOString(),
    };
    organizationsState.unshift(newOrg);

    const newUser: User = {
      id: `usr-supplier-${Date.now()}`,
      fullName: input.fullName.trim(),
      phone: cleanPhone,
      email: cleanEmail || `${input.fullName.trim().toLowerCase().replace(/[^a-z0-9]/g, '.')}@cargo.rw`,
      role: UserRole.SUPPLIER,
      organizationId: orgId,
      preferredLanguage: input.preferredLanguage || 'rw',
      isActive: true,
      isLocked: false,
      failedLoginAttempts: 0,
      onboardingCompleted: false,
      verificationStatus: VerificationStatus.PENDING,
      createdAt: new Date().toISOString(),
    };

    usersState.unshift(newUser);
    await localStorage.setSessionUser(newUser);
    return { user: newUser, requiresOtp: true, organization: newOrg };
  },

  async registerBuyer(input: BuyerRegistrationInput): Promise<AuthResult> {
    if (!input.fullName.trim()) {
      throw new Error('Full name is required.');
    }
    const cleanPhone = normalizeRwandanPhone(input.phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error('A valid Rwandan phone number is required.');
    }
    if (!input.enterpriseName.trim()) {
      throw new Error('Enterprise or institution name is required.');
    }
    if (!input.district.trim()) {
      throw new Error('District is required.');
    }
    const cleanEmail = input.email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      throw new Error('A valid email address is required for institutional buyers.');
    }

    // Check duplicate
    const existing = usersState.find(
      u => u.phone === cleanPhone || u.email.toLowerCase() === cleanEmail
    );
    if (existing) {
      throw new Error('An account with this phone number or email already exists.');
    }

    const orgId = `org-buyer-${Date.now()}`;
    const newOrg: Organization = {
      id: orgId,
      name: input.enterpriseName.trim(),
      type: OrganizationType.BUYER,
      registrationNumber: `RDB/2026/${Math.floor(1000 + Math.random() * 9000)}`,
      district: input.district.trim(),
      sector: input.sector?.trim() || 'Kigali',
      contactPerson: input.fullName.trim(),
      phone: cleanPhone,
      verificationStatus: VerificationStatus.PENDING,
      createdAt: new Date().toISOString(),
    };
    organizationsState.unshift(newOrg);

    const newUser: User = {
      id: `usr-buyer-${Date.now()}`,
      fullName: input.fullName.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      role: UserRole.BUYER,
      organizationId: orgId,
      preferredLanguage: input.preferredLanguage || 'en',
      isActive: true,
      isLocked: false,
      failedLoginAttempts: 0,
      onboardingCompleted: false,
      verificationStatus: VerificationStatus.PENDING,
      createdAt: new Date().toISOString(),
    };

    usersState.unshift(newUser);
    await localStorage.setSessionUser(newUser);
    return { user: newUser, requiresOtp: true, organization: newOrg };
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
    if (input.role === UserRole.SUPPLIER) {
      const res = await this.registerSupplier({
        fullName: input.fullName,
        phone: input.phone,
        organizationName: input.organizationName || `${input.fullName}'s Cooperative`,
        district: input.district || 'Nyagatare',
        sector: input.sector,
        password: input.password,
        email: input.email,
        preferredLanguage: input.preferredLanguage,
      });
      return { user: res.user, requiresOtp: res.requiresOtp };
    } else if (input.role === UserRole.BUYER) {
      const res = await this.registerBuyer({
        fullName: input.fullName,
        phone: input.phone,
        enterpriseName: input.organizationName || `${input.fullName}'s Enterprise`,
        district: input.district || 'Gasabo (Kigali)',
        sector: input.sector,
        email: input.email || `${input.fullName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@cargo.rw`,
        password: input.password,
        preferredLanguage: input.preferredLanguage,
      });
      return { user: res.user, requiresOtp: res.requiresOtp };
    }

    throw new Error('Public registration only permitted for Supplier or Buyer roles.');
  },

  async validateAgentInvitation(code: string): Promise<AgentInvitation> {
    if (!code || !code.trim()) {
      throw new Error('Please enter your invitation code.');
    }
    const cleanCode = code.trim().toUpperCase();
    const invitation = agentInvitationsState.find(inv => inv.code === cleanCode);
    if (!invitation) {
      throw new Error('Invalid invitation code. Demo fixture codes: AGENT-2026-RW or INV-AG-HUYE');
    }
    if (invitation.status === 'EXPIRED') {
      throw new Error('This invitation code has expired. Please request a new invitation from administrator.');
    }
    if (invitation.status === 'USED') {
      throw new Error('This invitation code has already been redeemed.');
    }
    return invitation;
  },

  async registerFieldAgentWithInvite(input: AgentInviteRegistrationInput): Promise<AuthResult> {
    const invitation = await this.validateAgentInvitation(input.code);

    const cleanPhone = normalizeRwandanPhone(input.phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error('A valid Rwandan phone number is required.');
    }

    const existing = usersState.find(u => u.phone === cleanPhone);
    if (existing) {
      throw new Error('An account with this phone number already exists.');
    }

    const newAgentId = `usr-agent-${Date.now()}`;

    // Mark invitation as redeemed (single-use invariant)
    invitation.status = 'USED';
    invitation.redeemedAt = new Date().toISOString();
    invitation.redeemedByUserId = newAgentId;

    const newUser: User = {
      id: newAgentId,
      fullName: input.fullName.trim(),
      phone: cleanPhone,
      email: `${input.fullName.trim().toLowerCase().replace(/[^a-z0-9]/g, '.')}@cargo.rw`,
      role: UserRole.FIELD_AGENT,
      organizationId: 'org-cargo-operations',
      preferredLanguage: input.preferredLanguage || 'rw',
      isActive: true,
      isLocked: false,
      failedLoginAttempts: 0,
      onboardingCompleted: false,
      verificationStatus: VerificationStatus.VERIFIED,
      agentAssignment: {
        district: invitation.district,
        sector: invitation.sector,
        supervisorName: invitation.supervisorName,
      },
      createdAt: new Date().toISOString(),
    };

    usersState.unshift(newUser);
    await localStorage.setSessionUser(newUser);
    return { user: newUser, requiresOtp: true };
  },

  async verifyOtp(code: string): Promise<boolean> {
    // Simulated OTP verification for demo prototype
    if (code && code.trim().length === 6) {
      return true;
    }
    throw new Error('Invalid verification code. Please enter 6 digits.');
  },

  async restoreSession(): Promise<SessionValidationResult> {
    try {
      const stored = await localStorage.getSessionUser();
      if (!stored) {
        return { isValid: false, user: null };
      }

      // Validate session against active repository
      const matched = usersState.find(u => u.id === stored.id);
      if (!matched) {
        await localStorage.setSessionUser(null);
        return { isValid: false, user: null, error: 'Session user no longer exists in repository.' };
      }

      if (matched.isLocked) {
        await localStorage.setSessionUser(null);
        return { isValid: false, user: null, error: 'Account is locked.' };
      }

      if (!matched.isActive) {
        await localStorage.setSessionUser(null);
        return { isValid: false, user: null, error: 'Account is suspended.' };
      }

      return { isValid: true, user: matched };
    } catch {
      return { isValid: false, user: null, error: 'Failed to read session storage.' };
    }
  },

  async getCurrentUser(): Promise<User | null> {
    return await localStorage.getSessionUser();
  },

  async completeOnboarding(userId: string): Promise<User> {
    const user = usersState.find(u => u.id === userId);
    if (!user) {
      throw new Error(`User ${userId} not found.`);
    }

    user.onboardingCompleted = true;
    await localStorage.setSessionUser(user);
    return user;
  },

  async getOnboardingStatus(user: User): Promise<AccountOnboardingStatus> {
    const org = organizationsState.find(o => o.id === user.organizationId);
    const pendingRequirements: string[] = [];

    if (!user.onboardingCompleted) {
      pendingRequirements.push('Complete role onboarding walkthrough');
    }
    if (org && org.verificationStatus === VerificationStatus.PENDING) {
      pendingRequirements.push('Cooperative / Enterprise institutional verification');
    }

    return {
      userId: user.id,
      onboardingCompleted: Boolean(user.onboardingCompleted),
      verificationStatus: org?.verificationStatus || user.verificationStatus || VerificationStatus.PENDING,
      organization: org,
      pendingRequirements,
    };
  },

  async updateProfile(userId: string, input: ProfileUpdateInput): Promise<User> {
    const user = usersState.find(u => u.id === userId);
    if (!user) {
      throw new Error(`User ${userId} not found.`);
    }

    if (input.fullName) user.fullName = input.fullName.trim();
    if (input.email) user.email = input.email.trim();
    if (input.phone) user.phone = normalizeRwandanPhone(input.phone);
    if (input.preferredLanguage) user.preferredLanguage = input.preferredLanguage;

    await localStorage.setSessionUser(user);
    return user;
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

  async getBuyerLotById(id: string): Promise<BuyerLotProjection | undefined> {
    const lot = lotsState.find(l => l.id === id);
    if (!lot || !isLotBuyerVisible(lot)) {
      return undefined;
    }
    return projectLotForBuyer(lot);
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
      // Enqueue to persistent offline queue with client idempotency key & local inspection persistence
      await syncCoordinator.enqueueInspection(lotId, gradingRecord, agent);
      return gradingRecord;
    }

    // Server authoritative update: Field inspection complete, awaiting administrative approval (BR-02)
    lot.grade = calculatedGrade;
    lot.gradedAt = new Date().toISOString();
    lot.inspectedByAgentId = agent.id;
    lot.updatedAt = new Date().toISOString();

    // Notify supplier
    notificationsState.unshift({
      id: `ntf-${Date.now()}`,
      userId: lot.supplierId,
      type: NotificationType.LOT,
      titleEn: `Lot Graded: ${lot.lotCode}`,
      titleRw: `Umusaruro wagenzuwe: ${lot.lotCode}`,
      messageEn: `Your lot was graded ${calculatedGrade} and is awaiting administrative operations approval before market listing.`,
      messageRw: `Umusaruro wawe wabonye ${calculatedGrade} utegereje kwemezwa n'ubuyobozi bwa Cargo mbere yo kwinjira ku isoko.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return gradingRecord;
  },
};

// 3.1 Administrator Operations & Approval Service (BR-02)
export const adminApprovalService = {
  async getPendingLots(): Promise<Lot[]> {
    // Lots that have been inspected & graded by field agent, but not yet approved by admin
    return lotsState.filter(l => !!l.grade && !l.adminApprovedAt && l.status !== LotStatus.REJECTED);
  },

  async approveLot(lotId: string, adminUser: User): Promise<Lot> {
    const lot = lotsState.find(l => l.id === lotId);
    if (!lot) throw new Error('Lot not found');

    if (adminUser.role !== UserRole.ADMINISTRATOR) {
      throw new Error('Only an authorized Cargo Administrator can approve agricultural lots for trade (BR-02).');
    }

    if (!lot.grade || !lot.inspectedByAgentId) {
      throw new Error('Cannot approve lot: Quality grading by an authorized field agent is strictly required (BR-02).');
    }

    const transitionCheck = validateLotTransition(lot, LotStatus.VERIFIED);
    if (!transitionCheck.success) {
      throw new Error(transitionCheck.error || 'Invalid lot transition to verified');
    }

    lot.status = LotStatus.VERIFIED;
    lot.adminApprovedAt = new Date().toISOString();
    lot.updatedAt = new Date().toISOString();

    // Notify supplier
    notificationsState.unshift({
      id: `ntf-${Date.now()}`,
      userId: lot.supplierId,
      type: NotificationType.LOT,
      titleEn: `Lot Approved for Trade: ${lot.lotCode}`,
      titleRw: `Umusaruro Wemejwe: ${lot.lotCode}`,
      messageEn: `Your lot was approved by Cargo Operations and is now active on the Buyer Discover catalogue.`,
      messageRw: `Umusaruro wawe wemejwe n'ubuyobozi bwa Cargo, ubu uragaragara mu bacuruzi.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return lot;
  },

  async rejectLot(lotId: string, adminUser: User, reason: string): Promise<Lot> {
    const lot = lotsState.find(l => l.id === lotId);
    if (!lot) throw new Error('Lot not found');

    if (adminUser.role !== UserRole.ADMINISTRATOR) {
      throw new Error('Only an authorized Cargo Administrator can reject agricultural lots.');
    }

    lot.status = LotStatus.REJECTED;
    lot.updatedAt = new Date().toISOString();

    // Notify supplier
    notificationsState.unshift({
      id: `ntf-${Date.now()}`,
      userId: lot.supplierId,
      type: NotificationType.LOT,
      titleEn: `Lot Returned / Rejected: ${lot.lotCode}`,
      titleRw: `Umusaruro Wasubijwe Inyuma: ${lot.lotCode}`,
      messageEn: `Lot review not approved: ${reason}`,
      messageRw: `Isuzuma ry'umusaruro ntabwo ryemejwe: ${reason}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return lot;
  },
};

// 4. Offers & Negotiation Service
export const offerService = {
  async getOffersForBuyer(buyerOrgId: string): Promise<Offer[]> {
    return offersState.filter(o => o.buyerOrgId === buyerOrgId);
  },

  async getOffersForSupplier(supplierOrgId: string): Promise<Offer[]> {
    return offersState.filter(o =>
      o.lines.some(l => l.supplierOrgId === supplierOrgId)
    );
  },

  async createOffer(
    buyerUser: User,
    input: {
      lotId: string;
      quantityKg: number;
      unitPriceRwf?: number;
      deliveryDistrict: string;
      deliveryDate: string;
      notes?: string;
    }
  ): Promise<Offer> {
    if (buyerUser.role !== UserRole.BUYER) {
      throw new Error('Only authorized institutional buyers can create purchase offers.');
    }

    const lot = lotsState.find(l => l.id === input.lotId);
    if (!lot) throw new Error('Lot not found');

    if (!isLotBuyerVisible(lot)) {
      throw new Error('Cannot create offer: This lot is not approved or available for trading (BR-02).');
    }

    if (input.quantityKg <= 0 || isNaN(input.quantityKg)) {
      throw new Error('Offer quantity must be greater than zero.');
    }

    if (input.quantityKg > lot.remainingQuantityKg) {
      throw new Error(
        `Requested quantity (${input.quantityKg.toLocaleString()} kg) exceeds remaining available stock (${lot.remainingQuantityKg.toLocaleString()} kg).`
      );
    }

    const unitPrice = input.unitPriceRwf && input.unitPriceRwf > 0 ? input.unitPriceRwf : lot.pricePerKgRwf;
    const subtotalRwf = Math.round(input.quantityKg * unitPrice);
    const buyerFeeCalc = calculateBuyerFee(subtotalRwf);
    const totalPriceRwf = buyerFeeCalc.totalBuyerPayableRwf;

    const offerId = `off-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const offerCount = offersState.length + 1;
    const offerCode = `OFF-202610-${String(offerCount).padStart(3, '0')}`;
    const newOffer: Offer = {
      id: offerId,
      offerCode,
      buyerOrgId: buyerUser.organizationId,
      status: OfferStatus.PROPOSED,
      cropName: lot.cropName,
      grade: lot.grade || QualityGrade.GRADE_A,
      totalQuantityKg: input.quantityKg,
      averagePricePerKgRwf: unitPrice,
      subtotalRwf,
      platformFeeRwf: buyerFeeCalc.buyerFeeRwf,
      inspectionFeeRwf: 0,
      totalPriceRwf,
      deliveryDistrict: input.deliveryDistrict,
      deliveryDate: input.deliveryDate,
      supplierCount: 1,
      lines: [
        {
          id: `line-${Date.now()}`,
          lotId: lot.id,
          lotCode: lot.lotCode,
          cropName: lot.cropName,
          grade: lot.grade || QualityGrade.GRADE_A,
          supplierOrgId: lot.organizationId,
          quantityKg: input.quantityKg,
          unitPriceRwf: unitPrice,
          subtotalRwf,
        },
      ],
      negotiationTimeline: [
        {
          id: `neg-${Date.now()}`,
          senderRole: UserRole.BUYER,
          senderName: buyerUser.fullName,
          timestamp: new Date().toISOString(),
          action: 'PROPOSE',
          notes: input.notes || `Proposed purchase of ${input.quantityKg} kg @ ${unitPrice} RWF/kg`,
        },
      ],
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    offersState.unshift(newOffer);

    // Notify supplier
    notificationsState.unshift({
      id: `ntf-${Date.now()}`,
      userId: lot.supplierId,
      type: NotificationType.OFFER,
      titleEn: `New Purchase Offer: ${lot.lotCode}`,
      titleRw: `Ubusabe bushya bwo kugura: ${lot.lotCode}`,
      messageEn: `Buyer offered ${unitPrice} RWF/kg for ${input.quantityKg.toLocaleString()} kg of ${lot.cropName}.`,
      messageRw: `Umuguzi yasabye kugura ${input.quantityKg.toLocaleString()} kg kuri ${unitPrice} RWF/kg.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return newOffer;
  },

  async respondToOffer(
    offerId: string,
    action: 'ACCEPT' | 'DECLINE' | 'COUNTER',
    notes?: string,
    counterPricePerKgRwf?: number,
    actor?: User
  ): Promise<Offer> {
    const offer = offersState.find(o => o.id === offerId);
    if (!offer) throw new Error('Offer not found');

    const actorRole = actor?.role || (action === 'ACCEPT' && offer.status === OfferStatus.PROPOSED ? UserRole.SUPPLIER : UserRole.BUYER);

    const targetStatus =
      action === 'ACCEPT'
        ? OfferStatus.ACCEPTED
        : action === 'DECLINE'
        ? OfferStatus.DECLINED
        : OfferStatus.COUNTERED;

    const transitionCheck = validateOfferTransition(offer, targetStatus, actorRole, counterPricePerKgRwf);
    if (!transitionCheck.success) {
      throw new Error(transitionCheck.error || `Cannot respond to offer in ${offer.status} status`);
    }

    if (action === 'ACCEPT') {
      // Validate atomic stock availability across all allocations
      const stockCheck = validateOfferStockAvailability(offer, lotId => {
        return lotsState.find(l => l.id === lotId)?.remainingQuantityKg;
      });
      if (!stockCheck.success) {
        throw new Error(stockCheck.error || 'Insufficient stock to accept offer');
      }

      // Reserve stock atomically
      for (const line of offer.lines) {
        const lot = lotsState.find(l => l.id === line.lotId)!;
        lot.remainingQuantityKg -= line.quantityKg;
        lot.reservedQuantityKg += line.quantityKg;
        lot.status = LotStatus.RESERVED;
        lot.updatedAt = new Date().toISOString();
      }

      offer.status = OfferStatus.ACCEPTED;
      offer.negotiationTimeline.push({
        id: `neg-${Date.now()}`,
        senderRole: actorRole,
        senderName: actor?.fullName || (actorRole === UserRole.SUPPLIER ? 'Supplier Representative' : 'Buyer Representative'),
        timestamp: new Date().toISOString(),
        action: 'ACCEPT',
        notes: notes || 'Offer accepted. Trade confirmation order generated.',
      });

      // Create new Order automatically from accepted offer (FR-ORD-01)
      const orderCount = ordersState.length + 1;
      const orderNumber = `ORD-202610-${String(orderCount).padStart(3, '0')}`;
      const buyerOrg = organizationsState.find(o => o.id === offer.buyerOrgId);

      const newOrder: Order = {
        id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        orderNumber,
        offerId: offer.id,
        buyerOrgId: offer.buyerOrgId,
        buyerOrgName: buyerOrg?.name || 'Kigali Institutional Foods Ltd',
        cropName: offer.cropName || (offer.lines[0]?.lotCode.includes('MZ') ? 'Maize' : 'Dry Beans'),
        grade: offer.grade || offer.lines[0]?.grade || QualityGrade.GRADE_A,
        totalQuantityKg: offer.totalQuantityKg,
        pricePerKgRwf: offer.averagePricePerKgRwf,
        subtotalRwf: offer.subtotalRwf,
        buyerFeeRwf: offer.platformFeeRwf,
        totalAmountRwf: offer.totalPriceRwf,
        allocations: offer.lines.map((l, i) => {
          const supplierOrg = organizationsState.find(o => o.id === l.supplierOrgId);
          const supplierFeeCalc = calculateSupplierPayout(l.subtotalRwf);
          return {
            id: `alloc-${Date.now()}-${i}`,
            lotId: l.lotId,
            lotCode: l.lotCode,
            supplierOrgId: l.supplierOrgId,
            supplierOrgName: supplierOrg?.name || 'Partner Agricultural Cooperative',
            quantityKg: l.quantityKg,
            pricePerKgRwf: l.unitPriceRwf,
            subtotalRwf: l.subtotalRwf,
            supplierFeeRwf: supplierFeeCalc.supplierFeeRwf,
            expectedSupplierPayoutRwf: supplierFeeCalc.netPayoutRwf,
            confirmedBySupplier: true,
            confirmedAt: new Date().toISOString(),
          };
        }),
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

      // Create linked settlement records for suppliers (BR-04)
      const settlements = createSettlementsFromOrder(newOrder);
      settlementsState.push(...settlements);

      return offer;
    }

    if (action === 'DECLINE') {
      offer.status = OfferStatus.DECLINED;
      offer.negotiationTimeline.push({
        id: `neg-${Date.now()}`,
        senderRole: actorRole,
        senderName: actor?.fullName || (actorRole === UserRole.SUPPLIER ? 'Supplier' : 'Buyer'),
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
        senderRole: actorRole,
        senderName: actor?.fullName || (actorRole === UserRole.SUPPLIER ? 'Supplier' : 'Buyer'),
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

  async getOrderById(orderId: string): Promise<Order | undefined> {
    return ordersState.find(o => o.id === orderId);
  },

  async simulatePayment(orderId: string, method: PaymentMethod, actor?: User): Promise<Order> {
    const order = ordersState.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.PAYMENT_PENDING) {
      throw new Error(`Cannot pay order in ${order.status} status`);
    }

    // Realistic simulated payment confirmation into Cargo Escrow
    order.status = OrderStatus.PAID;
    order.paymentStatus = PaymentStatus.CONFIRMED;
    order.paymentReference =
      method === PaymentMethod.MOBILE_MONEY
        ? `MOMO-RW-${Date.now().toString().slice(-6)}`
        : `BK-RW-${Date.now().toString().slice(-6)}`;
    order.paidAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    // Notify supplier that payment is confirmed in escrow and dispatch is authorized
    notificationsState.unshift({
      id: `ntf-${Date.now()}`,
      userId: order.allocations[0]?.supplierOrgId || 'usr-supplier-01',
      type: NotificationType.PAYMENT,
      titleEn: `Escrow Payment Confirmed: ${order.orderNumber}`,
      titleRw: `Ubwishyu bwa Escrow Bwemejwe: ${order.orderNumber}`,
      messageEn: `Buyer payment for order ${order.orderNumber} is confirmed in escrow. You may now dispatch shipment.`,
      messageRw: `Ubwishyu bw'umuguzi bwemejwe muri escrow ku ibwiriza ${order.orderNumber}. Ushobora kohereza umusaruro.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return order;
  },

  async dispatchOrder(orderId: string, supplierUser: User): Promise<Order> {
    const order = ordersState.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    // BR-03: Validate that payment is confirmed before dispatch can occur
    if (order.paymentStatus !== PaymentStatus.CONFIRMED || order.status !== OrderStatus.PAID) {
      throw new Error('Cannot dispatch order: Escrow payment is required before dispatch (BR-03)');
    }

    const transitionCheck = validateOrderTransition(order, OrderStatus.DISPATCHED);
    if (!transitionCheck.success) {
      throw new Error(transitionCheck.error || 'Cannot dispatch order: Escrow payment is required before dispatch (BR-03)');
    }

    order.status = OrderStatus.DISPATCHED;
    order.dispatchedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    // Notify buyer that order has been dispatched
    notificationsState.unshift({
      id: `ntf-${Date.now()}`,
      userId: order.buyerOrgId,
      type: NotificationType.ORDER,
      titleEn: `Order Dispatched: ${order.orderNumber}`,
      titleRw: `Ibikoresho Byatangiye Gutwarwa: ${order.orderNumber}`,
      messageEn: `Consignment for order ${order.orderNumber} (${order.cropName}) has been dispatched for delivery to ${order.deliveryDistrict}.`,
      messageRw: `Umusaruro w'ibwiriza ${order.orderNumber} (${order.cropName}) watangiye gutwarwa ujyanywe muri ${order.deliveryDistrict}.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return order;
  },

  async recordDelivery(orderId: string, actor: User, notes?: string): Promise<Order> {
    const order = ordersState.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const transitionCheck = validateOrderTransition(order, OrderStatus.DELIVERED);
    if (!transitionCheck.success) {
      throw new Error(transitionCheck.error || 'Cannot record delivery for this order');
    }

    order.status = OrderStatus.DELIVERED;
    order.deliveredAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    notificationsState.unshift({
      id: `ntf-${Date.now()}`,
      userId: order.buyerOrgId,
      type: NotificationType.ORDER,
      titleEn: `Order Delivered: ${order.orderNumber}`,
      titleRw: `Umusaruro Wageze Aho Woherejwe: ${order.orderNumber}`,
      messageEn: `Order ${order.orderNumber} has arrived at destination. Please inspect and confirm receipt.`,
      messageRw: `Ibikoresho by'ibwiriza ${order.orderNumber} byageze aho byoherejwe. Nyabuneka suzuma kandi wemeze.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return order;
  },

  async acceptOrder(orderId: string, buyerUser: User): Promise<Order> {
    const order = ordersState.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const transitionCheck = validateOrderTransition(order, OrderStatus.ACCEPTED);
    if (!transitionCheck.success) {
      throw new Error(transitionCheck.error || 'Cannot accept order');
    }

    order.status = OrderStatus.ACCEPTED;
    order.acceptedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    // Acceptance triggers settlement eligibility (BR-04)
    for (const stl of settlementsState.filter(s => s.orderId === order.id)) {
      if (stl.status !== 'PAUSED') {
        stl.status = 'ELIGIBLE';
      }
    }

    // Mark lots as SOLD when reserved quantity is consumed
    for (const alloc of order.allocations) {
      const lot = lotsState.find(l => l.id === alloc.lotId);
      if (lot) {
        lot.reservedQuantityKg = Math.max(0, lot.reservedQuantityKg - alloc.quantityKg);
        if (lot.remainingQuantityKg === 0 && lot.reservedQuantityKg === 0) {
          lot.status = LotStatus.SOLD;
        }
        lot.updatedAt = new Date().toISOString();
      }
    }

    notificationsState.unshift({
      id: `ntf-${Date.now()}`,
      userId: order.allocations[0]?.supplierOrgId || 'usr-supplier-01',
      type: NotificationType.ORDER,
      titleEn: `Delivery Accepted: ${order.orderNumber}`,
      titleRw: `Umusaruro Wakiriwe Neza: ${order.orderNumber}`,
      messageEn: `Buyer accepted delivery for order ${order.orderNumber}. Supplier payouts are now eligible for settlement.`,
      messageRw: `Umuguzi yakiriye neza ibicuruzwa. Ubwishyu bwemerewe kwishyurwa koperative.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

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

    // If order was dispatched, mark delivery arrival
    if (order.status === OrderStatus.DISPATCHED) {
      order.deliveredAt = new Date().toISOString();
    }

    if (action === 'DISPUTED') {
      order.status = OrderStatus.DISPUTED;
      order.hasActiveDispute = true;
      order.updatedAt = new Date().toISOString();

      // BR-04: Active dispute strictly pauses settlement
      for (const stl of settlementsState.filter(s => s.orderId === order.id)) {
        stl.status = 'PAUSED';
      }

      // Create linked dispute record
      const disputeCode = `DSP-202610-${String(disputesState.length + 1).padStart(3, '0')}`;
      disputesState.unshift({
        id: `dsp-${Date.now()}`,
        disputeCode,
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

    for (const stl of settlementsState.filter(s => s.orderId === order.id)) {
      if (stl.status !== 'PAUSED') {
        stl.status = 'ELIGIBLE';
      }
    }

    // Mark constituent lots as SOLD
    for (const alloc of order.allocations) {
      const lot = lotsState.find(l => l.id === alloc.lotId);
      if (lot) {
        lot.reservedQuantityKg = Math.max(0, lot.reservedQuantityKg - alloc.quantityKg);
        if (lot.remainingQuantityKg === 0 && lot.reservedQuantityKg === 0) {
          lot.status = LotStatus.SOLD;
        }
        lot.updatedAt = new Date().toISOString();
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
    order.updatedAt = new Date().toISOString();

    // Pause linked settlements (BR-04)
    for (const stl of settlementsState.filter(s => s.orderId === order.id)) {
      stl.status = 'PAUSED';
    }

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

  async resolveDispute(
    disputeId: string,
    adminUser: User,
    outcome: DisputeOutcome,
    notes?: string
  ): Promise<Dispute> {
    const dispute = disputesState.find(d => d.id === disputeId);
    if (!dispute) throw new Error('Dispute not found');

    if (adminUser.role !== UserRole.ADMINISTRATOR) {
      throw new Error('Only Cargo Operations administrators can resolve trade disputes.');
    }

    dispute.status = DisputeStatus.RESOLVED;
    dispute.outcome = outcome;
    dispute.resolutionNotes = notes;
    dispute.resolvedAt = new Date().toISOString();

    const order = ordersState.find(o => o.id === dispute.orderId);
    if (order) {
      order.hasActiveDispute = false;
      order.status = OrderStatus.ACCEPTED;
      order.updatedAt = new Date().toISOString();

      // Unpause settlements and make eligible
      for (const stl of settlementsState.filter(s => s.orderId === order.id)) {
        stl.status = 'ELIGIBLE';
      }
    }

    return dispute;
  },
};

// 6.1 Settlements & Payouts Service (BR-04)
export const settlementService = {
  async getSettlements(user?: User): Promise<SettlementRecord[]> {
    if (!user) return settlementsState;
    if (user.role === UserRole.SUPPLIER) {
      return settlementsState.filter(s => s.supplierOrgId === user.organizationId);
    }
    return settlementsState;
  },

  async getSettlementByOrderId(orderId: string): Promise<SettlementRecord | undefined> {
    return settlementsState.find(s => s.orderId === orderId);
  },

  async disburseSettlement(settlementId: string, adminUser: User): Promise<SettlementRecord> {
    const settlement = settlementsState.find(s => s.id === settlementId);
    if (!settlement) throw new Error('Settlement record not found');
    const order = ordersState.find(o => o.id === settlement.orderId);
    if (!order) throw new Error('Linked trade order not found');

    const validation = validateSettlementDisbursement(settlement, order, adminUser.role);
    if (!validation.success) {
      throw new Error(validation.error);
    }

    settlement.status = 'SETTLED';
    settlement.disbursedAt = new Date().toISOString();
    settlement.disbursedBy = adminUser.id;

    // Check if all settlements for this order have been disbursed
    const orderSettlements = settlementsState.filter(s => s.orderId === order.id);
    if (orderSettlements.every(s => s.status === 'SETTLED')) {
      order.status = OrderStatus.SETTLED;
      order.updatedAt = new Date().toISOString();
    }

    return settlement;
  },
};

// 7. Offline Queue Synchronization Service
export const offlineQueueService = {
  async syncPendingQueue(): Promise<{ syncedCount: number; errors: string[] }> {
    const res = await syncCoordinator.processQueue();
    return { syncedCount: res.syncedCount, errors: res.errors };
  },
  async getQueueSummary() {
    return syncCoordinator.getQueueSummary();
  },
  async retryItem(itemId: string) {
    return syncCoordinator.retryItem(itemId);
  },
  async discardItem(itemId: string) {
    return syncCoordinator.discardItem(itemId);
  },
};

