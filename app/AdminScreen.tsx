import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Card, DataTable, Divider, Menu, Searchbar, Text } from 'react-native-paper';

type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  eventId: string;
  timestamp: string;
  status: 'Checked In' | 'Checked Out';
};

export default function AdminPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('All Events');
  const [visible, setVisible] = useState(false);

  // Sample data - replace with your actual data
  useEffect(() => {
    const sampleData: AttendanceRecord[] = [
      {
        id: '1',
        employeeId: 'EMP001',
        employeeName: 'John Doe',
        eventId: 'Morning Shift',
        timestamp: '2023-06-15T09:00:00Z',
        status: 'Checked In'
      },
      {
        id: '2',
        employeeId: 'EMP002',
        employeeName: 'Jane Smith',
        eventId: 'Morning Shift',
        timestamp: '2023-06-15T09:05:00Z',
        status: 'Checked In'
      },
      {
        id: '3',
        employeeId: 'EMP003',
        employeeName: 'Robert Johnson',
        eventId: 'Afternoon Meeting',
        timestamp: '2023-06-15T14:30:00Z',
        status: 'Checked In'
      },
    ];
    setRecords(sampleData);
    setFilteredRecords(sampleData);
  }, []);

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
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Attendance Records" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Filters */}
        <Card style={styles.filterCard}>
          <Card.Content style={styles.filterContent}>
            <Searchbar
              placeholder="Search employees..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              inputStyle={styles.searchInput}
            />
            
            <Menu
              visible={visible}
              onDismiss={() => setVisible(false)}
              anchor={
                <Button 
                  mode="outlined" 
                  onPress={() => setVisible(true)}
                  style={styles.eventFilterButton}
                  contentStyle={styles.eventFilterContent}
                >
                  <Text style={styles.eventFilterText}>{selectedEvent}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} />
                </Button>
              }
            >
              {events.map((event, index) => (
                <React.Fragment key={event}>
                  <Menu.Item 
                    onPress={() => {
                      setSelectedEvent(event);
                      setVisible(false);
                    }}
                    title={event}
                    titleStyle={event === selectedEvent ? styles.selectedMenuItem : styles.menuItem}
                  />
                  {index < events.length - 1 && <Divider />}
                </React.Fragment>
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
              <DataTable.Title style={styles.column}>Status</DataTable.Title>
            </DataTable.Header>

            {filteredRecords.map(record => (
              <DataTable.Row key={record.id} style={styles.tableRow}>
                <DataTable.Cell style={styles.column}>{record.employeeName}</DataTable.Cell>
                <DataTable.Cell style={styles.column}>{record.employeeId}</DataTable.Cell>
                <DataTable.Cell style={styles.column}>{record.eventId}</DataTable.Cell>
                <DataTable.Cell style={styles.column}>{formatDate(record.timestamp)}</DataTable.Cell>
                <DataTable.Cell style={styles.column}>
                  <Text style={record.status === 'Checked In' ? styles.statusSuccess : styles.statusWarning}>
                    {record.status}
                  </Text>
                </DataTable.Cell>
              </DataTable.Row>
            ))}

            {filteredRecords.length === 0 && (
              <DataTable.Row>
                <DataTable.Cell style={styles.noRecords} colSpan={5}>
                  <Text style={styles.noRecordsText}>No attendance records found</Text>
                </DataTable.Cell>
              </DataTable.Row>
            )}
          </DataTable>
        </Card>
      </ScrollView>
    </View>
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
  },
  noRecords: {
    justifyContent: 'center',
    paddingVertical: 24,
  },
  noRecordsText: {
    textAlign: 'center',
    color: '#6c757d',
  },
  statusSuccess: {
    color: '#28a745',
    fontWeight: '500',
  },
  statusWarning: {
    color: '#ffc107',
    fontWeight: '500',
  },
});