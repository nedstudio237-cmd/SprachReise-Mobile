import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';

const QUESTIONS = [
  {
    id: 1,
    german: 'Wie heißt du?',
    french: 'Comment tu t\'appelles ?',
    level: 'A1',
    options: [
      { id: 'a', text: 'Ich heiße Marie.' },
      { id: 'b', text: 'Ich bin gut.' },
      { id: 'c', text: 'Ich komme aus Kamerun.' },
      { id: 'd', text: 'Ich spreche Deutsch.' },
    ],
    correct: 'a',
    explanation: '"Ich heiße" signifie "Je m\'appelle". C\'est la réponse correcte pour se présenter.',
  },
  {
    id: 2,
    german: 'Woher kommst du?',
    french: 'D\'où viens-tu ?',
    level: 'A1',
    options: [
      { id: 'a', text: 'Ich wohne in Berlin.' },
      { id: 'b', text: 'Ich komme aus Kamerun.' },
      { id: 'c', text: 'Ich bin zwanzig Jahre alt.' },
      { id: 'd', text: 'Ich lerne Deutsch.' },
    ],
    correct: 'b',
    explanation: '"Woher kommst du?" demande d\'où tu viens. "Ich komme aus..." signifie "Je viens de...".',
  },
  {
    id: 3,
    german: 'Was ist das?',
    french: 'Qu\'est-ce que c\'est ?',
    level: 'A1',
    options: [
      { id: 'a', text: 'Das bin ich.' },
      { id: 'b', text: 'Er ist müde.' },
      { id: 'c', text: 'Das ist ein Buch.' },
      { id: 'd', text: 'Sie heißt Anna.' },
    ],
    correct: 'c',
    explanation: '"Was ist das?" = "Qu\'est-ce que c\'est?" — "Das ist ein Buch" = "C\'est un livre".',
  },
  {
    id: 4,
    german: 'Wie alt bist du?',
    french: 'Quel âge as-tu ?',
    level: 'A1',
    options: [
      { id: 'a', text: 'Ich bin müde.' },
      { id: 'b', text: 'Ich bin aus Paris.' },
      { id: 'c', text: 'Ich bin Student.' },
      { id: 'd', text: 'Ich bin zwanzig Jahre alt.' },
    ],
    correct: 'd',
    explanation: '"Wie alt bist du?" demande ton âge. "Ich bin X Jahre alt" = "J\'ai X ans".',
  },
  {
    id: 5,
    german: 'Sprechen Sie Deutsch?',
    french: 'Parlez-vous allemand ?',
    level: 'A1',
    options: [
      { id: 'a', text: 'Ja, ein bisschen.' },
      { id: 'b', text: 'Nein, ich bin müde.' },
      { id: 'c', text: 'Ich wohne hier.' },
      { id: 'd', text: 'Das ist gut.' },
    ],
    correct: 'a',
    explanation: '"Sprechen Sie Deutsch?" = "Parlez-vous allemand?". La réponse logique est "Ja, ein bisschen" = "Oui, un peu".',
  },
];

