import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Appbar, Avatar, Button, Card, List, Text, TextInput } from 'react-native-paper';

export default function AttendanceScreen() {
  // Employee authentication state
  const [employeeId, setEmployeeId] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Event dropdown state
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([
    {label: 'Sample Event 1', value: 'event1'},
    {label: 'Sample Event 2', value: 'event2'},
    {label: 'Sample Event 3', value: 'event3'},
    {label: 'Sample Event 4', value: 'event4'},
  ]);

  // Attendance records
  const [attendanceRecords, setAttendanceRecords] = useState([
    { id: '1', name: 'John Doe', time: '09:00 AM', status: 'Checked In', date: 'May 15', event: 'Sample Event 1' },
    { id: '2', name: 'Jane Smith', time: '09:05 AM', status: 'Checked In', date: 'May 15', event: 'Sample Event 1' },
  ]);

  const handleFingerprintAuth = async () => {
    if (!value) {
      alert('Please select an event first');
      return;
    }
    
    if (!employeeId) {
      alert('Please enter employee ID');
      return;
    }

    setIsAuthenticating(true);
    try {
      // Check if biometrics are available
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        alert('No biometrics registered on this device');
        return;
      }

      // Authenticate fingerprint
      const { success } = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity for attendance',
        cancelLabel: 'Cancel',
        disableDeviceFallback: true,
      });

      if (success) {
        // Record attendance
        const newRecord = {
          id: Date.now().toString(),
          name: `Employee ${employeeId}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'Checked In',
          date: new Date().toLocaleDateString(),
          event: items.find(item => item.value === value)?.label || 'Unknown Event'
        };
        
        setAttendanceRecords([newRecord, ...attendanceRecords]);
        setEmployeeId('');
        alert(`Successfully checked in to ${newRecord.event}`);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Authentication failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Appbar.Header>
        <Appbar.Content 
          title="Fingerprint Attendance" 
          subtitle="HR Employee Tracking" 
        />
        <Appbar.Action icon="account-group" />
      </Appbar.Header>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Event Selection Dropdown */}
        <Card style={styles.dropdownCard}>
          <Card.Title
            title="Select Event"
            left={(props) => <MaterialCommunityIcons {...props} name="calendar" size={24} />}
          />
          <Card.Content>
            <DropDownPicker
              open={open}
              value={value}
              items={items}
              setOpen={setOpen}
              setValue={setValue}
              setItems={setItems}
              placeholder="Select an event"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              zIndex={3000}
              zIndexInverse={1000}
            />
          </Card.Content>
        </Card>
          
        {/* Authentication Card */}
        <Card style={styles.authCard}>
          <Card.Title
            title="Employee Check-In"
            left={(props) => <MaterialCommunityIcons {...props} name="fingerprint" size={24} />}
          />
          <Card.Content>
            <TextInput
              label="Employee ID"
              value={employeeId}
              onChangeText={setEmployeeId}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />
            <Button
              mode="contained"
              icon="fingerprint"
              loading={isAuthenticating}
              disabled={!employeeId || !value || isAuthenticating}
              onPress={handleFingerprintAuth}
              style={styles.authButton}
              labelStyle={styles.authButtonText}
            >
              {isAuthenticating ? 'Verifying...' : 'Authenticate & Check In'}
            </Button>
          </Card.Content>
        </Card>

        {/* Recent Activity */}
        <Card style={styles.activityCard}>
          <Card.Title title="Recent Check-Ins" />
          <Card.Content>
            {attendanceRecords.map((record) => (
              <List.Item
                key={record.id}
                title={record.name}
                description={`${record.event} • ${record.time} • ${record.date}`}
                left={props => (
                  <Avatar.Text 
                    {...props} 
                    label={record.name.split(' ').map(n => n[0]).join('')} 
                    style={styles.avatar}
                  />
                )}
                right={props => (
                  <Text 
                    {...props} 
                    style={[
                      styles.statusText,
                      record.status === 'Checked In' ? styles.successText : styles.warningText
                    ]}
                  >
                    {record.status}
                  </Text>
                )}
              />
            ))}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 16,
    paddingBottom: 20,
  },
  dropdownCard: {
    marginBottom: 16,
  },
  authCard: {
    marginBottom: 16,
  },
  activityCard: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  dropdown: {
    backgroundColor: 'white',
    borderColor: '#ddd',
    borderRadius: 4,
  },
  dropdownContainer: {
    backgroundColor: 'white',
    borderColor: '#ddd',
    marginTop: 2,
  },
  authButton: {
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: '#3f51b5',
  },
  authButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  avatar: {
    backgroundColor: '#e0e0e0',
  },
  statusText: {
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  successText: {
    color: '#4CAF50',
  },
  warningText: {
    color: '#FF9800',
  },
});