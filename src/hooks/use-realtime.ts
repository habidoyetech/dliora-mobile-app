import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useSession } from '@/auth/session';
import { disconnectEcho, getEcho } from '@/lib/echo';
import { REVERB_ENABLED } from '@/lib/config';
import type { ChatMessage, MessagesPage } from '@/types/api';

/**
 * Live messages in one conversation. Returns whether the socket is actually
 * connected, so the screen can slow its polling down rather than turning it
 * off — on mobile a socket drops whenever the app backgrounds or the network
 * switches, and the API keeps saving messages either way.
 */
export function useConversationChannel(conversationId: number | undefined): boolean {
  const { token } = useSession();
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!REVERB_ENABLED || !token || conversationId === undefined) return;

    const echo = getEcho(token);
    if (!echo) return;

    const channel = echo.private(`chat.conversation.${conversationId}`);

    channel.listen('.message.sent', (event: { message?: ChatMessage } | ChatMessage) => {
      const message = 'message' in event && event.message ? event.message : (event as ChatMessage);
      if (!message?.id) return;

      queryClient.setQueryData<MessagesPage>(['chat', 'messages', conversationId], (current) => {
        if (!current) return current;
        // Our own message may already be here from the POST response.
        if (current.data.some((existing) => existing.id === message.id)) return current;
        return { ...current, data: [...current.data, message] };
      });
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    });

    // The underlying pusher connection is shared, so track its state rather
    // than assuming a subscription means we're live.
    const connection = (echo.connector as { pusher?: { connection?: { state?: string; bind?: (e: string, cb: () => void) => void; unbind?: (e: string, cb: () => void) => void } } })
      .pusher?.connection;

    const sync = () => setConnected(connection?.state === 'connected');
    sync();
    connection?.bind?.('state_change', sync);

    return () => {
      connection?.unbind?.('state_change', sync);
      echo.leave(`chat.conversation.${conversationId}`);
      setConnected(false);
    };
  }, [conversationId, token, queryClient]);

  return connected;
}

/** New direct chats someone opens with you, on your own channel. */
export function useUserChannel(): void {
  const { token, user } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!REVERB_ENABLED || !token || !user?.id) return;

    const echo = getEcho(token);
    if (!echo) return;

    echo
      .private(`App.Models.User.${user.id}`)
      .listen('.conversation.started', () => {
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      });

    return () => echo.leave(`App.Models.User.${user.id}`);
  }, [token, user?.id, queryClient]);
}

/**
 * Drops the socket when the app goes to the background and reopens it on
 * return. Without this the connection dies quietly and the UI keeps believing
 * it's live.
 */
export function useRealtimeLifecycle(): void {
  const { token } = useSession();

  useEffect(() => {
    if (!REVERB_ENABLED) return;

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (token) getEcho(token);
      } else if (state === 'background') {
        disconnectEcho();
      }
    });

    return () => subscription.remove();
  }, [token]);
}
