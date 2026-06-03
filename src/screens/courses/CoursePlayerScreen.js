import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import AiTutorButton from '../../components/AiTutorButton';

const { width: SCREEN_W } = Dimensions.get('window');
const VIDEO_H = Math.round(SCREEN_W * 9 / 16); // 16:9

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Retourne { type: 'youtube'|'direct'|null, value: string } */
function parseVideoPath(videoPath) {
  if (!videoPath) return { type: null, value: null };
  if (videoPath.startsWith('yt:')) return { type: 'youtube', value: videoPath.slice(3) };
  if (videoPath.startsWith('http')) return { type: 'direct', value: videoPath };
  // Le chemin stocké est déjà relatif ex: "courses/video/uuid.mp4"
  // ou parfois juste le nom de fichier — on normalise
  const relative = videoPath.startsWith('courses/') ? videoPath : `courses/video/${videoPath}`;
  return { type: 'direct', value: `${API_BASE_URL}/files/${relative}` };
}

/** Construit l'URL du PDF depuis le chemin stocké en BDD */
function buildPdfUrl(course) {
  if (!course) return null;
  if (course.pdfPath) {
    const rel = course.pdfPath.startsWith('courses/') ? course.pdfPath : `courses/pdf/${course.pdfPath}`;
    return `${API_BASE_URL}/files/${rel}`;
  }
  return null;
}

function youtubeEmbedHtml(videoId) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; background:#000; }
    body { background:#000; overflow:hidden; }
    .container { position:relative; width:100vw; height:100vh; }
    iframe { position:absolute; top:0; left:0; width:100%; height:100%; border:none; }
  </style>
</head>
<body>
  <div class="container">
    <iframe
      src="https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&playsinline=1&cc_load_policy=0&hl=fr"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen>
    </iframe>
  </div>
</body>
</html>`;
}

// ─── Chapitres générés depuis la durée ────────────────────────────────────────
const CHAPTER_NAMES = [
  'Introduction et objectifs', 'Vocabulaire fondamental', 'Règles de base',
  'Exemples et exercices', 'Mise en pratique', 'Points avancés',
  'Révision et consolidation', 'Évaluation finale',
];

function buildChapters(course) {
  if (!course) return [];
  const dur = course.videoDurationSec ?? 1800;
  const count = Math.max(3, Math.min(8, Math.round(dur / 300)));
  const chDur = Math.round(dur / count);
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    title: CHAPTER_NAMES[i] ?? `Chapitre ${i + 1}`,
    durationSec: chDur,
    label: `${Math.round(chDur / 60)} min`,
    startSec: i * chDur,
    content: buildContent(course, i),
  }));
}

function buildContent(course, idx) {
  const texts = [
    `**${course.title}**\n\n${course.description}\n\nCe chapitre pose les bases essentielles du module.`,
    `Vocabulaire clé associé à : ${course.theme ?? 'ce sujet'}.\n\nPrenez le temps de mémoriser chaque terme avec sa prononciation.`,
    `Règles fondamentales présentées avec des exemples du quotidien germanophone.`,
    `Exercices pratiques : lisez attentivement chaque exemple et reproduisez-les à voix haute.`,
    `Situations réelles d'usage. Essayez de composer vos propres phrases.`,
    `Nuances et points avancés pour atteindre un niveau de précision supérieur.`,
    `Récapitulatif des points essentiels avant l'évaluation finale.`,
    `Cours terminé ! Vous êtes prêt(e) pour le QCM de validation.`,
  ];
  return texts[idx] ?? texts[0];
}

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Lecteur YouTube (WebView) ────────────────────────────────────────────────
function YouTubePlayer({ videoId }) {
  const [loading, setLoading] = useState(true);
  return (
    <View style={styles.videoContainer}>
      <WebView
        source={{ html: youtubeEmbedHtml(videoId) }}
        style={styles.video}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        onLoadEnd={() => setLoading(false)}
        scrollEnabled={false}
        bounces={false}
      />
      {loading && (
        <View style={styles.videoLoading}>
          <ActivityIndicator color={COLORS.gold} size="large" />
          <Text style={styles.videoLoadingText}>Chargement de la vidéo…</Text>
        </View>
      )}
    </View>
  );
}

