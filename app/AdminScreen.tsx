import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Card, DataTable, IconButton, Menu, PaperProvider, Searchbar, Text } from 'react-native-paper';

type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  eventId: string;
  timestamp: string;
  status: 'Checked In' | 'Checked Out';
};

export default function AdminScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('All Events');
  const [menuVisible, setMenuVisible] = useState(false); // Renamed from 'visible' to avoid confusion
  const [refreshing, setRefreshing] = useState(false);

  // Load data from secure storage
  const loadAttendance = async () => {
    try {
      setRefreshing(true);
      const savedAttendance = await SecureStore.getItemAsync('attendance');
      if (savedAttendance) {
        const parsedData = JSON.parse(savedAttendance);
        setRecords(parsedData);
        setFilteredRecords(parsedData);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load attendance data');
    } finally {
      setRefreshing(false);
    }
  };

  // Initial load and refresh when screen comes into focus
  useEffect(() => {
    loadAttendance();
  }, []);

  // Delete attendance record
  const deleteRecord = async (recordId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this attendance record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const updatedRecords = records.filter(record => record.id !== recordId);
            setRecords(updatedRecords);
            setFilteredRecords(updatedRecords);
            await SecureStore.setItemAsync('attendance', JSON.stringify(updatedRecords));
            Alert.alert('Success', 'Attendance record deleted');
          }
        }
      ]
    );
  };

  // Filter records based on search and event selection
  useEffect(() => {
    let result = records;
    
    // Filter by search query
    if (searchQuery) {
      result = result.filter(record => 
        record.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by event
    if (selectedEvent !== 'All Events') {
      result = result.filter(record => record.eventId === selectedEvent);
    }
    
    setFilteredRecords(result);
  }, [searchQuery, selectedEvent, records]);

  // Get unique events for filter dropdown
  const events = ['All Events', ...new Set(records.map(r => r.eventId))];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.Content title="Attendance Records" titleStyle={styles.headerTitle} />
          <Appbar.Action
            icon="refresh"
            onPress={loadAttendance}
            color="#fff"
          />
        </Appbar.Header>

        <ScrollView 
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadAttendance}
              colors={['#3a86ff']}
              tintColor="#3a86ff"
            />
          }
        >
          {/* Filters */}
          <Card style={styles.filterCard}>
            <Card.Content style={styles.filterContent}>
              <Searchbar
                placeholder="Search..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
                inputStyle={styles.searchInput}
              />
              
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Button 
                    mode="outlined" 
                    onPress={() => setMenuVisible(true)}
                    style={styles.eventFilterButton}
                    contentStyle={styles.eventFilterContent}
                  >
                    <Text style={styles.eventFilterText} numberOfLines={1}>
                      {selectedEvent}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} />
                  </Button>
                }
              >
                {events.map((event) => (
                  <Menu.Item 
                    key={event}
                    onPress={() => {
                      setSelectedEvent(event);
                      setMenuVisible(false);
                    }}
                    title={event}
                    titleStyle={event === selectedEvent ? styles.selectedMenuItem : styles.menuItem}
                  />
                ))}
              </Menu>
            </Card.Content>
          </Card>

          {/* Summary Stats */}
          <Card style={styles.statsCard}>
            <Card.Content style={styles.statsContent}>
              <View style={styles.statItem}>
                <Text variant="labelMedium" style={styles.statLabel}>Total Records</Text>
                <Text variant="titleLarge" style={styles.statValue}>{filteredRecords.length}</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="labelMedium" style={styles.statLabel}>Unique Employees</Text>
                <Text variant="titleLarge" style={styles.statValue}>
                  {new Set(filteredRecords.map(r => r.employeeId)).size}
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Data Table */}
          <Card style={styles.tableCard}>
            <DataTable>
              <DataTable.Header style={styles.tableHeader}>
                <DataTable.Title style={styles.column}>Employee</DataTable.Title>
                <DataTable.Title style={styles.column}>ID</DataTable.Title>
                <DataTable.Title style={styles.column}>Event</DataTable.Title>
                <DataTable.Title style={styles.column}>Time</DataTable.Title>
                {/* <DataTable.Title style={styles.actionColumn}>Action</DataTable.Title> */}
                <DataTable.Title style={styles.column}>Action</DataTable.Title>
              </DataTable.Header>

              {filteredRecords.map(record => (
                <DataTable.Row key={record.id} style={styles.tableRow}>
                  <DataTable.Cell style={styles.column}>{record.employeeName}</DataTable.Cell>
                  <DataTable.Cell style={styles.column}>{record.employeeId}</DataTable.Cell>
                  <DataTable.Cell style={styles.column}>{record.eventId}</DataTable.Cell>
                  <DataTable.Cell style={styles.column}>{formatDate(record.timestamp)}</DataTable.Cell>
                  {/* <DataTable.Cell style={styles.actionColumn}>
                    <IconButton
                      icon="trash-can-outline"
                      size={20}
                      onPress={() => deleteRecord(record.id)}
                      iconColor="#ff4444"
                    />
                  </DataTable.Cell> */}
                  <DataTable.Cell style={styles.column}>
                    <IconButton
                      icon="trash-can-outline"
                      size={20}
                      onPress={() => deleteRecord(record.id)}
                      iconColor="#ff4444"
                    />
                  </DataTable.Cell>
                </DataTable.Row>
              ))}

              {filteredRecords.length === 0 && (
                <DataTable.Row>
                  <DataTable.Cell style={styles.noRecords}>
                    <Text style={styles.noRecordsText}>No attendance records found</Text>
                  </DataTable.Cell>
                </DataTable.Row>
              )}
            </DataTable>
          </Card>
        </ScrollView>
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
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  filterCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 1,
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#f1f3f5',
    elevation: 0,
  },
  searchInput: {
    minHeight: 36,
  },
  eventFilterButton: {
    width: 180,
    backgroundColor: '#fff',
    borderColor: '#dee2e6',
  },
  eventFilterContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventFilterText: {
    flex: 1,
    marginRight: 8,
  },
  menuItem: {
    color: '#495057',
  },
  selectedMenuItem: {
    color: '#3a86ff',
    fontWeight: '500',
  },
  statsCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 1,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#6c757d',
  },
  statValue: {
    color: '#2b2d42',
    fontWeight: '600',
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 1,
  },
  tableHeader: {
    backgroundColor: '#f1f3f5',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  column: {
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    flex: 1,
  },
  // actionColumn: {
  //   justifyContent: 'center',
  //   paddingVertical: 0,
  //   paddingHorizontal: 4,
  //   width: 60,
  // },
  noRecords: {
    justifyContent: 'center',
    paddingVertical: 24,
  },
  noRecordsText: {
    textAlign: 'center',
    color: '#6c757d',
  },
});