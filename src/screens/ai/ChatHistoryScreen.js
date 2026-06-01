import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Alert, SafeAreaView as RNSafeAreaView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';
import { useChatStore } from '../../store/chatStore';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  if (h < 24) return `Il y a ${h}h`;
  if (d < 7)  return `Il y a ${d}j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function levelColor(level) {
  const map = { A1: '#10B981', A2: '#3B82F6', B1: '#8B5CF6', B2: '#F59E0B', C1: '#EF4444', C2: '#EC4899' };
  return map[level] ?? COLORS.gold;
}

export default function ChatHistoryScreen({ navigation }) {
  const { conversations, loaded, load, deleteConversation, clearAll } = useChatStore();
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { load(); }, []);

  const handleOpen = (conv) => {
    navigation.navigate('AiTutor', {
      resumeConv: conv,  // reprendre une conversation existante
    });
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Supprimer',
      'Supprimer cette conversation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => { setDeleting(id); deleteConversation(id).then(() => setDeleting(null)); } },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Effacer tout',
      'Supprimer tout l\'historique des conversations ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Effacer tout', style: 'destructive', onPress: clearAll },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, deleting === item.id && { opacity: 0.4 }]}
      onPress={() => handleOpen(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.levelBadge, { backgroundColor: levelColor(item.level) + '25', borderColor: levelColor(item.level) + '60' }]}>
          <Text style={[styles.levelText, { color: levelColor(item.level) }]}>{item.level}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardDate}>{timeAgo(item.updatedAt)}</Text>
            <Text style={styles.cardDot}>·</Text>
            <Text style={styles.cardCount}>{item.messages.length} messages</Text>
            {item.context ? (
              <>
                <Text style={styles.cardDot}>·</Text>
                <Text style={styles.cardContext} numberOfLines={1}>📚 {item.context.slice(0, 30)}</Text>
              </>
            ) : null}
          </View>
        </View>
      </View>
      <View style={styles.cardActions}>
        <Text style={styles.cardArrow}>›</Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.deleteBtn}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Historique des conversations</Text>
          <Text style={styles.headerSub}>🤖 Tuteur IA Max · {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</Text>
        </View>
        {conversations.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Tout effacer</Text>
          </TouchableOpacity>
        )}
      </View>

      {!loaded ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Chargement...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🤖</Text>
          <Text style={styles.emptyTitle}>Aucune conversation</Text>
          <Text style={styles.emptyText}>Tes discussions avec Max apparaîtront ici</Text>
          <TouchableOpacity style={styles.startBtn} onPress={() => navigation.navigate('AiTutor')}>
            <Text style={styles.startBtnText}>Commencer une conversation</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={() => (
            <TouchableOpacity
              style={styles.newConvBtn}
              onPress={() => navigation.navigate('AiTutor')}
              activeOpacity={0.8}
            >
              <Text style={styles.newConvIcon}>✚</Text>
              <Text style={styles.newConvText}>Nouvelle conversation</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.2)',
  },
  backBtn: { padding: 4, marginRight: 8 },
  backText: { fontFamily: FONTS.regular, color: COLORS.gold, fontSize: 22 },
  headerTitle: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 15 },
  headerSub: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11, marginTop: 1 },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  clearBtnText: { fontFamily: FONTS.uiMedium, color: '#EF4444', fontSize: 12 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 22, marginBottom: 8 },
  emptyText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, textAlign: 'center', marginBottom: 24 },
  startBtn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 28 },
  startBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13 },

  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

  newConvBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(184,137,58,0.12)', borderRadius: 12,
    padding: 14, marginBottom: 16,
    borderWidth: 1.5, borderColor: 'rgba(184,137,58,0.35)', borderStyle: 'dashed',
  },
  newConvIcon: { color: COLORS.gold, fontSize: 18 },
  newConvText: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 14 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(245,239,227,0.05)', borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  cardLeft: { flex: 1, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  levelBadge: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, alignSelf: 'flex-start', marginTop: 2,
  },
  levelText: { fontFamily: FONTS.uiBold, fontSize: 11 },
  cardTitle: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 14, lineHeight: 20, marginBottom: 4, flex: 1 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  cardDate: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11 },
  cardDot: { color: COLORS.muted, fontSize: 11 },
  cardCount: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11 },
  cardContext: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11, maxWidth: 120 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 8 },
  cardArrow: { color: COLORS.gold, fontSize: 20 },
  deleteBtn: { color: 'rgba(239,68,68,0.6)', fontSize: 14, fontFamily: FONTS.uiBold },

  separator: { height: 8 },
});
