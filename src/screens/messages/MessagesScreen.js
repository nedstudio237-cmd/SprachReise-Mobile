import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS } from '../../constants/config';
import api from '../../services/api';

function Avatar({ name, size = 44, color = COLORS.primary }) {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: size * 0.35 }}>{initials}</Text>
    </View>
  );
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000)   return 'À l\'instant';
  if (diff < 3600000) return Math.floor(diff / 60000) + ' min';
  if (diff < 86400000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function MessagesScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/messages/inbox')
      .then(r => setConversations(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  const renderItem = ({ item }) => {
    const fullName = `${item.otherFirstName ?? ''} ${item.otherLastName ?? ''}`.trim();
    const roleLabel = item.otherRole === 'TRAINER' ? 'Formateur' : 'Apprenant';
    return (
      <TouchableOpacity
        style={styles.convRow}
        onPress={() => navigation?.navigate('Conversation', {
          otherUserId: item.otherUserId,
          otherName: fullName,
        })}
        activeOpacity={0.8}
      >
        <Avatar name={fullName} />
        <View style={styles.convBody}>
          <View style={styles.convTop}>
            <Text style={styles.convName}>{fullName || 'Utilisateur'}</Text>
            <Text style={styles.convTime}>{formatTime(item.lastSentAt)}</Text>
          </View>
          <View style={styles.convBottom}>
            <Text style={styles.convRole}>{roleLabel}</Text>
            <Text style={styles.convPreview} numberOfLines={1}>{item.lastMessage ?? '...'}</Text>
          </View>
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 60 }} />
      ) : conversations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>💬</Text>
          <Text style={styles.emptyText}>Aucune conversation</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={i => String(i.otherUserId)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.2)',
  },
  headerTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 22 },
  list: { paddingTop: 8 },
  convRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.1)',
  },
  convBody: { flex: 1 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convName: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 14 },
  convTime: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11 },
  convBottom: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  convRole: {
    fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 9,
    borderWidth: 1, borderColor: COLORS.accent, borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  convPreview: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12, flex: 1, fontStyle: 'italic' },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  badgeText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 15, fontStyle: 'italic' },
});
