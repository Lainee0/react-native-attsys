// App.js
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PaperProvider } from 'react-native-paper';
import AdminScreen from './AdminScreen';
import MainScreen from './MainScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <PaperProvider>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#3a86ff',
          tabBarInactiveTintColor: '#6c757d',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 0,
            elevation: 8,
            height: 60,
            paddingBottom: 5,
          },
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Attendance"
          component={MainScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="fingerprint" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Admin"
          component={AdminScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="shield-account" color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
    </PaperProvider>
  );
}