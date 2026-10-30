import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

import { API_URL, REVERB, REVERB_ENABLED } from '@/lib/config';

/**
 * Live chat over Laravel Reverb — the mobile counterpart of the web portal's
 * `lib/echo.ts`. One shared connection per signed-in token; channels are
 * authorised at `POST /api/broadcasting/auth` with the same Passport bearer
 * token as every other call.
 *
 * Returns null when Reverb isn't configured for this build, so chat keeps
 * working over polling instead of failing.
 */
let echo: Echo<'reverb'> | null = null;
let echoToken: string | null = null;

export function getEcho(token: string | null): Echo<'reverb'> | null {
  if (!REVERB_ENABLED || !token) return null;

  // Signed in as someone else since the last connection — start over, so the
  // previous creator's channels aren't left subscribed.
  if (echo && echoToken !== token) disconnectEcho();
  if (echo) return echo;

  echo = new Echo({
    broadcaster: 'reverb',
    key: REVERB.key,
    wsHost: REVERB.host,
    wsPort: REVERB.port,
    wssPort: REVERB.port,
    forceTLS: REVERB.scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    Pusher,
    authorizer: (channel: { name: string }) => ({
      authorize: (
        socketId: string,
        callback: (error: Error | null, data: unknown) => void,
      ) => {
        fetch(`${API_URL}/broadcasting/auth`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
        })
          .then(async (response) => {
            if (!response.ok) throw new Error(`Channel auth failed (${response.status})`);
            callback(null, await response.json());
          })
          .catch((error: Error) => callback(error, null));
      },
    }),
  });
  echoToken = token;

  return echo;
}

/**
 * The current socket id. Sent as `X-Socket-ID` when posting a message so the
 * server doesn't echo our own message back to us over the socket.
 */
export function getSocketId(): string | undefined {
  return echo?.socketId();
}

export function disconnectEcho(): void {
  echo?.disconnect();
  echo = null;
  echoToken = null;
}
