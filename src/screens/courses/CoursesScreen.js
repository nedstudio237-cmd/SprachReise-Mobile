import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, SectionList,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, LEVELS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const LEVEL_IDS = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
const LEVEL_COLORS = {
  A1: '#10B981', A2: '#3B82F6', B1: '#8B5CF6',
  B2: '#F59E0B', C1: '#EC4899', C2: '#EF4444',
};

// Ordre et icônes des catégories
const CATEGORY_ORDER = [
  { key: 'Phonétique',                icon: '🎙️', label: 'Phonétique' },
  { key: 'Communication',             icon: '💬', label: 'Communication' },
  { key: 'Vocabulaire',               icon: '📖', label: 'Vocabulaire' },
  { key: 'Grammaire',                 icon: '✏️', label: 'Grammaire' },
  { key: 'Conjugaison',               icon: '🔄', label: 'Conjugaison' },
  { key: 'Orthographe',               icon: '🔡', label: 'Orthographe' },
  { key: 'Expression orale',          icon: '🗣️', label: 'Expression orale' },
  { key: 'Culture',                   icon: '🏛️', label: 'Culture' },
  { key: 'Certification',             icon: '🏆', label: 'Certification' },
  { key: 'Société',                   icon: '🌍', label: 'Société' },
  { key: 'Communication avancée',     icon: '📡', label: 'Communication avancée' },
  { key: 'Communication professionnelle', icon: '💼', label: 'Communication prof.' },
  { key: 'Académique',                icon: '🎓', label: 'Académique' },
  { key: 'Littérature',               icon: '📚', label: 'Littérature' },
  { key: 'Stylistique',               icon: '🖊️', label: 'Stylistique' },
  { key: 'Économie',                  icon: '📊', label: 'Économie' },
  { key: 'Éducation',                 icon: '🏫', label: 'Éducation' },
  { key: 'Philosophie',               icon: '🧠', label: 'Philosophie' },
];

function getCategoryMeta(theme) {
  return CATEGORY_ORDER.find((c) => c.key === theme) ?? { icon: '📂', label: theme ?? 'Autre' };
}

// Regroupe les cours en sections par thème, dans l'ordre défini
function groupByCategory(courses) {
  const map = {};
  courses.forEach((c) => {
    const k = c.theme ?? 'Autre';
    if (!map[k]) map[k] = [];
    map[k].push(c);
  });

  const sections = [];
  // D'abord les catégories dans l'ordre défini
  CATEGORY_ORDER.forEach(({ key, icon, label }) => {
    if (map[key]?.length) {
      sections.push({ title: label, icon, data: map[key] });
      delete map[key];
    }
  });
  // Puis les catégories restantes non listées
  Object.entries(map).forEach(([key, data]) => {
    sections.push({ title: key, icon: '📂', data });
  });
  return sections;
}

export default function CoursesScreen({ navigation }) {
  const { level: userLevel } = useAuthStore();
  const [activeLevel, setActiveLevel] = useState(userLevel ?? 'A1');
  const [courses, setCourses]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  const fetchCourses = useCallback(async (level) => {
    try {
      const params = { levelId: LEVEL_IDS[level] };
      const { data } = await api.get('/courses', { params });
      setCourses(data);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchCourses(activeLevel);
  }, [activeLevel]);

  const sections = useMemo(() => groupByCategory(courses), [courses]);
  const activeColor = LEVEL_COLORS[activeLevel] ?? COLORS.accent;

  const renderCourse = ({ item: course }) => {
    const accent = LEVEL_COLORS[course.levelCode] ?? COLORS.accent;
    const duration = course.videoDurationSec
      ? `${Math.round(course.videoDurationSec / 60)} min`
      : '—';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation?.navigate('CourseDetail', { courseId: course.id })}
        activeOpacity={0.82}
      >
        <Text style={styles.cardTitle}>{course.title}</Text>
        {course.trainerName ? (
          <Text style={styles.cardTrainer}>par {course.trainerName}</Text>
        ) : null}
        <Text style={styles.cardDesc} numberOfLines={3}>{course.description}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.metaDuration}>⏱ {duration}</Text>
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: accent }]}
            onPress={() => navigation?.navigate('CourseDetail', { courseId: course.id })}
          >
            <Text style={styles.startBtnText}>COMMENCER</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>{section.icon}</Text>
      <Text style={[styles.sectionTitle, { color: activeColor }]}>{section.title.toUpperCase()}</Text>
      <View style={[styles.sectionLine, { backgroundColor: activeColor + '30' }]} />
      <View style={[styles.sectionCountBadge, { backgroundColor: activeColor + '20' }]}>
        <Text style={[styles.sectionCount, { color: activeColor }]}>{section.data.length}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.heading}>Bibliothèque</Text>
          <Text style={styles.sub}>
            {courses.length} cours · niveau{' '}
            <Text style={[styles.subLevel, { color: activeColor }]}>{activeLevel}</Text>
          </Text>
        </View>
      </View>

      {/* Filtre niveaux */}
      <View style={styles.levelRow}>
        {LEVELS.map((lvl) => {
          const color = LEVEL_COLORS[lvl];
          const isActive = activeLevel === lvl;
          return (
            <TouchableOpacity
              key={lvl}
              style={[
                styles.levelChip,
                isActive
                  ? { backgroundColor: color, borderColor: color }
                  : { borderColor: color + '50' },
              ]}
              onPress={() => setActiveLevel(lvl)}
            >
              <Text style={[styles.levelChipText, { color: isActive ? '#fff' : color }]}>{lvl}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Indicateur de niveau actif */}
      <View style={[styles.levelBanner, { backgroundColor: activeColor + '15', borderColor: activeColor + '40' }]}>
        <Text style={[styles.levelBannerText, { color: activeColor }]}>
          {activeLevel === userLevel ? `📍 Ton niveau actuel` : `🔍 Exploration`} — {activeLevel}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={activeColor} />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>📚</Text>
          <Text style={styles.emptyText}>Aucun cours disponible pour le niveau {activeLevel}.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderCourse}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchCourses(activeLevel); }}
              tintColor={activeColor}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },

  topBar: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  heading: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 28, marginBottom: 2 },
  sub: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13 },
  subLevel: { fontFamily: FONTS.uiBold },

  levelRow: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, gap: 8, flexWrap: 'wrap',
  },
  levelChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, backgroundColor: 'transparent',
  },
  levelChipText: { fontFamily: FONTS.uiBold, fontSize: 12 },

  levelBanner: {
    marginHorizontal: 20, marginBottom: 4, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1,
  },
  levelBannerText: { fontFamily: FONTS.uiMedium, fontSize: 12 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontFamily: FONTS.regular, color: COLORS.muted, textAlign: 'center', fontSize: 14 },

  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 20, marginBottom: 10,
  },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { fontFamily: FONTS.uiBold, fontSize: 11, letterSpacing: 1.5 },
  sectionLine: { flex: 1, height: 1, borderRadius: 1 },
  sectionCountBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  sectionCount: { fontFamily: FONTS.uiBold, fontSize: 11 },

  card: {
    backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 12,
    padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  cardTitle: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 16, marginBottom: 2, lineHeight: 22 },
  cardTrainer: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12, marginBottom: 6, fontStyle: 'italic' },
  cardDesc: { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 13, lineHeight: 19, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaDuration: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 12 },
  startBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  startBtnText: { fontFamily: FONTS.uiBold, color: '#fff', fontSize: 11, letterSpacing: 1 },
});
