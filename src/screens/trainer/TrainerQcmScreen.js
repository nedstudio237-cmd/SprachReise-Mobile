import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';

const THEMES = ['Grammaire', 'Vocabulaire', 'Culture', 'Voyage', 'Examen', 'Conversation'];

export default function TrainerQcmScreen({ navigation }) {
  const { accessToken } = useAuthStore();
  const [qcms, setQcms]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle]       = useState('');
  const [theme, setTheme]       = useState('');
  const [questions, setQuestions] = useState([newQuestion()]);
  const [saving, setSaving]     = useState(false);

  function newQuestion() {
    return {
      questionText: '',
      questionType: 'SINGLE_CHOICE',
      choices: [
        { choiceText: '', isCorrect: false },
        { choiceText: '', isCorrect: false },
        { choiceText: '', isCorrect: true  },
        { choiceText: '', isCorrect: false },
      ],
    };
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/trainer/qcms`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setQcms(Array.isArray(data) ? data : []);
    } catch {
      setQcms([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const handleTogglePublish = async (qcm) => {
    try {
      const res = await fetch(`${API_BASE_URL}/trainer/qcms/${qcm.id}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setQcms(prev => prev.map(q => q.id === qcm.id ? { ...q, status: data.status } : q));
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier le statut');
    }
  };

  const handleDelete = (qcm) => {
    Alert.alert('Supprimer', `Supprimer "${qcm.title}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await fetch(`${API_BASE_URL}/trainer/qcms/${qcm.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setQcms(prev => prev.filter(q => q.id !== qcm.id));
      }},
    ]);
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Erreur', 'Titre requis'); return; }
    const validQ = questions.filter(q => q.questionText.trim());
    if (validQ.length === 0) { Alert.alert('Erreur', 'Au moins une question requise'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/trainer/qcms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ title: title.trim(), theme: theme || null, questions: validQ }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setQcms(prev => [data, ...prev]);
      setShowForm(false);
      setTitle(''); setTheme(''); setQuestions([newQuestion()]);
      Alert.alert('QCM créé ✓', `"${data.title}" enregistré en brouillon.`);
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setSaving(false);
    }
  };

  const updateQuestion = (qi, field, value) => {
    setQuestions(prev => prev.map((q, i) => i === qi ? { ...q, [field]: value } : q));
  };

  const updateChoice = (qi, ci, field, value) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qi) return q;
      const choices = q.choices.map((c, j) => {
        if (j !== ci) return field === 'isCorrect' && q.questionType === 'SINGLE_CHOICE' ? { ...c, isCorrect: false } : c;
        return { ...c, [field]: value };
      });
      return { ...q, choices };
    }));
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mes QCMs</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(true)}>
          <Text style={s.addBtnText}>+ Créer</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.accent} />
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {qcms.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyText}>Aucun QCM pour l'instant.</Text>
              <Text style={s.emptySubText}>Créez votre premier QCM pour vos apprenants.</Text>
            </View>
          )}
          {qcms.map(q => (
            <View key={q.id} style={s.card}>
              <View style={s.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{q.title}</Text>
                  <Text style={s.cardMeta}>{q.levelCode} · {q.questionCount} question{q.questionCount !== 1 ? 's' : ''}{q.theme ? ` · ${q.theme}` : ''}</Text>
                </View>
                <View style={[s.badge, q.status === 'PUBLISHED' ? s.badgePublished : s.badgeDraft]}>
                  <Text style={[s.badgeText, q.status === 'PUBLISHED' ? s.badgeTextPub : s.badgeTextDraft]}>
                    {q.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
                  </Text>
                </View>
              </View>
              <View style={s.cardActions}>
                <TouchableOpacity style={s.actionBtn} onPress={() => handleTogglePublish(q)}>
                  <Text style={s.actionBtnText}>{q.status === 'PUBLISHED' ? 'Dépublier' : 'Publier'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, s.actionBtnDanger]} onPress={() => handleDelete(q)}>
                  <Text style={[s.actionBtnText, { color: '#EF4444' }]}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Modal création QCM */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={s.modalCancel}>Annuler</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>Nouveau QCM</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.accent} /> : <Text style={s.modalSave}>Créer</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.modalBody} keyboardShouldPersistTaps="handled">
            <TextInput
              style={s.input}
              placeholder="Titre du QCM *"
              placeholderTextColor={COLORS.muted}
              value={title}
              onChangeText={setTitle}
            />

            <View style={s.themeRow}>
              {THEMES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[s.themeChip, theme === t && s.themeChipActive]}
                  onPress={() => setTheme(theme === t ? '' : t)}
                >
                  <Text style={[s.themeText, theme === t && s.themeTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {questions.map((q, qi) => (
              <View key={qi} style={s.questionCard}>
                <View style={s.questionHeader}>
                  <Text style={s.questionLabel}>Question {qi + 1}</Text>
                  {questions.length > 1 && (
                    <TouchableOpacity onPress={() => setQuestions(prev => prev.filter((_, i) => i !== qi))}>
                      <Text style={{ color: '#EF4444', fontSize: 13 }}>Supprimer</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={s.questionInput}
                  placeholder="Texte de la question…"
                  placeholderTextColor={COLORS.muted}
                  value={q.questionText}
                  onChangeText={v => updateQuestion(qi, 'questionText', v)}
                  multiline
                />
                {q.choices.map((c, ci) => (
                  <View key={ci} style={s.choiceRow}>
                    <TouchableOpacity
                      style={[s.choiceRadio, c.isCorrect && s.choiceRadioActive]}
                      onPress={() => updateChoice(qi, ci, 'isCorrect', !c.isCorrect)}
                    >
                      {c.isCorrect && <View style={s.choiceRadioDot} />}
                    </TouchableOpacity>
                    <TextInput
                      style={s.choiceInput}
                      placeholder={`Choix ${ci + 1}${c.isCorrect ? ' ✓ correct' : ''}`}
                      placeholderTextColor={COLORS.muted}
                      value={c.choiceText}
                      onChangeText={v => updateChoice(qi, ci, 'choiceText', v)}
                    />
                  </View>
                ))}
              </View>
            ))}

            <TouchableOpacity
              style={s.addQuestionBtn}
              onPress={() => setQuestions(prev => [...prev, newQuestion()])}
            >
              <Text style={s.addQuestionText}>+ Ajouter une question</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.paper },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.15)' },
  backBtn:     { marginRight: 12 },
  backText:    { fontFamily: FONTS.display, color: COLORS.accent, fontSize: 28 },
  headerTitle: { flex: 1, fontFamily: FONTS.display, color: COLORS.deep, fontSize: 20 },
  addBtn:      { backgroundColor: COLORS.accent, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 6 },
  addBtnText:  { fontFamily: FONTS.uiBold, color: 'white', fontSize: 13 },
  list:        { padding: 16, gap: 12, paddingBottom: 40 },
  empty:       { alignItems: 'center', paddingVertical: 60 },
  emptyText:   { fontFamily: FONTS.display, color: COLORS.deep, fontSize: 18, marginBottom: 8 },
  emptySubText:{ fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13, textAlign: 'center' },
  card:        { backgroundColor: 'white', borderRadius: 10, padding: 16, borderWidth: 1, borderColor: 'rgba(126,102,58,0.15)' },
  cardTop:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitle:   { fontFamily: FONTS.uiBold, color: COLORS.deep, fontSize: 15, marginBottom: 4 },
  cardMeta:    { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12 },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgePublished: { backgroundColor: '#DCFCE7' },
  badgeDraft:     { backgroundColor: '#FEF3C7' },
  badgeText:      { fontSize: 11, fontFamily: FONTS.uiBold },
  badgeTextPub:   { color: '#16A34A' },
  badgeTextDraft: { color: '#D97706' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn:   { flex: 1, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(126,102,58,0.25)', alignItems: 'center' },
  actionBtnDanger: { borderColor: '#FCA5A5' },
  actionBtnText:   { fontFamily: FONTS.uiMedium, color: COLORS.deep, fontSize: 12 },

  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.15)' },
  modalCancel: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 15 },
  modalTitle:  { fontFamily: FONTS.display, color: COLORS.deep, fontSize: 18 },
  modalSave:   { fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 15 },
  modalBody:   { padding: 20, gap: 16, paddingBottom: 60 },
  input:       { backgroundColor: 'white', borderWidth: 1.5, borderColor: 'rgba(126,102,58,0.25)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontFamily: FONTS.regular, color: COLORS.deep, fontSize: 15 },
  themeRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  themeChip:   { borderWidth: 1.5, borderColor: 'rgba(126,102,58,0.3)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'white' },
  themeChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  themeText:   { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 12 },
  themeTextActive: { color: 'white' },

  questionCard:   { backgroundColor: 'white', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)' },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  questionLabel:  { fontFamily: FONTS.uiBold, color: COLORS.primary, fontSize: 12, letterSpacing: 0.5 },
  questionInput:  { backgroundColor: COLORS.paper, borderRadius: 6, padding: 10, fontFamily: FONTS.regular, color: COLORS.deep, fontSize: 14, marginBottom: 12, minHeight: 52 },
  choiceRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  choiceRadio:    { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.muted, alignItems: 'center', justifyContent: 'center' },
  choiceRadioActive: { borderColor: COLORS.accent },
  choiceRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent },
  choiceInput:    { flex: 1, backgroundColor: COLORS.paper, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontFamily: FONTS.regular, color: COLORS.deep, fontSize: 13 },
  addQuestionBtn: { borderWidth: 1.5, borderColor: COLORS.accent, borderStyle: 'dashed', borderRadius: 8, padding: 14, alignItems: 'center' },
  addQuestionText:{ fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 14 },
});
