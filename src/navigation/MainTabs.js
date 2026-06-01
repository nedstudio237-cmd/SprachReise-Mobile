import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import HomeScreen from '../screens/home/HomeScreen';
import CoursesScreen from '../screens/courses/CoursesScreen';
import LiveSessionsScreen from '../screens/live/LiveSessionsScreen';
import CursusScreen from '../screens/cursus/CursusScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import TrainerDashboardScreen from '../screens/trainer/TrainerDashboardScreen';
import TrainerCoursesScreen from '../screens/trainer/TrainerCoursesScreen';
import TrainerSessionsScreen from '../screens/trainer/TrainerSessionsScreen';
import TrainerQcmsScreen from '../screens/trainer/TrainerQcmsScreen';
import MessagesScreen from '../screens/messages/MessagesScreen';
import { COLORS, FONTS } from '../constants/config';
import { useAuthStore } from '../store/authStore';

const Tab = createBottomTabNavigator();
const TabIcon = (emoji) => ({ focused }) => (
  <Text style={{ fontSize: 19, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
);

const tabBarOptions = {
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
};

function LearnerTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen name="Accueil" component={HomeScreen}         options={{ tabBarIcon: TabIcon('🏠') }} />
      <Tab.Screen name="Cours"   component={CoursesScreen}      options={{ tabBarIcon: TabIcon('📚') }} />
      <Tab.Screen name="Live"    component={LiveSessionsScreen}  options={{ tabBarIcon: TabIcon('📡') }} />
      <Tab.Screen name="Cursus"  component={CursusScreen}       options={{ tabBarIcon: TabIcon('✏️') }} />
      <Tab.Screen name="Profil"  component={ProfileScreen}      options={{ tabBarIcon: TabIcon('👤') }} />
    </Tab.Navigator>
  );
}

function TrainerTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen name="Tableau" component={TrainerDashboardScreen} options={{ tabBarIcon: TabIcon('📊') }} />
      <Tab.Screen name="Cours"   component={TrainerCoursesScreen}   options={{ tabBarIcon: TabIcon('📚') }} />
      <Tab.Screen name="Sessions" component={TrainerSessionsScreen} options={{ tabBarIcon: TabIcon('📡') }} />
      <Tab.Screen name="QCM"     component={TrainerQcmsScreen}      options={{ tabBarIcon: TabIcon('✏️') }} />
      <Tab.Screen name="Messages" component={MessagesScreen}        options={{ tabBarIcon: TabIcon('💬') }} />
    </Tab.Navigator>
  );
}

export default function MainTabs() {
  const role = useAuthStore((s) => s.user?.role);
  return role === 'TRAINER' ? <TrainerTabs /> : <LearnerTabs />;
}
