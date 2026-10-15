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

export const localStorage = {
  // Session
  async getSessionUser(): Promise<User | null> {
    const raw = await AsyncStorage.getItem(KEYS.SESSION_USER);
    return raw ? JSON.parse(raw) : null;
  },

  async setSessionUser(user: User | null): Promise<void> {
    if (user) {
      await AsyncStorage.setItem(KEYS.SESSION_USER, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(KEYS.SESSION_USER);
    }
  },

  // Lot Drafts
  async getLotDrafts(): Promise<any[]> {
    const raw = await AsyncStorage.getItem(KEYS.LOT_DRAFTS);
    return raw ? JSON.parse(raw) : [];
  },

  async saveLotDraft(draft: any): Promise<void> {
    const drafts = await this.getLotDrafts();
    const existingIdx = drafts.findIndex(d => d.id === draft.id);
    if (existingIdx >= 0) {
      drafts[existingIdx] = draft;
    } else {
      drafts.push(draft);
    }
    await AsyncStorage.setItem(KEYS.LOT_DRAFTS, JSON.stringify(drafts));
  },

  async removeLotDraft(id: string): Promise<void> {
    const drafts = await this.getLotDrafts();
    const filtered = drafts.filter(d => d.id !== id);
    await AsyncStorage.setItem(KEYS.LOT_DRAFTS, JSON.stringify(filtered));
  },

  // Offline Action Queue
  async getOfflineQueue(): Promise<OfflineQueueItem[]> {
    const raw = await AsyncStorage.getItem(KEYS.OFFLINE_QUEUE);
    return raw ? JSON.parse(raw) : [];
  },

  async enqueueOfflineItem(item: OfflineQueueItem): Promise<void> {
    const queue = await this.getOfflineQueue();
    // Idempotent insertion by client UUID item.id
    const existing = queue.findIndex(q => q.id === item.id);
    if (existing >= 0) {
      queue[existing] = item;
    } else {
      queue.push(item);
    }
    await AsyncStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  },

  async updateOfflineItem(id: string, updates: Partial<OfflineQueueItem>): Promise<void> {
    const queue = await this.getOfflineQueue();
    const idx = queue.findIndex(q => q.id === id);
    if (idx >= 0) {
      queue[idx] = { ...queue[idx], ...updates };
      await AsyncStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    }
  },

  async removeOfflineItem(id: string): Promise<void> {
    const queue = await this.getOfflineQueue();
    const filtered = queue.filter(q => q.id !== id);
    await AsyncStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(filtered));
  },

  // Reset demo storage
  async clearAllData(): Promise<void> {
    await AsyncStorage.clear();
  },
};
