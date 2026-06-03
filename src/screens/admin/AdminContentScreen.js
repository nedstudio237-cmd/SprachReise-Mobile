import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';

const LEVEL_CODES = { 1:'A1', 2:'A2', 3:'B1', 4:'B2', 5:'C1', 6:'C2' };

export default function AdminContentScreen({ navigation }) {
  const { accessToken } = useAuthStore();
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/admin/courses`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCourses(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const removeCourse = (courseId, title) => {
    Alert.alert('Retirer le cours', `Voulez-vous retirer "${title}" de la plateforme ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Retirer', style: 'destructive', onPress: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/admin/courses/${courseId}/remove`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (res.ok) {
            setCourses(prev => prev.filter(c => c.id !== courseId));
          } else {
            Alert.alert('Erreur', 'Impossible de retirer ce cours');
          }
        } catch { Alert.alert('Erreur réseau', 'Impossible de joindre le serveur'); }
      }},
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.levelBadge}>
          <Text style={s.levelText}>{LEVEL_CODES[item.levelId] || '?'}</Text>
        </View>
        <View style={s.cardInfo}>
          <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={s.cardTrainer}>👨‍🏫 {item.trainerName}</Text>
        </View>
      </View>

      <View style={s.cardMeta}>
        {item.theme ? <Text style={s.metaTag}>{item.theme}</Text> : null}
        <Text style={s.metaViews}>👁 {item.viewCount} vues</Text>
        {item.createdAt && (
          <Text style={s.metaDate}>📅 {new Date(item.createdAt).toLocaleDateString('fr')}</Text>
        )}
      </View>

      <View style={s.cardActions}>
        <TouchableOpacity
          style={s.removeBtn}
          onPress={() => removeCourse(item.id, item.title)}
          activeOpacity={0.8}
        >
          <Text style={s.removeBtnText}>✕ Retirer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={s.screenTitle}>Modération cours</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Compteur */}
      <View style={s.countBar}>
        <Text style={s.countText}>{courses.length} cours publiés</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
      ) : courses.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🎬</Text>
          <Text style={s.emptyText}>Aucun cours publié</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          onRefresh={load}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  back:        { padding: 4 },
  backText:    { fontFamily: FONTS.uiMedium, color: COLORS.accent, fontSize: 15 },
  screenTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 20 },

  countBar: { paddingHorizontal: 20, marginBottom: 6 },
  countText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12, fontStyle: 'italic' },

  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: 'rgba(249,244,232,0.06)', borderRadius: 10, padding: 16,
    borderWidth: 1, borderColor: 'rgba(184,137,58,0.2)',
  },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  levelBadge: {
    width: 40, height: 40, borderRadius: 8, backgroundColor: COLORS.accent + '33',
    borderWidth: 1, borderColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
  },
  levelText: { fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 13 },
  cardInfo: { flex: 1 },
  cardTitle:   { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 15, lineHeight: 20, marginBottom: 4 },
  cardTrainer: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12 },

  cardMeta: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' },
  metaTag: {
    fontFamily: FONTS.uiMedium, color: COLORS.gold, fontSize: 11,
    borderWidth: 1, borderColor: COLORS.gold + '66', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2,
  },
  metaViews: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12 },
  metaDate:  { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12 },

  cardActions: { alignItems: 'flex-start' },
  removeBtn: {
    borderWidth: 1.5, borderColor: COLORS.error + '88', borderRadius: 6,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  removeBtnText: { fontFamily: FONTS.uiBold, color: COLORS.error, fontSize: 12 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 60 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 15 },
});
