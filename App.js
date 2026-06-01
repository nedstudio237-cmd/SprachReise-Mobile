import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_600SemiBold,
  Fraunces_600SemiBold_Italic,
} from '@expo-google-fonts/fraunces';
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
} from '@expo-google-fonts/newsreader';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import AuthStack from './src/navigation/AuthStack';
import MainStack from './src/navigation/MainStack';
import OnboardingStack from './src/navigation/OnboardingStack';
import { useAuthStore } from './src/store/authStore';
import { COLORS } from './src/constants/config';

export default function App() {
  const { isLoading, accessToken, level, initialize } = useAuthStore();

  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_600SemiBold,
    Fraunces_600SemiBold_Italic,
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.deep, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          {!accessToken
            ? <AuthStack />
            : !level
              ? <OnboardingStack />   // connecté mais pas encore de niveau → sélection
              : <MainStack />
          }
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
