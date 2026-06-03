import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';

const FILTERS = ['ALL', 'LEARNER', 'TRAINER', 'ADMIN'];
const ROLE_LABELS = { LEARNER: 'Apprenant', TRAINER: 'Formateur', ADMIN: 'Admin' };

export default function AdminUsersScreen({ navigation }) {
  const { accessToken } = useAuthStore();
  const [filter, setFilter]   = useState('ALL');
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);

  const load = (f = filter) => {
    setLoading(true);
    fetch(`${API_BASE_URL}/admin/users?role=${f}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setUsers(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const toggleActive = async (userId, currentActive) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-active`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !currentActive } : u));
      }
    } catch { Alert.alert('Erreur', 'Impossible de modifier le compte'); }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => navigation.navigate('AdminUserProfile', { userId: item.id })}
      activeOpacity={0.8}
    >
      <View style={s.cardTop}>
        <View style={[s.avatar, { backgroundColor: COLORS.accent + '33' }]}>
          <Text style={s.avatarText}>{item.firstName?.[0]}{item.lastName?.[0]}</Text>
        </View>
        <View style={s.cardInfo}>
          <Text style={s.cardName}>{item.firstName} {item.lastName}</Text>
          <Text style={s.cardEmail}>{item.email}</Text>
          <View style={s.cardMeta}>
            <Text style={s.rolePill}>{ROLE_LABELS[item.role] || item.role}</Text>
            <Text style={[s.activePill, { color: item.active ? COLORS.success : COLORS.error }]}>
              {item.active ? '● Actif' : '● Inactif'}
            </Text>
          </View>
        </View>
        <Text style={s.cardArrow}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={s.screenTitle}>Utilisateurs</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterBtn, filter === f && s.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>
              {f === 'ALL' ? 'Tous' : ROLE_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          onRefresh={() => load()}
          refreshing={loading}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>Aucun utilisateur</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  back: { padding: 4 },
  backText: { fontFamily: FONTS.uiMedium, color: COLORS.accent, fontSize: 15 },
  screenTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 20 },

  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  filterBtn: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(184,137,58,0.3)' },
  filterActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  filterText: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 12 },
  filterTextActive: { color: 'white' },

  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: 'rgba(249,244,232,0.06)', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: 'rgba(184,137,58,0.2)',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 15 },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 14 },
  cardEmail: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12, marginTop: 1 },
  cardMeta: { flexDirection: 'row', gap: 10, marginTop: 4 },
  rolePill: { fontFamily: FONTS.uiMedium, color: COLORS.gold, fontSize: 11 },
  activePill: { fontFamily: FONTS.uiMedium, fontSize: 11 },
  cardArrow: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 22 },

  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 15 },
});
