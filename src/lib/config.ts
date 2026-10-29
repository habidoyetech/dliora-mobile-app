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

/**
 * Laravel Reverb — live chat messages, on the same host as the API over 443.
 *
 * The key is public by design: it only identifies the app to the socket
 * server, and the web bundle ships it too. The app *secret* is server-side and
 * must never reach a client.
 *
 * Never default this to `localhost` — on a device that resolves to the handset
 * itself, so the build would fail silently. With no host the app doesn't
 * connect and chat falls back to polling, which is also what happens whenever
 * the socket drops.
 */
export const REVERB = {
  key: process.env.EXPO_PUBLIC_REVERB_APP_KEY ?? '440f6b08fd5a05ba9226',
  host: process.env.EXPO_PUBLIC_REVERB_HOST ?? 'app.dliora.com',
  scheme: process.env.EXPO_PUBLIC_REVERB_SCHEME ?? 'https',
  port: Number(
    process.env.EXPO_PUBLIC_REVERB_PORT ??
      (process.env.EXPO_PUBLIC_REVERB_SCHEME === 'http' ? 80 : 443),
  ),
} as const;

/** False until a real host and key are configured for this build. */
export const REVERB_ENABLED = REVERB.host !== '' && REVERB.key !== '';
