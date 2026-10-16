/**
 * Cargo Mobile V1 - Replaceable Authentication Service Contract
 * Defines the formal interface separating UI components from authentication providers
 * (Mock provider today, REST/GraphQL provider in production).
 */

import { User, Organization } from '../../domain/models';
import { UserRole, VerificationStatus } from '../../domain/enums';

export interface SupplierRegistrationInput {
  fullName: string;
  phone: string;
  organizationName: string;
  district: string;
  sector?: string;
  password?: string;
  email?: string;
  preferredLanguage?: 'en' | 'rw';
}

export interface BuyerRegistrationInput {
  fullName: string;
  phone: string;
  enterpriseName: string;
  district: string;
  sector?: string;
  email: string;
  password?: string;
  preferredLanguage?: 'en' | 'rw';
}

export interface AgentInviteRegistrationInput {
  code: string;
  fullName: string;
  phone: string;
  nationalId: string;
  password?: string;
  preferredLanguage?: 'en' | 'rw';
}

export interface LoginInput {
  identifier: string; // Phone or Email
  password?: string;
}

export interface AgentInvitationDetails {
  code: string;
  district: string;
  sector: string;
  supervisorName: string;
  status: 'ACTIVE' | 'EXPIRED' | 'USED';
  expiresAt: string;
  redeemedAt?: string;
  redeemedByUserId?: string;
}

export interface AuthResult {
  user: User;
  requiresOtp: boolean;
  organization?: Organization;
}

export interface SessionValidationResult {
  isValid: boolean;
  user: User | null;
  error?: string;
}

export interface AccountOnboardingStatus {
  userId: string;
  onboardingCompleted: boolean;
  verificationStatus: VerificationStatus;
  organization?: Organization;
  pendingRequirements: string[];
}

export interface ProfileUpdateInput {
  fullName?: string;
  email?: string;
  phone?: string;
  preferredLanguage?: 'en' | 'rw';
}

/**
 * Replaceable Authentication Service Contract
 */
export interface IAuthService {
  /** Sign in with phone or email (supports both LoginInput object or string identifier + password) */
  login(inputOrIdentifier: LoginInput | string, password?: string): Promise<AuthResult>;

  /** Register a cooperative / agricultural supplier */
  registerSupplier(input: SupplierRegistrationInput): Promise<AuthResult>;

  /** Register an institutional / commercial buyer */
  registerBuyer(input: BuyerRegistrationInput): Promise<AuthResult>;

  /** Validate field agent invitation without redeeming it */
  validateAgentInvitation(code: string): Promise<AgentInvitationDetails>;

  /** Redeem agent invitation and create agent account */
  registerFieldAgentWithInvite(input: AgentInviteRegistrationInput): Promise<AuthResult>;

  /** Verify simulated OTP code (demo flow) */
  verifyOtp(code: string): Promise<boolean>;

  /** Restore and validate current local session */
  restoreSession(): Promise<SessionValidationResult>;

  /** Retrieve currently authenticated user */
  getCurrentUser(): Promise<User | null>;

  /** Sign out and wipe session */
  logout(): Promise<void>;

  /** Complete onboarding journey for a user */
  completeOnboarding(userId: string): Promise<User>;

  /** Retrieve onboarding and verification status */
  getOnboardingStatus(user: User): Promise<AccountOnboardingStatus>;

  /** Update profile fields */
  updateProfile(userId: string, input: ProfileUpdateInput): Promise<User>;

  /** Retrieve user's linked organization */
  getUserOrganization(user: User): Organization | undefined;
}
