import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import AiTutorButton from '../../components/AiTutorButton';

// Chapitres générés à partir du contenu du cours
function buildChapters(course) {
  if (!course) return [];
  const dur = course.videoDurationSec ?? 1800;
  const count = Math.max(3, Math.min(8, Math.round(dur / 300)));
  const CHAPTER_NAMES = [
    'Introduction et objectifs', 'Vocabulaire fondamental', 'Règles de base',
    'Exemples et exercices', 'Mise en pratique', 'Points avancés',
    'Révision et consolidation', 'Évaluation finale',
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: CHAPTER_NAMES[i] ?? `Chapitre ${i + 1}`,
    duration: `${Math.round(dur / count / 60)} min`,
    content: generateChapterContent(course, i),
  }));
}

function generateChapterContent(course, idx) {
  const intros = [
    `Bienvenue dans ce cours : **${course.title}**\n\n${course.description}\n\nCe chapitre pose les bases essentielles de ce module.`,
    `Dans ce chapitre, vous allez explorer le vocabulaire clé associé à : ${course.theme ?? 'ce sujet'}.\n\nPrenez le temps de mémoriser chaque terme.`,
    `Les règles fondamentales de ce module sont présentées ici avec des exemples tirés du quotidien germanophone.`,
    `Passons maintenant aux exercices pratiques. Lisez attentivement chaque exemple et essayez de les reproduire à voix haute.`,
    `La pratique est la clé de la maîtrise. Ce chapitre vous propose des situations réelles d'usage.`,
    `Approfondissons les nuances et points avancés de ce module pour atteindre un niveau de précision supérieur.`,
    `Revoyons ensemble les points essentiels de ce cours avant de passer à l'évaluation.`,
    `Vous avez parcouru l'ensemble du cours. Vous êtes maintenant prêt(e) pour le QCM de validation.`,
  ];
  return intros[idx] ?? intros[0];
}

