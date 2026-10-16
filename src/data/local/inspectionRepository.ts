/**
 * Cargo Mobile V1 - Durable Local Inspection Repository
 * Manages local inspection persistence, drafts, integrity checks,
 * and crash recovery reconciliation across app lifecycles.
 */

import { localStorage } from './storage';
import { GradingRecord, InspectionDraft, OfflineQueueItem } from '../../domain/models';
import { SyncStatus } from '../../domain/enums';

export interface IInspectionRepository {
  saveDraft(draft: InspectionDraft): Promise<void>;
  getDraft(lotId: string): Promise<InspectionDraft | null>;
  removeDraft(lotId: string): Promise<void>;
  saveInspection(record: GradingRecord): Promise<void>;
  getInspectionById(id: string): Promise<GradingRecord | null>;
  getInspections(): Promise<GradingRecord[]>;
  reconcileStartupState(): Promise<{ recoveredCount: number; activeQueueCount: number }>;
}

export const inspectionRepository: IInspectionRepository = {
  async saveDraft(draft: InspectionDraft): Promise<void> {
    if (!draft.lotId) throw new Error('Cannot save draft without valid lotId reference');
    await localStorage.saveInspectionDraft({
      ...draft,
      updatedAt: new Date().toISOString(),
    });
  },

  async getDraft(lotId: string): Promise<InspectionDraft | null> {
    return localStorage.getInspectionDraft(lotId);
  },

  async removeDraft(lotId: string): Promise<void> {
    await localStorage.removeInspectionDraft(lotId);
  },

  async saveInspection(record: GradingRecord): Promise<void> {
    if (!record.lotId || !record.fieldAgentId) {
      throw new Error('Inspection validation failed: lotId and fieldAgentId are required');
    }
    await localStorage.saveLocalInspection({
      ...record,
      localSavedAt: record.localSavedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },

  async getInspectionById(id: string): Promise<GradingRecord | null> {
    const all = await localStorage.getLocalInspections();
    return all.find(r => r.id === id) || null;
  },

  async getInspections(): Promise<GradingRecord[]> {
    return localStorage.getLocalInspections();
  },

  /**
   * Startup Integrity & Crash Recovery Reconciler:
   * Inspects offline queue for operations stuck in 'SYNCING' state due to
   * app termination or OS kill during active network sync.
   * Reverts them safely to 'RETRY_SCHEDULED' or 'QUEUED' so they are not abandoned.
   */
  async reconcileStartupState(): Promise<{ recoveredCount: number; activeQueueCount: number }> {
    const queue = await localStorage.getOfflineQueue();
    let recoveredCount = 0;

    for (const item of queue) {
      if (item.status === SyncStatus.SYNCING) {
        // App was terminated mid-sync; recover item safely
        await localStorage.updateOfflineItem(item.id, {
          status: SyncStatus.RETRY_SCHEDULED,
          retryCount: (item.retryCount || 0) + 1,
          nextRetryAt: new Date().toISOString(),
          errorMessage: 'Synchronization was interrupted by app termination. Scheduled for safe retry.',
          updatedAt: new Date().toISOString(),
        });
        recoveredCount++;
      }
    }

    const currentQueue = await localStorage.getOfflineQueue();
    const activeQueueCount = currentQueue.filter(
      q => q.status === SyncStatus.QUEUED || q.status === SyncStatus.RETRY_SCHEDULED || q.status === SyncStatus.SYNCING
    ).length;

    return { recoveredCount, activeQueueCount };
  },
};
