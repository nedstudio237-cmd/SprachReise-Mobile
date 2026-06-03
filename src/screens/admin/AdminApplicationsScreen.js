import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';

const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];
const STATUS_LABELS = { PENDING: 'En attente', APPROVED: 'Approuvée', REJECTED: 'Refusée' };
const STATUS_COLORS = { PENDING: COLORS.warning, APPROVED: COLORS.success, REJECTED: COLORS.error };

export default function AdminApplicationsScreen({ navigation }) {
  const { accessToken } = useAuthStore();
  const [filter, setFilter]   = useState('PENDING');
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);

  const load = (f = filter) => {
    setLoading(true);
    fetch(`${API_BASE_URL}/admin/applications?status=${f}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setApps(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => navigation.navigate('AdminApplicationDetail', { application: item, onRefresh: () => load() })}
      activeOpacity={0.8}
    >
      <View style={s.cardTop}>
        <View>
          <Text style={s.cardName}>{item.firstName} {item.lastName}</Text>
          <Text style={s.cardEmail}>{item.email}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: STATUS_COLORS[item.status] + '22', borderColor: STATUS_COLORS[item.status] }]}>
          <Text style={[s.badgeText, { color: STATUS_COLORS[item.status] }]}>{STATUS_LABELS[item.status]}</Text>
        </View>
      </View>
      <View style={s.cardMeta}>
        <Text style={s.metaItem}>📚 Niveau {item.teachingLevel}</Text>
        <Text style={s.metaItem}>🌍 {item.teachingLang?.toUpperCase()}</Text>
        {item.submittedAt && (
          <Text style={s.metaItem}>📅 {new Date(item.submittedAt).toLocaleDateString('fr')}</Text>
        )}
      </View>
      <Text style={s.cardArrow}>Voir le dossier ›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={s.screenTitle}>Candidatures</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Filtres */}
      <View style={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterBtn, filter === f && s.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>
              {f === 'ALL' ? 'Tous' : STATUS_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
      ) : apps.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📋</Text>
          <Text style={s.emptyText}>Aucune candidature {filter !== 'ALL' ? STATUS_LABELS[filter]?.toLowerCase() : ''}</Text>
        </View>
      ) : (
        <FlatList
          data={apps}
          keyExtractor={item => String(item.profileId)}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          onRefresh={() => load()}
          refreshing={loading}
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

  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: 'rgba(249,244,232,0.06)', borderRadius: 10, padding: 16,
    borderWidth: 1, borderColor: 'rgba(184,137,58,0.2)',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardName: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 16 },
  cardEmail: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12, marginTop: 2 },
  badge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: FONTS.uiBold, fontSize: 11 },
  cardMeta: { flexDirection: 'row', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  metaItem: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12 },
  cardArrow: { fontFamily: FONTS.uiMedium, color: COLORS.accent, fontSize: 13 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 15 },
});
