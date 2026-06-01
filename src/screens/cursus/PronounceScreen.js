import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import Voice from '@react-native-voice/voice';
import { COLORS, FONTS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { PRONOUNCE } from '../../data/vocabulary';
import api from '../../services/api';

// Levenshtein normalisé (0→1)
function similarity(a, b) {
  const s1 = a.toLowerCase().replace(/[^a-zäöüß\s]/g, '').trim();
  const s2 = b.toLowerCase().replace(/[^a-zäöüß\s]/g, '').trim();
  if (s1 === s2) return 1;
  const len = Math.max(s1.length, s2.length);
  if (len === 0) return 1;
  const dp = Array.from({ length: s1.length + 1 }, (_, i) =>
    Array.from({ length: s2.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      dp[i][j] = s1[i - 1] === s2[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return 1 - dp[s1.length][s2.length] / len;
}

function scoreLabel(pct) {
  if (pct >= 85) return { emoji: '🏆', label: 'Excellent !', color: '#10B981' };
  if (pct >= 65) return { emoji: '👍', label: 'Bien !',      color: '#3B82F6' };
  if (pct >= 40) return { emoji: '🙂', label: 'Pas mal',     color: '#F59E0B' };
  return               { emoji: '💪', label: 'À revoir',     color: '#EF4444' };
}

const STATE = { IDLE: 'idle', LISTENING: 'listening', ANALYZING: 'analyzing', RESULT: 'result' };

export default function PronounceScreen({ navigation }) {
  const { level, recordGameResult } = useAuthStore();
  const userLevel = level ?? 'A1';
  const pool = PRONOUNCE[userLevel] ?? PRONOUNCE.A1;

  const [questions] = useState(() => [...pool].sort(() => Math.random() - 0.5).slice(0, 6));
  const [current, setCurrent] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [exState, setExState] = useState(STATE.IDLE);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const question = questions[current];
  const progress = (current / questions.length) * 100;
  const transcriptRef = useRef('');

  useEffect(() => {
    Voice.onSpeechStart   = () => { setExState(STATE.LISTENING); setVoiceError(null); };
    Voice.onSpeechEnd     = () => analyzeTranscript(transcriptRef.current);
    Voice.onSpeechError   = () => {
      setVoiceError('Microphone non disponible. Vérifiez les permissions micro.');
      setExState(STATE.IDLE);
    };
    Voice.onSpeechResults = (e) => {
      const text = e?.value?.[0] ?? '';
      transcriptRef.current = text;
      setTranscript(text);
    };
    Voice.onSpeechPartialResults = (e) => {
      const text = e?.value?.[0] ?? '';
      transcriptRef.current = text;
      setTranscript(text);
    };
    return () => { Voice.destroy().then(Voice.removeAllListeners).catch(() => {}); };
  }, []);

  const speakModel = useCallback(() => {
    if (speaking) return;
    setSpeaking(true);
    Speech.speak(question.de, {
      language: 'de-DE', rate: 0.8,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [question, speaking]);

  const startListening = async () => {
    transcriptRef.current = '';
    setTranscript('');
    setVoiceError(null);
    try {
      await Voice.start('de-DE');
    } catch {
      setVoiceError('Impossible de démarrer le microphone.');
    }
  };

  const stopListening = async () => {
    try { await Voice.stop(); } catch {}
  };

  const analyzeTranscript = async (text) => {
    if (!text) { setExState(STATE.IDLE); return; }
    setExState(STATE.ANALYZING);
    const pct = Math.round(similarity(text, question.de) * 100);
    const { emoji, label, color } = scoreLabel(pct);

    let aiTip = null;
    if (pct < 85) {
      setAiLoading(true);
      try {
        const { data } = await api.post('/ai/explain', {
          level: userLevel,
          question: `L'étudiant a dit "${text}" au lieu de "${question.de}". Donne un conseil de prononciation court (1-2 phrases max).`,
          context: `Phonétique correcte : [${question.phonetic}]`,
          mode: 'explain',
        });
        aiTip = data.explanation;
      } catch { aiTip = null; }
      setAiLoading(false);
    }

    if (pct >= 65) setScore((s) => s + 1);
    setResult({ pct, emoji, label, color, aiTip, heard: text });
    setExState(STATE.RESULT);
  };

  const handleNext = async () => {
    Speech.stop();
    transcriptRef.current = '';
    setTranscript('');
    setResult(null);
    setExState(STATE.IDLE);
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      await recordGameResult('pronounce', score, questions.length);
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrent(0); setExState(STATE.IDLE); setTranscript('');
    setResult(null); setScore(0); setFinished(false);
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultScreen}>
          <Text style={styles.resultEmoji}>{pct >= 60 ? '🎙️' : '📚'}</Text>
          <Text style={styles.resultTitle}>{pct >= 60 ? 'Bravo !' : 'Continuez !'}</Text>
          <Text style={styles.resultSub}>Prononciation — {userLevel}</Text>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>{score}/{questions.length}</Text>
            <Text style={styles.scorePct}>{pct}%</Text>
          </View>
          <TouchableOpacity style={styles.btn} onPress={handleRestart}><Text style={styles.btnText}>REJOUER</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btnOutline} onPress={() => navigation?.goBack()}><Text style={styles.btnOutlineText}>Retour</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => { Speech.stop(); Voice.cancel().catch(() => {}); navigation?.goBack(); }}>
          <Text style={styles.back}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.counter}>{current + 1} / {questions.length}</Text>
        <View style={styles.scoreBadge}><Text style={styles.scoreText}>⭐ {score}</Text></View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.gameTag}>🎤 PRONONCIATION — {userLevel}</Text>

        <View style={styles.wordCard}>
          <Text style={styles.wordDE}>{question.de}</Text>
          <Text style={styles.wordFR}>{question.fr}</Text>
          <View style={styles.phoneticBox}>
            <Text style={styles.phoneticLabel}>Phonétique :</Text>
            <Text style={styles.phonetic}>[{question.phonetic}]</Text>
          </View>
        </View>

        {/* Étape 1 */}
        <View style={styles.stepRow}>
          <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
          <Text style={styles.stepLabel}>Écoute le modèle</Text>
        </View>
        <TouchableOpacity style={[styles.listenBtn, speaking && styles.listenBtnActive]} onPress={speakModel}>
          <Text style={styles.listenIcon}>{speaking ? '🔊' : '▶'}</Text>
          <Text style={styles.listenLabel}>{speaking ? 'Lecture...' : 'ÉCOUTER LE MODÈLE'}</Text>
        </TouchableOpacity>

        {/* Étape 2 */}
        <View style={styles.stepRow}>
          <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
          <Text style={styles.stepLabel}>
            {exState === STATE.LISTENING ? 'Parlez maintenant...' : 'Appuie et répète la phrase'}
          </Text>
        </View>

        {exState !== STATE.RESULT && (
          <TouchableOpacity
            style={[
              styles.recordBtn,
              exState === STATE.LISTENING && styles.recordBtnActive,
              exState === STATE.ANALYZING && { opacity: 0.6 },
            ]}
            onPress={exState === STATE.LISTENING ? stopListening : startListening}
            disabled={exState === STATE.ANALYZING}
          >
            <Text style={styles.recordIcon}>
              {exState === STATE.LISTENING ? '⏹' : exState === STATE.ANALYZING ? '⏳' : '🎙️'}
            </Text>
            <Text style={styles.recordLabel}>
              {exState === STATE.LISTENING  ? 'APPUYER POUR ARRÊTER' :
               exState === STATE.ANALYZING ? 'Analyse en cours...' :
               'APPUYER POUR PARLER'}
            </Text>
            {exState === STATE.LISTENING && <View style={styles.recordDot} />}
          </TouchableOpacity>
        )}

        {/* Transcript temps réel */}
        {exState === STATE.LISTENING && transcript.length > 0 && (
          <View style={styles.liveTranscript}>
            <Text style={styles.liveTranscriptText}>"{transcript}"</Text>
          </View>
        )}

        {voiceError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{voiceError}</Text>
          </View>
        )}

        {/* Résultat automatique */}
        {exState === STATE.RESULT && result && (
          <>
            <View style={[styles.scoreResultCard, { borderColor: result.color + '60' }]}>
              <Text style={styles.scoreResultEmoji}>{result.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.scoreResultLabel, { color: result.color }]}>{result.label}</Text>
                <Text style={styles.scoreResultPct}>{result.pct}% de similarité</Text>
                <View style={styles.scoreBar}>
                  <View style={[styles.scoreBarFill, { width: `${result.pct}%`, backgroundColor: result.color }]} />
                </View>
              </View>
            </View>

            <View style={styles.heardBox}>
              <Text style={styles.heardLabel}>🎙 Entendu :</Text>
              <Text style={styles.heardText}>"{result.heard}"</Text>
              <Text style={styles.heardLabel}>✓ Correct :</Text>
              <Text style={styles.heardCorrect}>{question.de}</Text>
            </View>

            {aiLoading ? (
              <View style={styles.aiLoadingBox}>
                <Text style={styles.aiLoadingText}>🤖 Le tuteur IA analyse votre prononciation...</Text>
              </View>
            ) : result.aiTip ? (
              <View style={styles.aiTipBox}>
                <Text style={styles.aiTipTitle}>💡 CONSEIL DU TUTEUR IA</Text>
                <Text style={styles.aiTipText}>{result.aiTip}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>
                {current < questions.length - 1 ? 'SUIVANT  ›' : 'VOIR MON SCORE'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  back: { fontFamily: FONTS.regular, color: COLORS.gold, fontSize: 16 },
  counter: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 13 },
  scoreBadge: { backgroundColor: 'rgba(184,137,58,0.2)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  scoreText: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 13 },
  progressTrack: { height: 3, backgroundColor: 'rgba(126,102,58,0.2)', marginHorizontal: 20 },
  progressFill: { height: 3, backgroundColor: '#EC4899', borderRadius: 2 },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },
  gameTag: { fontFamily: FONTS.uiBold, color: '#EC4899', fontSize: 10, letterSpacing: 1.5, marginBottom: 16 },
  wordCard: {
    backgroundColor: 'rgba(236,72,153,0.08)', borderRadius: 14, padding: 24,
    alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(236,72,153,0.2)',
  },
  wordDE: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 30, marginBottom: 6, textAlign: 'center' },
  wordFR: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 16, fontStyle: 'italic', marginBottom: 14 },
  phoneticBox: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' },
  phoneticLabel: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 10, marginBottom: 2 },
  phonetic: { fontFamily: FONTS.uiBold, color: '#EC4899', fontSize: 15 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#EC499940', alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: FONTS.uiBold, color: '#EC4899', fontSize: 12 },
  stepLabel: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 13 },
  listenBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 12, padding: 14, marginBottom: 20,
    borderWidth: 1.5, borderColor: 'rgba(59,130,246,0.3)', gap: 10,
  },
  listenBtnActive: { borderColor: '#3B82F6' },
  listenIcon: { fontSize: 24 },
  listenLabel: { fontFamily: FONTS.uiBold, color: '#3B82F6', fontSize: 13 },
  recordBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(236,72,153,0.1)', borderRadius: 12, padding: 20, marginBottom: 12,
    borderWidth: 2, borderColor: 'rgba(236,72,153,0.3)', gap: 10,
  },
  recordBtnActive: { borderColor: '#EC4899', backgroundColor: 'rgba(236,72,153,0.2)' },
  recordIcon: { fontSize: 32 },
  recordLabel: { fontFamily: FONTS.uiBold, color: '#EC4899', fontSize: 13 },
  recordDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginLeft: 4 },
  liveTranscript: {
    backgroundColor: 'rgba(236,72,153,0.07)', borderRadius: 8, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(236,72,153,0.2)', alignItems: 'center',
  },
  liveTranscriptText: { fontFamily: FONTS.medium, color: '#EC4899', fontSize: 15, fontStyle: 'italic' },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#EF444440' },
  errorText: { fontFamily: FONTS.regular, color: '#EF4444', fontSize: 13, textAlign: 'center' },
  scoreResultCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 16,
    borderWidth: 1.5, backgroundColor: 'rgba(245,239,227,0.04)', marginBottom: 14, gap: 14,
  },
  scoreResultEmoji: { fontSize: 40 },
  scoreResultLabel: { fontFamily: FONTS.uiBold, fontSize: 17, marginBottom: 2 },
  scoreResultPct: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12, marginBottom: 6 },
  scoreBar: { height: 6, backgroundColor: 'rgba(126,102,58,0.2)', borderRadius: 3, overflow: 'hidden' },
  scoreBarFill: { height: 6, borderRadius: 3 },
  heardBox: {
    backgroundColor: 'rgba(245,239,227,0.05)', borderRadius: 10, padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  heardLabel: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11, marginBottom: 3, marginTop: 6 },
  heardText: { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 15, fontStyle: 'italic' },
  heardCorrect: { fontFamily: FONTS.uiBold, color: '#10B981', fontSize: 16 },
  aiLoadingBox: { backgroundColor: 'rgba(184,137,58,0.08)', borderRadius: 10, padding: 14, marginBottom: 14, alignItems: 'center' },
  aiLoadingText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13, fontStyle: 'italic' },
  aiTipBox: {
    backgroundColor: 'rgba(184,137,58,0.1)', borderRadius: 10, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(184,137,58,0.3)',
  },
  aiTipTitle: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 11, letterSpacing: 1, marginBottom: 8 },
  aiTipText: { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 14, lineHeight: 22 },
  nextBtn: { backgroundColor: COLORS.accent, borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 4 },
  nextBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1.5 },
  resultScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  resultEmoji: { fontSize: 72, marginBottom: 16 },
  resultTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 36, marginBottom: 6 },
  resultSub: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, marginBottom: 32 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#EC4899', alignItems: 'center', justifyContent: 'center', marginBottom: 36 },
  scoreValue: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 26 },
  scorePct: { fontFamily: FONTS.uiMedium, color: '#EC4899', fontSize: 14 },
  btn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 48, marginBottom: 12 },
  btnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1.5 },
  btnOutline: { paddingVertical: 10 },
  btnOutlineText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14 },
});
