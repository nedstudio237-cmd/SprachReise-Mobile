import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../constants/config';
import api from '../../services/api';

const TABS = ['Description', 'Documents', 'Notes'];

export default function CourseDetailScreen({ route, navigation }) {
  const courseId = route?.params?.courseId;
  const [activeTab, setActiveTab] = useState('Description');
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const { courseProgress } = useAuthStore();
  const progress = courseProgress[courseId];
  const courseCompleted = progress?.completed ?? false;

  useEffect(() => {
    if (!courseId) { setLoading(false); return; }
    api.get(`/courses/${courseId}`)
      .then(({ data }) => setCourse(data))
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={styles.errorText}>Cours introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const durationLabel = course.videoDurationSec
    ? `${Math.round(course.videoDurationSec / 60)} min`
    : '—';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.heroContent}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{course.levelCode}</Text>
          </View>
          <Text style={styles.heroTitle}>{course.title}</Text>
          {course.trainerName ? (
            <Text style={styles.heroTrainer}>par {course.trainerName}</Text>
          ) : null}

          <View style={styles.heroStats}>
            <StatChip icon="⏱" label={durationLabel} />
            {course.theme ? <StatChip icon="🏷" label={course.theme} /> : null}
          </View>
        </View>

        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '0%' }]} />
          </View>
          <Text style={styles.progressLabel}>0%</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {activeTab === 'Description' && (
          <>
            <Text style={styles.descText}>{course.description}</Text>

            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => navigation?.navigate('CoursePlayer', { courseId: course.id })}
            >
              <Text style={styles.continueBtnText}>
                {progress?.chaptersRead > 0 ? 'CONTINUER LE COURS  ›' : 'COMMENCER LE COURS  ›'}
              </Text>
            </TouchableOpacity>

            {progress?.chaptersRead > 0 && (
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, {
                    width: `${Math.round((progress.chaptersRead / (progress.totalChapters || 1)) * 100)}%`
                  }]} />
                </View>
                <Text style={styles.progressLabel}>
                  {progress.chaptersRead}/{progress.totalChapters} chapitres
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.qcmBtn, !courseCompleted && styles.qcmBtnLocked]}
              onPress={() => courseCompleted && navigation?.navigate('Qcm', { levelId: course.levelId })}
              disabled={!courseCompleted}
            >
              <Text style={[styles.qcmBtnText, !courseCompleted && styles.qcmBtnTextLocked]}>
                {courseCompleted ? '📝  PASSER LE QCM' : '🔒  QCM — Terminez le cours d\'abord'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'Documents' && (
          <DocumentsTab course={course} />
        )}

        {activeTab === 'Notes' && (
          <View style={styles.notesEmpty}>
            <Text style={styles.notesEmptyIcon}>📝</Text>
            <Text style={styles.notesEmptyTitle}>Aucune note pour l'instant</Text>
            <Text style={styles.notesEmptyText}>
              Prenez des notes pendant vos cours pour les retrouver ici.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DocumentsTab({ course }) {
  const BASE = API_BASE_URL.replace('/api', '');

  if (!course?.pdfPath) {
    return (
      <View style={styles.notesEmpty}>
        <Text style={styles.notesEmptyIcon}>📄</Text>
        <Text style={styles.notesEmptyTitle}>Document en préparation</Text>
        <Text style={styles.notesEmptyText}>Le guide de cours sera disponible prochainement.</Text>
      </View>
    );
  }

  const pdfUrl = `${BASE}/api/files/${course.pdfPath}`;
  const filename = `SprachReise_${course.levelCode}_${course.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  const openPdf = async () => {
    try {
      await Linking.openURL(pdfUrl);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le PDF.');
    }
  };

  return (
    <View>
      <Text style={styles.sectionLabel}>GUIDE DE COURS OFFICIEL</Text>

      <View style={styles.pdfCard}>
        <View style={styles.pdfIconBox}>
          <Text style={styles.pdfIcon}>📕</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.pdfTitle}>{course.title}</Text>
          <Text style={styles.pdfMeta}>Guide pédagogique · PDF · Niveau {course.levelCode}</Text>
          <Text style={styles.pdfMeta}>Vocabulaire · Grammaire · Exemples</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.pdfOpenBtn} onPress={openPdf}>
        <Text style={styles.pdfOpenBtnText}>📖  CONSULTER LE PDF</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.pdfDownloadBtn} onPress={openPdf}>
        <Text style={styles.pdfDownloadBtnText}>⬇  TÉLÉCHARGER</Text>
      </TouchableOpacity>

      <Text style={styles.pdfHint}>
        Le PDF s'ouvre dans votre navigateur. Appuyez sur les 3 points pour sauvegarder.
      </Text>
    </View>
  );
}

function StatChip({ icon, label }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 16 },

  hero: { backgroundColor: COLORS.accent, paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { paddingTop: 16, paddingBottom: 12, alignSelf: 'flex-start' },
  backText: { color: COLORS.parchment, fontSize: 28, lineHeight: 28 },
  heroContent: { marginBottom: 16 },
  levelBadge: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 4, paddingHorizontal: 9, paddingVertical: 3, marginBottom: 8,
  },
  levelText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 10, letterSpacing: 1.5 },
  heroTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 24, lineHeight: 32, marginBottom: 4 },
  heroTrainer: { fontFamily: FONTS.regular, color: 'rgba(249,244,232,0.75)', fontSize: 14, marginBottom: 14 },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, gap: 4,
  },
  statIcon: { fontSize: 11 },
  statLabel: { fontFamily: FONTS.uiMedium, color: COLORS.parchment, fontSize: 11 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack: { flex: 1, height: 4, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: COLORS.parchment, borderRadius: 2 },
  progressLabel: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 12 },

  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1,
    borderBottomColor: 'rgba(126,102,58,0.2)', backgroundColor: COLORS.deep,
  },
  tabItem: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: COLORS.gold },
  tabText: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 13 },
  tabTextActive: { color: COLORS.gold },

  body: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  descText: { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 15, lineHeight: 24, marginBottom: 28 },
  continueBtn: {
    backgroundColor: COLORS.accent, borderRadius: 6, padding: 16,
    alignItems: 'center', marginBottom: 12,
  },
  continueBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1.5 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  progressTrack: { flex: 1, height: 4, backgroundColor: 'rgba(126,102,58,0.2)', borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: COLORS.gold, borderRadius: 2 },
  progressLabel: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11 },
  qcmBtn: { borderWidth: 1, borderColor: COLORS.gold, borderRadius: 6, padding: 14, alignItems: 'center' },
  qcmBtnLocked: { borderColor: 'rgba(126,102,58,0.3)' },
  qcmBtnText: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 13, letterSpacing: 1 },
  qcmBtnTextLocked: { color: COLORS.muted },

  pdfCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 10,
    padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  pdfIconBox: {
    width: 52, height: 52, borderRadius: 10,
    backgroundColor: 'rgba(161,94,45,0.15)',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  pdfIcon: { fontSize: 28 },
  pdfTitle: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 15, marginBottom: 3 },
  pdfMeta: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11, marginBottom: 1 },
  pdfOpenBtn: {
    backgroundColor: COLORS.accent, borderRadius: 8,
    padding: 15, alignItems: 'center', marginBottom: 10,
  },
  pdfOpenBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1 },
  pdfDownloadBtn: {
    borderWidth: 1.5, borderColor: COLORS.gold, borderRadius: 8,
    padding: 13, alignItems: 'center', marginBottom: 14,
  },
  pdfDownloadBtnText: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 13, letterSpacing: 1 },
  pdfHint: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11, textAlign: 'center', fontStyle: 'italic' },

  notesEmpty: { alignItems: 'center', paddingTop: 60 },
  notesEmptyIcon: { fontSize: 56, marginBottom: 16 },
  notesEmptyTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 20, marginBottom: 10 },
  notesEmptyText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
