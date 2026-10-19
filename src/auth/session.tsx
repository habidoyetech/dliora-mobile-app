import { createContext, use, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { api, ApiError } from '@/lib/api';
import { secureStorage } from '@/lib/secure-storage';

const TOKEN_KEY = 'dliora.access_token';

export type AppRole = 'creator' | 'manager' | 'admin';

/** The signed-in person, as `/auth/login` and `/auth/me` send it. */
export type User = {
  id: number;
  name: string | null;
  first_name: string | null;
  greeting_name: string | null;
  tiktok_username: string | null;
  tiktok_handle: string | null;
  d_liora_id: string | null;
  email: string | null;
  avatar_url: string | null;
  roles: AppRole[];
  must_change_password: boolean;
  bootcamp_level: string | null;
};

type LoginResponse = {
  access_token: string;
  must_change_password: boolean;
  user: User;
};

type Session = {
  /** true until the saved session has been checked on launch */
  isLoading: boolean;
  token: string | null;
  user: User | null;
  signIn: (login: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

/** The app is for creators and managers; admins use the web Back-Office. */
export function canUseApp(user: Pick<User, 'roles'>): boolean {
  return user.roles.includes('creator') || user.roles.includes('manager');
}

export function useSession(): Session {
  const session = use(SessionContext);
  if (!session) throw new Error('useSession must be used inside <SessionProvider>');
  return session;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Launch: restore the saved token and refresh who it belongs to.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const saved = await secureStorage.get(TOKEN_KEY).catch(() => null);
      if (!saved) return;

      try {
        const me = await api<{ data: User } | User>('/auth/me', { token: saved });
        const profile = 'data' in me ? me.data : me;
        if (cancelled) return;
        if (!canUseApp(profile)) {
          await secureStorage.remove(TOKEN_KEY);
          return;
        }
        setToken(saved);
        setUser(profile);
      } catch (error) {
        if (cancelled) return;
        // Expired / revoked → sign in again. Offline → keep them signed in.
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await secureStorage.remove(TOKEN_KEY);
        } else {
          setToken(saved);
        }
      }
    })().finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (login: string, password: string) => {
    const res = await api<LoginResponse>('/auth/login', { method: 'POST', body: { login, password } });

    if (!canUseApp(res.user)) {
      // Don't leave a usable admin token behind.
      api('/auth/logout', { method: 'POST', token: res.access_token }).catch(() => {});
      throw new ApiError('This app is for creators and managers. Admins, please use the D-Liora Back-Office on the web.', 403);
    }

    await secureStorage.set(TOKEN_KEY, res.access_token);
    const signedIn = { ...res.user, must_change_password: res.must_change_password };
    setToken(res.access_token);
    setUser(signedIn);
    return signedIn;
  }, []);

  const signOut = useCallback(async () => {
    const current = token;
    setToken(null);
    setUser(null);
    await secureStorage.remove(TOKEN_KEY);
    // Revoke on the server too; signing out works even offline.
    if (current) api('/auth/logout', { method: 'POST', token: current }).catch(() => {});
  }, [token]);

  const value = useMemo(() => ({ isLoading, token, user, signIn, signOut }), [isLoading, token, user, signIn, signOut]);

  return <SessionContext value={value}>{children}</SessionContext>;
}
