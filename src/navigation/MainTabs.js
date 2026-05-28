import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import HomeScreen from '../screens/home/HomeScreen';
import CoursesScreen from '../screens/courses/CoursesScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { COLORS } from '../constants/config';

const Tab = createBottomTabNavigator();

const icon = (emoji) => ({ focused }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
);

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1F0E08',
          borderTopColor: 'rgba(126,102,58,0.3)',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="Accueil"
        component={HomeScreen}
        options={{ tabBarIcon: icon('🏠') }}
      />
      <Tab.Screen
        name="Cours"
        component={CoursesScreen}
        options={{ tabBarIcon: icon('📚') }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{ tabBarIcon: icon('👤') }}
      />
    </Tab.Navigator>
  );
}
