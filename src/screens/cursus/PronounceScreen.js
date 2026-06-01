import { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { COLORS, FONTS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { PRONOUNCE } from '../../data/vocabulary';

export default function PronounceScreen({ navigation }) {
  const { level, recordGameResult } = useAuthStore();
  const userLevel = level ?? 'A1';
  const pool = PRONOUNCE[userLevel] ?? PRONOUNCE.A1;

  const [questions] = useState(() => [...pool].sort(() => Math.random() - 0.5).slice(0, 6));
  const [current, setCurrent]   = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded]   = useState(false);
  const [playing, setPlaying]     = useState(false);
  const [selfScore, setSelfScore] = useState(null); // 'good' | 'ok' | 'retry'
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const recordingRef = useRef(null);
  const soundRef     = useRef(null);
  const question     = questions[current];
  const progress     = (current / questions.length) * 100;

  const speakModel = useCallback(() => {
    if (speaking) return;
    setSpeaking(true);
    Speech.speak(question.de, {
      language: 'de-DE', rate: 0.8,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [question, speaking]);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setRecording(true);
    } catch { setRecording(false); }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    setRecording(false);
    await recordingRef.current.stopAndUnloadAsync();
    setRecorded(true);
  };

  const playback = async () => {
    if (!recordingRef.current) return;
    setPlaying(true);
    const uri = recordingRef.current.getURI();
    const { sound } = await Audio.Sound.createAsync({ uri });
    soundRef.current = sound;
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) setPlaying(false);
    });
  };

  const handleSelfEval = async (result) => {
    setSelfScore(result);
    if (result === 'good') setScore((s) => s + 1);
    else if (result === 'ok') setScore((s) => s + 0);
  };

  const handleNext = async () => {
    Speech.stop();
    if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
    recordingRef.current = null;
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSpeaking(false); setRecording(false); setRecorded(false);
      setPlaying(false); setSelfScore(null);
    } else {
      await recordGameResult('pronounce', score, questions.length);
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrent(0); setSpeaking(false); setRecording(false);
    setRecorded(false); setPlaying(false); setSelfScore(null);
    setScore(0); setFinished(false);
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
        <TouchableOpacity onPress={() => { Speech.stop(); navigation?.goBack(); }}>
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

        {/* Phrase à prononcer */}
        <View style={styles.wordCard}>
          <Text style={styles.wordDE}>{question.de}</Text>
          <Text style={styles.wordFR}>{question.fr}</Text>
          <View style={styles.phoneticBox}>
            <Text style={styles.phoneticLabel}>Phonétique :</Text>
            <Text style={styles.phonetic}>[{question.phonetic}]</Text>
          </View>
        </View>

        {/* Étape 1 — Écouter le modèle */}
        <View style={styles.stepRow}>
          <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
          <Text style={styles.stepLabel}>Écoute le modèle</Text>
        </View>
        <TouchableOpacity style={[styles.listenBtn, speaking && styles.listenBtnActive]} onPress={speakModel}>
          <Text style={styles.listenIcon}>{speaking ? '🔊' : '▶'}</Text>
          <Text style={styles.listenLabel}>{speaking ? 'Lecture...' : 'ÉCOUTER LE MODÈLE'}</Text>
        </TouchableOpacity>

        {/* Étape 2 — Enregistrer */}
        <View style={styles.stepRow}>
          <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
          <Text style={styles.stepLabel}>Enregistre ta prononciation</Text>
        </View>
        <TouchableOpacity
          style={[styles.recordBtn, recording && styles.recordBtnActive]}
          onPress={recording ? stopRecording : startRecording}
        >
          <Text style={styles.recordIcon}>{recording ? '⏹' : '🎙️'}</Text>
          <Text style={styles.recordLabel}>
            {recording ? 'APPUYER POUR ARRÊTER' : 'APPUYER POUR PARLER'}
          </Text>
          {recording && <View style={styles.recordDot} />}
        </TouchableOpacity>

        {/* Étape 3 — Réécouter + auto-évaluation */}
        {recorded && (
          <>
            <View style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
              <Text style={styles.stepLabel}>Réécoute et évalue-toi</Text>
            </View>
            <TouchableOpacity style={[styles.playbackBtn, playing && styles.playbackBtnActive]} onPress={playback} disabled={playing}>
              <Text style={styles.playbackIcon}>{playing ? '🔈' : '▶'}</Text>
              <Text style={styles.playbackLabel}>{playing ? 'Lecture...' : 'RÉÉCOUTER MA VOIX'}</Text>
            </TouchableOpacity>

            {selfScore === null ? (
              <View style={styles.evalRow}>
                <TouchableOpacity style={styles.evalBtnGood}  onPress={() => handleSelfEval('good')}>
                  <Text style={styles.evalEmoji}>😄</Text>
                  <Text style={styles.evalLabel}>Bien !</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.evalBtnOk}    onPress={() => handleSelfEval('ok')}>
                  <Text style={styles.evalEmoji}>🙂</Text>
                  <Text style={styles.evalLabel}>Pas mal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.evalBtnRetry} onPress={() => handleSelfEval('retry')}>
                  <Text style={styles.evalEmoji}>😅</Text>
                  <Text style={styles.evalLabel}>À revoir</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.evalResult}>
                  <Text style={styles.evalResultText}>
                    {selfScore === 'good' ? '✓ Bien prononcé !' : selfScore === 'ok' ? '~ Continuez à pratiquer !' : '↺ Écoutez encore et réessayez'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                  <Text style={styles.nextBtnText}>
                    {current < questions.length - 1 ? 'SUIVANT  ›' : 'VOIR MON SCORE'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
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
    backgroundColor: 'rgba(236,72,153,0.1)', borderRadius: 12, padding: 20, marginBottom: 20,
    borderWidth: 2, borderColor: 'rgba(236,72,153,0.3)', gap: 10,
  },
  recordBtnActive: { borderColor: '#EC4899', backgroundColor: 'rgba(236,72,153,0.2)' },
  recordIcon: { fontSize: 32 },
  recordLabel: { fontFamily: FONTS.uiBold, color: '#EC4899', fontSize: 13 },
  recordDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginLeft: 4 },
  playbackBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 12, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.25)', gap: 10,
  },
  playbackBtnActive: { borderColor: COLORS.gold },
  playbackIcon: { fontSize: 24 },
  playbackLabel: { fontFamily: FONTS.uiBold, color: COLORS.cream, fontSize: 13 },
  evalRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  evalBtnGood:  { flex: 1, alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#10B98140' },
  evalBtnOk:    { flex: 1, alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.12)',  borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#F59E0B40' },
  evalBtnRetry: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.1)',    borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#EF444440' },
  evalEmoji: { fontSize: 28, marginBottom: 6 },
  evalLabel: { fontFamily: FONTS.uiBold, color: COLORS.cream, fontSize: 12 },
  evalResult: { backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 16 },
  evalResultText: { fontFamily: FONTS.medium, color: COLORS.parchment, fontSize: 14 },
  nextBtn: { backgroundColor: COLORS.accent, borderRadius: 8, padding: 16, alignItems: 'center' },
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
