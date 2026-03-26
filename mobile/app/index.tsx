import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../src/store';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loadUser = useAuthStore((s) => s.loadUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadUser().finally(() => {
      if (mounted) {
        setReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, [loadUser]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#12121F' }}>
        <ActivityIndicator size="large" color="#E2A04A" />
      </View>
    );
  }

  return <Redirect href={(isAuthenticated ? '/tabs' : '/auth/login') as any} />;
}
