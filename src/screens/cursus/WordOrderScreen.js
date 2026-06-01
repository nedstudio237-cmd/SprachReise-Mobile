import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { setupSpeaker } from '../../utils/audio';
import { COLORS, FONTS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { WORD_ORDER } from '../../data/vocabulary';
import AiTutorButton from '../../components/AiTutorButton';

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

// Normalise la comparaison : retire les espaces avant ponctuation
function normalizeAnswer(words) {
  return words.join(' ')
    .replace(/\s([,\.!?:])/g, '$1')
    .trim();
}

export default function WordOrderScreen({ navigation }) {
  const { level, recordGameResult } = useAuthStore();
  const userLevel = level ?? 'A1';
  const pool = WORD_ORDER[userLevel] ?? WORD_ORDER.A1;

  // Chaque mot porte un id unique pour gérer les doublons
  const [questions] = useState(() =>
    [...pool].sort(() => Math.random() - 0.5).slice(0, 5).map((q) => {
      const indexed = q.words.map((w, i) => ({ id: `${w}_${i}`, text: w }));
      return { ...q, shuffled: shuffle(indexed) };
    })
  );
  const [current, setCurrent]   = useState(0);
  // selected = tableau d'objets { id, text }
  const [selected, setSelected] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const question = questions[current];
  const progress = (current / questions.length) * 100;
  const selectedIds = new Set(selected.map((s) => s.id));
  const remaining = question.shuffled.filter((w) => !selectedIds.has(w.id));

  const speak = useCallback(async () => {
    if (speaking) return;
    setSpeaking(true);
    await setupSpeaker();
    Speech.speak(question.audio, {
      language: 'de-DE', rate: 0.8,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [question, speaking]);

  const addWord = (wordObj) => {
    if (showResult) return;
    setSelected((s) => [...s, wordObj]);
  };

  const removeWord = (idx) => {
    if (showResult) return;
    setSelected((s) => s.filter((_, i) => i !== idx));
  };

  const checkAnswer = () => {
    setShowResult(true);
    const answer = normalizeAnswer(selected.map((s) => s.text));
    if (answer === question.de) setScore((s) => s + 1);
  };

  const handleNext = async () => {
    Speech.stop();
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected([]); setShowResult(false); setSpeaking(false);
    } else {
      await recordGameResult('wordOrder', score, questions.length);
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrent(0); setSelected([]); setShowResult(false); setScore(0); setFinished(false);
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultScreen}>
          <Text style={styles.resultEmoji}>{pct >= 70 ? '🏆' : '📚'}</Text>
          <Text style={styles.resultTitle}>{pct >= 70 ? 'Parfait !' : 'Continuez !'}</Text>
          <Text style={styles.resultSub}>Ordre des mots — {userLevel}</Text>
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

  const isCorrect = normalizeAnswer(selected.map((s) => s.text)) === question.de;

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
        <Text style={styles.gameTag}>🃏 ORDRE DES MOTS — {userLevel}</Text>
        <Text style={styles.instruction}>Écoute la phrase, puis remets les mots dans le bon ordre</Text>

        {/* Bouton écoute */}
        <TouchableOpacity style={[styles.speakBtn, speaking && styles.speakBtnActive]} onPress={speak}>
          <Text style={styles.speakIcon}>{speaking ? '🔊' : '▶'}</Text>
          <Text style={styles.speakLabel}>{speaking ? 'Lecture...' : 'ÉCOUTER LA PHRASE'}</Text>
        </TouchableOpacity>

        {/* Zone de réponse */}
        <View style={styles.answerZone}>
          <Text style={styles.answerLabel}>Ta phrase :</Text>
          <View style={styles.answerWords}>
            {selected.length === 0 ? (
              <Text style={styles.answerPlaceholder}>Sélectionne les mots ci-dessous...</Text>
            ) : (
              selected.map((w, i) => (
                <TouchableOpacity
                  key={w.id}
                  style={[
                    styles.answerChip,
                    showResult && isCorrect && styles.answerChipCorrect,
                    showResult && !isCorrect && styles.answerChipWrong,
                  ]}
                  onPress={() => removeWord(i)}
                >
                  <Text style={styles.answerChipText}>{w.text}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Mots disponibles */}
        {!showResult && (
          <View style={styles.wordsPool}>
            {remaining.map((wordObj) => (
              <TouchableOpacity key={wordObj.id} style={styles.wordChip} onPress={() => addWord(wordObj)}>
                <Text style={styles.wordChipText}>{wordObj.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Résultat */}
        {showResult && (
          <View style={[styles.resultBox, isCorrect ? styles.resultBoxOk : styles.resultBoxKo]}>
            <Text style={styles.resultBoxIcon}>{isCorrect ? '✓' : '✗'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resultBoxTitle, { color: isCorrect ? '#10B981' : '#EF4444' }]}>
                {isCorrect ? 'Correct !' : 'Pas tout à fait...'}
              </Text>
              {!isCorrect && <Text style={styles.correctAnswer}>{question.de}</Text>}
            </View>
          </View>
        )}

        {/* Actions */}
        {!showResult && selected.length > 0 && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.clearBtn} onPress={() => setSelected([])}>
              <Text style={styles.clearBtnText}>↺ EFFACER</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.checkBtn, remaining.length > 0 && { opacity: 0.5 }]}
              onPress={checkAnswer} disabled={remaining.length > 0}
            >
              <Text style={styles.checkBtnText}>VÉRIFIER  ✓</Text>
            </TouchableOpacity>
          </View>
        )}

        {showResult && !isCorrect && (
          <AiTutorButton
            question={`Pourquoi l'ordre correct est "${question.de}" ? Explique la règle de grammaire.`}
            context={`L'étudiant a répondu : "${normalizeAnswer(selected.map((s) => s.text))}"`}
            level={userLevel}
          />
        )}

        {showResult && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {current < questions.length - 1 ? 'SUIVANT  ›' : 'VOIR MON SCORE'}
            </Text>
          </TouchableOpacity>
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
  progressFill: { height: 3, backgroundColor: '#F59E0B', borderRadius: 2 },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  gameTag: { fontFamily: FONTS.uiBold, color: '#F59E0B', fontSize: 10, letterSpacing: 1.5, marginBottom: 6 },
  instruction: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13, fontStyle: 'italic', marginBottom: 20 },
  speakBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 14, padding: 18, marginBottom: 24,
    borderWidth: 2, borderColor: 'rgba(245,158,11,0.3)', gap: 12,
  },
  speakBtnActive: { borderColor: '#F59E0B' },
  speakIcon: { fontSize: 28 },
  speakLabel: { fontFamily: FONTS.uiBold, color: '#F59E0B', fontSize: 13 },
  answerZone: {
    backgroundColor: 'rgba(245,239,227,0.04)', borderRadius: 12, padding: 16,
    minHeight: 80, marginBottom: 20, borderWidth: 1.5, borderColor: 'rgba(126,102,58,0.25)',
    borderStyle: 'dashed',
  },
  answerLabel: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11, marginBottom: 10 },
  answerWords: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  answerPlaceholder: { fontFamily: FONTS.regular, color: 'rgba(174,145,130,0.4)', fontSize: 14, fontStyle: 'italic' },
  answerChip: {
    backgroundColor: COLORS.accent, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  answerChipCorrect: { backgroundColor: '#10B981' },
  answerChipWrong:   { backgroundColor: '#EF444480' },
  answerChipText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 14 },
  wordsPool: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  wordChip: {
    backgroundColor: 'rgba(245,239,227,0.08)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.3)',
  },
  wordChipText: { fontFamily: FONTS.uiBold, color: COLORS.cream, fontSize: 15 },
  resultBox: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 10,
    padding: 14, marginBottom: 16, gap: 12, borderWidth: 1,
  },
  resultBoxOk: { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: '#10B981' },
  resultBoxKo: { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: '#EF4444' },
  resultBoxIcon: { fontSize: 24 },
  resultBoxTitle: { fontFamily: FONTS.uiBold, fontSize: 15, marginBottom: 4 },
  correctAnswer: { fontFamily: FONTS.uiBold, color: COLORS.cream, fontSize: 14 },
  actionRow: { flexDirection: 'row', gap: 10 },
  clearBtn: { flex: 0.4, borderWidth: 1, borderColor: 'rgba(126,102,58,0.4)', borderRadius: 8, padding: 14, alignItems: 'center' },
  clearBtnText: { fontFamily: FONTS.uiBold, color: COLORS.muted, fontSize: 12 },
  checkBtn: { flex: 0.6, backgroundColor: COLORS.accent, borderRadius: 8, padding: 14, alignItems: 'center' },
  checkBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 12 },
  nextBtn: { backgroundColor: COLORS.accent, borderRadius: 8, padding: 16, alignItems: 'center' },
  nextBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1.5 },
  resultScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  resultEmoji: { fontSize: 72, marginBottom: 16 },
  resultTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 36, marginBottom: 6 },
  resultSub: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, marginBottom: 32 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', marginBottom: 36 },
  scoreValue: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 26 },
  scorePct: { fontFamily: FONTS.uiMedium, color: '#F59E0B', fontSize: 14 },
  btn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 48, marginBottom: 12 },
  btnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1.5 },
  btnOutline: { paddingVertical: 10 },
  btnOutlineText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14 },
});