export default function QcmScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = QUESTIONS[currentIndex];
  const progress = (currentIndex / QUESTIONS.length) * 100;

  const handleSelect = (optionId) => {
    if (showResult) return;
    setSelectedAnswer(optionId);
    setShowResult(true);
    if (optionId === question.correct) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    return <ResultScreen score={score} total={QUESTIONS.length} onRestart={handleRestart} navigation={navigation} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.progressLabel}>{currentIndex + 1} / {QUESTIONS.length}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{question.level}</Text>
        </View>

        <View style={styles.questionBlock}>
          <Text style={styles.questionDE}>{question.german}</Text>
          <Text style={styles.questionFR}>{question.french}</Text>
        </View>

        <Text style={styles.chooseLabel}>Choisissez la bonne réponse :</Text>

        {question.options.map((option) => {
          const isSelected = selectedAnswer === option.id;
          const isCorrect = option.id === question.correct;
          let optionStyle = styles.option;
          let textStyle = styles.optionText;

          if (showResult) {
            if (isCorrect) {
              optionStyle = [styles.option, styles.optionCorrect];
              textStyle = [styles.optionText, styles.optionTextCorrect];
            } else if (isSelected && !isCorrect) {
              optionStyle = [styles.option, styles.optionWrong];
              textStyle = [styles.optionText, styles.optionTextWrong];
            }
          } else if (isSelected) {
            optionStyle = [styles.option, styles.optionSelected];
          }

          return (
            <TouchableOpacity
              key={option.id}
              style={optionStyle}
              onPress={() => handleSelect(option.id)}
              activeOpacity={0.75}
            >
              <View style={[styles.optionLetter, showResult && isCorrect && styles.optionLetterCorrect, showResult && isSelected && !isCorrect && styles.optionLetterWrong]}>
                <Text style={[styles.optionLetterText, showResult && (isCorrect || (isSelected && !isCorrect)) && { color: COLORS.parchment }]}>
                  {option.id.toUpperCase()}
                </Text>
              </View>
              <Text style={textStyle}>{option.text}</Text>
              {showResult && isCorrect && <Text style={styles.checkIcon}>✓</Text>}
              {showResult && isSelected && !isCorrect && <Text style={styles.wrongIcon}>✗</Text>}
            </TouchableOpacity>
          );
        })}

        {showResult && (
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>Explication</Text>
            <Text style={styles.explanationText}>{question.explanation}</Text>
          </View>
        )}

        {showResult && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {currentIndex < QUESTIONS.length - 1 ? 'QUESTION SUIVANTE' : 'VOIR LES RÉSULTATS'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultScreen({ score, total, onRestart, navigation }) {
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 60;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.resultContainer}>
        <Text style={styles.resultEmoji}>{passed ? '🏆' : '📚'}</Text>
        <Text style={styles.resultTitle}>{passed ? 'Bravo !' : 'Continuez !'}</Text>
        <Text style={styles.resultSubtitle}>
          {passed ? 'Excellent travail sur ce QCM.' : 'La pratique mène à la perfection.'}
        </Text>

        <View style={styles.scoreCircle}>
          <Text style={styles.scoreValue}>{score}/{total}</Text>
          <Text style={styles.scorePercent}>{percentage}%</Text>
        </View>

        <View style={styles.resultMeta}>
          <ResultStat label="Bonnes réponses" value={`${score}`} positive />
          <ResultStat label="Mauvaises réponses" value={`${total - score}`} />
          <ResultStat label="Score" value={`${percentage}%`} positive={passed} />
        </View>

        <TouchableOpacity style={styles.restartBtn} onPress={onRestart}>
          <Text style={styles.restartBtnText}>RECOMMENCER</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backToCourseBtn} onPress={() => navigation?.goBack()}>
          <Text style={styles.backToCourseBtnText}>Retour au cours</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ResultStat({ label, value, positive }) {
  return (
    <View style={styles.resultStat}>
      <Text style={[styles.resultStatValue, positive ? styles.statPositive : styles.statNegative]}>
        {value}
      </Text>
      <Text style={styles.resultStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  backText: {
    fontFamily: FONTS.regular,
    color: COLORS.gold,
    fontSize: 16,
  },
  progressLabel: {
    fontFamily: FONTS.uiMedium,
    color: COLORS.muted,
    fontSize: 13,
  },

  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(126,102,58,0.2)',
    marginHorizontal: 20,
    borderRadius: 2,
  },
  progressFill: {
    height: 3,
    backgroundColor: COLORS.gold,
    borderRadius: 2,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },

  levelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(184,137,58,0.15)',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
  },
  levelText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.gold,
    fontSize: 11,
    letterSpacing: 1,
  },

  questionBlock: {
    backgroundColor: 'rgba(245,239,227,0.05)',
    borderRadius: 10,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(126,102,58,0.2)',
  },
  questionDE: {
    fontFamily: FONTS.displayItalic,
    color: COLORS.parchment,
    fontSize: 26,
    marginBottom: 8,
    lineHeight: 34,
  },
  questionFR: {
    fontFamily: FONTS.regular,
    color: COLORS.muted,
    fontSize: 15,
    fontStyle: 'italic',
  },

  chooseLabel: {
    fontFamily: FONTS.uiMedium,
    color: COLORS.muted,
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,239,227,0.06)',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(126,102,58,0.2)',
  },
  optionSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(161,94,45,0.12)',
  },
  optionCorrect: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  optionWrong: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  optionLetter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(126,102,58,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLetterCorrect: { backgroundColor: '#10B981' },
  optionLetterWrong: { backgroundColor: '#EF4444' },
  optionLetterText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.muted,
    fontSize: 13,
  },
  optionText: {
    fontFamily: FONTS.regular,
    color: COLORS.cream,
    fontSize: 15,
    flex: 1,
  },
  optionTextCorrect: { color: '#10B981' },
  optionTextWrong: { color: '#EF4444' },
  checkIcon: { color: '#10B981', fontSize: 18, marginLeft: 8 },
  wrongIcon: { color: '#EF4444', fontSize: 18, marginLeft: 8 },

  explanation: {
    backgroundColor: 'rgba(184,137,58,0.1)',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(184,137,58,0.25)',
  },
  explanationTitle: {
    fontFamily: FONTS.uiBold,
    color: COLORS.gold,
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  explanationText: {
    fontFamily: FONTS.regular,
    color: COLORS.cream,
    fontSize: 14,
    lineHeight: 21,
  },

  nextBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    padding: 16,
    alignItems: 'center',
  },
  nextBtnText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.parchment,
    fontSize: 13,
    letterSpacing: 1.5,
  },

  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  resultEmoji: { fontSize: 72, marginBottom: 16 },
  resultTitle: {
    fontFamily: FONTS.display,
    color: COLORS.parchment,
    fontSize: 36,
    marginBottom: 8,
  },
  resultSubtitle: {
    fontFamily: FONTS.regular,
    color: COLORS.muted,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  scoreValue: {
    fontFamily: FONTS.displayBold,
    color: COLORS.parchment,
    fontSize: 28,
  },
  scorePercent: {
    fontFamily: FONTS.uiMedium,
    color: COLORS.gold,
    fontSize: 13,
  },
  resultMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
    width: '100%',
    justifyContent: 'center',
  },
  resultStat: { alignItems: 'center' },
  resultStatValue: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    marginBottom: 4,
  },
  statPositive: { color: COLORS.gold },
  statNegative: { color: COLORS.muted },
  resultStatLabel: {
    fontFamily: FONTS.ui,
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'center',
  },
  restartBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 14,
    width: '100%',
    alignItems: 'center',
  },
  restartBtnText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.parchment,
    fontSize: 13,
    letterSpacing: 1.5,
  },
  backToCourseBtn: { paddingVertical: 8 },
  backToCourseBtnText: {
    fontFamily: FONTS.regular,
    color: COLORS.muted,
    fontSize: 14,
  },
});
