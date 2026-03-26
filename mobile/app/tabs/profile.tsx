import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Switch, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store';
import { userAPI, menuAPI } from '../../src/services/api';

const C = {
  bg: '#12121F', card: '#1A1A2E', elevated: '#242442',
  accent: '#E2A04A', text: '#FFF8F0', sub: '#888', muted: '#666',
  border: '#242442', danger: '#E25555',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [loadingFavs, setLoadingFavs] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [isAuthenticated]);

  const fetchFavorites = async () => {
    setLoadingFavs(true);
    try {
      const res = await userAPI.getFavorites();
      setFavorites(res.data.favorites || []);
    } catch {
      setFavorites([]);
    } finally {
      setLoadingFavs(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/auth/login' as any);
      }},
    ]);
  };

  const handleRemoveFavorite = async (dishId: string) => {
    try {
      await userAPI.toggleFavorite(dishId);
      setFavorites(prev => prev.filter(f => f._id !== dishId));
    } catch {}
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}><Text style={styles.title}>Profile</Text></View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={styles.emptyTitle}>You're not signed in</Text>
          <Text style={styles.emptyText}>Sign in to manage your profile, favorites, and order history</Text>
          <TouchableOpacity style={styles.authBtn} onPress={() => router.push('/auth/login' as any)}>
            <Text style={styles.authBtnText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.authBtnOutline} onPress={() => router.push('/auth/register' as any)}>
            <Text style={styles.authBtnOutlineText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><Text style={styles.title}>Profile</Text></View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Avatar & Name */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitial}>
                {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.fullName}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            {user?.phone && <Text style={styles.profilePhone}>{user.phone}</Text>}
          </View>
          <View style={[styles.roleBadge, user?.role === 'admin' && styles.adminBadge]}>
            <Text style={styles.roleText}>{user?.role === 'admin' ? '👑 Admin' : '🍽️ Member'}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Favorites', value: favorites.length, icon: '❤️' },
            { label: 'Orders', value: '—', icon: '📦' },
            { label: 'Reviews', value: '—', icon: '⭐' },
          ].map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Favorites */}
        {favorites.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>❤️ Favorites</Text>
            {favorites.map(dish => (
              <View key={dish._id} style={styles.favItem}>
                <TouchableOpacity style={styles.favContent} onPress={() => router.push(`/dish/${dish._id}` as any)}>
                  {dish.image ? (
                    <Image source={{ uri: dish.image }} style={styles.favImg} />
                  ) : (
                    <View style={[styles.favImg, { backgroundColor: C.elevated, justifyContent: 'center', alignItems: 'center' }]}>
                      <Text>🍽️</Text>
                    </View>
                  )}
                  <View style={styles.favInfo}>
                    <Text style={styles.favName} numberOfLines={1}>{dish.name}</Text>
                    <Text style={styles.favPrice}>${dish.price?.toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveFavorite(dish._id)} style={styles.removeFavBtn}>
                  <Text style={styles.removeFavIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Settings</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>🔔  Push Notifications</Text>
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ false: C.elevated, true: `${C.accent}80` }}
                thumbColor={notifEnabled ? C.accent : C.muted}
              />
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/tabs/orders' as any)}>
              <Text style={styles.settingLabel}>📋  Order History</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow}>
              <Text style={styles.settingLabel}>🔒  Privacy Policy</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow}>
              <Text style={styles.settingLabel}>💬  Help & Support</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
          <Text style={styles.version}>MOMO-RESTO v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 24, fontWeight: '700', color: C.text },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: C.sub, textAlign: 'center', marginBottom: 24 },
  authBtn: { backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 40, paddingVertical: 14, marginBottom: 12, width: '100%', alignItems: 'center' },
  authBtnText: { color: '#12121F', fontWeight: '700', fontSize: 15 },
  authBtnOutline: { borderWidth: 1.5, borderColor: C.accent, borderRadius: 12, paddingHorizontal: 40, paddingVertical: 14, width: '100%', alignItems: 'center' },
  authBtnOutlineText: { color: C.accent, fontWeight: '700', fontSize: 15 },
  profileCard: { marginHorizontal: 20, marginBottom: 16, backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center' },
  avatarImg: { width: 64, height: 64, borderRadius: 32 },
  avatarInitial: { fontSize: 26, fontWeight: '800', color: '#12121F' },
  profileInfo: { flex: 1 },
  profileName: { color: C.text, fontSize: 17, fontWeight: '700' },
  profileEmail: { color: C.sub, fontSize: 13, marginTop: 2 },
  profilePhone: { color: C.muted, fontSize: 12, marginTop: 1 },
  roleBadge: { backgroundColor: `${C.accent}22`, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  adminBadge: { backgroundColor: '#9B59B622' },
  roleText: { fontSize: 11, color: C.accent, fontWeight: '700' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { color: C.accent, fontSize: 18, fontWeight: '800', marginBottom: 2 },
  statLabel: { color: C.sub, fontSize: 11 },
  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 10 },
  favItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  favContent: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10 },
  favImg: { width: 52, height: 52, borderRadius: 8 },
  favInfo: { flex: 1 },
  favName: { color: C.text, fontSize: 14, fontWeight: '600' },
  favPrice: { color: C.accent, fontSize: 13, fontWeight: '700', marginTop: 2 },
  removeFavBtn: { padding: 14 },
  removeFavIcon: { fontSize: 18 },
  settingCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  settingLabel: { color: C.text, fontSize: 14, fontWeight: '500' },
  chevron: { color: C.sub, fontSize: 20, fontWeight: '300' },
  divider: { height: 1, backgroundColor: C.border, marginLeft: 16 },
  signOutBtn: { backgroundColor: `${C.danger}22`, borderWidth: 1, borderColor: C.danger, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  signOutText: { color: C.danger, fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', color: C.muted, fontSize: 12 },
});
