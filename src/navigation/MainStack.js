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
    </Stack.Navigator>
  );
}
