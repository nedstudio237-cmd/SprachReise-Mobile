/**
 * Store des conversations IA — persiste dans AsyncStorage par utilisateur.
 * Chaque conversation : { id, title, level, context, messages[], createdAt, updatedAt }
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_CONVERSATIONS = 50;

// Clé propre à chaque utilisateur pour isoler les historiques
function storageKey(userId) {
  return userId ? `ai_chat_history_${userId}` : 'ai_chat_history_guest';
}

function makeId() {
  return 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function autoTitle(messages) {
  const first = messages.find((m) => m.role === 'user');
  if (!first) return 'Conversation';
  return first.text.length > 60 ? first.text.slice(0, 57) + '...' : first.text;
}

export const useChatStore = create((set, get) => ({
  conversations: [],
  loaded:        false,
  currentUserId: null,   // userId chargé en mémoire

  // ── Charger l'historique d'un utilisateur précis ────────────────────────
  load: async (userId) => {
    const key = storageKey(userId);
    // Si déjà chargé pour ce même user, ne pas recharger
    if (get().loaded && get().currentUserId === userId) return;
    try {
      const raw = await AsyncStorage.getItem(key);
      const conversations = raw ? JSON.parse(raw) : [];
      set({ conversations, loaded: true, currentUserId: userId });
    } catch {
      set({ conversations: [], loaded: true, currentUserId: userId });
    }
  },

  // ── Réinitialiser quand on change d'utilisateur ─────────────────────────
  reset: () => set({ conversations: [], loaded: false, currentUserId: null }),

  // ── Sauvegarder une conversation (create ou update) ─────────────────────
  saveConversation: async (conv, userId) => {
    const key = storageKey(userId ?? get().currentUserId);
    const { conversations } = get();
    const now = new Date().toISOString();

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
      updated = [newConv, ...conversations].slice(0, MAX_CONVERSATIONS);
    }

    set({ conversations: updated });
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return existing ? conv.id : updated[0].id;
  },

  // ── Supprimer une conversation ───────────────────────────────────────────
  deleteConversation: async (id, userId) => {
    const key = storageKey(userId ?? get().currentUserId);
    const updated = get().conversations.filter((c) => c.id !== id);
    set({ conversations: updated });
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  },

  // ── Effacer tout l'historique de l'utilisateur courant ──────────────────
  clearAll: async (userId) => {
    const key = storageKey(userId ?? get().currentUserId);
    set({ conversations: [] });
    await AsyncStorage.removeItem(key);
  },
}));
