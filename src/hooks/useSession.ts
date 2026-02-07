import { useCallback, useEffect } from 'react';
import { openDB, type IDBPDatabase } from 'idb';
import { useAppStore } from '@/store/appStore';
import type { Session, DifyMessage, Listing, AmenitiesData, Location, RadiusKm } from '@/types';

const DB_NAME = 'nestai-sessions';
const SESSIONS_STORE = 'sessions';
const MESSAGES_STORE = 'messages';
const STATE_STORE = 'state';

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        const sessionsStore = db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
        sessionsStore.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        const messagesStore = db.createObjectStore(MESSAGES_STORE, { keyPath: 'id', autoIncrement: true });
        messagesStore.createIndex('sessionId', 'sessionId');
      }
      if (!db.objectStoreNames.contains(STATE_STORE)) {
        db.createObjectStore(STATE_STORE, { keyPath: 'key' });
      }
    },
  });
}

export function useSession() {
  const {
    sessionId,
    userId,
    messages,
    location,
    radiusKm,
    priceMin,
    priceMax,
    countryCode,
    amenities,
    listings,
    setListings,
    setAmenities,
  } = useAppStore();

  // Save session state to IndexedDB
  const saveSession = useCallback(async () => {
    try {
      const db = await getDB();
      
      const session: Session = {
        id: sessionId,
        createdAt: new Date().toISOString(),
        location: location || undefined,
        messages: messages.slice(-6), // Keep last 6 messages
        memorySummary: '',
        listings,
        selectedOfferIds: [],
        countryCode: countryCode || undefined,
        priceMin,
        priceMax,
        radiusKm,
        amenitiesSnapshot: amenities || undefined,
        offersSnapshot: listings,
      };

      await db.put(SESSIONS_STORE, session);
    } catch (err) {
      console.warn('Failed to save session:', err);
    }
  }, [sessionId, location, messages, listings, countryCode, priceMin, priceMax, radiusKm, amenities]);

  // Load session from IndexedDB
  const loadSession = useCallback(async (id: string): Promise<Session | null> => {
    try {
      const db = await getDB();
      return await db.get(SESSIONS_STORE, id);
    } catch (err) {
      console.warn('Failed to load session:', err);
      return null;
    }
  }, []);

  // Get all sessions
  const getAllSessions = useCallback(async (): Promise<Session[]> => {
    try {
      const db = await getDB();
      const sessions = await db.getAllFromIndex(SESSIONS_STORE, 'createdAt');
      return sessions.reverse(); // Most recent first
    } catch (err) {
      console.warn('Failed to get sessions:', err);
      return [];
    }
  }, []);

  // Delete a session
  const deleteSession = useCallback(async (id: string) => {
    try {
      const db = await getDB();
      await db.delete(SESSIONS_STORE, id);
    } catch (err) {
      console.warn('Failed to delete session:', err);
    }
  }, []);

  // Save last state for quick restore
  const saveLastState = useCallback(async () => {
    try {
      const db = await getDB();
      await db.put(STATE_STORE, {
        key: 'lastState',
        location,
        radiusKm,
        priceMin,
        priceMax,
        countryCode,
        amenities,
        listings,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Failed to save last state:', err);
    }
  }, [location, radiusKm, priceMin, priceMax, countryCode, amenities, listings]);

  // Load last state
  const loadLastState = useCallback(async () => {
    try {
      const db = await getDB();
      const state = await db.get(STATE_STORE, 'lastState');
      if (state) {
        if (state.amenities) setAmenities(state.amenities);
        if (state.listings) setListings(state.listings);
      }
      return state;
    } catch (err) {
      console.warn('Failed to load last state:', err);
      return null;
    }
  }, [setAmenities, setListings]);

  // Auto-save on changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (sessionId && (messages.length > 0 || listings.length > 0)) {
        saveSession();
        saveLastState();
      }
    }, 2000); // Debounce 2 seconds

    return () => clearTimeout(timeout);
  }, [sessionId, messages, listings, saveSession, saveLastState]);

  return {
    saveSession,
    loadSession,
    getAllSessions,
    deleteSession,
    saveLastState,
    loadLastState,
  };
}
