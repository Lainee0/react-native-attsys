import React from 'react';
import { PaperProvider } from 'react-native-paper';
import AppNavigator from './AppNavigator';

export default function AttSys() {
  return (
    <PaperProvider>
      <AppNavigator />
    </PaperProvider>
  );
}