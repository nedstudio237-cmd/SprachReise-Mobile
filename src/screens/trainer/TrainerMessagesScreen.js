import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { COLORS, FONTS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { useMessageStore } from '../../store/messageStore';
import socketService from '../../services/socketService';
import api from '../../services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

function Avatar({ name, size = 44 }) {
  const initials = (name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: size * 0.35 }}>{initials}</Text>
    </View>
  );
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso), now = new Date(), diff = now - d;
  if (diff < 60000)    return 'À l\'instant';
  if (diff < 3600000)  return Math.floor(diff / 60000) + ' min';
  if (diff < 86400000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function TrainerMessagesScreen({ navigation }) {
  const { user, accessToken } = useAuthStore();
  const { setUnread, incrementUnread } = useMessageStore();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showSearch, setShowSearch]       = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]         = useState(false);

  // ── Chargement inbox ──────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/inbox');
      const list = Array.isArray(data) ? data : [];
      setConversations(list);
      list.forEach(c => setUnread(c.otherUserId, c.unreadCount ?? 0));
    } catch {}
    finally { setLoading(false); }
  }, [setUnread]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ── WebSocket temps réel ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !accessToken) return;

    socketService.connect(accessToken, () => {
      socketService.subscribe(`/topic/inbox/${user.id}`, frame => {
        try {
          const msg     = JSON.parse(frame.body);
          const sender  = msg.senderId;
          const preview = msg.messageType !== 'TEXT'
            ? `[${(msg.messageType ?? 'fichier').toLowerCase()}]`
            : (msg.content ?? '');

          setConversations(prev => {
            const idx = prev.findIndex(c => c.otherUserId === sender);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], lastMessage: preview, lastSentAt: msg.sentAt, lastSenderId: sender, unreadCount: (updated[idx].unreadCount ?? 0) + 1 };
              const [item] = updated.splice(idx, 1);
              return [item, ...updated];
            }
            load();
            return prev;
          });

          incrementUnread(sender);

          const conv = conversations.find(c => c.otherUserId === sender);
          const name = conv ? `${conv.otherFirstName ?? ''} ${conv.otherLastName ?? ''}`.trim() : 'Nouvel apprenant';
          Notifications.scheduleNotificationAsync({
            content: {
              title: name,
              body:  msg.messageType !== 'TEXT' ? `📎 ${msg.messageType}` : (msg.content ?? ''),
              data:  { otherUserId: sender, otherName: name },
            },
            trigger: null,
          });
        } catch {}
      });
    });

    const poll = setInterval(() => load(), 3000);
    return () => {
      socketService.unsubscribe(`/topic/inbox/${user.id}`);
      clearInterval(poll);
    };
  }, [user?.id, accessToken, incrementUnread, load]);

  // ── Recherche dans les apprenants assignés ────────────────────────────────
  const searchLearners = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await api.get('/trainer/learners');
      const list = Array.isArray(data) ? data : [];
      const filtered = list.filter(l =>
        `${l.firstName ?? ''} ${l.lastName ?? ''}`.toLowerCase().includes(q.toLowerCase())
      );
      setSearchResults(filtered);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  // ── Ouvrir conversation ───────────────────────────────────────────────────
  const openConversation = (item) => {
    const fullName = `${item.otherFirstName ?? ''} ${item.otherLastName ?? ''}`.trim();
    setConversations(prev =>
      prev.map(c => c.otherUserId === item.otherUserId ? { ...c, unreadCount: 0 } : c)
    );
    setUnread(item.otherUserId, 0);
    navigation?.navigate('Conversation', { otherUserId: item.otherUserId, otherName: fullName });
  };

  const renderItem = ({ item }) => {
    const fullName  = `${item.otherFirstName ?? ''} ${item.otherLastName ?? ''}`.trim();
    const roleLabel = item.otherRole === 'LEARNER' ? 'Apprenant' : item.otherRole === 'TRAINER' ? 'Formateur' : 'Admin';
    const unread    = item.unreadCount ?? 0;
    const isMine    = item.lastSenderId === user?.id;

    return (
      <TouchableOpacity style={st.row} onPress={() => openConversation(item)} activeOpacity={0.8}>
        <Avatar name={fullName} />
        <View style={st.body}>
          <View style={st.top}>
            <Text style={[st.name, unread > 0 && st.nameBold]}>{fullName || 'Utilisateur'}</Text>
            <Text style={st.time}>{formatTime(item.lastSentAt)}</Text>
          </View>
          <View style={st.bottom}>
            <Text style={st.roleTag}>{roleLabel}</Text>
            <Text style={[st.preview, unread > 0 && st.previewBold]} numberOfLines={1}>
              {isMine ? `Vous : ${item.lastMessage ?? '…'}` : (item.lastMessage ?? '…')}
            </Text>
          </View>
        </View>
        {unread > 0 && (
          <View style={st.badge}>
            <Text style={st.badgeTxt}>{unread > 99 ? '99+' : unread}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={st.container}>
      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.parchment} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={() => setShowSearch(true)} style={st.newBtn}>
          <Ionicons name="create-outline" size={22} color={COLORS.cream} />
        </TouchableOpacity>
      </View>

      {/* Modal recherche apprenant */}
      <Modal visible={showSearch} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={st.searchCt}>
          <View style={st.searchHdr}>
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}>
              <Text style={st.cancelTxt}>Annuler</Text>
            </TouchableOpacity>
            <Text style={st.searchTitle}>Nouveau message</Text>
            <View style={{ width: 60 }} />
          </View>
          <View style={st.searchRow}>
            <Ionicons name="search" size={18} color={COLORS.muted} />
            <TextInput
              style={st.searchInput}
              placeholder="Rechercher un apprenant…"
              placeholderTextColor={COLORS.muted}
              value={searchQuery}
              onChangeText={searchLearners}
              autoFocus
            />
            {searching && <ActivityIndicator size="small" color={COLORS.accent} />}
          </View>
          <FlatList
            data={searchResults}
            keyExtractor={i => String(i.id ?? i.userId)}
            renderItem={({ item }) => {
              const name = `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim();
              const id   = item.id ?? item.userId;
              return (
                <TouchableOpacity
                  style={st.searchResult}
                  onPress={() => {
                    setShowSearch(false); setSearchQuery(''); setSearchResults([]);
                    navigation.navigate('Conversation', { otherUserId: id, otherName: name });
                  }}
                >
                  <Avatar name={name} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={st.resultName}>{name}</Text>
                    <Text style={st.resultSub}>Apprenant · {item.levelCode ?? item.level ?? ''}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              searchQuery.length > 0 && !searching
                ? <Text style={st.noResult}>Aucun apprenant trouvé</Text>
                : <Text style={st.hint}>Recherchez parmi vos apprenants pour démarrer une conversation</Text>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Liste */}
      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 60 }} />
      ) : conversations.length === 0 ? (
        <View style={st.empty}>
          <Text style={{ fontSize: 48 }}>💬</Text>
          <Text style={st.emptyTxt}>Aucune conversation</Text>
          <TouchableOpacity onPress={() => setShowSearch(true)} style={st.startBtn}>
            <Text style={st.startBtnTxt}>Écrire à un apprenant</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={i => String(i.otherUserId)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.deep },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.2)' },
  headerTitle: { flex: 1, fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 20 },
  newBtn:      { padding: 4 },

  row:         { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.1)' },
  body:        { flex: 1 },
  top:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name:        { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 14 },
  nameBold:    { fontFamily: FONTS.uiBold, color: COLORS.parchment },
  time:        { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11 },
  bottom:      { flexDirection: 'row', gap: 6, alignItems: 'center' },
  roleTag:     { fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 9, borderWidth: 1, borderColor: COLORS.accent, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  preview:     { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12, flex: 1, fontStyle: 'italic' },
  previewBold: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontStyle: 'normal' },
  badge:       { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeTxt:    { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 10 },

  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyTxt:    { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 15, fontStyle: 'italic' },
  startBtn:    { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: COLORS.accent, borderRadius: 24 },
  startBtnTxt: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 14 },

  searchCt:    { flex: 1, backgroundColor: COLORS.deep },
  searchHdr:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.2)' },
  cancelTxt:   { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 15 },
  searchTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 18 },
  searchRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 15 },
  searchResult:{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.1)' },
  resultName:  { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 14, marginBottom: 3 },
  resultSub:   { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12 },
  noResult:    { textAlign: 'center', marginTop: 40, fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, fontStyle: 'italic' },
  hint:        { textAlign: 'center', marginTop: 40, fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13, fontStyle: 'italic', paddingHorizontal: 30 },
});