// ─── Lecteur MP4 direct (expo-av) ─────────────────────────────────────────────
function DirectPlayer({ uri }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [isReady, setIsReady] = useState(false);

  const isPlaying = status.isPlaying ?? false;
  const duration  = (status.durationMillis ?? 0) / 1000;
  const position  = (status.positionMillis ?? 0) / 1000;
  const progress  = duration > 0 ? position / duration : 0;

  const togglePlay = async () => {
    if (!videoRef.current) return;
    isPlaying ? await videoRef.current.pauseAsync() : await videoRef.current.playAsync();
  };

  const seekTo = async (ratio) => {
    if (!videoRef.current || !duration) return;
    await videoRef.current.setPositionAsync(ratio * duration * 1000);
  };

  return (
    <View style={styles.videoContainer}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={false}
        useNativeControls={false}
        onPlaybackStatusUpdate={setStatus}
        onReadyForDisplay={() => setIsReady(true)}
        onError={() => {}}
      />
      <View style={styles.videoOverlay}>
        <TouchableOpacity style={styles.playBtn} onPress={togglePlay} activeOpacity={0.8}>
          <Text style={styles.playBtnIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <View style={styles.videoBottom}>
          <Text style={styles.videoTime}>{formatTime(position)}</Text>
          <TouchableOpacity style={styles.seekBar} activeOpacity={1}
            onPress={(e) => {
              e.target.measure((_x, _y, w) => seekTo(e.nativeEvent.locationX / w));
            }}>
            <View style={styles.seekTrack}>
              <View style={[styles.seekFill, { width: `${progress * 100}%` }]} />
              <View style={[styles.seekThumb, { left: `${progress * 100}%` }]} />
            </View>
          </TouchableOpacity>
          <Text style={styles.videoTime}>{formatTime(duration)}</Text>
        </View>
      </View>
      {!isReady && (
        <View style={styles.videoLoading}>
          <ActivityIndicator color={COLORS.gold} size="large" />
        </View>
      )}
    </View>
  );
}

// ─── Sélecteur de lecteur ─────────────────────────────────────────────────────
function VideoPlayer({ videoPath }) {
  const { type, value } = parseVideoPath(videoPath);

  if (type === 'youtube') return <YouTubePlayer videoId={value} />;
  if (type === 'direct')  return <DirectPlayer uri={value} />;

  return (
    <View style={[styles.videoContainer, styles.videoPlaceholder]}>
      <Text style={styles.videoPlaceholderIcon}>🎬</Text>
      <Text style={styles.videoPlaceholderText}>Vidéo disponible prochainement</Text>
      <Text style={styles.videoPlaceholderSub}>Place le fichier MP4 dans /storage/courses/</Text>
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function CoursePlayerScreen({ route, navigation }) {
  const courseId = route?.params?.courseId;
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [readChapters, setReadChapters] = useState(new Set());
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const { courseProgress, updateCourseProgress, accessToken } = useAuthStore();

  useEffect(() => {
    if (!courseId) { setLoading(false); return; }
    api.get(`/courses/${courseId}`)
      .then(({ data }) => {
        setCourse(data);
        const ch = buildChapters(data);
        setChapters(ch);
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

  const openPdf = async () => {
    const url = buildPdfUrl(course);
    if (!url) { Alert.alert('PDF non disponible', 'Ce cours n\'a pas encore de PDF.'); return; }

    const safeName = `course_${courseId}_${Date.now()}.pdf`;
    const localUri = FileSystem.cacheDirectory + safeName;
    setPdfDownloading(true);
    try {
      // Télécharger avec auth JWT
      const { status } = await FileSystem.downloadAsync(url, localUri, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (status !== 200) throw new Error(`HTTP ${status}`);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(localUri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: `${course?.title} — Support PDF`,
        });
      } else {
        Alert.alert('PDF téléchargé', `Fichier disponible dans : ${localUri}`);
      }
    } catch (e) {
      Alert.alert('Erreur PDF', `Impossible de charger le PDF.\n${e.message}`);
    } finally {
      setPdfDownloading(false);
    }
  };

  const isCurrentRead = readChapters.has(currentChapter);
  const allDone = chapters.length > 0 && readChapters.size >= chapters.length;
  const progress = chapters.length > 0 ? readChapters.size / chapters.length : 0;
  const chapter = chapters[currentChapter];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.accent} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Lecteur vidéo ── */}
      <VideoPlayer videoPath={course?.videoPath} />

      {/* ── En-tête titre ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 10 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{course?.title}</Text>
          <Text style={styles.headerSub}>{readChapters.size}/{chapters.length} chapitres lus</Text>
        </View>
        <Text style={styles.headerPct}>{Math.round(progress * 100)}%</Text>
      </View>

      {/* Barre de progression cours */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* ── Chapitres ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chaptersBar}
        contentContainerStyle={styles.chaptersContent}
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
              <Text style={[styles.chapChipText, (isCurrent || isDone) && styles.chapChipTextOn]}>
                {isDone ? '✓' : i + 1}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Corps du chapitre ── */}
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {chapter && (
          <>
            <View style={styles.chapterHeader}>
              <Text style={styles.chapterNum}>Chapitre {currentChapter + 1} · {chapter.label}</Text>
              <Text style={styles.chapterTitle}>{chapter.title}</Text>
            </View>

            <View style={styles.contentBox}>
              <Text style={styles.contentText}>{chapter.content}</Text>
            </View>

            {/* Bouton PDF */}
            <TouchableOpacity
              style={styles.pdfBtn}
              onPress={openPdf}
              disabled={pdfDownloading}
              activeOpacity={0.8}
            >
              {pdfDownloading ? (
                <ActivityIndicator color={COLORS.gold} size="small" />
              ) : (
                <Text style={styles.pdfBtnText}>📄  TÉLÉCHARGER LE SUPPORT PDF</Text>
              )}
            </TouchableOpacity>

            {/* Tuteur IA */}
            <AiTutorButton
              question={`J'étudie "${course?.title}" — chapitre "${chapter?.title}". Explique ce concept et donne un exemple pratique.`}
              context={chapter?.content?.slice(0, 300) ?? ''}
              level={course?.levelCode ?? 'A1'}
              mode="explain"
              label="🤖  Demander au tuteur IA"
            />

            {/* Boutons d'action */}
            {allDone ? (
              <TouchableOpacity
                style={styles.qcmBtn}
                onPress={() => navigation?.navigate('Qcm', { levelId: course?.levelId })}
                activeOpacity={0.85}
              >
                <Text style={styles.qcmBtnText}>🏆  PASSER LE QCM DE VALIDATION</Text>
              </TouchableOpacity>
            ) : isCurrentRead ? (
              <View style={styles.alreadyRead}>
                <Text style={styles.alreadyReadText}>✓ Chapitre déjà lu</Text>
                {currentChapter < chapters.length - 1 && (
                  <TouchableOpacity
                    onPress={() => setCurrentChapter((c) => c + 1)}
                    style={styles.nextChapBtn}
                  >
                    <Text style={styles.nextChapBtnText}>Chapitre suivant  ›</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity style={styles.markReadBtn} onPress={markCurrentRead} activeOpacity={0.85}>
                <Text style={styles.markReadBtnText}>
                  {currentChapter < chapters.length - 1 ? 'MARQUER COMME LU  ›' : 'TERMINER LE COURS  ✓'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Vidéo ──
  videoContainer: {
    width: SCREEN_W, height: VIDEO_H,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: { width: SCREEN_W, height: VIDEO_H },
  videoPlaceholder: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#0D0705',
  },
  videoPlaceholderIcon: { fontSize: 40 },
  videoPlaceholderText: {
    fontFamily: FONTS.uiBold, color: COLORS.cream,
    fontSize: 14, textAlign: 'center',
  },
  videoPlaceholderSub: {
    fontFamily: FONTS.ui, color: COLORS.muted,
    fontSize: 12, textAlign: 'center',
  },
  videoOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  playBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
  },
  playBtnIcon: { fontSize: 22, color: '#fff' },
  videoBottom: {
    position: 'absolute', bottom: 8, left: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  videoTime: { fontFamily: FONTS.ui, color: '#fff', fontSize: 11, minWidth: 36 },
  seekBar: { flex: 1, paddingVertical: 10 },
  seekTrack: {
    height: 3, backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2, position: 'relative',
  },
  seekFill: { height: 3, backgroundColor: COLORS.gold, borderRadius: 2 },
  seekThumb: {
    position: 'absolute', top: -5,
    width: 13, height: 13, borderRadius: 6.5,
    backgroundColor: COLORS.gold, marginLeft: -6.5,
  },
  videoLoading: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', gap: 10,
  },
  videoLoadingText: {
    fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 12,
  },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6,
  },
  backBtn: { padding: 4 },
  backText: { color: COLORS.gold, fontSize: 28, lineHeight: 28 },
  headerTitle: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 13 },
  headerSub: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11, marginTop: 1 },
  headerPct: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 14 },

  progressTrack: { height: 3, backgroundColor: 'rgba(126,102,58,0.2)', marginHorizontal: 16 },
  progressFill: { height: 3, backgroundColor: COLORS.gold, borderRadius: 2 },

  // ── Chapitres bar ──
  chaptersBar: { maxHeight: 54, marginTop: 10 },
  chaptersContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chapChip: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(245,239,227,0.07)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(126,102,58,0.25)',
  },
  chapChipActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(161,94,45,0.2)' },
  chapChipDone:   { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.15)' },
  chapChipText:   { fontFamily: FONTS.uiBold, color: COLORS.muted, fontSize: 12 },
  chapChipTextOn: { color: COLORS.parchment },

  // ── Corps ──
  body: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20 },

  chapterHeader: { marginBottom: 16 },
  chapterNum: {
    fontFamily: FONTS.uiBold, color: COLORS.gold,
    fontSize: 11, letterSpacing: 1, marginBottom: 6,
  },
  chapterTitle: {
    fontFamily: FONTS.display, color: COLORS.parchment,
    fontSize: 22, lineHeight: 30,
  },

  contentBox: {
    backgroundColor: 'rgba(245,239,227,0.05)', borderRadius: 10,
    padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.15)',
  },
  contentText: { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 15, lineHeight: 26 },

  // ── PDF ──
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.gold,
    borderRadius: 8, padding: 12, marginBottom: 14,
    backgroundColor: 'rgba(184,137,58,0.1)',
  },
  pdfBtnText: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 12, letterSpacing: 1 },

  // ── Actions ──
  markReadBtn: { backgroundColor: COLORS.accent, borderRadius: 8, padding: 16, alignItems: 'center' },
  markReadBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1.5 },

  alreadyRead: { alignItems: 'center', gap: 12 },
  alreadyReadText: { fontFamily: FONTS.uiMedium, color: '#10B981', fontSize: 14 },
  nextChapBtn: {
    borderWidth: 1, borderColor: COLORS.accent, borderRadius: 8,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  nextChapBtnText: { fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 13 },

  qcmBtn: { backgroundColor: '#10B981', borderRadius: 8, padding: 16, alignItems: 'center' },
  qcmBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1 },
});
