import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';

const THEMES = ['Grammaire', 'Vocabulaire', 'Culture', 'Voyage', 'Examen', 'Conversation'];

export default function TrainerCreateCourseScreen({ navigation }) {
  const { accessToken } = useAuthStore();
  const [title, setTitle]       = useState('');
  const [description, setDesc]  = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [theme, setTheme]       = useState('');
  const [loading, setLoading]   = useState(false);

  // Fichiers locaux
  const [videoFile, setVideoFile] = useState(null);
  const [pdfFile, setPdfFile]     = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPdf, setUploadingPdf]     = useState(false);

  // ── Sélectionner une vidéo locale ────────────────────────────────────────
  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/mp4', 'video/quicktime', 'video/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        const sizeMb = (asset.size || 0) / (1024 * 1024);
        if (sizeMb > 500) {
          Alert.alert('Fichier trop grand', 'La vidéo ne doit pas dépasser 500 Mo');
          return;
        }
        setVideoFile(asset);
        setVideoUrl(''); // Priorité au fichier local sur l'URL
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de sélectionner la vidéo');
    }
  };

  // ── Sélectionner un PDF ───────────────────────────────────────────────────
  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        const sizeMb = (asset.size || 0) / (1024 * 1024);
        if (sizeMb > 20) {
          Alert.alert('Fichier trop grand', 'Le PDF ne doit pas dépasser 20 Mo');
          return;
        }
        setPdfFile(asset);
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de sélectionner le PDF');
    }
  };

  // ── Upload d'un fichier via FormData ─────────────────────────────────────
  const uploadFile = async (asset, fieldName, setUploading) => {
    setUploading(true);
    try {
      const uri = asset.uri;
      const name = asset.name || uri.split('/').pop();

      const formData = new FormData();
      formData.append(fieldName, {
        uri,
        name,
        type: asset.mimeType || 'application/octet-stream',
      });

      const response = await fetch(`${API_BASE_URL}/files/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur upload');
      return data.path; // chemin serveur retourné
    } catch (e) {
      Alert.alert('Erreur upload', e.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // ── Créer le cours ────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!title.trim()) { Alert.alert('Erreur', 'Le titre est requis'); return; }
    setLoading(true);
    try {
      let finalVideoPath = videoUrl.trim() || null;
      let finalPdfPath   = null;

      // Upload vidéo locale si sélectionnée
      if (videoFile) {
        const path = await uploadFile(videoFile, 'file', setUploadingVideo);
        if (path) finalVideoPath = path;
      }
      // Upload PDF si sélectionné
      if (pdfFile) {
        const path = await uploadFile(pdfFile, 'file', setUploadingPdf);
        if (path) finalPdfPath = path;
      }

      const res = await fetch(`${API_BASE_URL}/trainer/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          videoPath: finalVideoPath,
          pdfPath:   finalPdfPath,
          theme:     theme || null,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        Alert.alert('Cours créé ✓', `"${json.title}" enregistré en brouillon.`, [
          { text: 'Voir mes cours', onPress: () => navigation.navigate('TrainerCourses') },
          { text: 'Créer un autre', onPress: () => {
            setTitle(''); setDesc(''); setVideoUrl(''); setTheme('');
            setVideoFile(null); setPdfFile(null);
          }},
        ]);
      } else {
        Alert.alert('Erreur', json.error || `HTTP ${res.status}`);
      }
    } catch (e) {
      Alert.alert('Erreur réseau', e.message);
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || uploadingVideo || uploadingPdf;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>‹ Retour</Text>
        </TouchableOpacity>

        <Text style={s.overline}>NOUVEAU COURS</Text>
        <Text style={s.title}>Créer un cours</Text>
        <View style={s.divider} />

        <Field label="Titre *" value={title} onChange={setTitle} placeholder="ex : Les verbes séparables en B2" />
        <Field label="Description" value={description} onChange={setDesc} multiline placeholder="Résumez le contenu du cours..." />

        {/* Vidéo — URL ou fichier local */}
        <Text style={s.label}>Vidéo du cours</Text>
        <Field
          label="URL YouTube / lien externe"
          value={videoUrl}
          onChange={v => { setVideoUrl(v); if (v) setVideoFile(null); }}
          placeholder="https://youtube.com/watch?v=..."
          keyboard="url"
          lower
        />
        <View style={s.orRow}>
          <View style={s.orLine} />
          <Text style={s.orText}>ou</Text>
          <View style={s.orLine} />
        </View>
        <TouchableOpacity
          style={[s.uploadBtn, videoFile && s.uploadBtnActive]}
          onPress={pickVideo}
          disabled={!!videoUrl.trim()}
        >
          <Text style={s.uploadIcon}>🎬</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.uploadLabel, videoFile && { color: COLORS.deep }]}>
              {videoFile ? videoFile.name : 'Importer une vidéo depuis l\'appareil'}
            </Text>
            {videoFile && (
              <Text style={s.uploadSize}>{((videoFile.size || 0) / (1024*1024)).toFixed(1)} Mo · MP4/MOV</Text>
            )}
          </View>
          {videoFile && (
            <TouchableOpacity onPress={() => setVideoFile(null)}>
              <Text style={{ color: '#EF4444', fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* PDF obligatoire */}
        <Text style={[s.label, { marginTop: 20 }]}>Document PDF du cours</Text>
        <TouchableOpacity
          style={[s.uploadBtn, pdfFile && s.uploadBtnActive]}
          onPress={pickPdf}
        >
          <Text style={s.uploadIcon}>📄</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.uploadLabel, pdfFile && { color: COLORS.deep }]}>
              {pdfFile ? pdfFile.name : 'Importer le PDF (exercices, vocabulaire…)'}
            </Text>
            {pdfFile && (
              <Text style={s.uploadSize}>{((pdfFile.size || 0) / (1024*1024)).toFixed(1)} Mo · max 20 Mo</Text>
            )}
          </View>
          {pdfFile && (
            <TouchableOpacity onPress={() => setPdfFile(null)}>
              <Text style={{ color: '#EF4444', fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Thème */}
        <Text style={[s.label, { marginTop: 20 }]}>Thème</Text>
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

        <View style={s.infoBox}>
          <Text style={s.infoText}>
            💡 Le cours sera enregistré en <Text style={{ fontFamily: FONTS.uiBold }}>brouillon</Text>. Vous pourrez le publier depuis "Mes cours" une fois le contenu complet.
          </Text>
        </View>

        <TouchableOpacity style={[s.submitBtn, isLoading && { opacity: 0.6 }]} onPress={handleCreate} disabled={isLoading}>
          {isLoading
            ? <ActivityIndicator color="white" />
            : <Text style={s.submitText}>CRÉER LE COURS</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const Field = ({ label, value, onChange, multiline, placeholder, keyboard, lower }) => (
  <View style={{ marginBottom: 16 }}>
    {label ? <Text style={s.label}>{label}</Text> : null}
    <TextInput
      style={[s.input, multiline && { height: 90, textAlignVertical: 'top', paddingTop: 12 }]}
      value={value} onChangeText={onChange} placeholder={placeholder || ''}
      placeholderTextColor={COLORS.muted} multiline={!!multiline}
      keyboardType={keyboard || 'default'} autoCapitalize={lower ? 'none' : 'sentences'}
    />
  </View>
);

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paper },
  scroll:    { padding: 24, paddingBottom: 50 },
  back:      { marginBottom: 24 },
  backText:  { fontFamily: FONTS.uiMedium, color: COLORS.accent, fontSize: 15 },
  overline:  { fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 10, letterSpacing: 3, marginBottom: 6 },
  title:     { fontFamily: FONTS.display, color: COLORS.deep, fontSize: 30, marginBottom: 12 },
  divider:   { width: 50, height: 1.5, backgroundColor: COLORS.gold, marginBottom: 28 },
  label:     { fontFamily: FONTS.uiMedium, color: COLORS.deep, fontSize: 12, letterSpacing: 0.5, marginBottom: 7 },
  input: {
    backgroundColor: 'white', borderWidth: 1.5, borderColor: 'rgba(126,102,58,0.25)',
    borderRadius: 6, paddingHorizontal: 14, paddingVertical: 12,
    color: COLORS.deep, fontSize: 15, fontFamily: FONTS.regular,
  },
  orRow:  { flexDirection: 'row', alignItems: 'center', marginVertical: 10, gap: 8 },
  orLine: { flex: 1, height: 1, backgroundColor: 'rgba(126,102,58,0.2)' },
  orText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12 },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: 'rgba(126,102,58,0.25)', borderStyle: 'dashed',
    borderRadius: 8, padding: 14, backgroundColor: 'rgba(126,102,58,0.04)', marginBottom: 4,
  },
  uploadBtnActive: {
    borderStyle: 'solid', borderColor: COLORS.accent,
    backgroundColor: 'rgba(161,94,45,0.06)',
  },
  uploadIcon:  { fontSize: 22 },
  uploadLabel: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13 },
  uploadSize:  { fontFamily: FONTS.regular, color: COLORS.accent, fontSize: 11, marginTop: 2 },
  themeRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  themeChip:  { borderWidth: 1.5, borderColor: 'rgba(126,102,58,0.3)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'white' },
  themeChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  themeText:  { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 13 },
  themeTextActive: { color: 'white' },
  infoBox:    { backgroundColor: 'rgba(184,137,58,0.08)', borderRadius: 8, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(184,137,58,0.2)' },
  infoText:   { fontFamily: FONTS.regular, color: COLORS.primary, fontSize: 13, lineHeight: 20 },
  submitBtn:  { backgroundColor: COLORS.accent, padding: 17, borderRadius: 6, alignItems: 'center' },
  submitText: { fontFamily: FONTS.uiBold, color: 'white', fontSize: 14, letterSpacing: 1.5 },
});
