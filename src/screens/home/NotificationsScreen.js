import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';

const TYPE_CONFIG = {
  COURSE:  { icon: 'book-outline',       color: COLORS.accent },
  SESSION: { icon: 'radio-outline',       color: '#8B5CF6' },
  QCM:     { icon: 'help-circle-outline', color: '#10B981' },
  EXAM:    { icon: 'school-outline',      color: '#F59E0B' },
  MESSAGE: { icon: 'chatbubble-outline',  color: COLORS.primary },
};

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000)    return 'À l\'instant';
  if (diff < 3600000)  return Math.floor(diff / 60000) + ' min';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
  return Math.floor(diff / 86400000) + 'j';
}

export default function NotificationsScreen({ navigation }) {
  const { accessToken } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/notifications`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (!cancelled) setNotifications(data.notifications ?? []);
      } catch {
        if (!cancelled) setNotifications([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [accessToken]));

  const markAllRead = async () => {
    await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handlePress = async (item) => {
    // Marquer comme lu
    await fetch(`${API_BASE_URL}/notifications/${item.id}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));

    // Naviguer vers le contenu
    if (item.type === 'COURSE'  && item.entityId) navigation.navigate('CourseDetail', { courseId: item.entityId });
    if (item.type === 'SESSION' && item.entityId) navigation.navigate('LiveSession', { sessionId: item.entityId });
    if (item.type === 'QCM'     && item.entityId) navigation.navigate('Qcm', { qcmId: item.entityId });
    if (item.type === 'MESSAGE')                  navigation.navigate('Tabs', { screen: 'Messages' });
  };

  const cfg = (type) => TYPE_CONFIG[type] ?? TYPE_CONFIG.MESSAGE;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.deep} />
        </TouchableOpacity>
        <Text style={s.title}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead} style={s.readAllBtn}>
          <Text style={s.readAllText}>Tout lire</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={COLORS.accent} />
      ) : notifications.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="notifications-off-outline" size={48} color={COLORS.muted} />
          <Text style={s.emptyText}>Aucune notification</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.item, !item.isRead && s.itemUnread]}
              onPress={() => handlePress(item)}
              activeOpacity={0.8}
            >
              <View style={[s.iconWrap, { backgroundColor: cfg(item.type).color + '20' }]}>
                <Ionicons name={cfg(item.type).icon} size={22} color={cfg(item.type).color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.itemTitle, !item.isRead && s.itemTitleUnread]}>{item.title}</Text>
                <Text style={s.itemBody} numberOfLines={2}>{item.body}</Text>
                <Text style={s.itemTime}>{timeAgo(item.createdAt)}</Text>
              </View>
              {!item.isRead && <View style={s.dot} />}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paper },
  header:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.15)' },
  backBtn:   { marginRight: 12 },
  title:     { flex: 1, fontFamily: FONTS.display, color: COLORS.deep, fontSize: 22 },
  readAllBtn:{ paddingHorizontal: 4 },
  readAllText:{ fontFamily: FONTS.uiMedium, color: COLORS.accent, fontSize: 13 },

  item:       { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.08)' },
  itemUnread: { backgroundColor: 'rgba(161,94,45,0.05)' },
  iconWrap:   { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  itemTitle:  { fontFamily: FONTS.uiMedium, color: COLORS.deep, fontSize: 14, marginBottom: 3 },
  itemTitleUnread: { fontFamily: FONTS.uiBold },
  itemBody:   { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12, lineHeight: 18, marginBottom: 4 },
  itemTime:   { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 11 },
  dot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent, marginTop: 6 },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText:  { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 15, fontStyle: 'italic' },
});
