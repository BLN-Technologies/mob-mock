/**
 * Cargo Mobile V1 - Offer & Negotiation Domain Workflow
 * Enforces legal state transitions, actor role validation,
 * atomic stock validation, and negotiation invariants.
 */

import { OfferStatus, UserRole, QualityGrade } from '../enums';
import { Offer, Lot } from '../models';

export function canTransitionOffer(currentStatus: OfferStatus, targetStatus: OfferStatus): boolean {
  switch (currentStatus) {
    case OfferStatus.PROPOSED:
      return (
        targetStatus === OfferStatus.ACCEPTED ||
        targetStatus === OfferStatus.DECLINED ||
        targetStatus === OfferStatus.COUNTERED ||
        targetStatus === OfferStatus.EXPIRED
      );

    case OfferStatus.COUNTERED:
      return (
        targetStatus === OfferStatus.ACCEPTED ||
        targetStatus === OfferStatus.DECLINED ||
        targetStatus === OfferStatus.COUNTERED ||
        targetStatus === OfferStatus.EXPIRED
      );

    case OfferStatus.ACCEPTED:
    case OfferStatus.DECLINED:
    case OfferStatus.EXPIRED:
      return false; // Terminal states

    default:
      return false;
  }
}

export function validateOfferTransition(
  offer: Offer,
  targetStatus: OfferStatus,
  actorRole: UserRole,
  counterPricePerKgRwf?: number
): { success: boolean; error?: string } {
  if (!canTransitionOffer(offer.status, targetStatus)) {
    return {
      success: false,
      error: `Invalid offer state transition from ${offer.status} to ${targetStatus}`,
    };
  }

  // Acceptance validation:
  if (targetStatus === OfferStatus.ACCEPTED) {
    // If offer was PROPOSED by buyer, only SUPPLIER can accept it.
    // If offer was COUNTERED by supplier, BUYER can accept it.
    if (offer.status === OfferStatus.PROPOSED && actorRole !== UserRole.SUPPLIER && actorRole !== UserRole.ADMINISTRATOR) {
      return {
        success: false,
        error: 'Only the recipient supplier can accept a proposed offer.',
      };
    }
  }

  // Counter validation:
  if (targetStatus === OfferStatus.COUNTERED) {
    if (!counterPricePerKgRwf || counterPricePerKgRwf <= 0 || isNaN(counterPricePerKgRwf)) {
      return {
        success: false,
        error: 'Counter-offer price must be a valid positive number in RWF.',
      };
    }
  }

  return { success: true };
}

/**
 * Validates that all allocated lots have sufficient remaining unreserved stock
 */
export function validateOfferStockAvailability(
  offer: Offer,
  getLotRemainingQuantity: (lotId: string) => number | undefined
): { success: boolean; error?: string } {
  for (const line of offer.lines) {
    const remaining = getLotRemainingQuantity(line.lotId);
    if (remaining === undefined) {
      return {
        success: false,
        error: `Lot ${line.lotCode} not found in inventory.`,
      };
    }
    if (remaining < line.quantityKg) {
      return {
        success: false,
        error: `Insufficient stock for lot ${line.lotCode}. Required: ${line.quantityKg} kg, Available: ${remaining} kg.`,
      };
    }
  }

  return { success: true };
}
