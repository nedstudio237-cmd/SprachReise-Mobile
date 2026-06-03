import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LANGUAGES = [
  { code: 'de', label: '🇩🇪 Allemand' },
  { code: 'en', label: '🇬🇧 Anglais' },
  { code: 'es', label: '🇪🇸 Espagnol' },
  { code: 'zh', label: '🇨🇳 Mandarin' },
];
const pwCriteria = [
  { test: v => v.length >= 8,          label: '8 caractères minimum' },
  { test: v => /[A-Z]/.test(v),        label: '1 majuscule' },
  { test: v => /[0-9]/.test(v),        label: '1 chiffre' },
  { test: v => /[^a-zA-Z0-9]/.test(v), label: '1 caractère spécial' },
];

// ── Écran de succès ────────────────────────────────────────────────────────────
function SuccessScreen({ candidatureNumber, onBack }) {
  return (
    <SafeAreaView style={ss.container}>
      <View style={ss.inner}>
        <View style={ss.iconWrap}>
          <Text style={ss.checkmark}>✓</Text>
        </View>

        <Text style={ss.title}>Candidature envoyée</Text>
        <View style={ss.divider} />

        <Text style={ss.body}>
          Ta candidature de formateur a bien été enregistrée{candidatureNumber ? ` (n° ${candidatureNumber})` : ''}.
        </Text>
        <Text style={ss.body}>
          L'administration va examiner ton dossier dans les{' '}
          <Text style={ss.bold}>48 prochaines heures</Text>. Si elle est acceptée, tu recevras un email avec tes identifiants formateur.
        </Text>

        <TouchableOpacity style={ss.btn} onPress={onBack} activeOpacity={0.8}>
          <Text style={ss.btnText}>RETOUR À LA CONNEXION</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 2, borderColor: '#10B981',
    alignItems: 'center', justifyContent: 'center', marginBottom: 28,
  },
  checkmark: { fontSize: 42, color: '#10B981' },
  title: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 30, textAlign: 'center', marginBottom: 14 },
  divider: { width: 60, height: 1.5, backgroundColor: COLORS.gold, marginBottom: 24 },
  body: {
    fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 15,
    textAlign: 'center', lineHeight: 22, marginBottom: 12,
  },
  bold: { color: COLORS.cream, fontFamily: FONTS.uiBold },
  btn: {
    marginTop: 36, backgroundColor: COLORS.accent,
    paddingVertical: 16, paddingHorizontal: 32,
    borderRadius: 6, width: '100%', alignItems: 'center',
  },
  btnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 14, letterSpacing: 1.5 },
});

