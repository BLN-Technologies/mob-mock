import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Lot, OfflineQueueItem } from '../../domain/models';

const KEYS = {
  SESSION_USER: '@cargo_session_user',
  LOT_DRAFTS: '@cargo_lot_drafts',
  OFFLINE_QUEUE: '@cargo_offline_queue',
  STORED_LOTS: '@cargo_stored_lots',
  STORED_ORDERS: '@cargo_stored_orders',
  STORED_OFFERS: '@cargo_stored_offers',
  STORED_DISPUTES: '@cargo_stored_disputes',
  STORED_NOTIFICATIONS: '@cargo_stored_notifications',
  HAS_INITIALIZED: '@cargo_has_seeded_v1',
};

// In-memory fallback map in case native AsyncStorage module is unavailable
const memoryFallback = new Map<string, string>();
const ASYNC_STORAGE_TIMEOUT_MS = 400;

function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ASYNC_STORAGE_TIMEOUT_MS)),
  ]).catch(() => fallback);
}

export async function safeGetItem(key: string): Promise<string | null> {
  try {
    const value = await withTimeout(AsyncStorage.getItem(key), null);
    return value ?? memoryFallback.get(key) ?? null;
  } catch {
    return memoryFallback.get(key) ?? null;
  }
}

export async function safeSetItem(key: string, value: string): Promise<void> {
  memoryFallback.set(key, value);
  try {
    await withTimeout(AsyncStorage.setItem(key, value), undefined);
  } catch {
    // Non-fatal, cached in memoryFallback
  }
}

export async function safeRemoveItem(key: string): Promise<void> {
  memoryFallback.delete(key);
  try {
    await withTimeout(AsyncStorage.removeItem(key), undefined);
  } catch {
    // Non-fatal
  }
}

export async function safeClear(): Promise<void> {
  memoryFallback.clear();
  try {
    await withTimeout(AsyncStorage.clear(), undefined);
  } catch {
    // Non-fatal
  }
}

export const localStorage = {
  // Session
  async getSessionUser(): Promise<User | null> {
    try {
      const raw = await safeGetItem(KEYS.SESSION_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async setSessionUser(user: User | null): Promise<void> {
    try {
      if (user) {
        await safeSetItem(KEYS.SESSION_USER, JSON.stringify(user));
      } else {
        await safeRemoveItem(KEYS.SESSION_USER);
      }
    } catch {
      // Ignored
    }
  },

  // Lot Drafts
  async getLotDrafts(): Promise<any[]> {
    try {
      const raw = await safeGetItem(KEYS.LOT_DRAFTS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async saveLotDraft(draft: any): Promise<void> {
    try {
      const drafts = await this.getLotDrafts();
      const existingIdx = drafts.findIndex(d => d.id === draft.id);
      if (existingIdx >= 0) {
        drafts[existingIdx] = draft;
      } else {
        drafts.push(draft);
      }
      await safeSetItem(KEYS.LOT_DRAFTS, JSON.stringify(drafts));
    } catch {
      // Ignored
    }
  },

  async removeLotDraft(id: string): Promise<void> {
    try {
      const drafts = await this.getLotDrafts();
      const filtered = drafts.filter(d => d.id !== id);
      await safeSetItem(KEYS.LOT_DRAFTS, JSON.stringify(filtered));
    } catch {
      // Ignored
    }
  },

  // Offline Action Queue
  async getOfflineQueue(): Promise<OfflineQueueItem[]> {
    try {
      const raw = await safeGetItem(KEYS.OFFLINE_QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async enqueueOfflineItem(item: OfflineQueueItem): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      // Idempotent insertion by client UUID item.id
      const existing = queue.findIndex(q => q.id === item.id);
      if (existing >= 0) {
        queue[existing] = item;
      } else {
        queue.push(item);
      }
      await safeSetItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch {
      // Ignored
    }
  },

  async updateOfflineItem(id: string, updates: Partial<OfflineQueueItem>): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const idx = queue.findIndex(q => q.id === id);
      if (idx >= 0) {
        queue[idx] = { ...queue[idx], ...updates };
        await safeSetItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
      }
    } catch {
      // Ignored
    }
  },

  async removeOfflineItem(id: string): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const filtered = queue.filter(q => q.id !== id);
      await safeSetItem(KEYS.OFFLINE_QUEUE, JSON.stringify(filtered));
    } catch {
      // Ignored
    }
  },

  // Reset demo storage
  async clearAllData(): Promise<void> {
    try {
      await safeClear();
    } catch {
      // Ignored
    }
  },
};
