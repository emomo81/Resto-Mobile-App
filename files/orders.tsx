import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { orderAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/store';

const C = {
  bg: '#12121F', card: '#1A1A2E', elevated: '#242442',
  accent: '#E2A04A', text: '#FFF8F0', sub: '#888', muted: '#666',
  border: '#242442', danger: '#E25555', green: '#4CAF50',
};

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  pending:    { color: '#F5A623', icon: '⏳', label: 'Pending' },
  confirmed:  { color: '#4A90D9', icon: '✅', label: 'Confirmed' },
  preparing:  { color: '#9B59B6', icon: '👨‍🍳', label: 'Preparing' },
  ready:      { color: C.accent, icon: '🔔', label: 'Ready' },
  delivered:  { color: C.green, icon: '🎉', label: 'Delivered' },
  cancelled:  { color: C.danger, icon: '❌', label: 'Cancelled' },
};

const FILTERS = ['All', 'Active', 'Delivered', 'Cancelled'];

export default function OrdersScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const res = await orderAPI.getMyOrders();
      setOrders(res.data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const onRefresh = () => { setRefreshing(true); fetchOrders(); };

  const filteredOrders = orders.filter(o => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Active') return !['delivered', 'cancelled'].includes(o.status);
    if (activeFilter === 'Delivered') return o.status === 'delivered';
    if (activeFilter === 'Cancelled') return o.status === 'cancelled';
    return true;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleCancel = async (orderId: string) => {
    try {
      await orderAPI.cancel(orderId);
      fetchOrders();
    } catch {}
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}><Text style={styles.title}>My Orders</Text></View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔐</Text>
          <Text style={styles.emptyTitle}>Sign in to view orders</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Text style={styles.refreshText}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={C.accent} size="large" /></View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyText}>Your order history will appear here</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/tabs/menu')}>
            <Text style={styles.loginBtnText}>Order Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        >
          {filteredOrders.map(order => {
            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const canCancel = ['pending', 'confirmed'].includes(order.status);
            return (
              <TouchableOpacity key={order._id} style={styles.orderCard} onPress={() => router.push(`/order/${order._id}`)} activeOpacity={0.85}>
                {/* Header */}
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>#{order._id?.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${status.color}22` }]}>
                    <Text style={styles.statusIcon}>{status.icon}</Text>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>

                {/* Order Type */}
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>
                    {order.orderType === 'dine-in' ? `🍽️ Dine In · Table ${order.tableNumber}` : '🥡 Takeaway'}
                  </Text>
                  <Text style={styles.metaText}>{order.items?.length || 0} items</Text>
                </View>

                {/* Items Preview */}
                <View style={styles.itemsList}>
                  {(order.items || []).slice(0, 3).map((item: any, idx: number) => (
                    <Text key={idx} style={styles.itemText} numberOfLines={1}>
                      • {item.quantity}x {item.dish?.name || 'Item'}
                    </Text>
                  ))}
                  {(order.items?.length || 0) > 3 && (
                    <Text style={styles.moreItems}>+{order.items.length - 3} more items</Text>
                  )}
                </View>

                {/* Progress Bar */}
                {!['delivered', 'cancelled'].includes(order.status) && (
                  <View style={styles.progressContainer}>
                    {['pending', 'confirmed', 'preparing', 'ready', 'delivered'].map((s, i) => {
                      const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
                      const currentIdx = statusOrder.indexOf(order.status);
                      const isCompleted = i <= currentIdx;
                      return (
                        <React.Fragment key={s}>
                          <View style={[styles.progressDot, isCompleted && styles.progressDotActive]} />
                          {i < 4 && <View style={[styles.progressLine, isCompleted && i < currentIdx && styles.progressLineActive]} />}
                        </React.Fragment>
                      );
                    })}
                  </View>
                )}

                {/* Footer */}
                <View style={styles.orderFooter}>
                  <Text style={styles.totalText}>${(order.totalAmount || 0).toFixed(2)}</Text>
                  {canCancel && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancel(order._id)}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                  {order.status === 'delivered' && (
                    <TouchableOpacity
                      style={styles.reorderBtn}
                      onPress={() => router.push('/tabs/menu')}
                    >
                      <Text style={styles.reorderBtnText}>Reorder</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 24, fontWeight: '700', color: C.text },
  refreshText: { color: C.accent, fontSize: 14, fontWeight: '600' },
  filterBar: { marginBottom: 16 },
  filterChip: { backgroundColor: C.card, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
  filterChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  filterText: { color: C.sub, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#12121F' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: C.sub, textAlign: 'center', marginBottom: 24 },
  loginBtn: { backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 },
  loginBtnText: { color: '#12121F', fontWeight: '700', fontSize: 15 },
  orderCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderId: { color: C.text, fontSize: 16, fontWeight: '700' },
  orderDate: { color: C.sub, fontSize: 12, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 },
  statusIcon: { fontSize: 13 },
  statusText: { fontSize: 12, fontWeight: '700' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  metaText: { color: C.sub, fontSize: 13 },
  itemsList: { marginBottom: 12 },
  itemText: { color: C.text, fontSize: 13, marginBottom: 2 },
  moreItems: { color: C.muted, fontSize: 12, marginTop: 2 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.elevated, borderWidth: 2, borderColor: C.border },
  progressDotActive: { backgroundColor: C.accent, borderColor: C.accent },
  progressLine: { flex: 1, height: 2, backgroundColor: C.elevated },
  progressLineActive: { backgroundColor: C.accent },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  totalText: { color: C.accent, fontSize: 18, fontWeight: '800' },
  cancelBtn: { borderWidth: 1, borderColor: C.danger, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  cancelBtnText: { color: C.danger, fontWeight: '600', fontSize: 13 },
  reorderBtn: { backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  reorderBtnText: { color: '#12121F', fontWeight: '700', fontSize: 13 },
});
