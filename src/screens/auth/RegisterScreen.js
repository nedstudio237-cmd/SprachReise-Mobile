import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';
import { authAPI } from '../../services/api';

const PW_RULES = [
  { key: 'length',  label: '8 caractères minimum',           test: (p) => p.length >= 8 },
  { key: 'upper',   label: 'Une lettre majuscule (A-Z)',      test: (p) => /[A-Z]/.test(p) },
  { key: 'digit',   label: 'Un chiffre (0-9)',                test: (p) => /\d/.test(p) },
  { key: 'special', label: 'Un caractère spécial (!@#$...)',  test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(p) },
];

function validatePhone(phone) {
  const clean = phone.replace(/\s/g, '');
  return /^\+\d{7,15}$/.test(clean);
}

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    phone: '+237 ', password: '', confirm: '',
  });
  const [showPw, setShowPw]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [touched, setTouched]   = useState({ password: false, phone: false });

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const touch  = (key) => setTouched((t) => ({ ...t, [key]: true }));

  const pwRules = PW_RULES.map((r) => ({ ...r, passed: r.test(form.password) }));
  const pwValid = pwRules.every((r) => r.passed);
  const phoneValid = !form.phone || form.phone === '+237 ' || validatePhone(form.phone);

  const handleRegister = async () => {
    setTouched({ password: true, phone: true });
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires'); return;
    }
    if (!pwValid) {
      Alert.alert('Mot de passe invalide', 'Respectez toutes les règles de sécurité'); return;
    }
    if (form.password !== form.confirm) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas'); return;
    }
    if (form.phone && form.phone !== '+237 ' && !validatePhone(form.phone)) {
      Alert.alert('Téléphone invalide', 'Format requis : +237 6XX XXX XXX'); return;
    }
    setLoading(true);
    try {
      const phone = form.phone.trim() === '+237' ? '' : form.phone.replace(/\s/g, '');
      const { data } = await authAPI.register({
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        email:     form.email.trim().toLowerCase(),
        password:  form.password,
        phone,
      });
      navigation.navigate('Pricing', {
        authData: {
          user: { email: data.email, firstName: data.firstName, lastName: data.lastName, role: data.role },
          accessToken: data.accessToken,
        },
      });
    } catch (err) {
      Alert.alert('Inscription impossible', err.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>‹ Retour</Text>
          </TouchableOpacity>

          <Text style={styles.heading}>Créer un compte</Text>
          <Text style={styles.subheading}>Rejoignez SprachReise gratuitement</Text>

          <Field label="Prénom *" value={form.firstName}
            onChangeText={(v) => update('firstName', v)} placeholder="Jean" />
          <Field label="Nom *" value={form.lastName}
            onChangeText={(v) => update('lastName', v)} placeholder="Dupont" />
          <Field label="Email *" value={form.email}
            onChangeText={(v) => update('email', v)}
            placeholder="jean@exemple.com" keyboardType="email-address" autoCapitalize="none" />

          {/* Phone */}
          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={[styles.input, touched.phone && !phoneValid && styles.inputError]}
            value={form.phone}
            onChangeText={(v) => {
              if (!v.startsWith('+237')) update('phone', '+237 ' + v.replace(/^\+237\s?/, ''));
              else update('phone', v);
            }}
            onBlur={() => touch('phone')}
            placeholder="+237 6XX XXX XXX"
            placeholderTextColor={COLORS.muted}
            keyboardType="phone-pad"
          />
          {touched.phone && !phoneValid && (
            <Text style={styles.errorText}>Format requis : +237 6XX XXX XXX</Text>
          )}

          {/* Password */}
          <Text style={styles.label}>Mot de passe *</Text>
          <View style={styles.pwRow}>
            <TextInput
              style={[styles.input, styles.inputFlex,
                touched.password && !pwValid && styles.inputError,
                touched.password && pwValid && styles.inputSuccess,
              ]}
              value={form.password}
              onChangeText={(v) => update('password', v)}
              onBlur={() => touch('password')}
              placeholder="Minimum 8 caractères"
              placeholderTextColor={COLORS.muted}
              secureTextEntry={!showPw}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw((v) => !v)}>
              <Text style={styles.eyeIcon}>{showPw ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          {/* Password rules */}
          {(touched.password || form.password.length > 0) && (
            <View style={styles.rulesBox}>
              {pwRules.map((r) => (
                <View key={r.key} style={styles.ruleRow}>
                  <Text style={[styles.ruleDot, r.passed && styles.ruleDotOk]}>
                    {r.passed ? '✓' : '·'}
                  </Text>
                  <Text style={[styles.ruleText, r.passed && styles.ruleTextOk]}>{r.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Confirm */}
          <Text style={styles.label}>Confirmer le mot de passe *</Text>
          <View style={styles.pwRow}>
            <TextInput
              style={[styles.input, styles.inputFlex,
                form.confirm.length > 0 && form.confirm !== form.password && styles.inputError,
                form.confirm.length > 0 && form.confirm === form.password && styles.inputSuccess,
              ]}
              value={form.confirm}
              onChangeText={(v) => update('confirm', v)}
              placeholder="••••••••"
              placeholderTextColor={COLORS.muted}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm((v) => !v)}>
              <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
          {form.confirm.length > 0 && form.confirm !== form.password && (
            <Text style={styles.errorText}>Les mots de passe ne correspondent pas</Text>
          )}

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleRegister} disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.parchment} />
              : <Text style={styles.buttonText}>CRÉER MON COMPTE</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Déjà un compte ?{'  '}
              <Text style={styles.loginTextHighlight}>Se connecter</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, ...props }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={COLORS.muted} {...props} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 40 },
  back: { paddingTop: 16, paddingBottom: 4 },
  backText: { fontFamily: FONTS.regular, color: COLORS.gold, fontSize: 16 },
  heading: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 30, marginTop: 12, marginBottom: 6 },
  subheading: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 15, marginBottom: 8 },
  label: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 13, marginBottom: 7, marginTop: 16, letterSpacing: 0.3 },
  input: {
    backgroundColor: 'rgba(249,244,232,0.07)', borderWidth: 1,
    borderColor: 'rgba(126,102,58,0.4)', borderRadius: 6,
    padding: 14, color: COLORS.parchment, fontSize: 15, fontFamily: FONTS.regular,
  },
  inputFlex: { flex: 1 },
  inputError: { borderColor: '#EF4444' },
  inputSuccess: { borderColor: '#10B981' },
  errorText: { fontFamily: FONTS.ui, color: '#EF4444', fontSize: 11, marginTop: 4 },
  pwRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 10 },
  eyeIcon: { fontSize: 18 },
  rulesBox: {
    backgroundColor: 'rgba(245,239,227,0.05)', borderRadius: 8,
    padding: 12, marginTop: 8, gap: 4,
  },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleDot: { fontFamily: FONTS.uiBold, color: COLORS.muted, fontSize: 16, width: 16 },
  ruleDotOk: { color: '#10B981' },
  ruleText: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 12 },
  ruleTextOk: { color: '#10B981' },
  button: { backgroundColor: COLORS.accent, padding: 16, borderRadius: 6, alignItems: 'center', marginTop: 28 },
  buttonText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 14, letterSpacing: 1.5 },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14 },
  loginTextHighlight: { fontFamily: FONTS.medium, color: COLORS.gold },
});
