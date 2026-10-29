import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import { useSession } from '@/auth/session';
import { REVERB_ENABLED } from '@/lib/config';
import { getSocketId } from '@/lib/echo';
import { uploadToTarget } from '@/lib/uploads';
import type { ChatMessage, Conversation, MessagesPage, UploadTarget } from '@/types/api';

/**
 * `GET /chat/conversations`. The backend pushes new messages over Reverb for
 * the web portal; until the websocket client is wired up here, the list polls
 * while the screen is open — cheap, and it keeps the unread badges honest.
 */
export function useConversations() {
  const request = useApi();

  return useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: () => request<{ data: Conversation[] }>('/chat/conversations').then((r) => r.data),
    refetchInterval: REVERB_ENABLED ? 60_000 : 20_000,
  });
}

export type ChatContact = {
  id: number;
  name: string | null;
  role: string;
  d_liora_id: string | null;
  tiktok_username: string | null;
  avatar_url: string | null;
  is_my_manager: boolean;
};

/** Who this person is allowed to start a chat with. */
export function useChatContacts() {
  const request = useApi();

  return useQuery({
    queryKey: ['chat', 'contacts'],
    queryFn: () => request<{ data: ChatContact[] }>('/chat/contacts').then((r) => r.data),
  });
}

/** Opens (or reuses) a direct chat with someone from the contact list. */
export function useStartConversation() {
  const request = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    // `adminTeam` opens the "D-Liora Admin" support thread instead of a person.
    mutationFn: (target: { recipientId: number } | { adminTeam: true }) =>
      request<{ data: Conversation }>('/chat/conversations', {
        method: 'POST',
        body: 'adminTeam' in target ? { admin_team: true } : { recipient_id: target.recipientId },
      }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] }),
  });
}

/**
 * The newest messages in a thread, oldest first. Opening the thread marks it
 * read on the server, so the conversation list and the dashboard badge are
 * refreshed too.
 */
export function useMessages(conversationId: number | undefined, live = false) {
  const request = useApi();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['chat', 'messages', conversationId],
    enabled: conversationId !== undefined,
    // With the socket connected this is only a safety net for anything the
    // connection missed; without it, it's how messages arrive at all.
    refetchInterval: live ? 60_000 : 8_000,
    queryFn: async () => {
      const page = await request<MessagesPage>(
        `/chat/conversations/${conversationId}/messages?recent=1&per_page=40`,
      );
      // The server marked them read as it answered.
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      return page;
    },
  });
}

/** config/… StoreChatMessageRequest — 5 files, 20MB each. */
export const CHAT_MAX_FILES = 5;
export const CHAT_MAX_BYTES = 20 * 1024 * 1024;

export type PendingAttachment = { path: string; name: string };

export function useSendMessage(conversationId: number | undefined) {
  const request = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ body, uploaded }: { body: string; uploaded?: PendingAttachment[] }) => {
      const socketId = getSocketId();

      return request<{ data: ChatMessage }>(`/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        // The API wants a body or at least one file — never neither.
        body: { ...(body ? { body } : {}), ...(uploaded?.length ? { uploaded } : {}) },
        // Our own socket shouldn't be sent the echo of this message.
        ...(socketId ? { headers: { 'X-Socket-ID': socketId } } : {}),
      }).then((r) => r.data);
    },
    onSuccess: (message) => {
      // Show it straight away rather than waiting for the next poll.
      queryClient.setQueryData<MessagesPage>(['chat', 'messages', conversationId], (current) =>
        current ? { ...current, data: [...current.data, message] } : current,
      );
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
}


/**
 * Sends a picked chat file straight to storage, the same two-step the
 * assignment hand-ins use: ask the API where it goes, upload there, then name
 * it on the message.
 */
export function useChatUpload() {
  const request = useApi();
  const { token } = useSession();

  return useMutation({
    mutationFn: async (file: { uri: string; name: string; size: number; mimeType?: string }) => {
      const target = await request<{ data: UploadTarget }>('/uploads/files/chat', {
        method: 'POST',
        body: { filename: file.name, size: file.size },
      }).then((r) => r.data);

      await uploadToTarget(target, file, token);

      return { path: target.path, name: file.name };
    },
  });
}
