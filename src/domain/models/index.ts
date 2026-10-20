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
  SyncErrorCategory,
  NotificationType,
} from '../enums';

export {
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
  SyncErrorCategory,
  NotificationType,
};

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: UserRole;
  organizationId: string;
  preferredLanguage: 'en' | 'rw';
  isActive: boolean;
  isLocked: boolean;
  failedLoginAttempts: number;
  lastLoginAt?: string;
  onboardingCompleted?: boolean;
  verificationStatus?: VerificationStatus;
  contactVerified?: boolean;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  verificationCode?: string;
  agentAssignment?: {
    district: string;
    sector: string;
    supervisorName: string;
  };
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  registrationNumber: string;
  tin?: string;
  district: string;
  sector: string;
  contactPerson: string;
  phone: string;
  cropsGrown?: string[];
  capacityKg?: number;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface Lot {
  id: string;
  lotCode: string; // Deterministic, e.g. "LOT-MZ-202610-001"
  supplierId: string;
  organizationId: string;
  cropName: string;
  cropType?: 'PERISHABLE' | 'NON_PERISHABLE';
  variety?: string;
  totalQuantityKg: number;
  remainingQuantityKg: number;
  reservedQuantityKg: number;
  pricePerKgRwf: number;
  harvestDate: string; // ISO Date string - must be confirmed in the past
  availabilityDate: string;
  pickupDistrict: string;
  pickupSector: string;
  pickupLocationDetails: string;
  photos: string[];
  status: LotStatus;
  grade?: QualityGrade;
  gradedAt?: string;
  inspectedByAgentId?: string;
  adminApprovedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Central Warehouse Stock Group (Aggregated across approved supplier lots)
export interface WarehouseStockGroup {
  id: string;
  cropName: string;
  variety?: string;
  cropType: 'PERISHABLE' | 'NON_PERISHABLE';
  grade: QualityGrade;
  totalEligibleQuantityKg: number;
  reservedQuantityKg: number;
  availableToOrderKg: number;
  pricePerKgRwf: number;
  availabilityDate: string;
  hubLocation: string;
  photos: string[];
  contributingLotsCount: number;
  contributingLotIds: string[];
}

// Buyer view of a lot, with private supplier identity stripped
export interface BuyerLotProjection {
  id: string;
  lotCode: string;
  cropName: string;
  cropType?: 'PERISHABLE' | 'NON_PERISHABLE';
  variety?: string;
  availableQuantityKg: number;
  pricePerKgRwf: number;
  grade: QualityGrade;
  availabilityDate: string;
  district: string;
  sector?: string;
  harvestDate?: string;
  notes?: string;
  photos: string[];
  status: LotStatus;
  verifiedAt: string;
}

export interface GradingMeasurement {
  metricName: string;
  labelEn: string;
  labelRw: string;
  value: number;
  unit: string;
  passedThreshold: boolean;
}

export interface GradingRecord {
  id: string;
  lotId: string;
  fieldAgentId: string;
  fieldAgentName: string;
  measurements: GradingMeasurement[];
  moisturePercentage: number;
  foreignMatterPercentage: number;
  defectiveRatePercentage: number;
  calculatedGrade: QualityGrade;
  finalGrade: QualityGrade;
  photos: string[];
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAccuracyMeters?: number;
  checklist?: Record<string, boolean>;
  submissionTimestamp?: string;
  editDeadline?: string; // ISO string 5 minutes after submission
  editHistory?: { editedAt: string; editorId: string; changes: string }[];
  notes: string;
  isOfflineSubmission: boolean;
  syncOperationId?: string;
  syncStatus?: SyncStatus;
  localSavedAt?: string;
  updatedAt?: string;
  createdAt: string;
}

export interface SupplierVisitRecord {
  id: string;
  supplierOrgId: string;
  fieldAgentId: string;
  notes: string;
  photos: string[];
  gpsLatitude?: number;
  gpsLongitude?: number;
  timestamp: string;
  recommendedStatus: VerificationStatus;
}

export interface BuyerRequest {
  id: string;
  buyerOrgId: string;
  buyerUserId: string;
  cropName: string;
  variety?: string;
  minimumGrade: QualityGrade;
  quantityKg: number;
  targetPricePerKgRwf?: number;
  deliveryDistrict: string;
  deliverySector: string;
  requiredDeliveryDate: string;
  notes?: string;
  status: 'OPEN' | 'MATCHED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
}

export interface OfferLine {
  id: string;
  lotId: string;
  lotCode: string;
  supplierOrgId: string;
  quantityKg: number;
  grade: QualityGrade;
  cropName?: string;
  unitPriceRwf: number;
  subtotalRwf: number;
}

export interface NegotiationMessage {
  id: string;
  senderRole: UserRole;
  senderName: string;
  timestamp: string;
  action: 'PROPOSE' | 'ACCEPT' | 'DECLINE' | 'COUNTER';
  notes?: string;
  counterPricePerKgRwf?: number;
}

export interface Offer {
  id: string;
  offerCode: string; // e.g. "OFF-202610-001"
  requestId?: string;
  buyerOrgId: string;
  cropName?: string;
  grade?: QualityGrade;
  lines: OfferLine[];
  totalQuantityKg: number;
  averagePricePerKgRwf: number;
  subtotalRwf: number;
  platformFeeRwf: number;
  inspectionFeeRwf: number;
  totalPriceRwf: number;
  deliveryDistrict: string;
  deliveryDate: string;
  status: OfferStatus;
  supplierCount: number;
  negotiationTimeline: NegotiationMessage[];
  expiresAt: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderAllocation {
  id: string;
  lotId: string;
  lotCode: string;
  supplierOrgId: string;
  supplierOrgName: string; // private, filtered on buyer screen
  quantityKg: number;
  pricePerKgRwf: number;
  subtotalRwf: number;
  supplierFeeRwf: number;
  expectedSupplierPayoutRwf: number;
  confirmedBySupplier: boolean;
  confirmedAt?: string;
  declinedReason?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "ORD-202610-001"
  offerId: string;
  buyerOrgId: string;
  buyerOrgName: string;
  cropName: string;
  grade: QualityGrade;
  totalQuantityKg: number;
  pricePerKgRwf: number;
  subtotalRwf: number;
  buyerFeeRwf: number;
  totalAmountRwf: number;
  allocations: OrderAllocation[];
  deliveryDistrict: string;
  deliverySector: string;
  deliveryAddress: string;
  agreedDeliveryDate: string;
  status: OrderStatus;
  termsAcceptedByBuyer: boolean;
  termsAcceptedByBuyerAt?: string;
  termsAcceptedByBuyerUserId?: string;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  paidAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  acceptedAt?: string;
  hasActiveDispute: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TripDetails {
  id: string;
  orderId: string;
  transporterName: string;
  vehicleRegistration: string;
  driverName: string;
  driverPhone: string;
  quantityLoadedKg: number;
  loadingConfirmedBy: string;
  loadingConfirmedAt: string;
  expectedArrivalDate: string;
  actualArrivalDate?: string;
  notes?: string;
}

export interface DeliveryReceipt {
  id: string;
  orderId: string;
  buyerUserId: string;
  quantityReceivedKg: number;
  quantityDiscrepancyKg: number;
  qualityPassed: boolean;
  receivedGrade: QualityGrade;
  photos: string[];
  notes?: string;
  actionTaken: 'ACCEPT_FULL' | 'ACCEPT_ADJUSTED' | 'DISPUTED';
  adjustedTotalRwf?: number;
  timestamp: string;
}

export interface Dispute {
  id: string;
  disputeCode: string; // e.g. "DSP-202610-001"
  orderId: string;
  orderNumber: string;
  openedByUserId: string;
  openedByRole: UserRole;
  reason: string;
  description: string;
  evidencePhotos: string[];
  amountOnHoldRwf: number;
  status: DisputeStatus;
  outcome?: DisputeOutcome;
  adminDecisionNotes?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string; // e.g. "INV-202610-001"
  orderId: string;
  orderNumber: string;
  buyerName: string;
  cropName: string;
  quantityKg: number;
  totalAmountRwf: number;
  ebmReceiptNumber?: string;
  ebmDocumentUrl?: string;
  generatedAt: string;
}

export interface LedgerEntry {
  id: string;
  orderId: string;
  orderNumber: string;
  timestamp: string;
  entryType: 'PAYMENT_RECEIVED' | 'PAYOUT_PREPARED' | 'PAYOUT_DISBURSED' | 'FEE_EARNED' | 'DISPUTE_HOLD' | 'REFUND';
  amountRwf: number;
  debitAccount: string;
  creditAccount: string;
  reference: string;
  notes: string;
}

export interface SettlementRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  supplierOrgId: string;
  supplierOrgName: string;
  grossSubtotalRwf: number;
  supplierFeeRwf: number; // 3% commercial fee
  netPayoutRwf: number;   // 97% net payable to supplier cooperative
  status: 'PENDING' | 'ELIGIBLE' | 'PAUSED' | 'SETTLED';
  disbursedAt?: string;
  disbursedBy?: string;
  reference?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  titleEn: string;
  titleRw: string;
  messageEn: string;
  messageRw: string;
  targetScreen?: string;
  targetId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface OfflineQueueItem {
  id: string; // Stable client UUID
  type: 'SUBMIT_GRADING' | 'SUPPLIER_VISIT' | 'CREATE_LOT_DRAFT' | 'UPDATE_LOT';
  entityId?: string; // Associated Lot ID or record ID
  payload: any;
  status: SyncStatus;
  retryCount: number;
  maxRetries?: number;
  nextRetryAt?: string;
  lastAttemptAt?: string;
  errorCategory?: SyncErrorCategory | 'TRANSIENT' | 'PERMANENT' | 'CONFLICT' | 'UNAUTHORIZED';
  errorMessage?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface InspectionDraft {
  id: string; // Stable draft ID (e.g. draft-lotId)
  lotId: string;
  agentId: string;
  moisture: string;
  foreignMatter: string;
  defects: string;
  notes: string;
  checklist?: Record<string, boolean>;
  photos: string[];
  gps?: { lat: number; lng: number };
  updatedAt: string;
}
