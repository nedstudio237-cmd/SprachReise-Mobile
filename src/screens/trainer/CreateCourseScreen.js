import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, FONTS } from '../../constants/config';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const THEMES = ['Phonétique', 'Grammaire', 'Vocabulaire', 'Communication', 'Culture', 'Conjugaison', 'Orthographe'];

export default function CreateCourseScreen({ navigation }) {
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme]             = useState(THEMES[0]);
  const [videoFile, setVideoFile]     = useState(null);
  const [pdfFile, setPdfFile]         = useState(null);
  const [loading, setLoading]         = useState(false);

  const pickVideo = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true });
    if (!res.canceled && res.assets?.[0]) setVideoFile(res.assets[0]);
  };

  const pickPdf = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (!res.canceled && res.assets?.[0]) setPdfFile(res.assets[0]);
  };

  const submit = async () => {
    if (!title.trim()) { Alert.alert('Erreur', 'Le titre est obligatoire'); return; }
    if (!videoFile)    { Alert.alert('Erreur', 'Veuillez sélectionner une vidéo'); return; }
    if (!pdfFile)      { Alert.alert('Erreur', 'Le PDF du cours est obligatoire'); return; }

    setLoading(true);
    try {
      const form = new FormData();
      form.append('title', title.trim());
      form.append('description', description.trim());
      form.append('theme', theme);
      form.append('videoFile', { uri: videoFile.uri, name: videoFile.name, type: 'video/mp4' });
      form.append('pdfFile',   { uri: pdfFile.uri,   name: pdfFile.name,   type: 'application/pdf' });

      await api.post('/courses', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Succès', 'Cours créé avec succès !', [{ text: 'OK', onPress: () => navigation?.goBack() }]);
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
        <Text style={styles.headerTitle}>Nouveau cours</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Field label="Titre *" value={title} onChangeText={setTitle} placeholder="Ex: Les déclinaisons allemandes" />
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="Décrivez le contenu du cours..." multiline />

        <Text style={styles.label}>Thème</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {THEMES.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.themeChip, theme === t && styles.themeChipActive]}
              onPress={() => setTheme(t)}
            >
              <Text style={[styles.themeChipText, theme === t && styles.themeChipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Vidéo du cours * (MP4, max 500 Mo)</Text>
        <TouchableOpacity style={styles.fileBtn} onPress={pickVideo}>
          <Text style={styles.fileIcon}>🎬</Text>
          <Text style={styles.fileBtnText}>{videoFile ? videoFile.name : 'Sélectionner une vidéo'}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>PDF du cours * (obligatoire)</Text>
        <TouchableOpacity style={styles.fileBtn} onPress={pickPdf}>
          <Text style={styles.fileIcon}>📄</Text>
          <Text style={styles.fileBtnText}>{pdfFile ? pdfFile.name : 'Sélectionner le PDF'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={submit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={COLORS.parchment} />
            : <Text style={styles.submitBtnText}>PUBLIER LE COURS</Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 100, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        multiline={multiline}
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

  themeChip: {
    borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(126,102,58,0.3)',
    paddingHorizontal: 14, paddingVertical: 7, marginRight: 8,
    backgroundColor: 'rgba(245,239,227,0.05)',
  },
  themeChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  themeChipText: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 12 },
  themeChipTextActive: { color: COLORS.parchment },

  fileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: 'rgba(184,137,58,0.4)',
    borderRadius: 8, padding: 14, marginBottom: 20,
    backgroundColor: 'rgba(184,137,58,0.06)',
  },
  fileIcon: { fontSize: 20 },
  fileBtnText: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 13, flex: 1 },

  submitBtn: { backgroundColor: COLORS.accent, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  submitBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1.5 },
});
