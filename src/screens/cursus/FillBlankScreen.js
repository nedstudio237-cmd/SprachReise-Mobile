import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { getRandomSentences } from '../../data/vocabulary';

export default function FillBlankScreen({ navigation }) {
  const { level, recordGameResult } = useAuthStore();
  const userLevel = level ?? 'A1';

  const [questions] = useState(() => getRandomSentences(userLevel, 6));
  const [current, setCurrent]   = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[current];
  const progress = (current / questions.length) * 100;

  const handleSelect = useCallback((idx) => {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    if (idx === question.correct) setScore((s) => s + 1);
  }, [showResult, question]);

  const handleNext = async () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      await recordGameResult('fillBlank', score, questions.length);
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrent(0); setSelected(null);
    setShowResult(false); setScore(0); setFinished(false);
  };

  // Split sentence at ___
  const renderSentence = (sentence, answer) => {
    const parts = sentence.split('___');
    return (
      <Text style={styles.sentenceText}>
        {parts[0]}
        <Text style={styles.sentenceBlank}>
          {showResult ? answer : '  ___  '}
        </Text>
        {parts[1] ?? ''}
      </Text>
    );
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultScreen}>
          <Text style={styles.resultEmoji}>{pct >= 70 ? '🎯' : '📚'}</Text>
          <Text style={styles.resultTitle}>{pct >= 70 ? 'Bravo !' : 'Continuez !'}</Text>
          <Text style={styles.resultSub}>Compléter la phrase — {userLevel}</Text>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>{score}/{questions.length}</Text>
            <Text style={styles.scorePct}>{pct}%</Text>
          </View>
          <TouchableOpacity style={styles.btn} onPress={handleRestart}>
            <Text style={styles.btnText}>REJOUER</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnOutline} onPress={() => navigation?.goBack()}>
            <Text style={styles.btnOutlineText}>Retour au cursus</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const correctWord = question.options[question.correct];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.back}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.counter}>{current + 1} / {questions.length}</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>⭐ {score}</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.gameTag}>✏️ COMPLÉTER LA PHRASE — {userLevel}</Text>

        <View style={styles.sentenceCard}>
          <Text style={styles.cardHint}>Complétez la phrase en allemand :</Text>
          {renderSentence(question.sentence, correctWord)}
        </View>

        <Text style={styles.chooseLabel}>Quel mot convient ?</Text>

        {question.options.map((opt, idx) => {
          const isSelected = selected === idx;
          const isCorrect  = idx === question.correct;
          let cardStyle = styles.optionCard;
          if (showResult) {
            if (isCorrect) cardStyle = [styles.optionCard, styles.optionCorrect];
            else if (isSelected) cardStyle = [styles.optionCard, styles.optionWrong];
          } else if (isSelected) {
            cardStyle = [styles.optionCard, styles.optionSelected];
          }
          return (
            <TouchableOpacity key={idx} style={cardStyle} onPress={() => handleSelect(idx)} activeOpacity={0.78}>
              <Text style={[styles.optionText,
                showResult && isCorrect && { color: '#10B981', fontFamily: FONTS.uiBold },
                showResult && isSelected && !isCorrect && { color: '#EF4444' },
              ]}>
                {opt}
              </Text>
              {showResult && isCorrect && <Text style={styles.checkIcon}>✓</Text>}
              {showResult && isSelected && !isCorrect && <Text style={styles.wrongIcon}>✗</Text>}
            </TouchableOpacity>
          );
        })}

        {showResult && (
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>EXPLICATION</Text>
            <Text style={styles.explanationText}>{question.explanation}</Text>
          </View>
        )}

        {showResult && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {current < questions.length - 1 ? 'PHRASE SUIVANTE  ›' : 'VOIR MON SCORE'}
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
  progressFill: { height: 3, backgroundColor: '#8B5CF6', borderRadius: 2 },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  gameTag: { fontFamily: FONTS.uiBold, color: '#8B5CF6', fontSize: 10, letterSpacing: 1.5, marginBottom: 16 },
  sentenceCard: {
    backgroundColor: 'rgba(139,92,246,0.08)', borderRadius: 14,
    padding: 24, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
  },
  cardHint: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 12, marginBottom: 12 },
  sentenceText: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 22, lineHeight: 34, textAlign: 'center' },
  sentenceBlank: { color: '#8B5CF6', fontFamily: FONTS.displayBold, textDecorationLine: 'underline' },
  chooseLabel: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 12, marginBottom: 12 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 10,
    padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  optionSelected: { borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.12)' },
  optionCorrect:  { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)' },
  optionWrong:    { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)' },
  optionText: { fontFamily: FONTS.medium, color: COLORS.cream, fontSize: 17 },
  checkIcon: { color: '#10B981', fontSize: 18 },
  wrongIcon: { color: '#EF4444', fontSize: 18 },
  explanation: {
    backgroundColor: 'rgba(184,137,58,0.1)', borderRadius: 8,
    padding: 14, marginTop: 4, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(184,137,58,0.25)',
  },
  explanationTitle: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 },
  explanationText: { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 13, lineHeight: 20 },
  nextBtn: { backgroundColor: COLORS.accent, borderRadius: 8, padding: 16, alignItems: 'center' },
  nextBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1.5 },
  resultScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  resultEmoji: { fontSize: 72, marginBottom: 16 },
  resultTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 36, marginBottom: 6 },
  resultSub: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, marginBottom: 32 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', marginBottom: 36 },
  scoreValue: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 26 },
  scorePct: { fontFamily: FONTS.uiMedium, color: '#8B5CF6', fontSize: 14 },
  btn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 48, marginBottom: 12 },
  btnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1.5 },
  btnOutline: { paddingVertical: 10 },
  btnOutlineText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14 },
});
