import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { setupSpeaker } from '../../utils/audio';
import { COLORS, FONTS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { LISTEN_CHOOSE } from '../../data/vocabulary';

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function buildQuestion(item) {
  return { de: item.de, correct: item.fr, options: shuffle([item.fr, ...item.wrong]) };
}

export default function ListenChooseScreen({ navigation }) {
  const { level, recordGameResult } = useAuthStore();
  const userLevel = level ?? 'A1';
  const pool = LISTEN_CHOOSE[userLevel] ?? LISTEN_CHOOSE.A1;

  const [questions] = useState(() => shuffle(pool).slice(0, 6).map(buildQuestion));
  const [current, setCurrent]   = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const question = questions[current];
  const progress = (current / questions.length) * 100;

  const speak = useCallback(async () => {
    if (speaking) return;
    setSpeaking(true);
    await setupSpeaker();
    Speech.speak(question.de, {
      language: 'de-DE', rate: 0.85, pitch: 1.0,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [question, speaking]);

  const handleSelect = (opt) => {
    if (showResult) return;
    Speech.stop();
    setSelected(opt);
    setShowResult(true);
    if (opt === question.correct) setScore((s) => s + 1);
  };

  const handleNext = async () => {
    setSpeaking(false);
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      await recordGameResult('listenChoose', score + (selected === question.correct ? 1 : 0), questions.length);
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrent(0); setSelected(null); setShowResult(false); setScore(0); setFinished(false);
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultScreen}>
          <Text style={styles.resultEmoji}>{pct >= 70 ? '🏆' : '📚'}</Text>
          <Text style={styles.resultTitle}>{pct >= 70 ? 'Excellent !' : 'Continuez !'}</Text>
          <Text style={styles.resultSub}>Écoute & Choix — {userLevel}</Text>
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
        <Text style={styles.gameTag}>🔊 ÉCOUTE & CHOISIS — {userLevel}</Text>
        <Text style={styles.instruction}>Appuie sur le haut-parleur, écoute, puis choisis la bonne traduction</Text>

        {/* Bouton écoute */}
        <TouchableOpacity style={[styles.speakBtn, speaking && styles.speakBtnActive]} onPress={speak}>
          <Text style={styles.speakIcon}>{speaking ? '🔊' : '▶'}</Text>
          <Text style={styles.speakLabel}>{speaking ? 'Lecture...' : 'ÉCOUTER LA PHRASE'}</Text>
        </TouchableOpacity>

        {/* Affiche le texte après avoir répondu */}
        {showResult && (
          <View style={styles.phraseReveal}>
            <Text style={styles.phraseRevealLabel}>Phrase entendue :</Text>
            <Text style={styles.phraseRevealText}>{question.de}</Text>
          </View>
        )}

        <Text style={styles.chooseLabel}>Quelle est la traduction ?</Text>

        {question.options.map((opt) => {
          const isSelected = selected === opt;
          const isCorrect  = opt === question.correct;
          let cardStyle = styles.optionCard;
          if (showResult) {
            if (isCorrect) cardStyle = [styles.optionCard, styles.optionCorrect];
            else if (isSelected) cardStyle = [styles.optionCard, styles.optionWrong];
          } else if (isSelected) {
            cardStyle = [styles.optionCard, styles.optionSelected];
          }
          return (
            <TouchableOpacity key={opt} style={cardStyle} onPress={() => handleSelect(opt)} activeOpacity={0.78}>
              <Text style={[styles.optionText,
                showResult && isCorrect && { color: '#10B981', fontFamily: FONTS.uiBold },
                showResult && isSelected && !isCorrect && { color: '#EF4444' },
              ]}>{opt}</Text>
              {showResult && isCorrect && <Text style={styles.checkIcon}>✓</Text>}
              {showResult && isSelected && !isCorrect && <Text style={styles.wrongIcon}>✗</Text>}
            </TouchableOpacity>
          );
        })}

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
  progressFill: { height: 3, backgroundColor: '#3B82F6', borderRadius: 2 },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  gameTag: { fontFamily: FONTS.uiBold, color: '#3B82F6', fontSize: 10, letterSpacing: 1.5, marginBottom: 6 },
  instruction: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13, fontStyle: 'italic', marginBottom: 24 },
  speakBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#3B82F620', borderRadius: 14, padding: 24, marginBottom: 20,
    borderWidth: 2, borderColor: '#3B82F640', gap: 12,
  },
  speakBtnActive: { backgroundColor: '#3B82F630', borderColor: '#3B82F6' },
  speakIcon: { fontSize: 36 },
  speakLabel: { fontFamily: FONTS.uiBold, color: '#3B82F6', fontSize: 14, letterSpacing: 1 },
  phraseReveal: {
    backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 10, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  phraseRevealLabel: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11, marginBottom: 4 },
  phraseRevealText: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 20 },
  chooseLabel: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 12, marginBottom: 12 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 10,
    padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  optionSelected: { borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)' },
  optionCorrect:  { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)' },
  optionWrong:    { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)' },
  optionText: { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 15 },
  checkIcon: { color: '#10B981', fontSize: 18 },
  wrongIcon: { color: '#EF4444', fontSize: 18 },
  nextBtn: { backgroundColor: COLORS.accent, borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  nextBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1.5 },
  resultScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  resultEmoji: { fontSize: 72, marginBottom: 16 },
  resultTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 36, marginBottom: 6 },
  resultSub: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, marginBottom: 32 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', marginBottom: 36 },
  scoreValue: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 26 },
  scorePct: { fontFamily: FONTS.uiMedium, color: '#3B82F6', fontSize: 14 },
  btn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 48, marginBottom: 12 },
  btnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1.5 },
  btnOutline: { paddingVertical: 10 },
  btnOutlineText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14 },
});
