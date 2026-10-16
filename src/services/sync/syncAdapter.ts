/**
 * Cargo Mobile V1 - Remote Synchronization Adapter Interface & Mock Implementation
 * Defines the contract expected from future backend integration and provides
 * robust idempotency, conflict detection, and network failure classification.
 */

import { GradingRecord, Lot, User } from '../../domain/models';
import { SyncErrorCategory, LotStatus, QualityGrade } from '../../domain/enums';
import { mockState } from '../mock/mockServices';

export interface SyncSubmissionResult {
  success: boolean;
  errorCategory?: SyncErrorCategory;
  errorMessage?: string;
  serverRecordId?: string;
  isDuplicate?: boolean;
}

export interface ISyncAdapter {
  submitGrading(params: {
    lotId: string;
    gradingRecord: GradingRecord;
    idempotencyKey: string;
    agentUser?: User;
  }): Promise<SyncSubmissionResult>;
  resetIdempotencyRegistry?(): void;
}

// In-memory registry of processed idempotency keys for cross-attempt duplicate prevention
const processedIdempotencyKeys = new Map<string, { serverRecordId: string; processedAt: string }>();

export const mockSyncAdapter: ISyncAdapter = {
  async submitGrading(params: {
    lotId: string;
    gradingRecord: GradingRecord;
    idempotencyKey: string;
    agentUser?: User;
  }): Promise<SyncSubmissionResult> {
    const { lotId, gradingRecord, idempotencyKey } = params;

    // 1. Idempotency Check (Duplicate prevention)
    if (processedIdempotencyKeys.has(idempotencyKey)) {
      const existing = processedIdempotencyKeys.get(idempotencyKey)!;
      return {
        success: true,
        isDuplicate: true,
        serverRecordId: existing.serverRecordId,
      };
    }

    // 2. Simulated Connectivity Check
    if (mockState.isOffline()) {
      return {
        success: false,
        errorCategory: SyncErrorCategory.TRANSIENT,
        errorMessage: 'Network connection is currently unavailable. Retries scheduled when online.',
      };
    }

    // 3. Validation: Measurements bounds check (Permanent error if violated)
    if (
      gradingRecord.moisturePercentage < 0 ||
      gradingRecord.moisturePercentage > 50 ||
      gradingRecord.foreignMatterPercentage < 0 ||
      gradingRecord.defectiveRatePercentage < 0
    ) {
      return {
        success: false,
        errorCategory: SyncErrorCategory.PERMANENT,
        errorMessage: 'Inspection rejected: Quality measurements are out of physically permitted agricultural ranges.',
      };
    }

    // 4. Entity Existence & Conflict Check
    // We dynamically query lotService to check authoritative lot status
    const { lotService } = await import('../mock/mockServices');
    const lot = await lotService.getLotById(lotId);

    if (!lot) {
      return {
        success: false,
        errorCategory: SyncErrorCategory.PERMANENT,
        errorMessage: `Referenced agricultural lot ${lotId} was not found in central registry.`,
      };
    }

    // Conflict detection: Lot closed, rejected, or sold while agent was offline
    if (lot.status === LotStatus.REJECTED || lot.status === LotStatus.SOLD || lot.status === LotStatus.WITHDRAWN) {
      return {
        success: false,
        errorCategory: SyncErrorCategory.CONFLICT,
        errorMessage: `Synchronization conflict: Lot is in ${lot.status} status and can no longer accept physical inspection records.`,
      };
    }

    // 5. Server Update: Authoritative assignment of quality grade
    lot.grade = gradingRecord.finalGrade;
    lot.gradedAt = gradingRecord.createdAt;
    lot.inspectedByAgentId = gradingRecord.fieldAgentId;
    lot.updatedAt = new Date().toISOString();
    // In accordance with BR-02: Offline synchronization does NOT fabricate administrative approval!

    // Record idempotency token
    processedIdempotencyKeys.set(idempotencyKey, {
      serverRecordId: gradingRecord.id,
      processedAt: new Date().toISOString(),
    });

    return {
      success: true,
      serverRecordId: gradingRecord.id,
      isDuplicate: false,
    };
  },

  resetIdempotencyRegistry(): void {
    processedIdempotencyKeys.clear();
  },
};
