import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';
import api from '../../services/api';

export default function QcmScreen({ route, navigation }) {
  const levelId = route?.params?.levelId ?? 1;
  const [qcm, setQcm] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState(null);
  const [aiModalVisible, setAiModalVisible] = useState(false);

  useEffect(() => {
    api.get('/qcm', { params: { levelId } })
      .then(({ data }) => {
        if (data.length > 0) {
          const first = data[0];
          setQcm(first);
          setQuestions(first.questions ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [levelId]);

  const question = questions[currentIndex];
  const progress = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  const correctChoice = question?.choices?.find((c) => c.isCorrect);
  const explanation = correctChoice?.explanation ?? '';

  const handleSelect = useCallback((choiceId, isCorrect) => {
    if (showResult) return;
    setSelectedId(choiceId);
    setShowResult(true);
    if (isCorrect) setScore((s) => s + 1);
  }, [showResult]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedId(null);
      setShowResult(false);
      setAiText(null);
    } else {
      submitAndFinish();
    }
  };

  const submitAndFinish = async () => {
    try {
      await api.post(`/qcm/${qcm.id}/attempt`, {
        score,
        total: questions.length,
        correct: score,
        duration: 0,
      });
    } catch {}
    setFinished(true);
  };

  const handleAskAI = async () => {
    if (aiLoading || !question) return;
    setAiLoading(true);
    setAiText(null);
    try {
      const { data } = await api.post('/ai/explain', {
        level: 'A1',
        question: question.questionText,
        context: explanation,
        mode: 'explain',
      });
      setAiText(data.explanation);
      setAiModalVisible(true);
    } catch {
      setAiText('Tuteur IA indisponible pour le moment.');
      setAiModalVisible(true);
    } finally {
      setAiLoading(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedId(null);
    setShowResult(false);
    setScore(0);
    setFinished(false);
    setAiText(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!qcm || questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.topBackBtn}>
          <Text style={styles.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Aucun QCM disponible pour ce niveau.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (finished) {
    return (
      <ResultScreen
        score={score}
        total={questions.length}
        qcmTitle={qcm.title}
        onRestart={handleRestart}
        navigation={navigation}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.progressLabel}>{currentIndex + 1} / {questions.length}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.qcmMeta}>
          <Text style={styles.qcmTitle}>{qcm.title}</Text>
          {qcm.theme ? <Text style={styles.qcmTheme}>{qcm.theme}</Text> : null}
        </View>

        <View style={styles.questionBlock}>
          <Text style={styles.questionText}>{question.questionText}</Text>
        </View>

        <Text style={styles.chooseLabel}>Choisissez la bonne réponse :</Text>

        {question.choices?.map((choice) => {
          const isSelected = selectedId === choice.id;
          const isCorrect = choice.isCorrect;
          let cardStyle = styles.option;
          let textStyle = styles.optionText;
          let dotStyle = styles.optionLetter;

          if (showResult) {
            if (isCorrect) {
              cardStyle = [styles.option, styles.optionCorrect];
              textStyle = [styles.optionText, styles.optionTextCorrect];
              dotStyle = [styles.optionLetter, styles.optionLetterCorrect];
            } else if (isSelected) {
              cardStyle = [styles.option, styles.optionWrong];
              textStyle = [styles.optionText, styles.optionTextWrong];
              dotStyle = [styles.optionLetter, styles.optionLetterWrong];
            }
          } else if (isSelected) {
            cardStyle = [styles.option, styles.optionSelected];
          }

          return (
            <TouchableOpacity
              key={choice.id}
              style={cardStyle}
              onPress={() => handleSelect(choice.id, choice.isCorrect)}
              activeOpacity={0.75}
            >
              <View style={dotStyle}>
                {showResult && isCorrect && <Text style={styles.dotIcon}>✓</Text>}
                {showResult && isSelected && !isCorrect && <Text style={styles.dotIcon}>✗</Text>}
              </View>
              <Text style={textStyle}>{choice.choiceText}</Text>
            </TouchableOpacity>
          );
        })}

        {showResult && (
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>EXPLICATION</Text>
            <Text style={styles.explanationText}>{explanation}</Text>

            <TouchableOpacity
              style={styles.aiBtn}
              onPress={handleAskAI}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <ActivityIndicator size="small" color={COLORS.gold} />
              ) : (
                <Text style={styles.aiBtnText}>🤖  Demander au tuteur IA</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {showResult && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {currentIndex < questions.length - 1 ? 'QUESTION SUIVANTE  ›' : 'VOIR LES RÉSULTATS'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal
        visible={aiModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🤖 Tuteur IA</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalText}>{aiText}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setAiModalVisible(false)}>
              <Text style={styles.modalCloseText}>FERMER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ResultScreen({ score, total, qcmTitle, onRestart, navigation }) {
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 60;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.resultContainer}>
        <Text style={styles.resultEmoji}>{passed ? '🏆' : '📚'}</Text>
        <Text style={styles.resultTitle}>{passed ? 'Bravo !' : 'Continuez !'}</Text>
        <Text style={styles.resultSubtitle}>{qcmTitle}</Text>

        <View style={styles.scoreCircle}>
          <Text style={styles.scoreValue}>{score}/{total}</Text>
          <Text style={styles.scorePercent}>{percentage}%</Text>
        </View>

        <View style={styles.resultMeta}>
          <ResultStat label="Corrects" value={`${score}`} positive />
          <ResultStat label="Erreurs" value={`${total - score}`} />
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 15, fontStyle: 'italic' },
  topBackBtn: { padding: 20 },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  backText: { fontFamily: FONTS.regular, color: COLORS.gold, fontSize: 16 },
  progressLabel: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 13 },

  progressTrack: { height: 3, backgroundColor: 'rgba(126,102,58,0.2)', marginHorizontal: 20, borderRadius: 2 },
  progressFill: { height: 3, backgroundColor: COLORS.gold, borderRadius: 2 },

  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  qcmMeta: { marginBottom: 16 },
  qcmTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 19, marginBottom: 2 },
  qcmTheme: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 12 },

  questionBlock: {
    backgroundColor: 'rgba(245,239,227,0.05)', borderRadius: 10,
    padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  questionText: { fontFamily: FONTS.medium, color: COLORS.parchment, fontSize: 18, lineHeight: 28 },

  chooseLabel: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 12, letterSpacing: 0.5, marginBottom: 12 },

  option: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 8,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  optionSelected: { borderColor: COLORS.accent, backgroundColor: 'rgba(161,94,45,0.12)' },
  optionCorrect: { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)' },
  optionWrong: { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)' },
  optionLetter: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(126,102,58,0.15)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  optionLetterCorrect: { backgroundColor: '#10B981' },
  optionLetterWrong: { backgroundColor: '#EF4444' },
  dotIcon: { color: COLORS.parchment, fontSize: 13, fontWeight: 'bold' },
  optionText: { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 15, flex: 1 },
  optionTextCorrect: { color: '#10B981' },
  optionTextWrong: { color: '#EF4444' },

  explanation: {
    backgroundColor: 'rgba(184,137,58,0.1)', borderRadius: 8,
    padding: 16, marginTop: 8, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(184,137,58,0.25)',
  },
  explanationTitle: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 11, letterSpacing: 1, marginBottom: 6 },
  explanationText: { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 14, lineHeight: 21, marginBottom: 14 },
  aiBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(184,137,58,0.4)',
    borderRadius: 6, paddingVertical: 10,
  },
  aiBtnText: { fontFamily: FONTS.uiMedium, color: COLORS.gold, fontSize: 13 },

  nextBtn: { backgroundColor: COLORS.accent, borderRadius: 6, padding: 16, alignItems: 'center' },
  nextBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1.5 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#2A1D14', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, maxHeight: '70%',
  },
  modalTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 20, marginBottom: 16 },
  modalScroll: { maxHeight: 300 },
  modalText: { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 15, lineHeight: 24 },
  modalClose: {
    backgroundColor: COLORS.accent, borderRadius: 6, padding: 14,
    alignItems: 'center', marginTop: 20,
  },
  modalCloseText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1 },

  resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  resultEmoji: { fontSize: 72, marginBottom: 16 },
  resultTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 36, marginBottom: 8 },
  resultSubtitle: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, textAlign: 'center', marginBottom: 32 },
  scoreCircle: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 3, borderColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center', marginBottom: 32,
  },
  scoreValue: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 28 },
  scorePercent: { fontFamily: FONTS.uiMedium, color: COLORS.gold, fontSize: 13 },
  resultMeta: { flexDirection: 'row', gap: 16, marginBottom: 40, width: '100%', justifyContent: 'center' },
  resultStat: { alignItems: 'center' },
  resultStatValue: { fontFamily: FONTS.displayBold, fontSize: 22, marginBottom: 4 },
  statPositive: { color: COLORS.gold },
  statNegative: { color: COLORS.muted },
  resultStatLabel: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11, textAlign: 'center' },
  restartBtn: {
    backgroundColor: COLORS.accent, borderRadius: 6,
    paddingVertical: 14, paddingHorizontal: 40, marginBottom: 14,
    width: '100%', alignItems: 'center',
  },
  restartBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1.5 },
  backToCourseBtn: { paddingVertical: 8 },
  backToCourseBtnText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14 },
});
