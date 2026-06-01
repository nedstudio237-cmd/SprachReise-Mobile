/**
 * Store des conversations IA — persiste dans AsyncStorage.
 * Chaque conversation : { id, title, level, context, messages[], createdAt, updatedAt }
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ai_chat_history';
const MAX_CONVERSATIONS = 50;

function makeId() {
  return 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

// Titre auto : premiers 60 caractères du premier message utilisateur
function autoTitle(messages) {
  const first = messages.find((m) => m.role === 'user');
  if (!first) return 'Conversation';
  return first.text.length > 60 ? first.text.slice(0, 57) + '...' : first.text;
}

export const useChatStore = create((set, get) => ({
  conversations: [],   // liste triée par updatedAt desc
  loaded: false,

  // ── Charger depuis AsyncStorage ────────────────────────────────────────
  load: async () => {
    if (get().loaded) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const conversations = raw ? JSON.parse(raw) : [];
      set({ conversations, loaded: true });
    } catch {
      set({ conversations: [], loaded: true });
    }
  },

  // ── Sauvegarder une conversation (create ou update) ────────────────────
  saveConversation: async (conv) => {
    const { conversations } = get();
    const now = new Date().toISOString();

    // Ne pas sauvegarder si moins de 2 messages (uniquement le message de bienvenue)
    const realMessages = conv.messages.filter((m) => m.id !== 'welcome');
    if (realMessages.length < 2) return conv.id ?? null;

    const existing = conversations.find((c) => c.id === conv.id);
    let updated;

    if (existing) {
      updated = conversations.map((c) =>
        c.id === conv.id
          ? { ...c, messages: realMessages, title: autoTitle(realMessages), updatedAt: now }
          : c
      );
    } else {
      const newConv = {
        id:        conv.id ?? makeId(),
        title:     autoTitle(realMessages),
        level:     conv.level ?? 'A1',
        context:   conv.context ?? '',
        messages:  realMessages,
        createdAt: now,
        updatedAt: now,
      };
      // Garder les MAX_CONVERSATIONS les plus récentes
      updated = [newConv, ...conversations].slice(0, MAX_CONVERSATIONS);
    }

    set({ conversations: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return existing ? conv.id : updated[0].id;
  },

  // ── Supprimer une conversation ─────────────────────────────────────────
  deleteConversation: async (id) => {
    const updated = get().conversations.filter((c) => c.id !== id);
    set({ conversations: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  // ── Effacer tout l'historique ──────────────────────────────────────────
  clearAll: async () => {
    set({ conversations: [] });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
