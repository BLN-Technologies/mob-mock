import { LotStatus, QualityGrade } from '../enums';
import { Lot } from '../models';

export function isLotBuyerVisible(lot: Lot): boolean {
  // BR-02: A lot is visible to buyers only after field grading AND administrator verification
  if (lot.status !== LotStatus.VERIFIED && lot.status !== LotStatus.RESERVED) {
    return false;
  }
  // Unapproved, ungraded, or rejected lots are never visible in buyer catalogue
  if (!lot.grade || lot.grade === QualityGrade.REJECT || !lot.adminApprovedAt) {
    return false;
  }
  return lot.remainingQuantityKg > 0;
}

export function canTransitionLot(currentStatus: LotStatus, targetStatus: LotStatus): boolean {
  switch (currentStatus) {
    case LotStatus.DRAFT:
      return targetStatus === LotStatus.SUBMITTED;

    case LotStatus.SUBMITTED:
      return targetStatus === LotStatus.VERIFIED || targetStatus === LotStatus.REJECTED;

    case LotStatus.VERIFIED:
      return (
        targetStatus === LotStatus.RESERVED ||
        targetStatus === LotStatus.WITHDRAWN ||
        targetStatus === LotStatus.EXPIRED ||
        targetStatus === LotStatus.SOLD
      );

    case LotStatus.RESERVED:
      // Cancelled order restores to VERIFIED, or completed delivery marks as SOLD
      return targetStatus === LotStatus.VERIFIED || targetStatus === LotStatus.SOLD;

    case LotStatus.REJECTED:
    case LotStatus.WITHDRAWN:
    case LotStatus.EXPIRED:
    case LotStatus.SOLD:
      return false; // Terminal states in V1

    default:
      return false;
  }
}

export function validateLotTransition(lot: Lot, targetStatus: LotStatus): { success: boolean; error?: string } {
  if (!canTransitionLot(lot.status, targetStatus)) {
    return {
      success: false,
      error: `Invalid lot status transition from ${lot.status} to ${targetStatus}`,
    };
  }

  if (targetStatus === LotStatus.VERIFIED && (!lot.grade || !lot.inspectedByAgentId)) {
    return {
      success: false,
      error: 'Cannot verify a lot without a field agent quality grading record (FR-QA-02, BR-02)',
    };
  }

  return { success: true };
}
