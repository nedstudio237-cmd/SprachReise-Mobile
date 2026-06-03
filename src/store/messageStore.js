import { create } from 'zustand';

export const useMessageStore = create((set, get) => ({
  // { [otherUserId]: MessageDto[] }
  conversations: {},
  // { [otherUserId]: number }
  unread: {},

  // ── Conversations ─────────────────────────────────────────────────────────
  setMessages: (otherId, messages) =>
    set(s => ({ conversations: { ...s.conversations, [otherId]: messages } })),

  getMessages: (otherId) => get().conversations[otherId] ?? null,

  /** Ajoute ou remplace un message (par id) dans une conversation */
  upsertMessage: (otherId, msg) =>
    set(s => {
      const list = s.conversations[otherId] ?? [];
      const idx  = list.findIndex(m => m.id === msg.id);
      const next = idx >= 0
        ? list.map((m, i) => (i === idx ? msg : m))
        : [...list, msg];
      return { conversations: { ...s.conversations, [otherId]: next } };
    }),

  /** Met à jour un champ d'un message existant */
  patchMessage: (otherId, msgId, patch) =>
    set(s => {
      const list = s.conversations[otherId];
      if (!list) return s;
      return {
        conversations: {
          ...s.conversations,
          [otherId]: list.map(m => m.id === msgId ? { ...m, ...patch } : m),
        },
      };
    }),

  // ── Non-lus ───────────────────────────────────────────────────────────────
  setUnread: (otherId, count) =>
    set(s => ({ unread: { ...s.unread, [otherId]: count } })),

  incrementUnread: (otherId) =>
    set(s => ({ unread: { ...s.unread, [otherId]: (s.unread[otherId] ?? 0) + 1 } })),

  clearUnread: (otherId) =>
    set(s => ({ unread: { ...s.unread, [otherId]: 0 } })),

  getUnread: (otherId) => get().unread[otherId] ?? 0,

  /** Total de tous les non-lus (pour badge global) */
  totalUnread: () => Object.values(get().unread).reduce((a, b) => a + b, 0),
}));
