import { createStackNavigator } from '@react-navigation/stack';
import LanguageSelectScreen from '../screens/auth/LanguageSelectScreen';
import LevelSelectScreen from '../screens/auth/LevelSelectScreen';
import SubLevelScreen from '../screens/auth/SubLevelScreen';
import PricingScreen from '../screens/auth/PricingScreen';

const Stack = createStackNavigator();

// Stack affiché quand l'utilisateur est connecté mais n'a pas encore choisi son niveau
export default function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} />
      <Stack.Screen name="LevelSelect"    component={LevelSelectScreen} />
      <Stack.Screen name="SubLevel"       component={SubLevelScreen} />
      <Stack.Screen name="Pricing"        component={PricingScreen} />
    </Stack.Navigator>
  );
}
