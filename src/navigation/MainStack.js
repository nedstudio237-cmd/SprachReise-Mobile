import { createStackNavigator } from '@react-navigation/stack';
import MainTabs from './MainTabs';
import CourseDetailScreen from '../screens/courses/CourseDetailScreen';
import CoursePlayerScreen from '../screens/courses/CoursePlayerScreen';
import QcmScreen from '../screens/qcm/QcmScreen';

const Stack = createStackNavigator();

export default function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="CoursePlayer" component={CoursePlayerScreen} />
      <Stack.Screen name="Qcm" component={QcmScreen} />
    </Stack.Navigator>
  );
}
