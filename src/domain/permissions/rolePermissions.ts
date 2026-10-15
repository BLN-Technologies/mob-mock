import { UserRole, VerificationStatus } from '../enums';
import { User, Organization } from '../models';

export function canCreateLot(user: User | null, org: Organization | null): boolean {
  if (!user || user.role !== UserRole.SUPPLIER) return false;
  if (!user.isActive || user.isLocked) return false;
  if (!org || org.verificationStatus !== VerificationStatus.VERIFIED) return false;
  return true;
}

export function canGradeLot(user: User | null): boolean {
  if (!user || user.role !== UserRole.FIELD_AGENT) return false;
  if (!user.isActive || user.isLocked) return false;
  return true;
}

export function canPerformSupplierVisit(user: User | null): boolean {
  if (!user || user.role !== UserRole.FIELD_AGENT) return false;
  if (!user.isActive || user.isLocked) return false;
  return true;
}

export function canBrowseCatalogue(user: User | null): boolean {
  if (!user) return false;
  // Buyers and Admins can browse catalogue; suppliers can only see their own lots
  return user.role === UserRole.BUYER || user.role === UserRole.ADMINISTRATOR;
}

export function canPostBuyerRequest(user: User | null, org: Organization | null): boolean {
  if (!user || user.role !== UserRole.BUYER) return false;
  if (!user.isActive || user.isLocked) return false;
  if (!org || org.verificationStatus !== VerificationStatus.VERIFIED) return false;
  return true;
}

export function canAcceptOrCounterOffer(user: User | null, org: Organization | null): boolean {
  if (!user || user.role !== UserRole.BUYER) return false;
  if (!user.isActive || user.isLocked) return false;
  if (!org || org.verificationStatus !== VerificationStatus.VERIFIED) return false;
  return true;
}

export function canConfirmAllocation(user: User | null, orgId: string): boolean {
  if (!user || user.role !== UserRole.SUPPLIER) return false;
  return user.organizationId === orgId && user.isActive && !user.isLocked;
}

export function canConfirmDeliveryReceipt(user: User | null, orderBuyerOrgId: string): boolean {
  if (!user || user.role !== UserRole.BUYER) return false;
  return user.organizationId === orderBuyerOrgId && user.isActive;
}

export function canOpenDispute(user: User | null, order: { buyerOrgId: string; allocations: { supplierOrgId: string }[] }): boolean {
  if (!user || !user.isActive) return false;
  if (user.role === UserRole.BUYER && user.organizationId === order.buyerOrgId) return true;
  if (user.role === UserRole.SUPPLIER) {
    return order.allocations.some(a => a.supplierOrgId === user.organizationId);
  }
  return false;
}
