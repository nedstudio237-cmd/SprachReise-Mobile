import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';
import api from '../../services/api';

export default function CreateQcmScreen({ navigation }) {
  const [title, setTitle]   = useState('');
  const [theme, setTheme]   = useState('');
  const [questions, setQs]  = useState([newQuestion()]);
  const [loading, setLoading] = useState(false);

  function newQuestion() {
    return { text: '', choices: [{ text: '', correct: true }, { text: '', correct: false }, { text: '', correct: false }] };
  }

  const addQuestion = () => setQs([...questions, newQuestion()]);

  const updateQuestion = (qi, text) => {
    const next = [...questions];
    next[qi] = { ...next[qi], text };
    setQs(next);
  };

  const updateChoice = (qi, ci, field, value) => {
    const next = [...questions];
    const choices = [...next[qi].choices];
    choices[ci] = { ...choices[ci], [field]: value };
    if (field === 'correct' && value) {
      // Désélectionner les autres
      choices.forEach((c, i) => { if (i !== ci) choices[i] = { ...c, correct: false }; });
    }
    next[qi] = { ...next[qi], choices };
    setQs(next);
  };

  const submit = async () => {
    if (!title.trim()) { Alert.alert('Erreur', 'Titre obligatoire'); return; }
    if (questions.length < 5) { Alert.alert('Erreur', 'Minimum 5 questions'); return; }
    for (const q of questions) {
      if (!q.text.trim()) { Alert.alert('Erreur', 'Remplissez toutes les questions'); return; }
      if (!q.choices.some(c => c.correct)) { Alert.alert('Erreur', 'Chaque question doit avoir une bonne réponse'); return; }
    }
    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        theme: theme.trim(),
        status: 'PUBLISHED',
        questions: questions.map((q, i) => ({
          questionText: q.text,
          questionType: 'SINGLE_CHOICE',
          orderIndex: i + 1,
          choices: q.choices.map(c => ({ choiceText: c.text, isCorrect: c.correct })),
        })),
      };
      await api.post('/qcms', payload);
      Alert.alert('Succès', 'QCM publié !', [{ text: 'OK', onPress: () => navigation?.goBack() }]);
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.error ?? 'Erreur lors de la création');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}><Text style={styles.backText}>‹</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau QCM</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Titre *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Ex: QCM Grammaire B1" placeholderTextColor={COLORS.muted} />

        <Text style={styles.label}>Thème</Text>
        <TextInput style={[styles.input, { marginBottom: 24 }]} value={theme} onChangeText={setTheme} placeholder="Grammaire, Vocabulaire..." placeholderTextColor={COLORS.muted} />

        <Text style={styles.sectionTitle}>QUESTIONS ({questions.length})</Text>

        {questions.map((q, qi) => (
          <View key={qi} style={styles.questionCard}>
            <Text style={styles.questionNum}>Question {qi + 1}</Text>
            <TextInput
              style={styles.questionInput}
              value={q.text}
              onChangeText={t => updateQuestion(qi, t)}
              placeholder="Texte de la question..."
              placeholderTextColor={COLORS.muted}
              multiline
            />
            {q.choices.map((c, ci) => (
              <View key={ci} style={styles.choiceRow}>
                <TouchableOpacity onPress={() => updateChoice(qi, ci, 'correct', true)} style={styles.radioWrap}>
                  <View style={[styles.radio, c.correct && styles.radioActive]} />
                </TouchableOpacity>
                <TextInput
                  style={styles.choiceInput}
                  value={c.text}
                  onChangeText={t => updateChoice(qi, ci, 'text', t)}
                  placeholder={`Choix ${ci + 1}`}
                  placeholderTextColor={COLORS.muted}
                />
              </View>
            ))}
          </View>
        ))}

        <TouchableOpacity style={styles.addQBtn} onPress={addQuestion}>
          <Text style={styles.addQBtnText}>+ Ajouter une question</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.parchment} /> : <Text style={styles.submitBtnText}>PUBLIER LE QCM</Text>}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.2)',
  },
  backText: { color: COLORS.gold, fontSize: 26 },
  headerTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 17 },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  label: { fontFamily: FONTS.uiBold, color: COLORS.cream, fontSize: 12, letterSpacing: 0.5, marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(245,239,227,0.07)', borderWidth: 1,
    borderColor: 'rgba(126,102,58,0.4)', borderRadius: 8,
    padding: 14, color: COLORS.parchment, fontSize: 15, fontFamily: FONTS.regular, marginBottom: 18,
  },
  sectionTitle: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 10, letterSpacing: 2.5, marginBottom: 12 },
  questionCard: {
    backgroundColor: 'rgba(245,239,227,0.05)', borderRadius: 10, padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  questionNum: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 11, marginBottom: 8 },
  questionInput: {
    color: COLORS.parchment, fontFamily: FONTS.regular, fontSize: 14,
    borderBottomWidth: 1, borderColor: 'rgba(126,102,58,0.3)', paddingBottom: 8, marginBottom: 12,
  },
  choiceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  radioWrap: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: COLORS.muted },
  radioActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accent },
  choiceInput: {
    flex: 1, color: COLORS.cream, fontFamily: FONTS.regular, fontSize: 13,
    borderBottomWidth: 1, borderColor: 'rgba(126,102,58,0.2)', paddingBottom: 6,
  },
  addQBtn: {
    borderWidth: 1.5, borderColor: COLORS.accent, borderRadius: 8,
    padding: 12, alignItems: 'center', marginBottom: 20,
    backgroundColor: 'rgba(161,94,45,0.08)',
  },
  addQBtnText: { fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 13 },
  submitBtn: { backgroundColor: COLORS.accent, borderRadius: 10, padding: 16, alignItems: 'center' },
  submitBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1.5 },
});
