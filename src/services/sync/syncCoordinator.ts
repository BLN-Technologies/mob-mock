/**
 * Cargo Mobile V1 - Reliable Offline Synchronization Coordinator
 * Enforces queue concurrency protection, deterministic processing,
 * bounded exponential backoff, stable idempotency tokens, and error classification.
 */

import { localStorage } from '../../data/local/storage';
import { inspectionRepository } from '../../data/local/inspectionRepository';
import { mockSyncAdapter, ISyncAdapter } from './syncAdapter';
import { GradingRecord, OfflineQueueItem, User } from '../../domain/models';
import { SyncStatus, SyncErrorCategory } from '../../domain/enums';
import { mockState } from '../mock/mockServices';

export interface QueueSummary {
  total: number;
  pending: number;
  syncing: number;
  synced: number;
  failed: number;
  conflicts: number;
  lastSyncAt: string | null;
}

export interface SyncBatchResult {
  syncedCount: number;
  skippedCount: number;
  failedCount: number;
  conflictCount: number;
  errors: string[];
  inProgress?: boolean;
}

let isSyncInProgress = false;

export const syncCoordinator = {
  adapter: mockSyncAdapter as ISyncAdapter,

  setAdapter(newAdapter: ISyncAdapter) {
    this.adapter = newAdapter;
  },

  isSyncing(): boolean {
    return isSyncInProgress;
  },

  /**
   * Enqueues an inspection into durable storage with a stable client idempotency key.
   * Survives app terminations and preserves inspection evidence.
   */
  async enqueueInspection(
    lotId: string,
    gradingRecord: GradingRecord,
    agentUser: User
  ): Promise<OfflineQueueItem> {
    const operationId = `op-${gradingRecord.id}`;
    const idempotencyKey = `idem-${gradingRecord.id}`;

    // 1. Persist local inspection record first (Durability guarantee)
    await inspectionRepository.saveInspection({
      ...gradingRecord,
      syncOperationId: operationId,
      syncStatus: SyncStatus.QUEUED,
    });

    // 2. Clear any in-progress draft for this lot
    await inspectionRepository.removeDraft(lotId);

    // 3. Create durable queue item
    const queueItem: OfflineQueueItem = {
      id: operationId,
      type: 'SUBMIT_GRADING',
      entityId: lotId,
      payload: { lotId, gradingRecord, agentUser },
      status: SyncStatus.QUEUED,
      retryCount: 0,
      maxRetries: 5,
      idempotencyKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await localStorage.enqueueOfflineItem(queueItem);
    return queueItem;
  },

  /**
   * Processes all eligible operations in the durable queue.
   * Concurrency lock prevents parallel duplicate synchronization runs.
   */
  async processQueue(): Promise<SyncBatchResult> {
    if (isSyncInProgress) {
      return {
        syncedCount: 0,
        skippedCount: 0,
        failedCount: 0,
        conflictCount: 0,
        errors: ['Synchronization is already in progress by an active worker.'],
        inProgress: true,
      };
    }

    isSyncInProgress = true;
    const errors: string[] = [];
    let syncedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    let conflictCount = 0;

    try {
      const queue = await localStorage.getOfflineQueue();
      const now = Date.now();

      // Find eligible items: QUEUED, FAILED (manual), or RETRY_SCHEDULED where backoff has elapsed
      const eligible = queue.filter(item => {
        if (item.status === SyncStatus.QUEUED) return true;
        if (item.status === SyncStatus.FAILED) return true;
        if (item.status === SyncStatus.RETRY_SCHEDULED) {
          if (!item.nextRetryAt) return true;
          return new Date(item.nextRetryAt).getTime() <= now;
        }
        return false;
      });

      if (eligible.length === 0) {
        return { syncedCount: 0, skippedCount: queue.length, failedCount: 0, conflictCount: 0, errors: [] };
      }

      for (const item of eligible) {
        // Concurrency flag per item
        await localStorage.updateOfflineItem(item.id, {
          status: SyncStatus.SYNCING,
          lastAttemptAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        try {
          if (item.type === 'SUBMIT_GRADING') {
            const { lotId, gradingRecord, agentUser } = item.payload;

            const result = await this.adapter.submitGrading({
              lotId,
              gradingRecord,
              idempotencyKey: item.idempotencyKey || `idem-${item.id}`,
              agentUser,
            });

            if (result.success) {
              await localStorage.updateOfflineItem(item.id, {
                status: SyncStatus.SYNCED,
                errorMessage: undefined,
                updatedAt: new Date().toISOString(),
              });
              syncedCount++;
            } else {
              const errCategory = result.errorCategory || SyncErrorCategory.TRANSIENT;
              const errMsg = result.errorMessage || 'Synchronization failed';

              if (errCategory === SyncErrorCategory.TRANSIENT) {
                const nextRetryCount = (item.retryCount || 0) + 1;
                const maxRetries = item.maxRetries || 5;

                if (nextRetryCount < maxRetries) {
                  // Bounded exponential backoff: 5s, 10s, 20s, 40s... capped at 300s
                  const delaySeconds = Math.min(300, Math.pow(2, nextRetryCount) * 5);
                  const nextRetryAt = new Date(Date.now() + delaySeconds * 1000).toISOString();

                  await localStorage.updateOfflineItem(item.id, {
                    status: SyncStatus.RETRY_SCHEDULED,
                    retryCount: nextRetryCount,
                    nextRetryAt,
                    errorCategory: SyncErrorCategory.TRANSIENT,
                    errorMessage: errMsg,
                    updatedAt: new Date().toISOString(),
                  });
                } else {
                  await localStorage.updateOfflineItem(item.id, {
                    status: SyncStatus.FAILED,
                    retryCount: nextRetryCount,
                    errorCategory: SyncErrorCategory.TRANSIENT,
                    errorMessage: `Max retry attempts reached (${maxRetries}). ${errMsg}`,
                    updatedAt: new Date().toISOString(),
                  });
                  failedCount++;
                }
              } else if (errCategory === SyncErrorCategory.CONFLICT) {
                // Conflict: Preserved locally for agent/admin review
                await localStorage.updateOfflineItem(item.id, {
                  status: SyncStatus.CONFLICT,
                  errorCategory: SyncErrorCategory.CONFLICT,
                  errorMessage: errMsg,
                  updatedAt: new Date().toISOString(),
                });
                conflictCount++;
              } else {
                // Permanent rejection: do not retry automatically
                await localStorage.updateOfflineItem(item.id, {
                  status: SyncStatus.FAILED_PERMANENT,
                  errorCategory: SyncErrorCategory.PERMANENT,
                  errorMessage: errMsg,
                  updatedAt: new Date().toISOString(),
                });
                failedCount++;
              }
              errors.push(`Item ${item.id}: ${errMsg}`);
            }
          }
        } catch (innerErr: any) {
          const errMsg = innerErr.message || 'Unexpected exception during item sync';
          await localStorage.updateOfflineItem(item.id, {
            status: SyncStatus.FAILED,
            retryCount: (item.retryCount || 0) + 1,
            errorMessage: errMsg,
            updatedAt: new Date().toISOString(),
          });
          failedCount++;
          errors.push(errMsg);
        }
      }

      if (syncedCount > 0) {
        await localStorage.setLastSyncAt(new Date().toISOString());
      }
    } finally {
      isSyncInProgress = false;
    }

    return {
      syncedCount,
      skippedCount,
      failedCount,
      conflictCount,
      errors,
    };
  },

  /**
   * Manually retries a single failed or retry-scheduled item immediately,
   * reusing the original stable operation ID and idempotency key.
   */
  async retryItem(itemId: string): Promise<SyncBatchResult> {
    const queue = await localStorage.getOfflineQueue();
    const item = queue.find(q => q.id === itemId);
    if (!item) {
      throw new Error(`Queue item ${itemId} not found`);
    }

    // Reset status to QUEUED so processQueue will pick it up immediately
    await localStorage.updateOfflineItem(itemId, {
      status: SyncStatus.QUEUED,
      nextRetryAt: undefined,
      updatedAt: new Date().toISOString(),
    });

    return this.processQueue();
  },

  /**
   * Removes an item from the queue with explicit agent confirmation.
   */
  async discardItem(itemId: string): Promise<void> {
    await localStorage.removeOfflineItem(itemId);
  },

  /**
   * Returns aggregated queue counts and sync status.
   */
  async getQueueSummary(): Promise<QueueSummary> {
    const queue = await localStorage.getOfflineQueue();
    const lastSyncAt = await localStorage.getLastSyncAt();

    const pending = queue.filter(
      q => q.status === SyncStatus.QUEUED || q.status === SyncStatus.RETRY_SCHEDULED
    ).length;
    const syncing = queue.filter(q => q.status === SyncStatus.SYNCING).length;
    const synced = queue.filter(q => q.status === SyncStatus.SYNCED).length;
    const failed = queue.filter(
      q => q.status === SyncStatus.FAILED || q.status === SyncStatus.FAILED_PERMANENT
    ).length;
    const conflicts = queue.filter(q => q.status === SyncStatus.CONFLICT).length;

    return {
      total: queue.length,
      pending,
      syncing,
      synced,
      failed,
      conflicts,
      lastSyncAt,
    };
  },
};
