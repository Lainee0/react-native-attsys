import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { Appbar, Avatar, Button, Card, List, Text, TextInput } from 'react-native-paper';

export default function AttendanceScreen() {
  const [employeeId, setEmployeeId] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([
    { id: '1', name: 'John Doe', time: '09:00 AM', status: 'Checked In', date: 'May 15' },
    { id: '2', name: 'Jane Smith', time: '09:05 AM', status: 'Checked In', date: 'May 15' },
  ]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleFingerprintAuth = async () => {
    setIsAuthenticating(true);
    try {
      const { success } = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity',
      });

      if (success) {
        // Add to attendance records
        const newRecord = {
          id: Date.now().toString(),
          name: `Employee ${employeeId}`,
          time: new Date().toLocaleTimeString(),
          status: 'Checked In',
          date: new Date().toLocaleDateString()
        };
        setAttendanceRecords([newRecord, ...attendanceRecords]);
        setEmployeeId('');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const data = [
    { label: 'Item 1', value: '1' },
    { label: 'Item 2', value: '2' },
    { label: 'Item 3', value: '3' },
  ];

  const DropdownComponent = () => {
    const [value, setValue] = useState(null);
    const [isFocus, setIsFocus] = useState(false);

    const renderLabel = () => {
      if (value || isFocus) {
        return (
          <Text style={[styles.label, isFocus && { color: 'blue' }]}>
            Select event
          </Text>
        );
      }
      return null;
    };
  }

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
        {/* Events Card */}
        <Card style={styles.dropdownCard}>
          <Card.Title
            title="Select Event"
            right={(props) => <MaterialCommunityIcons {...props} name="flag" size={24} />}
          />
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
            />
            <Button
              mode="contained"
              icon="fingerprint"
              loading={isAuthenticating}
              disabled={!employeeId || isAuthenticating}
              onPress={handleFingerprintAuth}
              style={styles.authButton}
            >
              {isAuthenticating ? 'Authenticating...' : 'Scan Fingerprint'}
            </Button>
          </Card.Content>
        </Card>

        {/* Today's Summary */}
        {/* <Card style={styles.summaryCard}>
          <Card.Title title="Today's Summary" />
          <Card.Content style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <Text variant="labelLarge">Present</Text>
              <Text variant="headlineMedium">42</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="labelLarge">Late</Text>
              <Text variant="headlineMedium">3</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="labelLarge">Absent</Text>
              <Text variant="headlineMedium">5</Text>
            </View>
          </Card.Content>
        </Card> */}

        {/* Recent Activity */}
        <Card style={styles.activityCard}>
          <Card.Title title="Recent Check-Ins" />
          <Card.Content>
            {attendanceRecords.map((record) => (
              <List.Item
                key={record.id}
                title={record.name}
                description={`${record.time} • ${record.date}`}
                left={props => <Avatar.Text {...props} label={record.name.split(' ').map(n => n[0]).join('')} />}
                right={props => <Text {...props} style={record.status === 'Checked In' ? styles.successText : styles.warningText}>
                  {record.status}
                </Text>}
              />
            ))}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Bottom Navigation */}
      {/* <Appbar style={styles.bottomBar}>
        <Appbar.Action icon="home" />
        <Appbar.Action icon="calendar" />
        <Appbar.Action icon="chart-bar" />
        <Appbar.Action icon="account" />
      </Appbar> */}
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
    paddingBottom: 80,
  },
  authCard: {
    marginBottom: 16,
  },
  dropdownCard: {
    marginBottom: 16,
    paddingRight: 12,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  authButton: {
    marginTop: 8,
    paddingVertical: 6,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    padding: 8,
  },
  activityCard: {
    marginBottom: 16,
  },
  successText: {
    color: '#4CAF50',
    alignSelf: 'center',
  },
  warningText: {
    color: '#FF9800',
    alignSelf: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  label: {
    position: 'absolute',
    backgroundColor: 'white',
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
    },
});