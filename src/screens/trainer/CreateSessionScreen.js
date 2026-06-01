import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';
import api from '../../services/api';

export default function CreateSessionScreen({ navigation }) {
  const [title, setTitle]         = useState('');
  const [description, setDesc]    = useState('');
  const [date, setDate]           = useState('');  // YYYY-MM-DD HH:MM
  const [duration, setDuration]   = useState('60');
  const [record, setRecord]       = useState(false);
  const [loading, setLoading]     = useState(false);

  const submit = async () => {
    if (!title.trim()) { Alert.alert('Erreur', 'Le titre est obligatoire'); return; }
    if (!date.trim())  { Alert.alert('Erreur', 'La date est obligatoire (YYYY-MM-DD HH:MM)'); return; }
    setLoading(true);
    try {
      await api.post('/sessions', {
        title: title.trim(),
        description: description.trim(),
        scheduledStart: date.trim().replace(' ', 'T') + ':00',
        durationMinutes: parseInt(duration) || 60,
        recordEnabled: record,
      });
      Alert.alert('Succès', 'Session planifiée !', [{ text: 'OK', onPress: () => navigation?.goBack() }]);
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.error ?? 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planifier une session</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Field label="Titre *" value={title} onChangeText={setTitle} placeholder="Ex: Introduction à la grammaire B1" />
        <Field label="Description" value={description} onChangeText={setDesc} placeholder="Objectifs de la session..." multiline />
        <Field label="Date et heure * (YYYY-MM-DD HH:MM)" value={date} onChangeText={setDate} placeholder="2026-07-15 18:00" />
        <Field label="Durée (minutes)" value={duration} onChangeText={setDuration} placeholder="60" keyboardType="numeric" />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Enregistrer la session</Text>
          <Switch
            value={record}
            onValueChange={setRecord}
            trackColor={{ false: 'rgba(126,102,58,0.3)', true: COLORS.accent }}
            thumbColor={record ? COLORS.gold : COLORS.muted}
          />
        </View>

        <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.parchment} /> : <Text style={styles.submitBtnText}>PLANIFIER LA SESSION</Text>}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline, keyboardType }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 100, textAlignVertical: 'top' }]}
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={COLORS.muted} multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.2)',
  },
  backBtn: { padding: 4 },
  backText: { color: COLORS.gold, fontSize: 26 },
  headerTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 17 },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  label: { fontFamily: FONTS.uiBold, color: COLORS.cream, fontSize: 12, letterSpacing: 0.5, marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(245,239,227,0.07)', borderWidth: 1,
    borderColor: 'rgba(126,102,58,0.4)', borderRadius: 8,
    padding: 14, color: COLORS.parchment, fontSize: 15, fontFamily: FONTS.regular,
  },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24, paddingVertical: 12,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  switchLabel: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 14 },
  submitBtn: { backgroundColor: COLORS.accent, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  submitBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1.5 },
});
