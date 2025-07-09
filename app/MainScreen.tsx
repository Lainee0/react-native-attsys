import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Avatar, Button, Card, List, Text, TextInput } from 'react-native-paper';

type Employee = {
  id: string;
  name: string;
  employeeId: string;
};

type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  eventId: string;
  timestamp: string;
  status: 'Checked In' | 'Checked Out';
};

export default function AttendanceSystem() {
  // States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [currentEvent, setCurrentEvent] = useState('');
  const [mode, setMode] = useState<'register' | 'attend'>('attend');

  // Load data on startup
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedEmployees = await SecureStore.getItemAsync('employees');
      const savedAttendance = await SecureStore.getItemAsync('attendance');
      
      if (savedEmployees) setEmployees(JSON.parse(savedEmployees));
      if (savedAttendance) setAttendance(JSON.parse(savedAttendance));
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    }
  };

  const saveData = async () => {
    try {
      await SecureStore.setItemAsync('employees', JSON.stringify(employees));
      await SecureStore.setItemAsync('attendance', JSON.stringify(attendance));
    } catch (error) {
      Alert.alert('Error', 'Failed to save data');
    }
  };

  // Employee Registration
  const registerEmployee = async () => {
    if (!newEmployeeName.trim() || !newEmployeeId.trim()) {
      Alert.alert('Error', 'Please enter both name and ID');
      return;
    }

    if (employees.some(e => e.employeeId === newEmployeeId)) {
      Alert.alert('Error', 'Employee ID already exists');
      return;
    }

    try {
      const { success } = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Register your fingerprint',
        disableDeviceFallback: true,
      });

      if (success) {
        const newEmployee = {
          id: `emp-${Date.now()}`,
          name: newEmployeeName,
          employeeId: newEmployeeId,
        };

        setEmployees([...employees, newEmployee]);
        setNewEmployeeName('');
        setNewEmployeeId('');
        await saveData();
        Alert.alert('Success', 'Employee registered with fingerprint');
      }
    } catch (error) {
      Alert.alert('Error', 'Fingerprint registration failed');
    }
  };

  // Mark Attendance
  const markAttendance = async () => {
    if (!currentEvent) {
      Alert.alert('Error', 'Please enter event name');
      return;
    }

    try {
      const { success } = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate for attendance',
      });

      if (success) {
        // In a real app, you would match against specific employee fingerprint
        // For demo, we'll use the first employee
        const employee = employees[0]; 
        
        if (employee) {
          const newRecord: AttendanceRecord = {
            id: `att-${Date.now()}`,
            employeeId: employee.employeeId,
            employeeName: employee.name,
            eventId: currentEvent,
            timestamp: new Date().toISOString(),
            status: 'Checked In',
          };

          setAttendance([...attendance, newRecord]);
          await saveData();
          Alert.alert('Success', `${employee.name} checked in to ${currentEvent}`);
        } else {
          Alert.alert('Error', 'No registered employees found');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Authentication failed');
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Employee Attendance System" />
        <Appbar.Action 
          icon={mode === 'register' ? 'calendar-check' : 'account-plus'} 
          onPress={() => setMode(mode === 'register' ? 'attend' : 'register')}
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {mode === 'register' ? (
          <Card style={styles.card}>
            <Card.Title 
              title="Register Employee" 
              left={() => <MaterialCommunityIcons name="account-plus" size={24} />}
            />
            <Card.Content>
              <TextInput
                label="Full Name"
                value={newEmployeeName}
                onChangeText={setNewEmployeeName}
                style={styles.input}
              />
              <TextInput
                label="Employee ID"
                value={newEmployeeId}
                onChangeText={setNewEmployeeId}
                keyboardType="numeric"
                style={styles.input}
              />
              <Button
                mode="contained"
                icon="fingerprint"
                onPress={registerEmployee}
                style={styles.button}
              >
                Register Fingerprint
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.card}>
            <Card.Title 
              title="Mark Attendance" 
              left={() => <MaterialCommunityIcons name="fingerprint" size={24} />}
            />
            <Card.Content>
              <TextInput
                label="Event Name"
                value={currentEvent}
                onChangeText={setCurrentEvent}
                style={styles.input}
              />
              <Button
                mode="contained"
                icon="login"
                onPress={markAttendance}
                style={styles.button}
              >
                Authenticate & Check In
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Employees List */}
        <Card style={styles.card}>
          <Card.Title title="Registered Employees" />
          <Card.Content>
            {employees.map(employee => (
              <List.Item
                key={employee.id}
                title={employee.name}
                description={`ID: ${employee.employeeId}`}
                left={props => <Avatar.Text {...props} label={employee.name[0]} />}
              />
            ))}
          </Card.Content>
        </Card>

        {/* Attendance Records */}
        <Card style={styles.card}>
          <Card.Title title="Attendance Records" />
          <Card.Content>
            {attendance.slice(0, 10).map(record => (
              <List.Item
                key={record.id}
                title={record.employeeName}
                description={`${record.eventId} - ${new Date(record.timestamp).toLocaleString()}`}
                left={props => <Avatar.Text {...props} label={record.employeeName[0]} />}
                right={props => <Text {...props} style={styles.attendanceStatus}>{record.status}</Text>}
              />
            ))}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 8,
  },
  attendanceStatus: {
    alignSelf: 'center',
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});