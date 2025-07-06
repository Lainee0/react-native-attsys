import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Appbar, Button, Card, Provider as PaperProvider, Text, TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

const App = () => {
  const [employees, setEmployees] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState('');
  const [eventName, setEventName] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load employees from storage
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const savedEmployees = await AsyncStorage.getItem('employees');
      if (savedEmployees) {
        setEmployees(JSON.parse(savedEmployees));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load attendance records');
    }
  };

  const saveEmployees = async (empList) => {
    try {
      await AsyncStorage.setItem('employees', JSON.stringify(empList));
    } catch (error) {
      Alert.alert('Error', 'Failed to save attendance records');
    }
  };

  const handleFingerprintAuth = async () => {
    try {
      const { success } = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity',
      });

      if (success) {
        setIsAuthenticated(true);
        Alert.alert('Success', 'Authentication successful');
      } else {
        Alert.alert('Error', 'Authentication failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Fingerprint scanner not available');
    }
  };

  const handleCheckIn = async () => {
    if (!eventName || !currentEmployee) {
      Alert.alert('Error', 'Please enter event name and employee ID');
      return;
    }

    if (!isAuthenticated) {
      Alert.alert('Error', 'Please authenticate first');
      return;
    }

    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    const attendanceRecord = {
      employeeId: currentEmployee,
      eventName,
      checkInTime: now,
      checkOutTime: null,
    };

    const updatedEmployees = [...employees, attendanceRecord];
    setEmployees(updatedEmployees);
    await saveEmployees(updatedEmployees);

    Alert.alert('Success', `${currentEmployee} checked in to ${eventName}`);
    setCurrentEmployee('');
    setIsAuthenticated(false);
  };

  const handleCheckOut = async () => {
    if (!eventName || !currentEmployee) {
      Alert.alert('Error', 'Please enter event name and employee ID');
      return;
    }

    if (!isAuthenticated) {
      Alert.alert('Error', 'Please authenticate first');
      return;
    }

    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    const employeeIndex = employees.findIndex(
      emp => emp.employeeId === currentEmployee && emp.eventName === eventName && !emp.checkOutTime
    );

    if (employeeIndex === -1) {
      Alert.alert('Error', 'No matching check-in record found');
      return;
    }

    const updatedEmployees = [...employees];
    updatedEmployees[employeeIndex].checkOutTime = now;
    
    setEmployees(updatedEmployees);
    await saveEmployees(updatedEmployees);

    Alert.alert('Success', `${currentEmployee} checked out from ${eventName}`);
    setCurrentEmployee('');
    setIsAuthenticated(false);
  };

  return (
    <PaperProvider>
      <Appbar.Header>
        <Appbar.Content title="HR Fingerprint Attendance" />
      </Appbar.Header>

      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Title title="Event Attendance" />
          <Card.Content>
            <TextInput
              label="Event Name"
              value={eventName}
              onChangeText={setEventName}
              style={styles.input}
            />
            
            <TextInput
              label="Employee ID"
              value={currentEmployee}
              onChangeText={setCurrentEmployee}
              style={styles.input}
              keyboardType="numeric"
            />
            
            <Button 
              mode="contained" 
              onPress={handleFingerprintAuth}
              style={styles.button}
              icon={() => <Icon name="fingerprint" size={20} color="white" />}
            >
              Authenticate Fingerprint
            </Button>
            
            <View style={styles.buttonGroup}>
              <Button 
                mode="contained" 
                onPress={handleCheckIn}
                style={[styles.button, styles.checkInButton]}
                disabled={!isAuthenticated}
              >
                Check In
              </Button>
              
              <Button 
                mode="contained" 
                onPress={handleCheckOut}
                style={[styles.button, styles.checkOutButton]}
                disabled={!isAuthenticated}
              >
                Check Out
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Recent Attendance" />
          <Card.Content>
            {employees.slice(-5).reverse().map((emp, index) => (
              <View key={index} style={styles.record}>
                <Text>ID: {emp.employeeId}</Text>
                <Text>Event: {emp.eventName}</Text>
                <Text>In: {emp.checkInTime}</Text>
                {emp.checkOutTime && (
                  <Text>Out: {emp.checkOutTime}</Text>
                )}
              </View>
            ))}
          </Card.Content>
        </Card>
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  checkInButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#4CAF50',
  },
  checkOutButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#F44336',
  },
  record: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default App;