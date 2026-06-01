import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.login(email.trim().toLowerCase(), password);
      await setAuth(
        {
          id: data.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          photoUrl: data.photoUrl ?? null,
        },
        data.accessToken
      );
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur de connexion';
      Alert.alert('Connexion impossible', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <Text style={styles.logo}>SprachReise</Text>
            <Text style={styles.logoSub}>Voyage en langue allemande</Text>
          </View>

          <Text style={styles.heading}>Bienvenue</Text>
          <Text style={styles.subheading}>Connectez-vous à votre compte</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Adresse email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="vous@exemple.com"
              placeholderTextColor={COLORS.muted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={COLORS.muted}
              secureTextEntry
            />

            <TouchableOpacity style={styles.forgotLink}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.6 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.parchment} />
              ) : (
                <Text style={styles.buttonText}>SE CONNECTER</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerLink}>
              <Text style={styles.registerText}>
                Pas encore de compte ?{'  '}
                <Text style={styles.registerTextHighlight}>S'inscrire</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 32, paddingBottom: 40 },

  header: { alignItems: 'center', marginBottom: 48 },
  logo: {
    fontFamily: FONTS.displayItalic,
    color: COLORS.parchment,
    fontSize: 32,
    letterSpacing: 0.5,
  },
  logoSub: {
    fontFamily: FONTS.regular,
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },

  heading: {
    fontFamily: FONTS.display,
    color: COLORS.parchment,
    fontSize: 30,
    marginBottom: 6,
  },
  subheading: {
    fontFamily: FONTS.regular,
    color: COLORS.muted,
    fontSize: 15,
    marginBottom: 28,
  },

  form: {},
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
  forgotLink: { alignSelf: 'flex-end', marginTop: 8 },
  forgotText: {
    fontFamily: FONTS.regular,
    color: COLORS.gold,
    fontSize: 13,
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

  registerLink: { alignItems: 'center', marginTop: 20 },
  registerText: {
    fontFamily: FONTS.regular,
    color: COLORS.muted,
    fontSize: 14,
  },
  registerTextHighlight: {
    fontFamily: FONTS.medium,
    color: COLORS.gold,
  },
});
