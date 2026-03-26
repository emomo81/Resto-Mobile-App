import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store';

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      await register(fullName, email.trim(), password, phone);
      router.replace('/tabs' as any);
    } catch (err: any) {
      Alert.alert('Registration Failed', err?.response?.data?.error || 'Something went wrong');
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
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Create Account</Text>

          {[
            { label: 'Full Name *', value: fullName, setter: setFullName, placeholder: 'John Doe' },
            { label: 'Email *', value: email, setter: setEmail, placeholder: 'you@example.com', keyboard: 'email-address' as const, autoCapitalize: 'none' as const },
            { label: 'Phone', value: phone, setter: setPhone, placeholder: '+1 234 567 890', keyboard: 'phone-pad' as const },
            { label: 'Password *', value: password, setter: setPassword, placeholder: '••••••••', secure: true },
          ].map((field) => (
            <View key={field.label} style={styles.inputGroup}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.input}
                placeholder={field.placeholder}
                placeholderTextColor="#555"
                value={field.value}
                onChangeText={field.setter}
                keyboardType={field.keyboard}
                autoCapitalize={field.autoCapitalize || 'words'}
                secureTextEntry={field.secure}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#12121F" /> : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
            <Text style={styles.secondaryText}>Already have an account? <Text style={styles.link}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121F' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 40, fontWeight: '900', color: '#FFF8F0', letterSpacing: 8 },
  logoAccent: { fontSize: 16, fontWeight: '400', color: '#E2A04A', letterSpacing: 12, marginTop: -6 },
  form: { backgroundColor: '#1A1A2E', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#242442' },
  title: { fontSize: 24, fontWeight: '700', color: '#FFF8F0', marginBottom: 24 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 11, color: '#888', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#242442', borderRadius: 12, padding: 14,
    color: '#FFF8F0', fontSize: 15, borderWidth: 1, borderColor: '#333360',
  },
  btn: { backgroundColor: '#E2A04A', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#12121F', fontWeight: '700', fontSize: 16 },
  secondaryBtn: { marginTop: 16, alignItems: 'center' },
  secondaryText: { color: '#888', fontSize: 14 },
  link: { color: '#E2A04A', fontWeight: '600' },
});
