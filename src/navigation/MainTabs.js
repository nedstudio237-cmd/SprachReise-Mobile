import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import HomeScreen from '../screens/home/HomeScreen';
import CoursesScreen from '../screens/courses/CoursesScreen';
import LiveSessionsScreen from '../screens/live/LiveSessionsScreen';
import CursusScreen from '../screens/cursus/CursusScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { COLORS, FONTS } from '../constants/config';

const Tab = createBottomTabNavigator();
const TabIcon = (emoji) => ({ focused }) => (
  <Text style={{ fontSize: 19, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
);

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#160A06',
          borderTopColor: 'rgba(126,102,58,0.25)',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 4,
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: {
          fontFamily: FONTS.uiMedium,
          fontSize: 10,
          letterSpacing: 0.3,
        },
      }}
    >
      <Tab.Screen name="Accueil" component={HomeScreen}        options={{ tabBarIcon: TabIcon('🏠') }} />
      <Tab.Screen name="Cours"   component={CoursesScreen}     options={{ tabBarIcon: TabIcon('📚') }} />
      <Tab.Screen name="Live"    component={LiveSessionsScreen} options={{ tabBarIcon: TabIcon('📡') }} />
      <Tab.Screen name="Cursus"  component={CursusScreen}      options={{ tabBarIcon: TabIcon('✏️') }} />
      <Tab.Screen name="Profil"  component={ProfileScreen}     options={{ tabBarIcon: TabIcon('👤') }} />
    </Tab.Navigator>
  );
}
