import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AdminPanel" 
        component={AdminPanel}
        options={{ title: 'Attendance Records' }}
      />
    </Stack.Navigator>
  );
}