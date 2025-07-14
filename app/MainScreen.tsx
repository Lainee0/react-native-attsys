import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import { Appbar, Avatar, Button, Card, IconButton, List, Modal, PaperProvider, Portal, Text, TextInput } from 'react-native-paper';

type Employee = {
  id: string;
  name: string;
  employeeId: string;
  biometricPublicKey?: string;
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
  const [biometrics, setBiometrics] = useState<ReactNativeBiometrics | null>(null);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  // Initialize biometrics on component mount
  useEffect(() => {
    const initBiometrics = async () => {
      try {
        const instance = new ReactNativeBiometrics();
        const { available } = await instance.isSensorAvailable();
        
        if (!available) {
          throw new Error('Biometrics not available');
        }
        
        setBiometrics(instance);
        setBiometricsAvailable(true);
      } catch (error) {
        console.error('Biometrics init error:', error);
        setBiometrics(null);
        setBiometricsAvailable(false);
        Alert.alert('Biometrics Error', 
          'Failed to initialize biometric features. ' + 
          'Please check your device settings or try again.'
        );
      }
    };

    initBiometrics();
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [savedEmployees, savedAttendance] = await Promise.all([
        SecureStore.getItemAsync('employees'),
        SecureStore.getItemAsync('attendance')
      ]);
      
      if (savedEmployees) {
        try {
          setEmployees(JSON.parse(savedEmployees));
        } catch (e) {
          console.error('Failed to parse employees:', e);
          await SecureStore.deleteItemAsync('employees');
        }
      }
      
      if (savedAttendance) {
        try {
          setAttendance(JSON.parse(savedAttendance));
        } catch (e) {
          console.error('Failed to parse attendance:', e);
          await SecureStore.deleteItemAsync('attendance');
        }
      }
    } catch (error) {
      console.error('Load error:', error);
      Alert.alert('Error', 'Failed to load data. Please try refreshing.');
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

  // Update the registerEmployee function with proper biometrics checks
  const registerEmployee = async () => {
    // Add this check first
    if (!biometrics) {
      Alert.alert('Error', 'Biometrics service is still initializing. Please try again in a moment.');
      return;
    }
    
    if (!newEmployeeName.trim() || !newEmployeeId.trim()) {
      Alert.alert('Error', 'Please enter both name and ID');
      return;
    }

    if (employees.some(e => e.employeeId === newEmployeeId)) {
      Alert.alert('Error', 'Employee ID already exists');
      return;
    }

    if (!biometrics) {
      Alert.alert('Error', 'Biometrics not initialized');
      return;
    }

    if (!biometricsAvailable) {
      Alert.alert('Error', 'Biometrics not available on this device');
      return;
    }

    try {
      // Create biometric keys
      const { publicKey } = await biometrics.createKeys('Register fingerprint');
      
      if (!publicKey) {
        Alert.alert('Error', 'Failed to create biometric keys');
        return;
      }

      // Verify enrollment with simplePrompt
      const { success } = await biometrics.simplePrompt({
        promptMessage: 'Verify your fingerprint to complete registration',
      });

      if (success) {
        const newEmployee = {
          id: `emp-${Date.now()}`,
          name: newEmployeeName,
          employeeId: newEmployeeId,
          biometricPublicKey: publicKey,
        };

        const updatedEmployees = [...employees, newEmployee];
        setEmployees(updatedEmployees);
        setNewEmployeeName('');
        setNewEmployeeId('');
        
        await SecureStore.setItemAsync('employees', JSON.stringify(updatedEmployees));
        Alert.alert('Success', 'Employee registered with fingerprint');
      } else {
        Alert.alert('Error', 'Fingerprint verification failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error instanceof Error ? error.message : 'Biometric registration failed. Please try again.'
      );
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

  // Update markAttendance function to use the biometrics state
  const markAttendance = async () => {
    if (!currentEvent) {
      Alert.alert('Error', 'Please enter event name');
      return;
    }

    if (!biometrics) {
      Alert.alert('Error', 'Biometrics not initialized');
      return;
    }

    try {
      const enrolledEmployees = employees.filter(e => e.biometricPublicKey);
      if (enrolledEmployees.length === 0) {
        Alert.alert('Error', 'No employees with registered biometrics');
        return;
      }

      // First authenticate with simplePrompt
      const { success } = await biometrics.simplePrompt({
        promptMessage: 'Authenticate to check in',
      });

      if (!success) {
        Alert.alert('Error', 'Authentication failed');
        return;
      }

      // Show employee selection after successful authentication
      Alert.alert(
        'Select Employee',
        'Choose the employee checking in:',
        enrolledEmployees.map(employee => ({
          text: `${employee.name} (${employee.employeeId})`,
          onPress: async () => {
            try {
              // Verify again with the specific employee's biometrics
              const { success: employeeAuthSuccess } = await biometrics.simplePrompt({
                promptMessage: `Verify ${employee.name}'s identity`,
              });

              if (employeeAuthSuccess) {
                const newRecord: AttendanceRecord = {
                  id: `att-${Date.now()}`,
                  employeeId: employee.employeeId,
                  employeeName: employee.name,
                  eventId: currentEvent,
                  timestamp: new Date().toISOString(),
                  status: 'Checked In',
                };

                const updatedAttendance = [...attendance, newRecord];
                setAttendance(updatedAttendance);
                await SecureStore.setItemAsync('attendance', JSON.stringify(updatedAttendance));
                Alert.alert('Success', `${employee.name} checked in to ${currentEvent}`);
                setCurrentEvent('');
              } else {
                Alert.alert('Error', 'Biometric verification failed');
              }
            } catch (error) {
              console.error('Verification error:', error);
              Alert.alert('Error', 'Verification process failed');
            }
          }
        }))
      );
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Error', 'Biometric authentication failed');
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