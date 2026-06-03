import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';

export default function DiplomaViewerScreen({ route, navigation }) {
  const { profileId, candidateName } = route.params;
  const { accessToken } = useAuthStore();
  const [loading, setLoading]   = useState(true);
  const [hasError, setHasError] = useState(false);

  const uri = `${API_BASE_URL}/admin/applications/${profileId}/diploma`;

  return (
    <SafeAreaView style={s.container}>
      {/* Barre du haut */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <View style={s.titleBox}>
          <Text style={s.title} numberOfLines={1}>Diplôme</Text>
          {candidateName ? <Text style={s.subtitle} numberOfLines={1}>{candidateName}</Text> : null}
        </View>
        <View style={{ width: 70 }} />
      </View>

      {/* Viewer */}
      <View style={s.viewer}>
        {loading && !hasError && (
          <View style={s.loadingOverlay}>
            <ActivityIndicator color={COLORS.gold} size="large" />
            <Text style={s.loadingText}>Chargement du diplôme…</Text>
          </View>
        )}

        {hasError ? (
          <View style={s.errorBox}>
            <Text style={s.errorIcon}>📄</Text>
            <Text style={s.errorTitle}>Impossible d'afficher le PDF</Text>
            <Text style={s.errorText}>Le fichier est peut-être absent ou le serveur est inaccessible.</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => setHasError(false)}>
              <Text style={s.retryText}>RÉESSAYER</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            source={{
              uri,
              headers: { Authorization: `Bearer ${accessToken}` },
            }}
            style={{ flex: 1 }}
            onLoadStart={() => { setLoading(true); setHasError(false); }}
            onLoadEnd={() => setLoading(false)}
            onError={() => { setLoading(false); setHasError(true); }}
            onHttpError={({ nativeEvent }) => {
              if (nativeEvent.statusCode >= 400) {
                setLoading(false);
                setHasError(true);
              }
            }}
            scalesPageToFit
            allowsInlineMediaPlayback
            originWhitelist={['*']}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: 'rgba(184,137,58,0.2)',
  },
  back: { width: 70, padding: 4 },
  backText: { fontFamily: FONTS.uiMedium, color: COLORS.accent, fontSize: 15 },
  titleBox: { flex: 1, alignItems: 'center' },
  title: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 17 },
  subtitle: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12, marginTop: 1 },

  viewer: { flex: 1, position: 'relative', backgroundColor: '#fff' },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.deep,
    alignItems: 'center', justifyContent: 'center', gap: 14, zIndex: 10,
  },
  loadingText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14 },

  errorBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 12, backgroundColor: COLORS.deep,
  },
  errorIcon:  { fontSize: 48 },
  errorTitle: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 20, textAlign: 'center' },
  errorText:  { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryBtn:   { marginTop: 12, borderWidth: 1.5, borderColor: COLORS.accent, borderRadius: 6, paddingHorizontal: 24, paddingVertical: 12 },
  retryText:  { fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 13, letterSpacing: 1.5 },
});
