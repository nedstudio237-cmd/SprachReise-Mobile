import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    emoji: '🇩🇪',
    title: 'Bienvenue sur\nSprachReise',
    subtitle: 'Commencez votre voyage vers la maîtrise de l\'allemand, depuis l\'Afrique.',
    eyebrow: 'DÉCOUVREZ',
  },
  {
    id: '2',
    emoji: '🎓',
    title: 'Des formateurs\ncertifiés',
    subtitle: 'Apprenez avec des experts qualifiés, en sessions live ou à votre rythme.',
    eyebrow: 'APPRENEZ',
  },
  {
    id: '3',
    emoji: '📜',
    title: 'Certifiez-vous\net progressez',
    subtitle: 'Obtenez un certificat reconnu à chaque niveau complété (A1 → C2).',
    eyebrow: 'PROGRESSEZ',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.replace('Register');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={() => navigation.replace('Login')}>
        <Text style={styles.skipText}>Passer</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.eyebrow}>{item.eyebrow}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={goNext}>
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? 'COMMENCER' : 'SUIVANT'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>J'ai déjà un compte</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },

  skip: { alignSelf: 'flex-end', padding: 20 },
  skipText: {
    fontFamily: FONTS.uiMedium,
    color: COLORS.muted,
    fontSize: 14,
  },

  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 20,
  },
  emoji: { fontSize: 88, marginBottom: 24 },
  eyebrow: {
    fontFamily: FONTS.uiBold,
    color: COLORS.gold,
    fontSize: 11,
    letterSpacing: 2.5,
    marginBottom: 12,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 34,
    color: COLORS.parchment,
    textAlign: 'center',
    lineHeight: 43,
    marginBottom: 18,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 25,
  },

  footer: {
    paddingHorizontal: 32,
    paddingBottom: 36,
    alignItems: 'center',
  },
  dots: { flexDirection: 'row', marginBottom: 28, gap: 6 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(174,145,130,0.4)',
  },
  dotActive: {
    backgroundColor: COLORS.gold,
    width: 22,
    borderRadius: 3.5,
  },

  button: {
    backgroundColor: COLORS.accent,
    width: '100%',
    padding: 17,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.parchment,
    fontSize: 14,
    letterSpacing: 1.5,
  },

  loginLink: { paddingVertical: 6 },
  loginLinkText: {
    fontFamily: FONTS.regular,
    color: COLORS.gold,
    fontSize: 14,
  },
});
