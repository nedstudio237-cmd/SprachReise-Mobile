import { createStackNavigator } from '@react-navigation/stack';
import TrainerDashboardScreen    from '../screens/trainer/TrainerDashboardScreen';
import TrainerCoursesScreen      from '../screens/trainer/TrainerCoursesScreen';
import TrainerCreateCourseScreen from '../screens/trainer/TrainerCreateCourseScreen';
import TrainerSessionsScreen     from '../screens/trainer/TrainerSessionsScreen';
import TrainerExamsScreen        from '../screens/trainer/TrainerExamsScreen';
import TrainerLearnersScreen     from '../screens/trainer/TrainerLearnersScreen';
import TrainerPendingScreen      from '../screens/trainer/TrainerPendingScreen';
import TrainerQcmScreen          from '../screens/trainer/TrainerQcmScreen';
import TrainerMessagesScreen     from '../screens/trainer/TrainerMessagesScreen';
import ConversationScreen        from '../screens/messages/ConversationScreen';
import LiveSessionScreen         from '../screens/live/LiveSessionScreen';
import LiveStatsScreen           from '../screens/live/LiveStatsScreen';
import { useAuthStore } from '../store/authStore';

const Stack = createStackNavigator();

export default function TrainerStack() {
  const trainerStatus = useAuthStore(s => s.trainerStatus);

  if (trainerStatus !== 'APPROVED') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TrainerPending" component={TrainerPendingScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainerDashboard"    component={TrainerDashboardScreen} />
      <Stack.Screen name="TrainerCourses"      component={TrainerCoursesScreen} />
      <Stack.Screen name="TrainerCreateCourse" component={TrainerCreateCourseScreen} />
      <Stack.Screen name="TrainerSessions"     component={TrainerSessionsScreen} />
      <Stack.Screen name="TrainerExams"        component={TrainerExamsScreen} />
      <Stack.Screen name="TrainerLearners"     component={TrainerLearnersScreen} />
      <Stack.Screen name="TrainerQcms"         component={TrainerQcmScreen} />
      <Stack.Screen name="TrainerMessages"     component={TrainerMessagesScreen} />
      <Stack.Screen name="Conversation"        component={ConversationScreen} />
      <Stack.Screen name="LiveSession"         component={LiveSessionScreen} />
      <Stack.Screen name="LiveStats"           component={LiveStatsScreen} />
    </Stack.Navigator>
  );
}
