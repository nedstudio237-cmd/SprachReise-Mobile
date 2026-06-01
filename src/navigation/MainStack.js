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
import CreateCourseScreen from '../screens/trainer/CreateCourseScreen';
import CreateSessionScreen from '../screens/trainer/CreateSessionScreen';
import CreateQcmScreen from '../screens/trainer/CreateQcmScreen';
import TrainerExamsScreen from '../screens/trainer/TrainerExamsScreen';
import ConversationScreen from '../screens/messages/ConversationScreen';

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
      <Stack.Screen name="Progress"       component={ProgressScreen} />
      <Stack.Screen name="CreateCourse"   component={CreateCourseScreen} />
      <Stack.Screen name="CreateSession"  component={CreateSessionScreen} />
      <Stack.Screen name="CreateQcm"      component={CreateQcmScreen} />
      <Stack.Screen name="TrainerExams"   component={TrainerExamsScreen} />
      <Stack.Screen name="Conversation"   component={ConversationScreen} />
    </Stack.Navigator>
  );
}
