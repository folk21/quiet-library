import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LibraryPage } from './types';

export type RecentPage = {
  pageNumber: number;
  displayName: string;
  postCount: number;
  openedAt: string;
};

const STORAGE_KEY = 'quiet_library_recent_pages_v1';
const HISTORY_LIMIT = 12;

let cache: RecentPage[] | null = null;
let queue: Promise<void> = Promise.resolve();

function validEntry(value: unknown): value is RecentPage {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<RecentPage>;
  return Number.isSafeInteger(entry.pageNumber) && Number(entry.pageNumber) > 0 &&
    typeof entry.displayName === 'string' && entry.displayName.length > 0 &&
    Number.isSafeInteger(entry.postCount) && Number(entry.postCount) >= 0 &&
    typeof entry.openedAt === 'string' && !Number.isNaN(Date.parse(entry.openedAt));
}

async function readCache(): Promise<RecentPage[]> {
  if (cache !== null) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? parsed.filter(validEntry).slice(0, HISTORY_LIMIT) : [];
  } catch {
    cache = [];
  }
  return cache;
}

export async function loadRecentPages(): Promise<RecentPage[]> {
  await queue;
  return [...await readCache()];
}

export function recordPageOpen(page: LibraryPage): Promise<void> {
  const entry: RecentPage = {
    pageNumber: page.user.pageNumber,
    displayName: page.user.displayName,
    postCount: page.posts.length,
    openedAt: new Date().toISOString(),
  };
  queue = queue.catch(() => {}).then(async () => {
    const previous = await readCache();
    cache = [entry, ...previous.filter((item) => item.pageNumber !== entry.pageNumber)].slice(0, HISTORY_LIMIT);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache)); } catch {}
  });
  return queue;
}

export function clearRecentPages(): Promise<void> {
  queue = queue.catch(() => {}).then(async () => {
    cache = [];
    try { await AsyncStorage.removeItem(STORAGE_KEY); } catch {}
  });
  return queue;
}
