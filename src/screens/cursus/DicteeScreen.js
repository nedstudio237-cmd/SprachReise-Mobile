import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { COLORS, FONTS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { DICTEE } from '../../data/vocabulary';

function normalize(s) {
  return s.toLowerCase()
    .replace(/[äÄ]/g,'a').replace(/[öÖ]/g,'o').replace(/[üÜ]/g,'u')
    .replace(/ß/g,'ss').replace(/[^a-z0-9\s]/g,'').trim();
}
function isClose(a, b) {
  const na = normalize(a), nb = normalize(b);
  if (na === nb) return true;
  // Levenshtein distance ≤ 2
  if (Math.abs(na.length - nb.length) > 3) return false;
  let errors = 0;
  for (let i = 0; i < Math.max(na.length, nb.length); i++) {
    if (na[i] !== nb[i]) errors++;
    if (errors > 2) return false;
  }
  return true;
}

export default function DicteeScreen({ navigation }) {
  const { level, recordGameResult } = useAuthStore();
  const userLevel = level ?? 'A1';
  const pool = DICTEE[userLevel] ?? DICTEE.A1;

  const [questions] = useState(() => [...pool].sort(() => Math.random() - 0.5).slice(0, 5));
  const [current, setCurrent]   = useState(0);
  const [input, setInput]       = useState('');
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [playCount, setPlayCount] = useState(0);

  const question = questions[current];
  const progress = (current / questions.length) * 100;

  const speak = useCallback((slow = false) => {
    if (speaking) return;
    setSpeaking(true);
    setPlayCount((c) => c + 1);
    Speech.speak(question.de, {
      language: 'de-DE', rate: slow ? 0.6 : 0.85,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [question, speaking]);

  const handleCheck = () => {
    if (!input.trim()) return;
    setShowResult(true);
    if (isClose(input, question.de)) setScore((s) => s + 1);
  };

  const handleNext = async () => {
    setSpeaking(false);
    setPlayCount(0);
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setInput('');
      setShowResult(false);
    } else {
      await recordGameResult('dictee', score, questions.length);
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrent(0); setInput(''); setShowResult(false);
    setScore(0); setFinished(false); setPlayCount(0);
  };

  const isCorrect = isClose(input, question?.de ?? '');

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultScreen}>
          <Text style={styles.resultEmoji}>{pct >= 70 ? '🏆' : '📚'}</Text>
          <Text style={styles.resultTitle}>{pct >= 70 ? 'Excellent !' : 'Continuez !'}</Text>
          <Text style={styles.resultSub}>Dictée — {userLevel}</Text>
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
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

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.gameTag}>📝 DICTÉE — {userLevel}</Text>
          <Text style={styles.hint}>💡 {question.hint}</Text>

          {/* Boutons écoute */}
          <View style={styles.listenRow}>
            <TouchableOpacity style={[styles.speakBtn, speaking && styles.speakBtnActive]} onPress={() => speak(false)}>
              <Text style={styles.speakIcon}>{speaking ? '🔊' : '▶'}</Text>
              <Text style={styles.speakLabel}>{speaking ? 'Lecture...' : 'ÉCOUTER'}</Text>
            </TouchableOpacity>
            {playCount >= 1 && (
              <TouchableOpacity style={styles.slowBtn} onPress={() => speak(true)} disabled={speaking}>
                <Text style={styles.slowIcon}>🐢</Text>
                <Text style={styles.slowLabel}>LENTEMENT</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.inputLabel}>Écrivez ce que vous avez entendu :</Text>
          <TextInput
            style={[
              styles.textInput,
              showResult && isCorrect && styles.inputSuccess,
              showResult && !isCorrect && styles.inputError,
            ]}
            value={input}
            onChangeText={setInput}
            placeholder="Tapez la phrase en allemand..."
            placeholderTextColor={COLORS.muted}
            editable={!showResult}
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
          />

          {!showResult ? (
            <TouchableOpacity
              style={[styles.checkBtn, !input.trim() && { opacity: 0.4 }]}
              onPress={handleCheck} disabled={!input.trim()}
            >
              <Text style={styles.checkBtnText}>VÉRIFIER  ✓</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={[styles.resultBox, isCorrect ? styles.resultBoxOk : styles.resultBoxKo]}>
                <Text style={styles.resultBoxIcon}>{isCorrect ? '✓' : '✗'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resultBoxTitle, { color: isCorrect ? '#10B981' : '#EF4444' }]}>
                    {isCorrect ? 'Correct !' : 'Pas tout à fait...'}
                  </Text>
                  {!isCorrect && (
                    <Text style={styles.correctAnswer}>Réponse : <Text style={styles.correctAnswerText}>{question.de}</Text></Text>
                  )}
                </View>
              </View>
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>
                  {current < questions.length - 1 ? 'PHRASE SUIVANTE  ›' : 'VOIR MON SCORE'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  progressFill: { height: 3, backgroundColor: '#10B981', borderRadius: 2 },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },
  gameTag: { fontFamily: FONTS.uiBold, color: '#10B981', fontSize: 10, letterSpacing: 1.5, marginBottom: 8 },
  hint: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13, fontStyle: 'italic', marginBottom: 20 },
  listenRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  speakBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#10B98120', borderRadius: 12, padding: 18,
    borderWidth: 2, borderColor: '#10B98140', gap: 10,
  },
  speakBtnActive: { borderColor: '#10B981', backgroundColor: '#10B98130' },
  speakIcon: { fontSize: 28 },
  speakLabel: { fontFamily: FONTS.uiBold, color: '#10B981', fontSize: 13 },
  slowBtn: {
    flex: 0.6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.25)', gap: 6,
  },
  slowIcon: { fontSize: 20 },
  slowLabel: { fontFamily: FONTS.uiBold, color: COLORS.muted, fontSize: 11 },
  inputLabel: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 13, marginBottom: 8 },
  textInput: {
    backgroundColor: 'rgba(249,244,232,0.07)', borderWidth: 1.5,
    borderColor: 'rgba(126,102,58,0.4)', borderRadius: 10,
    padding: 16, color: COLORS.parchment, fontSize: 16,
    fontFamily: FONTS.regular, marginBottom: 16, minHeight: 80,
    textAlignVertical: 'top',
  },
  inputSuccess: { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.08)' },
  inputError: { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.06)' },
  checkBtn: { backgroundColor: COLORS.accent, borderRadius: 8, padding: 16, alignItems: 'center' },
  checkBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1.5 },
  resultBox: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 10,
    padding: 14, marginBottom: 16, gap: 12, borderWidth: 1,
  },
  resultBoxOk: { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: '#10B981' },
  resultBoxKo: { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: '#EF4444' },
  resultBoxIcon: { fontSize: 24 },
  resultBoxTitle: { fontFamily: FONTS.uiBold, fontSize: 15, marginBottom: 4 },
  correctAnswer: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 12 },
  correctAnswerText: { fontFamily: FONTS.uiBold, color: COLORS.cream, fontSize: 13 },
  nextBtn: { backgroundColor: COLORS.accent, borderRadius: 8, padding: 16, alignItems: 'center' },
  nextBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1.5 },
  resultScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  resultEmoji: { fontSize: 72, marginBottom: 16 },
  resultTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 36, marginBottom: 6 },
  resultSub: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, marginBottom: 32 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginBottom: 36 },
  scoreValue: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 26 },
  scorePct: { fontFamily: FONTS.uiMedium, color: '#10B981', fontSize: 14 },
  btn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 48, marginBottom: 12 },
  btnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1.5 },
  btnOutline: { paddingVertical: 10 },
  btnOutlineText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14 },
});
