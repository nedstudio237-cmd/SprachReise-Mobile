import { createStackNavigator } from '@react-navigation/stack';
import AdminDashboardScreen    from '../screens/admin/AdminDashboardScreen';
import AdminApplicationsScreen from '../screens/admin/AdminApplicationsScreen';
import AdminApplicationDetail  from '../screens/admin/AdminApplicationDetail';
import AdminUsersScreen        from '../screens/admin/AdminUsersScreen';
import DiplomaViewerScreen     from '../screens/admin/DiplomaViewerScreen';
import AdminUserProfileScreen  from '../screens/admin/AdminUserProfileScreen';
import AdminContentScreen      from '../screens/admin/AdminContentScreen';
import AdminCertificatesScreen from '../screens/admin/AdminCertificatesScreen';

const Stack = createStackNavigator();

export default function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard"         component={AdminDashboardScreen} />
      <Stack.Screen name="AdminApplications"      component={AdminApplicationsScreen} />
      <Stack.Screen name="AdminApplicationDetail" component={AdminApplicationDetail} />
      <Stack.Screen name="AdminUsers"             component={AdminUsersScreen} />
      <Stack.Screen name="DiplomaViewer"          component={DiplomaViewerScreen} />
      <Stack.Screen name="AdminUserProfile"       component={AdminUserProfileScreen} />
      <Stack.Screen name="AdminContent"           component={AdminContentScreen} />
      <Stack.Screen name="AdminCertificates"      component={AdminCertificatesScreen} />
    </Stack.Navigator>
  );
}
