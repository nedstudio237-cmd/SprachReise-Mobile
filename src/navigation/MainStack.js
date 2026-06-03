import { createStackNavigator } from '@react-navigation/stack';
import MainTabs from './MainTabs';
import CourseDetailScreen from '../screens/courses/CourseDetailScreen';
import CoursePlayerScreen from '../screens/courses/CoursePlayerScreen';
import QcmScreen from '../screens/qcm/QcmScreen';
import WordMatchScreen from '../screens/cursus/WordMatchScreen';
import FillBlankScreen from '../screens/cursus/FillBlankScreen';
import ListenChooseScreen from '../screens/cursus/ListenChooseScreen';
import DicteeScreen from '../screens/cursus/DicteeScreen';
import PronounceScreen from '../screens/cursus/PronounceScreen';
import WordOrderScreen from '../screens/cursus/WordOrderScreen';
import AiTutorScreen from '../screens/ai/AiTutorScreen';
import ChatHistoryScreen from '../screens/ai/ChatHistoryScreen';
import ProgressScreen from '../screens/home/ProgressScreen';
import ConversationScreen from '../screens/messages/ConversationScreen';
import LiveSessionScreen from '../screens/live/LiveSessionScreen';
import LiveStatsScreen from '../screens/live/LiveStatsScreen';
import LiveDetailScreen from '../screens/live/LiveDetailScreen';
import TrainerPublicProfileScreen from '../screens/learner/TrainerPublicProfileScreen';
import NotificationsScreen from '../screens/home/NotificationsScreen';
import PaymentScreen       from '../screens/auth/PaymentScreen';
import SubscriptionScreen  from '../screens/profile/SubscriptionScreen';
import HelpScreen          from '../screens/profile/HelpScreen';
import AboutScreen         from '../screens/profile/AboutScreen';

const Stack = createStackNavigator();

export default function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs"         component={MainTabs} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="CoursePlayer" component={CoursePlayerScreen} />
      <Stack.Screen name="Qcm"          component={QcmScreen} />
      <Stack.Screen name="WordMatch"    component={WordMatchScreen} />
      <Stack.Screen name="FillBlank"    component={FillBlankScreen} />
      <Stack.Screen name="ListenChoose" component={ListenChooseScreen} />
      <Stack.Screen name="Dictee"       component={DicteeScreen} />
      <Stack.Screen name="Pronounce"    component={PronounceScreen} />
      <Stack.Screen name="WordOrder"    component={WordOrderScreen} />
      <Stack.Screen name="AiTutor"      component={AiTutorScreen} />
      <Stack.Screen name="ChatHistory"  component={ChatHistoryScreen} />
      <Stack.Screen name="Progress"     component={ProgressScreen} />
      <Stack.Screen name="Conversation" component={ConversationScreen} />
      <Stack.Screen name="LiveSession"  component={LiveSessionScreen} />
      <Stack.Screen name="LiveStats"           component={LiveStatsScreen} />
      <Stack.Screen name="LiveDetail"          component={LiveDetailScreen} />
      <Stack.Screen name="TrainerPublicProfile" component={TrainerPublicProfileScreen} />
      <Stack.Screen name="Notifications"   component={NotificationsScreen} />
      <Stack.Screen name="Payment"        component={PaymentScreen} />
      <Stack.Screen name="Subscription"   component={SubscriptionScreen} />
      <Stack.Screen name="Help"           component={HelpScreen} />
      <Stack.Screen name="About"          component={AboutScreen} />
    </Stack.Navigator>
  );
}
