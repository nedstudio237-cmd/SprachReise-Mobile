import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/config';
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
        { email: data.email, firstName: data.firstName, lastName: data.lastName, role: data.role },
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
            <View style={styles.titleRow}>
              <Text style={styles.title}>Sprach</Text>
              <Text style={[styles.title, { color: COLORS.accent }]}>Reise</Text>
            </View>
            <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
          </View>

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
                Pas encore de compte ?{' '}
                <Text style={{ color: COLORS.gold }}>S'inscrire</Text>
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
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 40 },
  header: { alignItems: 'center', marginBottom: 48 },
  titleRow: { flexDirection: 'row' },
  title: { fontSize: 36, color: COLORS.parchment, fontWeight: 'bold' },
  subtitle: { color: COLORS.muted, fontSize: 14, marginTop: 6 },
  form: { flex: 1 },
  label: { color: COLORS.cream, fontSize: 13, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: 'rgba(249,244,232,0.08)',
    borderWidth: 1,
    borderColor: '#7E663A55',
    borderRadius: 4,
    padding: 14,
    color: COLORS.parchment,
    fontSize: 15,
  },
  button: {
    backgroundColor: COLORS.accent,
    padding: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonText: {
    color: COLORS.parchment,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1.5,
  },
  registerLink: { alignItems: 'center', marginTop: 20 },
  registerText: { color: COLORS.muted, fontSize: 14 },
});
