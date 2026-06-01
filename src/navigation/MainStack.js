import { createStackNavigator } from '@react-navigation/stack';
import MainTabs from './MainTabs';
import CourseDetailScreen from '../screens/courses/CourseDetailScreen';
import CoursePlayerScreen from '../screens/courses/CoursePlayerScreen';
import QcmScreen from '../screens/qcm/QcmScreen';
import WordMatchScreen from '../screens/cursus/WordMatchScreen';
import FillBlankScreen from '../screens/cursus/FillBlankScreen';

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
    </Stack.Navigator>
  );
}
