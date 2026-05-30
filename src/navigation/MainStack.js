import { createStackNavigator } from '@react-navigation/stack';
import MainTabs from './MainTabs';
import CourseDetailScreen from '../screens/courses/CourseDetailScreen';
import QcmScreen from '../screens/qcm/QcmScreen';

const Stack = createStackNavigator();

export default function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="Qcm" component={QcmScreen} />
    </Stack.Navigator>
  );
}
