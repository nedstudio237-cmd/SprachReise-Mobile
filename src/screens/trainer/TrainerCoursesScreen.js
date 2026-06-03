import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';

export default function TrainerCoursesScreen({ navigation }) {
  const { accessToken } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/trainer/courses`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCourses(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const togglePublish = async (courseId, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/trainer/courses/${courseId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (res.ok) {
        setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: json.status } : c));
      }
    } catch { Alert.alert('Erreur', 'Impossible de modifier le statut'); }
  };

  const renderItem = ({ item }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.statusDot, { backgroundColor: item.status === 'PUBLISHED' ? COLORS.success : COLORS.muted }]} />
        <Text style={s.statusText}>{item.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}</Text>
      </View>
      <Text style={s.cardTitle}>{item.title}</Text>
      {item.description ? <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
      <View style={s.cardFooter}>
        <Text style={s.cardViews}>👁 {item.viewCount} vues</Text>
        <TouchableOpacity
          style={[s.pubBtn, item.status === 'PUBLISHED' && s.pubBtnActive]}
          onPress={() => togglePublish(item.id, item.status)}
        >
          <Text style={[s.pubBtnText, item.status === 'PUBLISHED' && { color: COLORS.parchment }]}>
            {item.status === 'PUBLISHED' ? 'Dépublier' : 'Publier'}
          </Text>
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
        <Text style={s.screenTitle}>Mes cours</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('TrainerCreateCourse')}>
          <Text style={s.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 60 }} />
      ) : courses.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📚</Text>
          <Text style={s.emptyTitle}>Aucun cours</Text>
          <Text style={s.emptyText}>Créez votre premier cours en appuyant sur ＋</Text>
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
  container: { flex: 1, backgroundColor: COLORS.paper },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  back: { padding: 4 },
  backText: { fontFamily: FONTS.uiMedium, color: COLORS.accent, fontSize: 15 },
  screenTitle: { fontFamily: FONTS.display, color: COLORS.deep, fontSize: 20 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: 'white', fontSize: 20, lineHeight: 22 },

  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: 'white', borderRadius: 10, padding: 16,
    borderWidth: 1, borderColor: COLORS.paperDeep,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 11, letterSpacing: 1 },
  cardTitle: { fontFamily: FONTS.uiBold, color: COLORS.deep, fontSize: 16, marginBottom: 4 },
  cardDesc: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardViews: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12 },
  pubBtn: {
    borderWidth: 1.5, borderColor: COLORS.accent, borderRadius: 6,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  pubBtnActive: { backgroundColor: COLORS.accent },
  pubBtnText: { fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 12 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontFamily: FONTS.displayBold, color: COLORS.deep, fontSize: 22 },
  emptyText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, textAlign: 'center' },
});
