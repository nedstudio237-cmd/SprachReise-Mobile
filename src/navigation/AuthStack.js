import { createStackNavigator } from '@react-navigation/stack';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import PricingScreen from '../screens/auth/PricingScreen';
import LanguageSelectScreen from '../screens/auth/LanguageSelectScreen';
import LevelSelectScreen from '../screens/auth/LevelSelectScreen';
import SubLevelScreen from '../screens/auth/SubLevelScreen';

const Stack = createStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Pricing" component={PricingScreen} />
      <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} />
      <Stack.Screen name="LevelSelect" component={LevelSelectScreen} />
      <Stack.Screen name="SubLevel" component={SubLevelScreen} />
    </Stack.Navigator>
  );
}
