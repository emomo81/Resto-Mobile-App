import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/tabs');
    } catch (err: any) {
      Alert.alert('Login Failed', err?.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>MOMO</Text>
          <Text style={styles.logoAccent}>RESTO</Text>
          <Text style={styles.tagline}>Fine Dining Experience</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Welcome Back</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#555"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#555"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#12121F" />
            ) : (
              <Text style={styles.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/auth/register')}>
            <Text style={styles.secondaryText}>Don't have an account? <Text style={styles.link}>Register</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121F' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 48 },
  logo: { fontSize: 48, fontWeight: '900', color: '#FFF8F0', letterSpacing: 8 },
  logoAccent: { fontSize: 20, fontWeight: '400', color: '#E2A04A', letterSpacing: 12, marginTop: -8 },
  tagline: { fontSize: 12, color: '#888', letterSpacing: 3, marginTop: 8, textTransform: 'uppercase' },
  form: { backgroundColor: '#1A1A2E', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#242442' },
  title: { fontSize: 24, fontWeight: '700', color: '#FFF8F0', marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, color: '#888', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#242442', borderRadius: 12, padding: 14,
    color: '#FFF8F0', fontSize: 15, borderWidth: 1, borderColor: '#333360',
  },
  btn: {
    backgroundColor: '#E2A04A', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#12121F', fontWeight: '700', fontSize: 16 },
  secondaryBtn: { marginTop: 16, alignItems: 'center' },
  secondaryText: { color: '#888', fontSize: 14 },
  link: { color: '#E2A04A', fontWeight: '600' },
});
