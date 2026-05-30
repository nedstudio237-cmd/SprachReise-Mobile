import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, LEVELS } from '../../constants/config';
import api from '../../services/api';

const LEVEL_IDS = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
const LEVEL_COLORS = {
  A1: '#10B981', A2: '#3B82F6', B1: '#8B5CF6',
  B2: '#F59E0B', C1: '#EC4899', C2: '#EF4444',
};
const FILTER_LEVELS = ['Tous', ...LEVELS];

export default function CoursesScreen({ navigation }) {
  const [activeLevel, setActiveLevel] = useState('Tous');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCourses = useCallback(async (level) => {
    try {
      const params = level !== 'Tous' ? { levelId: LEVEL_IDS[level] } : {};
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
  }, [activeLevel, fetchCourses]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses(activeLevel);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.heading}>Bibliothèque</Text>
        <Text style={styles.sub}>Progressez niveau par niveau</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        {FILTER_LEVELS.map((lvl) => (
          <TouchableOpacity
            key={lvl}
            style={[styles.filterChip, activeLevel === lvl && styles.filterChipActive]}
            onPress={() => setActiveLevel(lvl)}
          >
            <Text style={[styles.filterText, activeLevel === lvl && styles.filterTextActive]}>
              {lvl}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        >
          {courses.length === 0 ? (
            <Text style={styles.empty}>Aucun cours disponible pour ce niveau.</Text>
          ) : (
            courses.map((course) => {
              const accent = LEVEL_COLORS[course.levelCode] || COLORS.accent;
              const duration = course.videoDurationSec
                ? `${Math.round(course.videoDurationSec / 60)} min`
                : '—';
              return (
                <TouchableOpacity
                  key={course.id}
                  style={styles.card}
                  onPress={() => navigation?.navigate('CourseDetail', { courseId: course.id })}
                  activeOpacity={0.82}
                >
                  <View style={styles.cardTop}>
                    <View style={[styles.levelBadge, { backgroundColor: accent + '22' }]}>
                      <Text style={[styles.levelBadgeText, { color: accent }]}>{course.levelCode}</Text>
                    </View>
                    {course.theme ? (
                      <Text style={styles.themeText}>{course.theme}</Text>
                    ) : null}
                  </View>

                  <Text style={styles.cardTitle}>{course.title}</Text>
                  {course.trainerName ? (
                    <Text style={styles.cardTrainer}>par {course.trainerName}</Text>
                  ) : null}
                  <Text style={styles.cardDesc}>{course.description}</Text>

                  <View style={styles.cardFooter}>
                    <Text style={styles.metaChip}>⏱ {duration}</Text>
                    <TouchableOpacity
                      style={styles.startBtn}
                      onPress={() => navigation?.navigate('CourseDetail', { courseId: course.id })}
                    >
                      <Text style={styles.startBtnText}>COMMENCER</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },

  topBar: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  heading: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 28, marginBottom: 4 },
  sub: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, fontStyle: 'italic' },

  filterBar: { maxHeight: 48, marginTop: 12 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(245,239,227,0.07)',
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.25)',
  },
  filterChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  filterText: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 13 },
  filterTextActive: { color: COLORS.parchment },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { fontFamily: FONTS.regular, color: COLORS.muted, textAlign: 'center', marginTop: 40, fontStyle: 'italic' },

  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  card: {
    backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 10,
    padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  levelBadge: { borderRadius: 5, paddingHorizontal: 9, paddingVertical: 4 },
  levelBadgeText: { fontFamily: FONTS.uiBold, fontSize: 11, letterSpacing: 0.5 },
  themeText: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 12 },
  cardTitle: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 17, marginBottom: 3, lineHeight: 23 },
  cardTrainer: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13, marginBottom: 8, fontStyle: 'italic' },
  cardDesc: { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 13, lineHeight: 20, marginBottom: 14 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaChip: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 12 },
  startBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 5 },
  startBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 11, letterSpacing: 1 },
});
