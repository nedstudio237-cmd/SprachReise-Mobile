import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS } from '../../constants/config';
import api from '../../services/api';

const STATUS_COLORS = { PUBLISHED: '#10B981', DRAFT: COLORS.muted, REMOVED: '#EF4444' };
const STATUS_LABELS = { PUBLISHED: 'Publié', DRAFT: 'Brouillon', REMOVED: 'Retiré' };

export default function TrainerCoursesScreen({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/courses/mine')
      .then(r => setCourses(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardTheme}>{item.theme ?? '—'} · {item.levelCode}</Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: STATUS_COLORS[item.status] }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
            {STATUS_LABELS[item.status] ?? item.status}
          </Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>👁 {item.viewCount ?? 0} vues</Text>
        <Text style={styles.metaText}>⏱ {item.videoDurationSec ? Math.round(item.videoDurationSec / 60) + ' min' : '—'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes cours</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation?.navigate('CreateCourse')}
        >
          <Text style={styles.addBtnText}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 60 }} size="large" />
      ) : courses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyText}>Aucun cours publié</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation?.navigate('CreateCourse')}>
            <Text style={styles.emptyBtnText}>Créer mon premier cours</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={i => String(i.id)}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.2)',
  },
  headerTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 20 },
  addBtn: {
    backgroundColor: COLORS.accent, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 12 },

  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  cardTop: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  cardTitle: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 14 },
  cardTheme: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 12, marginTop: 3 },
  statusBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  statusText: { fontFamily: FONTS.uiBold, fontSize: 10 },
  cardMeta: { flexDirection: 'row', gap: 16 },
  metaText: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 12 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 15, fontStyle: 'italic' },
  emptyBtn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13 },
});
