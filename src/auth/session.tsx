import { useQueryClient } from '@tanstack/react-query';
import { createContext, use, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { api, ApiError, setUnauthorizedHandler } from '@/lib/api';
import { secureStorage } from '@/lib/secure-storage';

const TOKEN_KEY = 'dliora.access_token';
const USER_KEY = 'dliora.user';

export type AppRole = 'creator' | 'manager' | 'admin';

export type UserStatus = 'pending_registration' | 'active' | 'suspended' | 'disabled';

/** Set while that portal is restricted; null while it isn't. */
export type RoleRestriction = {
  reason: string | null;
  restricted_at: string | null;
};

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
  status?: UserStatus | null;
  region_name?: string | null;
  manager?: { status: 'certified' | 'pending'; since: string | null } | null;
  /** Per role: set while that portal is restricted, else null. */
  restrictions?: {
    creator: RoleRestriction | null;
    manager: RoleRestriction | null;
  } | null;
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
  changePassword: (input: ChangePasswordInput) => Promise<void>;
};

export type ChangePasswordInput = {
  /** Omitted for a forced first-login change — the API doesn't ask for it then. */
  currentPassword?: string;
  password: string;
  passwordConfirmation: string;
};

const SessionContext = createContext<Session | null>(null);

const PORTAL_ROLES = ['creator', 'manager'] as const;

type AccessInput = Pick<User, 'roles' | 'restrictions'>;

/**
 * Restrictions are per role on the server, so someone restricted only as a
 * manager still uses the creator side. These are the portals they can open.
 */
export function usableRoles(user: AccessInput): AppRole[] {
  return PORTAL_ROLES.filter((role) => user.roles.includes(role) && !user.restrictions?.[role]);
}

export type Access =
  | { kind: 'ok'; roles: AppRole[] }
  /** Admin-only account — the Back-Office is on the web. */
  | { kind: 'wrong-app' }
  /** Holds a portal role, but every one of them is restricted. */
  | { kind: 'restricted'; reason: string | null };

export function accessFor(user: AccessInput): Access {
  const usable = usableRoles(user);
  if (usable.length) return { kind: 'ok', roles: usable };

  const held = PORTAL_ROLES.filter((role) => user.roles.includes(role));
  if (!held.length) return { kind: 'wrong-app' };

  // Restricted everywhere they hold a role — tell them why rather than
  // dropping them into an app where every request 403s.
  const reason = held.map((role) => user.restrictions?.[role]?.reason).find(Boolean) ?? null;
  return { kind: 'restricted', reason };
}

/**
 * Whether this account belongs in the app at all. Restricted creators do —
 * they're shown the reason; admins don't.
 */
export function canUseApp(user: AccessInput): boolean {
  return accessFor(user).kind !== 'wrong-app';
}

export function useSession(): Session {
  const session = use(SessionContext);
  if (!session) throw new Error('useSession must be used inside <SessionProvider>');
  return session;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  /** Forget the session locally. Used on sign-out and when a token is rejected. */
  const clearSession = useCallback(async () => {
    setToken(null);
    setUser(null);
    // Without this the next person to sign in on this device would be served
    // the previous one's cached campaigns, training progress and profile.
    queryClient.clear();
    await Promise.all([
      secureStorage.remove(TOKEN_KEY).catch(() => {}),
      secureStorage.remove(USER_KEY).catch(() => {}),
    ]);
  }, [queryClient]);

  // Any 401 on a request we authenticated means the token is dead — drop it
  // wherever the user happens to be, rather than leaving them on a screen
  // that silently fails.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Launch: restore the saved session, then refresh it in the background.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [saved, cachedUser] = await Promise.all([
        secureStorage.get(TOKEN_KEY).catch(() => null),
        secureStorage.get(USER_KEY).catch(() => null),
      ]);
      if (!saved || cancelled) return;

      // Show the app immediately from cache; a stale name beats a blank screen.
      let restored: User | null = null;
      if (cachedUser) {
        try {
          const parsed = JSON.parse(cachedUser) as User;
          if (canUseApp(parsed)) {
            restored = parsed;
            setToken(saved);
            setUser(parsed);
          }
        } catch {
          await secureStorage.remove(USER_KEY).catch(() => {});
        }
      }

      try {
        const me = await api<{ data: User } | User>('/auth/me', {
          token: saved,
          // Handled explicitly below — don't also fire the global handler.
          skipUnauthorizedHandler: true,
        });
        const profile = 'data' in me ? me.data : me;
        if (cancelled) return;

        if (!canUseApp(profile)) {
          await clearSession();
          return;
        }
        setToken(saved);
        setUser(profile);
        await secureStorage.set(USER_KEY, JSON.stringify(profile)).catch(() => {});
      } catch (error) {
        if (cancelled) return;
        // Expired / revoked → sign in again.
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await clearSession();
          return;
        }
        // Offline or server trouble: stay signed in only if we have a cached
        // profile to render. A token with no user is a broken half-state.
        if (!restored) await clearSession();
      }
    })().finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const signIn = useCallback(async (login: string, password: string) => {
    const res = await api<LoginResponse>('/auth/login', { method: 'POST', body: { login, password } });

    if (!canUseApp(res.user)) {
      // Don't leave a usable admin token behind.
      api('/auth/logout', { method: 'POST', token: res.access_token }).catch(() => {});
      throw new ApiError('This app is for creators and managers. Admins, please use the D-Liora Back-Office on the web.', 403);
    }

    const signedIn = { ...res.user, must_change_password: res.must_change_password };
    await Promise.all([
      secureStorage.set(TOKEN_KEY, res.access_token),
      secureStorage.set(USER_KEY, JSON.stringify(signedIn)).catch(() => {}),
    ]);
    setToken(res.access_token);
    setUser(signedIn);
    return signedIn;
  }, []);

  const changePassword = useCallback(
    async ({ currentPassword, password, passwordConfirmation }: ChangePasswordInput) => {
      const res = await api<{ message: string; user: User }>('/auth/password', {
        method: 'PUT',
        token,
        body: {
          ...(currentPassword ? { current_password: currentPassword } : {}),
          password,
          password_confirmation: passwordConfirmation,
        },
      });

      // The API revokes every *other* token and keeps this one, so the session
      // survives the change — just refresh the profile we're holding.
      setUser(res.user);
      await secureStorage.set(USER_KEY, JSON.stringify(res.user)).catch(() => {});
    },
    [token],
  );

  const signOut = useCallback(async () => {
    const current = token;
    await clearSession();
    // Revoke on the server too; signing out works even offline.
    if (current) {
      api('/auth/logout', { method: 'POST', token: current, skipUnauthorizedHandler: true }).catch(() => {});
    }
  }, [token, clearSession]);

  const value = useMemo(
    () => ({ isLoading, token, user, signIn, signOut, changePassword }),
    [isLoading, token, user, signIn, signOut, changePassword],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}
