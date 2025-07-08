import * as LocalAuthentication from 'expo-local-authentication';
import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';

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

  return (
    <SafeAreaView style={styles.container}>
      <Text>Admin Panel</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});