import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Avatar, Button, Card, IconButton, List, Modal, PaperProvider, Portal, Text, TextInput } from 'react-native-paper';

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

export default function MainScreen() {
  // States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [currentEvent, setCurrentEvent] = useState('');
  const [mode, setMode] = useState<'register' | 'attend'>('attend');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editName, setEditName] = useState('');
  const [editId, setEditId] = useState('');
  const [visible, setVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load data on startup and when refreshed
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const savedEmployees = await SecureStore.getItemAsync('employees');
      const savedAttendance = await SecureStore.getItemAsync('attendance');
      
      if (savedEmployees) setEmployees(JSON.parse(savedEmployees));
      if (savedAttendance) setAttendance(JSON.parse(savedAttendance));
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setRefreshing(false);
    }
  };

  const saveData = async () => {
    try {
      await SecureStore.setItemAsync('employees', JSON.stringify(employees));
      await SecureStore.setItemAsync('attendance', JSON.stringify(attendance));
    } catch (error) {
      Alert.alert('Error', 'Failed to save data');
      console.error('Save error:', error);
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

        // Create updated employees array
        const updatedEmployees = [...employees, newEmployee];
        
        // Update state
        setEmployees(updatedEmployees);
        setNewEmployeeName('');
        setNewEmployeeId('');

        // Save to SecureStore
        try {
          await SecureStore.setItemAsync('employees', JSON.stringify(updatedEmployees));
          Alert.alert('Success', 'Employee registered with fingerprint');
        } catch (saveError) {
          console.error('Failed to save employee:', saveError);
          Alert.alert('Error', 'Failed to save employee data');
          // Rollback the state if save fails
          setEmployees(employees);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Fingerprint registration failed');
    }
  };

  // Edit Employee
  const startEditing = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditName(employee.name);
    setEditId(employee.employeeId);
    setVisible(true);
  };

  const saveEdit = async () => {
    if (!editingEmployee || !editName.trim() || !editId.trim()) return;

    if (employees.some(e => e.employeeId === editId && e.id !== editingEmployee.id)) {
      Alert.alert('Error', 'Employee ID already exists');
      return;
    }

    const updatedEmployees = employees.map(emp => 
      emp.id === editingEmployee.id ? { ...emp, name: editName, employeeId: editId } : emp
    );

    // Also update attendance records if employee ID changed
    const updatedAttendance = attendance.map(record => 
      record.employeeId === editingEmployee.employeeId 
        ? { ...record, employeeId: editId, employeeName: editName } 
        : record
    );

    setEmployees(updatedEmployees);
    setAttendance(updatedAttendance);
    
    // Save both updates
    await SecureStore.setItemAsync('employees', JSON.stringify(updatedEmployees));
    await SecureStore.setItemAsync('attendance', JSON.stringify(updatedAttendance));
    
    setVisible(false);
    Alert.alert('Success', 'Employee updated');
  };

  // Delete Employee
  const deleteEmployee = async (employeeId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this employee?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const updatedEmployees = employees.filter(emp => emp.id !== employeeId);
            setEmployees(updatedEmployees);
            // Also remove any attendance records for this employee
            const updatedAttendance = attendance.filter(record => record.employeeId !== employeeId);
            setAttendance(updatedAttendance);
            // Save both updates
            await SecureStore.setItemAsync('employees', JSON.stringify(updatedEmployees));
            await SecureStore.setItemAsync('attendance', JSON.stringify(updatedAttendance));
            Alert.alert('Success', 'Employee deleted');
          }
        }
      ]
    );
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
        // Find the employee by matching fingerprint (in real app use actual biometric matching)
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

          // Update both local state and storage
          const updatedAttendance = [...attendance, newRecord];
          setAttendance(updatedAttendance);
          await SecureStore.setItemAsync('attendance', JSON.stringify(updatedAttendance));
          
          Alert.alert('Success', `${employee.name} checked in to ${currentEvent}`);
          setCurrentEvent('');
        } else {
          Alert.alert('Error', 'No registered employees found');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Authentication failed');
    }
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.Content title="Employee Attendance" titleStyle={styles.headerTitle} />
          <Appbar.Action 
            icon="refresh" 
            onPress={loadData}
            color="#fff"
          />
          <Appbar.Action 
            icon={mode === 'register' ? 'calendar-check' : 'account-plus'} 
            onPress={() => setMode(mode === 'register' ? 'attend' : 'register')}
            color="#fff"
          />
        </Appbar.Header>

        <ScrollView 
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadData}
              colors={['#3a86ff']}
              tintColor="#3a86ff"
            />
          }  
        >
          {mode === 'register' ? (
            <Card style={styles.card}>
              <Card.Title 
                title="Register Employee" 
                titleStyle={styles.cardTitle}
                left={() => <MaterialCommunityIcons name="account-plus" size={24} color="#3a86ff" />}
              />
              <Card.Content>
                <TextInput
                  label="Full Name"
                  value={newEmployeeName}
                  onChangeText={setNewEmployeeName}
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Employee ID"
                  value={newEmployeeId}
                  onChangeText={setNewEmployeeId}
                  keyboardType="numeric"
                  style={styles.input}
                  mode="outlined"
                />
                <Button
                  mode="contained"
                  icon="fingerprint"
                  onPress={registerEmployee}
                  style={styles.primaryButton}
                  labelStyle={styles.buttonLabel}
                >
                  Register Fingerprint
                </Button>
              </Card.Content>
            </Card>
          ) : (
            <Card style={styles.card}>
              <Card.Title 
                title="Mark Attendance" 
                titleStyle={styles.cardTitle}
                left={() => <MaterialCommunityIcons name="fingerprint" size={24} color="#3a86ff" />}
              />
              <Card.Content>
                <TextInput
                  label="Event Name"
                  value={currentEvent}
                  onChangeText={setCurrentEvent}
                  style={styles.input}
                  mode="outlined"
                />
                <Button
                  mode="contained"
                  icon="login"
                  onPress={markAttendance}
                  style={styles.primaryButton}
                  labelStyle={styles.buttonLabel}
                >
                  Authenticate & Check In
                </Button>
              </Card.Content>
            </Card>
          )}

          {/* Employees List */}
          <Card style={styles.card}>
            <Card.Title title="Registered Employees" titleStyle={styles.cardTitle} />
            <Card.Content>
              {employees.map(employee => (
                <List.Item
                  key={employee.id}
                  title={employee.name}
                  description={`ID: ${employee.employeeId}`}
                  titleStyle={styles.listItemTitle}
                  descriptionStyle={styles.listItemDescription}
                  left={props => <Avatar.Text {...props} label={employee.name[0]} style={styles.avatar} />}
                  right={() => (
                    <View style={styles.actions}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => startEditing(employee)}
                        iconColor="#3a86ff"
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => deleteEmployee(employee.id)}
                        iconColor="#ff4d4d"
                      />
                    </View>
                  )}
                  style={styles.listItem}
                />
              ))}
            </Card.Content>
          </Card>

          {/* Attendance Records */}
          <Card style={styles.card}>
            <Card.Title title="Attendance Logs" titleStyle={styles.cardTitle} />
            <Card.Content>
              {attendance.slice(0, 10).map(record => (
                <List.Item
                  key={record.id}
                  title={record.employeeName}
                  description={`${record.eventId} • ${new Date(record.timestamp).toLocaleString()}`}
                  titleStyle={styles.listItemTitle}
                  descriptionStyle={styles.listItemDescription}
                  left={props => <Avatar.Text {...props} label={record.employeeName[0]} style={styles.avatar} />}
                  right={props => (
                    <Text {...props} style={[
                      styles.attendanceStatus,
                      record.status === 'Checked In' ? styles.statusSuccess : styles.statusWarning
                    ]}>
                      {record.status}
                    </Text>
                  )}
                  style={styles.listItem}
                />
              ))}
            </Card.Content>
          </Card>
        </ScrollView>

        {/* Edit Modal */}
        <Portal>
          <Modal visible={visible} onDismiss={() => setVisible(false)}>
            <Card style={styles.modalCard}>
              <Card.Title title="Edit Employee" titleStyle={styles.cardTitle} />
              <Card.Content>
                <TextInput
                  label="Full Name"
                  value={editName}
                  onChangeText={setEditName}
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Employee ID"
                  value={editId}
                  onChangeText={setEditId}
                  keyboardType="numeric"
                  style={styles.input}
                  mode="outlined"
                />
                <Button
                  mode="contained"
                  onPress={saveEdit}
                  style={styles.primaryButton}
                  labelStyle={styles.buttonLabel}
                >
                  Save Changes
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setVisible(false)}
                  style={styles.secondaryButton}
                  labelStyle={styles.buttonLabel}
                >
                  Cancel
                </Button>
              </Card.Content>
            </Card>
          </Modal>
        </Portal>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#3a86ff',
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 1,
  },
  cardTitle: {
    color: '#2b2d42',
    fontWeight: '600',
  },
  modalCard: {
    margin: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#3a86ff',
    borderRadius: 4,
    paddingVertical: 6,
  },
  secondaryButton: {
    marginTop: 8,
    borderColor: '#3a86ff',
    borderRadius: 4,
    paddingVertical: 6,
  },
  buttonLabel: {
    color: '#fff',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#e9ecef',
  },
  listItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  listItemTitle: {
    color: '#2b2d42',
    fontWeight: '500',
  },
  listItemDescription: {
    color: '#6c757d',
  },
  attendanceStatus: {
    alignSelf: 'center',
    fontWeight: '500',
  },
  statusSuccess: {
    color: '#28a745',
  },
  statusWarning: {
    color: '#ffc107',
  },
});