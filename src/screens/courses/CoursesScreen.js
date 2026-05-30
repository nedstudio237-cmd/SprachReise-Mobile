import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, LEVELS } from '../../constants/config';

const COURSES = [
  {
    id: 1,
    title: 'Introduction à l\'allemand',
    level: 'A1',
    lessons: 12,
    duration: '4 sem',
    enrolled: 248,
    accent: '#10B981',
    trainer: 'Dr. Emma Nguema',
    description: 'Alphabet, phonétique, salutations et présentations de base.',
  },
  {
    id: 2,
    title: 'Vie quotidienne en allemand',
    level: 'A2',
    lessons: 16,
    duration: '6 sem',
    enrolled: 195,
    accent: '#3B82F6',
    trainer: 'Hans Becker',
    description: 'Shopping, transports, famille et activités du quotidien.',
  },
  {
    id: 3,
    title: 'Communiquer au travail',
    level: 'B1',
    lessons: 20,
    duration: '8 sem',
    enrolled: 142,
    accent: '#8B5CF6',
    trainer: 'Marie Dubois',
    description: 'Vocabulaire professionnel, réunions et correspondance.',
  },
  {
    id: 4,
    title: 'Allemand avancé — B2',
    level: 'B2',
    lessons: 24,
    duration: '10 sem',
    enrolled: 89,
    accent: '#F59E0B',
    trainer: 'Dr. Klaus Weber',
    description: 'Expression complexe, nuances culturelles et argumentation.',
  },
  {
    id: 5,
    title: 'Maîtrise C1',
    level: 'C1',
    lessons: 28,
    duration: '12 sem',
    enrolled: 54,
    accent: '#EC4899',
    trainer: 'Prof. Anna Schmidt',
    description: 'Textes littéraires, débats et compréhension native.',
  },
];

const FILTER_LEVELS = ['Tous', ...LEVELS.slice(0, 5)];

export default function CoursesScreen({ navigation }) {
  const [activeLevel, setActiveLevel] = useState('Tous');

  const filtered = activeLevel === 'Tous'
    ? COURSES
    : COURSES.filter((c) => c.level === activeLevel);

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

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((course) => (
          <TouchableOpacity
            key={course.id}
            style={styles.card}
            onPress={() => navigation?.navigate('CourseDetail', { course })}
            activeOpacity={0.82}
          >
            <View style={styles.cardTop}>
              <View style={[styles.levelBadge, { backgroundColor: course.accent + '22' }]}>
                <Text style={[styles.levelBadgeText, { color: course.accent }]}>{course.level}</Text>
              </View>
              <View style={styles.enrolledBadge}>
                <Text style={styles.enrolledText}>👥 {course.enrolled}</Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>{course.title}</Text>
            <Text style={styles.cardTrainer}>par {course.trainer}</Text>
            <Text style={styles.cardDesc}>{course.description}</Text>

            <View style={styles.cardFooter}>
              <View style={styles.cardMeta}>
                <Text style={styles.metaChip}>📖 {course.lessons} leçons</Text>
                <Text style={styles.metaChip}>⏱ {course.duration}</Text>
              </View>
              <TouchableOpacity style={styles.startBtn}>
                <Text style={styles.startBtnText}>COMMENCER</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },

  topBar: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  heading: {
    fontFamily: FONTS.display,
    color: COLORS.parchment,
    fontSize: 28,
    marginBottom: 4,
  },
  sub: {
    fontFamily: FONTS.regular,
    color: COLORS.muted,
    fontSize: 14,
    fontStyle: 'italic',
  },

  filterBar: { maxHeight: 48, marginTop: 12 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(245,239,227,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(126,102,58,0.25)',
  },
  filterChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterText: {
    fontFamily: FONTS.uiMedium,
    color: COLORS.muted,
    fontSize: 13,
  },
  filterTextActive: { color: COLORS.parchment },

  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },

  card: {
    backgroundColor: 'rgba(245,239,227,0.06)',
    borderRadius: 10,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(126,102,58,0.2)',
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelBadge: {
    borderRadius: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  levelBadgeText: {
    fontFamily: FONTS.uiBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  enrolledBadge: {},
  enrolledText: {
    fontFamily: FONTS.ui,
    color: COLORS.muted,
    fontSize: 12,
  },

  cardTitle: {
    fontFamily: FONTS.displayBold,
    color: COLORS.parchment,
    fontSize: 17,
    marginBottom: 3,
    lineHeight: 23,
  },
  cardTrainer: {
    fontFamily: FONTS.regular,
    color: COLORS.muted,
    fontSize: 13,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  cardDesc: {
    fontFamily: FONTS.regular,
    color: COLORS.cream,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMeta: { flexDirection: 'row', gap: 10 },
  metaChip: {
    fontFamily: FONTS.ui,
    color: COLORS.muted,
    fontSize: 12,
  },
  startBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 5,
  },
  startBtnText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.parchment,
    fontSize: 11,
    letterSpacing: 1,
  },
});