// ── Formulaire principal ───────────────────────────────────────────────────────
export default function TrainerRegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    phone: '', bio: '', nativeLanguage: '', motivation: '',
  });
  const [selectedLevel, setSelectedLevel] = useState('B1');
  const [selectedLang, setSelectedLang]   = useState('de');
  const [diploma, setDiploma]             = useState(null);
  const [loading, setLoading]             = useState(false);
  const [pwFocused, setPwFocused]         = useState(false);
  const [success, setSuccess]             = useState(null); // candidature number

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const pickDiploma = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!res.canceled && res.assets?.[0]) setDiploma(res.assets[0]);
    } catch {
      showErr('Impossible d\'ouvrir le fichier');
    }
  };

  const pwValid = pwCriteria.every(c => c.test(form.password));
  const pwMatch = form.password === form.confirmPassword && form.confirmPassword.length > 0;

  const validate = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return 'Prénom et nom requis';
    if (!form.email.trim() || !form.email.includes('@'))  return 'Email invalide';
    if (!pwValid)  return 'Le mot de passe ne respecte pas les critères';
    if (!pwMatch)  return 'Les mots de passe ne correspondent pas';
    if (!diploma)  return 'Veuillez joindre votre diplôme (PDF)';
    return null;
  };

  const showErr = msg => {
    // inline — pas d'Alert
    setErrMsg(msg);
    setTimeout(() => setErrMsg(''), 4000);
  };
  const [errMsg, setErrMsg] = useState('');

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setErrMsg(err); return; }
    setErrMsg('');
    setLoading(true);
    try {
      const localUri = FileSystem.cacheDirectory + 'diploma_upload.pdf';
      await FileSystem.copyAsync({ from: diploma.uri, to: localUri });
      const diplomaBase64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(`${API_BASE_URL}/auth/trainer-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          firstName: form.firstName.trim(), lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(), password: form.password,
          phone: form.phone.trim(), bio: form.bio.trim(),
          nativeLanguage: form.nativeLanguage.trim(), motivation: form.motivation.trim(),
          teachingLevelCode: selectedLevel, teachingLanguageCode: selectedLang,
          diplomaBase64, diplomaFileName: diploma.name || 'diploma.pdf',
        }),
      });
      clearTimeout(timeoutId);

      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setErrMsg(json.error || `Erreur HTTP ${res.status}`); return; }

      setSuccess(json.profileId || json.id || 'OK');
    } catch (e) {
      setErrMsg(e.name === 'AbortError' ? 'Délai dépassé — vérifie ta connexion' : (e.message || 'Impossible de joindre le serveur'));
    } finally {
      setLoading(false);
    }
  };

  if (success !== null) {
    return <SuccessScreen candidatureNumber={success} onBack={() => navigation.navigate('Login')} />;
  }

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backRow}>
            <Text style={s.backArrow}>‹</Text>
            <Text style={s.backText}>Retour</Text>
          </TouchableOpacity>

          <Text style={s.overline}>CANDIDATURE FORMATEUR</Text>
          <Text style={s.title}>Rejoignez{'\n'}SprachReise.</Text>
          <View style={s.titleDivider} />
          <Text style={s.subtitle}>
            Remplissez ce formulaire. Votre dossier sera examiné par l'administrateur avant activation de votre compte.
          </Text>

          {/* Erreur inline */}
          {errMsg ? (
            <View style={s.errBanner}>
              <Text style={s.errText}>⚠ {errMsg}</Text>
            </View>
          ) : null}

          {/* ── IDENTITÉ ── */}
          <Section>IDENTITÉ</Section>
          <Row>
            <Field label="Prénom *" value={form.firstName} onChange={v => set('firstName', v)} style={{ flex: 1 }} />
            <View style={{ width: 12 }} />
            <Field label="Nom *" value={form.lastName} onChange={v => set('lastName', v)} style={{ flex: 1 }} />
          </Row>
          <Field label="Email *" value={form.email} onChange={v => set('email', v)} keyboard="email-address" lower />
          <Field label="Téléphone" value={form.phone} onChange={v => set('phone', v)} keyboard="phone-pad" placeholder="+237 6XX XXX XXX" />
          <Field label="Langue maternelle" value={form.nativeLanguage} onChange={v => set('nativeLanguage', v)} placeholder="ex : Français" />

          {/* ── MOT DE PASSE ── */}
          <Section>MOT DE PASSE</Section>
          <Field
            label="Mot de passe *" value={form.password} onChange={v => set('password', v)}
            secure onFocus={() => setPwFocused(true)} onBlur={() => setPwFocused(false)}
          />
          {(pwFocused || form.password.length > 0) && (
            <View style={s.pwBox}>
              {pwCriteria.map((c, i) => {
                const ok = c.test(form.password);
                return (
                  <View key={i} style={s.pwRow}>
                    <Text style={[s.pwIcon, { color: ok ? '#10B981' : COLORS.muted }]}>{ok ? '✓' : '○'}</Text>
                    <Text style={[s.pwLabel, { color: ok ? '#10B981' : COLORS.muted }]}>{c.label}</Text>
                  </View>
                );
              })}
            </View>
          )}
          <Field
            label="Confirmer le mot de passe *" value={form.confirmPassword}
            onChange={v => set('confirmPassword', v)} secure
          />
          {form.confirmPassword.length > 0 && (
            <Text style={[s.matchHint, { color: pwMatch ? '#10B981' : '#EF4444' }]}>
              {pwMatch ? '✓ Mots de passe identiques' : '✗ Les mots de passe ne correspondent pas'}
            </Text>
          )}

          {/* ── PROFIL ── */}
          <Section>PROFIL D'ENSEIGNEMENT</Section>

          <Text style={s.label}>Langue à enseigner *</Text>
          <View style={s.chipRow}>
            {LANGUAGES.map(l => (
              <TouchableOpacity key={l.code} style={[s.chip, selectedLang === l.code && s.chipActive]} onPress={() => setSelectedLang(l.code)}>
                <Text style={[s.chipText, selectedLang === l.code && s.chipTextActive]}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Niveau enseigné *</Text>
          <View style={s.chipRow}>
            {LEVELS.map(lv => (
              <TouchableOpacity key={lv} style={[s.chip, s.chipLevel, selectedLevel === lv && s.chipActive]} onPress={() => setSelectedLevel(lv)}>
                <Text style={[s.chipText, s.chipLevelText, selectedLevel === lv && s.chipTextActive]}>{lv}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Field label="Biographie publique" value={form.bio} onChange={v => set('bio', v)} multiline placeholder="Décrivez votre expérience et vos qualifications..." />
          <Field label="Lettre de motivation *" value={form.motivation} onChange={v => set('motivation', v)} multiline placeholder="Pourquoi voulez-vous enseigner sur SprachReise ?" />

          {/* ── DIPLÔME ── */}
          <Section>DIPLÔME DE LANGUE</Section>
          <Text style={s.hint}>
            Goethe-Zertifikat · telc Deutsch · TestDaF · DSH · Licence/Master langues{'\n'}
            Fichier PDF · max 5 Mo
          </Text>

          <TouchableOpacity style={[s.uploadBtn, diploma && s.uploadDone]} onPress={pickDiploma} activeOpacity={0.8}>
            <Text style={s.uploadIcon}>{diploma ? '📎' : '⬆️'}</Text>
            <Text style={[s.uploadText, diploma && { color: '#10B981' }]}>
              {diploma ? diploma.name : 'Choisir le fichier PDF'}
            </Text>
          </TouchableOpacity>

          {/* Bouton */}
          <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.65 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color={COLORS.parchment} />
              : <Text style={s.submitText}>ENVOYER MA CANDIDATURE</Text>
            }
          </TouchableOpacity>

          <Text style={s.footNote}>
            Après vérification de votre dossier, vous recevrez un email de bienvenue avec vos identifiants de connexion.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Sous-composants ─────────────────────────────────────────────────────────
const Section = ({ children }) => (
  <View style={s.sectionRow}>
    <View style={s.sectionLine} />
    <Text style={s.sectionText}>{children}</Text>
    <View style={s.sectionLine} />
  </View>
);

const Row = ({ children }) => <View style={{ flexDirection: 'row' }}>{children}</View>;

const Field = ({ label, value, onChange, secure, keyboard, lower, multiline, placeholder, style, onFocus, onBlur }) => (
  <View style={[{ marginBottom: 16 }, style]}>
    <Text style={s.label}>{label}</Text>
    <TextInput
      style={[s.input, multiline && { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder || ''}
      placeholderTextColor={COLORS.muted}
      secureTextEntry={!!secure}
      keyboardType={keyboard || 'default'}
      autoCapitalize={lower ? 'none' : 'sentences'}
      multiline={!!multiline}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  </View>
);

// ── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.paper || '#F5EFE3' },
  scroll: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 50 },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 28 },
  backArrow: { fontFamily: FONTS.regular, color: COLORS.accent, fontSize: 26, lineHeight: 28 },
  backText: { fontFamily: FONTS.uiMedium, color: COLORS.accent, fontSize: 14 },

  overline: { fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 10, letterSpacing: 3, marginBottom: 8 },
  title: { fontFamily: FONTS.display, color: COLORS.deep || COLORS.ink, fontSize: 34, lineHeight: 40, marginBottom: 12 },
  titleDivider: { width: 50, height: 1.5, backgroundColor: COLORS.gold || COLORS.primary, marginBottom: 14 },
  subtitle: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, lineHeight: 21, marginBottom: 28 },

  errBanner: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: '#EF4444',
    borderRadius: 6, padding: 12, marginBottom: 16,
  },
  errText: { fontFamily: FONTS.uiMedium, color: '#EF4444', fontSize: 13 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 22 },
  sectionLine: { flex: 1, height: 1, backgroundColor: COLORS.muted, opacity: 0.3 },
  sectionText: { fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 10, letterSpacing: 2 },

  label: { fontFamily: FONTS.uiMedium, color: COLORS.deep || COLORS.ink, fontSize: 12, letterSpacing: 0.5, marginBottom: 7 },
  hint: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12, lineHeight: 18, fontStyle: 'italic', marginBottom: 14 },

  input: {
    backgroundColor: 'white',
    borderWidth: 1.5, borderColor: 'rgba(126,102,58,0.25)',
    borderRadius: 6, paddingHorizontal: 14, paddingVertical: 12,
    color: COLORS.deep || COLORS.ink, fontSize: 15, fontFamily: FONTS.regular,
  },

  pwBox: {
    backgroundColor: 'rgba(126,102,58,0.06)', borderRadius: 6,
    padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(126,102,58,0.15)',
  },
  pwRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  pwIcon: { fontSize: 13, width: 20 },
  pwLabel: { fontFamily: FONTS.regular, fontSize: 13 },
  matchHint: { fontFamily: FONTS.regular, fontSize: 12, marginTop: -10, marginBottom: 16 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    borderWidth: 1.5, borderColor: 'rgba(126,102,58,0.35)',
    borderRadius: 6, paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: 'white',
  },
  chipLevel: { paddingHorizontal: 18 },
  chipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  chipText: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 13 },
  chipLevelText: { fontFamily: FONTS.uiBold, fontSize: 14 },
  chipTextActive: { color: 'white' },

  uploadBtn: {
    borderWidth: 1.5, borderColor: 'rgba(126,102,58,0.35)', borderStyle: 'dashed',
    borderRadius: 6, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 28, backgroundColor: 'white',
  },
  uploadDone: { borderColor: '#10B981', borderStyle: 'solid' },
  uploadIcon: { fontSize: 20 },
  uploadText: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 14, flex: 1 },

  submitBtn: {
    backgroundColor: COLORS.accent, padding: 17, borderRadius: 6,
    alignItems: 'center', shadowColor: COLORS.accent, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  submitText: { fontFamily: FONTS.uiBold, color: 'white', fontSize: 14, letterSpacing: 1.5 },

  footNote: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12, textAlign: 'center', marginTop: 20, lineHeight: 18, fontStyle: 'italic' },
});