export default function CoursePlayerScreen({ route, navigation }) {
  const courseId = route?.params?.courseId;
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [readChapters, setReadChapters] = useState(new Set());

  const { courseProgress, updateCourseProgress } = useAuthStore();

  useEffect(() => {
    if (!courseId) { setLoading(false); return; }
    api.get(`/courses/${courseId}`)
      .then(({ data }) => {
        setCourse(data);
        const ch = buildChapters(data);
        setChapters(ch);
        // Restaurer progression sauvegardée
        const saved = courseProgress[courseId];
        if (saved?.chaptersRead > 0) {
          setReadChapters(new Set(Array.from({ length: saved.chaptersRead }, (_, i) => i)));
          setCurrentChapter(Math.min(saved.chaptersRead, ch.length - 1));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  const markCurrentRead = async () => {
    const next = new Set(readChapters);
    next.add(currentChapter);
    setReadChapters(next);
    await updateCourseProgress(courseId, next.size, chapters.length);

    if (currentChapter < chapters.length - 1) {
      setCurrentChapter((c) => c + 1);
    }
  };

  const isCurrentRead = readChapters.has(currentChapter);
  const allDone = chapters.length > 0 && readChapters.size >= chapters.length;
  const progress = chapters.length > 0 ? readChapters.size / chapters.length : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.accent} /></View>
      </SafeAreaView>
    );
  }

  const chapter = chapters[currentChapter];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{course?.title}</Text>
          <Text style={styles.headerSub}>{readChapters.size}/{chapters.length} chapitres lus</Text>
        </View>
        <Text style={styles.headerPct}>{Math.round(progress * 100)}%</Text>
      </View>

      {/* Barre de progression */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Liste des chapitres (sidebar horizontale) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chaptersBar}
        contentContainerStyle={styles.chaptersBarContent}
      >
        {chapters.map((ch, i) => {
          const isDone = readChapters.has(i);
          const isCurrent = currentChapter === i;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.chapChip, isCurrent && styles.chapChipActive, isDone && styles.chapChipDone]}
              onPress={() => setCurrentChapter(i)}
            >
              <Text style={[styles.chapChipText, (isCurrent || isDone) && styles.chapChipTextActive]}>
                {isDone ? '✓' : i + 1}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Contenu du chapitre */}
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {chapter && (
          <>
            <View style={styles.chapterHeader}>
              <Text style={styles.chapterNum}>Chapitre {currentChapter + 1} · {chapter.duration}</Text>
              <Text style={styles.chapterTitle}>{chapter.title}</Text>
            </View>

            {/* Simule le contenu du cours */}
            <View style={styles.contentBox}>
              <Text style={styles.contentText}>{chapter.content}</Text>
            </View>

            {/* Bloc de lecture simulée */}
            <View style={styles.mediaBlock}>
              <View style={styles.mediaPlaceholder}>
                <Text style={styles.mediaIcon}>🎬</Text>
                <Text style={styles.mediaLabel}>Vidéo — {chapter.duration}</Text>
                <Text style={styles.mediaSub}>Disponible dans la version complète</Text>
              </View>
            </View>

            {/* Tuteur IA contextuel au chapitre en cours */}
            <AiTutorButton
              question={`J'étudie "${course?.title}" — chapitre "${chapter?.title}". Explique ce concept et donne un exemple pratique.`}
              context={chapter?.content?.slice(0, 300) ?? ''}
              level={course?.levelCode ?? 'A1'}
              mode="explain"
              label="🤖  Demander au tuteur IA"
            />

            {allDone ? (
              <TouchableOpacity
                style={styles.qcmBtn}
                onPress={() => navigation?.navigate('Qcm', { levelId: course?.levelId })}
              >
                <Text style={styles.qcmBtnText}>🏆  PASSER LE QCM DE VALIDATION</Text>
              </TouchableOpacity>
            ) : isCurrentRead ? (
              <View style={styles.alreadyRead}>
                <Text style={styles.alreadyReadText}>✓ Chapitre déjà lu</Text>
                {currentChapter < chapters.length - 1 && (
                  <TouchableOpacity onPress={() => setCurrentChapter((c) => c + 1)} style={styles.nextChapBtn}>
                    <Text style={styles.nextChapBtnText}>Chapitre suivant  ›</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity style={styles.markReadBtn} onPress={markCurrentRead}>
                <Text style={styles.markReadBtnText}>
                  {currentChapter < chapters.length - 1 ? 'MARQUER COMME LU  ›' : 'TERMINER LE COURS  ✓'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn: { padding: 4 },
  backText: { color: COLORS.gold, fontSize: 28, lineHeight: 28 },
  headerTitle: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 14 },
  headerSub: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11, marginTop: 1 },
  headerPct: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 14 },

  progressTrack: { height: 3, backgroundColor: 'rgba(126,102,58,0.2)', marginHorizontal: 16 },
  progressFill: { height: 3, backgroundColor: COLORS.gold, borderRadius: 2 },

  chaptersBar: { maxHeight: 56, marginTop: 12 },
  chaptersBarContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chapChip: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(245,239,227,0.07)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(126,102,58,0.25)',
  },
  chapChipActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(161,94,45,0.2)' },
  chapChipDone: { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.15)' },
  chapChipText: { fontFamily: FONTS.uiBold, color: COLORS.muted, fontSize: 13 },
  chapChipTextActive: { color: COLORS.parchment },

  body: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 },

  chapterHeader: { marginBottom: 20 },
  chapterNum: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 11, letterSpacing: 1, marginBottom: 6 },
  chapterTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 24, lineHeight: 32 },

  contentBox: {
    backgroundColor: 'rgba(245,239,227,0.05)', borderRadius: 10,
    padding: 18, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.15)',
  },
  contentText: { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 15, lineHeight: 26 },

  mediaBlock: { marginBottom: 28 },
  mediaPlaceholder: {
    backgroundColor: 'rgba(161,94,45,0.08)', borderRadius: 10,
    padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(161,94,45,0.2)',
  },
  mediaIcon: { fontSize: 40, marginBottom: 10 },
  mediaLabel: { fontFamily: FONTS.uiBold, color: COLORS.cream, fontSize: 15, marginBottom: 4 },
  mediaSub: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 12 },

  markReadBtn: { backgroundColor: COLORS.accent, borderRadius: 8, padding: 16, alignItems: 'center' },
  markReadBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1.5 },

  alreadyRead: { alignItems: 'center', gap: 12 },
  alreadyReadText: { fontFamily: FONTS.uiMedium, color: '#10B981', fontSize: 14 },
  nextChapBtn: { borderWidth: 1, borderColor: COLORS.accent, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 },
  nextChapBtnText: { fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 13 },

  qcmBtn: {
    backgroundColor: '#10B981', borderRadius: 8, padding: 16, alignItems: 'center',
  },
  qcmBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1 },
});
