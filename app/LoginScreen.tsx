import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text, TextInput } from 'react-native-paper';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    setError('');
    
    // Simple validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    
    // Simulate login API call
    setTimeout(() => {
      setLoading(false);
      if (email === 'admin@company.com' && password === 'admin123') {
        navigation.navigate('AdminPanel');
      } else {
        setError('Invalid credentials');
      }
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons 
              name="fingerprint" 
              size={60} 
              color="#3a86ff" 
              style={styles.logo}
            />
            <Text variant="headlineMedium" style={styles.title}>
              Attendance System
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              HR Admin Portal
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <Text style={styles.errorText}>
              <MaterialCommunityIcons name="alert-circle" size={16} /> {error}
            </Text>
          ) : null}

          {/* Email Input */}
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!error}
          />

          {/* Password Input */}
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon 
                icon={showPassword ? "eye-off" : "eye"} 
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            secureTextEntry={!showPassword}
            error={!!error}
          />

          {/* Login Button */}
          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            labelStyle={styles.buttonLabel}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              'Login'
            )}
          </Button>

          {/* Forgot Password */}
          <Button
            mode="text"
            onPress={() => {}}
            style={styles.textButton}
            labelStyle={styles.textButtonLabel}
          >
            Forgot Password?
          </Button>
        </Card.Content>
      </Card>

      {/* Footer */}
      <Text style={styles.footerText}>
        © 2025 LGU Garcia-Hernandez. All rights reserved.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  card: {
    borderRadius: 12,
    elevation: 3,
    backgroundColor: '#fff',
  },
  cardContent: {
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    marginBottom: 16,
  },
  title: {
    color: '#2b2d42',
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6c757d',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#3a86ff',
  },
  buttonLabel: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
    height: 24,
  },
  textButton: {
    marginTop: 12,
  },
  textButtonLabel: {
    color: '#6c757d',
  },
  errorText: {
    color: '#dc3545',
    marginBottom: 16,
    textAlign: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    textAlign: 'center',
    marginTop: 24,
    color: '#6c757d',
    fontSize: 12,
  },
});