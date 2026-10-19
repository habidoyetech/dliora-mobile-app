/**
 * Where the app talks to. Override per build with EXPO_PUBLIC_API_URL /
 * EXPO_PUBLIC_WEB_URL (e.g. a local API while developing):
 *
 *   EXPO_PUBLIC_API_URL=http://192.168.1.10:8000/api npx expo start
 */
const trim = (url: string) => url.replace(/\/+$/, '');

export const API_URL = trim(process.env.EXPO_PUBLIC_API_URL ?? 'https://app.dliora.com/api');

/** The public website — "Join Agency" and "Forgot password" open here for now. */
export const WEB_URL = trim(process.env.EXPO_PUBLIC_WEB_URL ?? 'https://dliora.com');

/** Give up on a request after this long (slow mobile networks). */
export const REQUEST_TIMEOUT_MS = 20_000;
