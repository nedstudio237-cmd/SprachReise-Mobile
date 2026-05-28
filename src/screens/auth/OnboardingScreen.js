import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/config';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    emoji: '🇩🇪',
    title: 'Bienvenue sur\nSprachReise',
    subtitle: 'Commencez votre voyage vers la maîtrise de l\'allemand, depuis l\'Afrique.',
  },
  {
    id: '2',
    emoji: '🎓',
    title: 'Des formateurs\ncertifiés',
    subtitle: 'Apprenez avec des experts locaux qualifiés, en live ou à votre rythme.',
  },
  {
    id: '3',
    emoji: '📜',
    title: 'Certifiez-vous\net progressez',
    subtitle: 'Obtenez un certificat reconnu à chaque niveau complété.',
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
      navigation.replace('Login');
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
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={goNext}>
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? 'COMMENCER' : 'SUIVANT'}
          </Text>
        </TouchableOpacity>

        {currentIndex === slides.length - 1 && (
          <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>J'ai déjà un compte</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deep,
  },
  skip: {
    alignSelf: 'flex-end',
    padding: 20,
  },
  skipText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.parchment,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 32,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.muted,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: COLORS.gold,
    width: 24,
  },
  button: {
    backgroundColor: COLORS.accent,
    width: '100%',
    padding: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.parchment,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1.5,
  },
  loginLink: {
    marginTop: 16,
  },
  loginLinkText: {
    color: COLORS.gold,
    fontSize: 14,
  },
});
