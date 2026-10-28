import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';
import { readToken, writeToken } from './storage';
import type { AuthResponse, User } from './types';

type SessionContextType = {
  token: string | null;
  user: User | null;
  loading: boolean;
  signIn: (response: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await readToken();
      if (stored) {
        try {
          const restored = await api.me(stored);
          if (active) { setToken(stored); setUser(restored); }
        } catch { await writeToken(null); }
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const signIn = useCallback(async (response: AuthResponse) => {
    await writeToken(response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const signOut = useCallback(async () => {
    if (token) await api.logout(token).catch(() => {});
    await writeToken(null);
    setToken(null);
    setUser(null);
  }, [token]);

  const refresh = useCallback(async () => {
    if (token) setUser(await api.me(token));
  }, [token]);

  return <SessionContext.Provider value={{ token, user, loading, signIn, signOut, refresh }}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextType {
  const value = useContext(SessionContext);
  if (!value) throw new Error('SessionProvider is missing.');
  return value;
}
