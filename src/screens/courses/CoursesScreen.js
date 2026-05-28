import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, LEVELS } from '../../constants/config';

const courses = [
  { id: 1, title: 'Allemand A1', level: 'A1', lessons: 12, duration: '4 sem', color: '#10B981' },
  { id: 2, title: 'Allemand A2', level: 'A2', lessons: 16, duration: '6 sem', color: '#3B82F6' },
  { id: 3, title: 'Allemand B1', level: 'B1', lessons: 20, duration: '8 sem', color: '#8B5CF6' },
  { id: 4, title: 'Allemand B2', level: 'B2', lessons: 24, duration: '10 sem', color: '#F59E0B' },
];

export default function CoursesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Nos cours</Text>
        <Text style={styles.sub}>Progressez niveau par niveau</Text>

        <View style={styles.levelRow}>
          {LEVELS.map((lvl) => (
            <TouchableOpacity key={lvl} style={styles.levelChip}>
              <Text style={styles.levelChipText}>{lvl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {courses.map((course) => (
          <TouchableOpacity key={course.id} style={styles.card}>
            <View style={[styles.levelBadge, { backgroundColor: course.color + '22' }]}>
              <Text style={[styles.levelBadgeText, { color: course.color }]}>{course.level}</Text>
            </View>
            <Text style={styles.cardTitle}>{course.title}</Text>
            <Text style={styles.cardMeta}>{course.lessons} leçons · {course.duration}</Text>
            <View style={styles.cardFooter}>
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
  scroll: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 24 },
  heading: { color: COLORS.parchment, fontSize: 26, fontWeight: 'bold' },
  sub: { color: COLORS.muted, fontSize: 14, marginTop: 4, marginBottom: 20 },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  levelChip: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  levelChipText: { color: COLORS.cream, fontSize: 13 },
  card: {
    backgroundColor: 'rgba(245,239,227,0.07)',
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(126,102,58,0.3)',
  },
  levelBadge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  levelBadgeText: { fontWeight: 'bold', fontSize: 12 },
  cardTitle: { color: COLORS.parchment, fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  cardMeta: { color: COLORS.muted, fontSize: 13, marginBottom: 16 },
  cardFooter: { alignItems: 'flex-end' },
  startBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  startBtnText: { color: COLORS.parchment, fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
});
