import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';
import { authAPI } from '../../services/api';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '',
  });
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (form.password !== form.confirm) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (form.password.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone,
      });
      navigation.navigate('Pricing', {
        authData: {
          user: { email: data.email, firstName: data.firstName, lastName: data.lastName, role: data.role },
          accessToken: data.accessToken,
        },
      });
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur lors de l\'inscription';
      Alert.alert('Inscription impossible', msg);
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

          <Field label="Prénom *" value={form.firstName} onChangeText={(v) => update('firstName', v)} placeholder="Jean" />
          <Field label="Nom *" value={form.lastName} onChangeText={(v) => update('lastName', v)} placeholder="Dupont" />
          <Field label="Email *" value={form.email} onChangeText={(v) => update('email', v)} placeholder="jean@exemple.com" keyboardType="email-address" autoCapitalize="none" />
          <Field label="Téléphone" value={form.phone} onChangeText={(v) => update('phone', v)} placeholder="+237 6XX XXX XXX" keyboardType="phone-pad" />
          <Field label="Mot de passe *" value={form.password} onChangeText={(v) => update('password', v)} placeholder="Minimum 8 caractères" secureTextEntry />
          <Field label="Confirmer le mot de passe *" value={form.confirm} onChangeText={(v) => update('confirm', v)} placeholder="••••••••" secureTextEntry />

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.parchment} />
            ) : (
              <Text style={styles.buttonText}>CRÉER MON COMPTE</Text>
            )}
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
  backText: {
    fontFamily: FONTS.regular,
    color: COLORS.gold,
    fontSize: 16,
  },

  heading: {
    fontFamily: FONTS.display,
    color: COLORS.parchment,
    fontSize: 30,
    marginTop: 12,
    marginBottom: 6,
  },
  subheading: {
    fontFamily: FONTS.regular,
    color: COLORS.muted,
    fontSize: 15,
    marginBottom: 8,
  },

  label: {
    fontFamily: FONTS.uiMedium,
    color: COLORS.cream,
    fontSize: 13,
    marginBottom: 7,
    marginTop: 16,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: 'rgba(249,244,232,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(126,102,58,0.4)',
    borderRadius: 6,
    padding: 14,
    color: COLORS.parchment,
    fontSize: 15,
    fontFamily: FONTS.regular,
  },

  button: {
    backgroundColor: COLORS.accent,
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.parchment,
    fontSize: 14,
    letterSpacing: 1.5,
  },

  loginLink: { alignItems: 'center', marginTop: 20 },
  loginText: {
    fontFamily: FONTS.regular,
    color: COLORS.muted,
    fontSize: 14,
  },
  loginTextHighlight: {
    fontFamily: FONTS.medium,
    color: COLORS.gold,
  },
});
