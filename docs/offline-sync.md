# Cargo V1 Mobile Offline Synchronization Architecture

**Version:** 1.0  
**Authority:** Cargo V1 SRS NFR-OFF-01 to NFR-OFF-03  

---

## 1. Overview
Field agents inspecting harvest lots in rural Rwanda frequently operate in areas with weak or zero mobile cellular coverage. The Cargo mobile application guarantees **zero data loss** through a local-first persistent action queue.

---

## 2. Queue Life Cycle & Data Structure

Every offline action creates a persistent `OfflineQueueItem`:
```typescript
interface OfflineQueueItem {
  id: string;              // Client UUID (opId)
  type: 'SUBMIT_GRADING' | 'SUPPLIER_VISIT' | 'CREATE_LOT_DRAFT';
  payload: any;            // Validated action payload
  status: SyncStatus;      // QUEUED | SYNCING | SYNCED | FAILED
  retryCount: number;
  lastAttemptAt?: string;
  errorMessage?: string;
  createdAt: string;
}
```

### Queue Transitions:
1. **Capture:** When the agent taps "Submit Grading" in offline mode, the record is immediately written to `@cargo_offline_queue` via AsyncStorage.
2. **Banner Feedback:** The `OfflineBanner` component immediately reflects the incremented queue count (e.g. `Offline Mode (1 queued)`).
3. **Resilience:** The agent can force close the app, reboot the phone, or navigate away. When reopened, the draft and queue remain intact.
4. **Reconnection & Sync:** When connectivity returns, `offlineQueueService.syncPendingQueue()` processes each item.
5. **Idempotency:** The client UUID `opId` ensures the service never creates duplicate grading records upon multiple retry attempts.
6. **Server Authority:** The central Cargo system remains authoritative for final lot status transitions and financial numbers.
