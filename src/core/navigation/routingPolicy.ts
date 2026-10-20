/**
 * Cargo Mobile V1 - Centralized Role- & Status-Aware Routing Policy
 * Single source of truth for routing decisions across authentication,
 * session bootstrap, onboarding completion, and workspace access.
 */

import { User, Organization } from '../../domain/models';
import { UserRole, VerificationStatus } from '../../domain/enums';

export type AppDestination =
  | 'WELCOME'
  | 'ROLE_SELECT'
  | 'REGISTER'
  | 'VERIFICATION'
  | 'APPROVAL_PENDING'
  | 'AGENT_INVITE'
  | 'LOGIN'
  | 'ONBOARDING_SUPPLIER'
  | 'ONBOARDING_BUYER'
  | 'ONBOARDING_AGENT'
  | 'SUPPLIER_WORKSPACE'
  | 'BUYER_WORKSPACE'
  | 'AGENT_WORKSPACE'
  | 'ADMIN_HANDOFF'
  | 'UNAUTHORIZED';

export interface RouteResolution {
  destination: AppDestination;
  initialTab?: string;
  requiresOnboarding: boolean;
  isVerificationPending: boolean;
  statusNotice?: string;
}

/**
 * Resolves the authenticated destination based on user role and onboarding/verification status.
 * Unauthenticated users are deterministically redirected to WELCOME.
 */
export function resolveAuthenticatedRoute(
  user: User | null,
  organization?: Organization
): RouteResolution {
  if (!user) {
    return {
      destination: 'WELCOME',
      requiresOnboarding: false,
      isVerificationPending: false,
    };
  }

  // Account locked or suspended guards
  if (user.isLocked || !user.isActive) {
    return {
      destination: 'UNAUTHORIZED',
      requiresOnboarding: false,
      isVerificationPending: false,
      statusNotice: user.isLocked
        ? 'Account locked due to security policy'
        : 'Account is suspended by administrator',
    };
  }

  // 1. Contact verification check (Step 2 in updated approval flow)
  if (user.contactVerified === false) {
    return {
      destination: 'VERIFICATION',
      requiresOnboarding: false,
      isVerificationPending: true,
      statusNotice: 'Contact verification required',
    };
  }

  // 2. Cargo Operations approval check (Step 4 in updated approval flow)
  if (user.approvalStatus === 'PENDING') {
    return {
      destination: 'APPROVAL_PENDING',
      requiresOnboarding: false,
      isVerificationPending: false,
      statusNotice: 'Account awaiting Cargo Operations review and approval',
    };
  }

  if (user.approvalStatus === 'REJECTED') {
    return {
      destination: 'UNAUTHORIZED',
      requiresOnboarding: false,
      isVerificationPending: false,
      statusNotice: 'Account was not approved by Cargo Operations',
    };
  }

  // 3. Administrator: Strictly routed to Web Operations Portal Handoff
  if (user.role === UserRole.ADMINISTRATOR) {
    return {
      destination: 'ADMIN_HANDOFF',
      requiresOnboarding: false,
      isVerificationPending: false,
    };
  }

  // Determine onboarding completion status
  const isOnboardingComplete = Boolean(user.onboardingCompleted);

  // 4. Supplier Routing
  if (user.role === UserRole.SUPPLIER) {
    if (!isOnboardingComplete) {
      return {
        destination: 'ONBOARDING_SUPPLIER',
        requiresOnboarding: true,
        isVerificationPending: organization?.verificationStatus === VerificationStatus.PENDING,
      };
    }
    return {
      destination: 'SUPPLIER_WORKSPACE',
      initialTab: 'home',
      requiresOnboarding: false,
      isVerificationPending: organization?.verificationStatus === VerificationStatus.PENDING,
    };
  }

  // 5. Buyer Routing
  if (user.role === UserRole.BUYER) {
    if (!isOnboardingComplete) {
      return {
        destination: 'ONBOARDING_BUYER',
        requiresOnboarding: true,
        isVerificationPending: false,
      };
    }
    return {
      destination: 'BUYER_WORKSPACE',
      initialTab: 'home',
      requiresOnboarding: false,
      isVerificationPending: false,
    };
  }

  // 6. Field Inspector Routing
  if (user.role === UserRole.FIELD_AGENT) {
    if (!isOnboardingComplete) {
      return {
        destination: 'ONBOARDING_AGENT',
        requiresOnboarding: true,
        isVerificationPending: false,
      };
    }
    return {
      destination: 'AGENT_WORKSPACE',
      initialTab: 'home',
      requiresOnboarding: false,
      isVerificationPending: false,
    };
  }

  // Fallback safe default
  return {
    destination: 'WELCOME',
    requiresOnboarding: false,
    isVerificationPending: false,
  };
}

/**
 * Access-control guard checking whether a user has permission to view a target destination.
 */
export function canAccessDestination(destination: AppDestination, user: User | null): boolean {
  if (!user) {
    return destination === 'WELCOME' || destination === 'ROLE_SELECT' || destination === 'REGISTER' || destination === 'LOGIN' || destination === 'AGENT_INVITE';
  }

  // Account locked or suspended guards
  if (user.isLocked || !user.isActive) {
    return destination === 'UNAUTHORIZED' || destination === 'WELCOME' || destination === 'LOGIN';
  }

  // Unverified or Pending Approval users can only access verification/status screens
  if (user.contactVerified === false || user.approvalStatus === 'PENDING') {
    return (
      destination === 'VERIFICATION' ||
      destination === 'APPROVAL_PENDING' ||
      destination === 'WELCOME' ||
      destination === 'LOGIN'
    );
  }

  if (destination === 'VERIFICATION' || destination === 'APPROVAL_PENDING') {
    return true;
  }

  switch (destination) {
    case 'SUPPLIER_WORKSPACE':
    case 'ONBOARDING_SUPPLIER':
      return user.role === UserRole.SUPPLIER;

    case 'BUYER_WORKSPACE':
    case 'ONBOARDING_BUYER':
      return user.role === UserRole.BUYER;

    case 'AGENT_WORKSPACE':
    case 'ONBOARDING_AGENT':
      return user.role === UserRole.FIELD_AGENT;

    case 'ADMIN_HANDOFF':
      return user.role === UserRole.ADMINISTRATOR;

    case 'WELCOME':
    case 'LOGIN':
    case 'ROLE_SELECT':
    case 'REGISTER':
    case 'AGENT_INVITE':
      return true; // Navigation reset/logout always permitted

    default:
      return false;
  }
}
