import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { orderAPI } from '../../src/services/api';

const C = {
  bg: '#12121F', card: '#1A1A2E', elevated: '#242442',
  accent: '#E2A04A', text: '#FFF8F0', sub: '#888', muted: '#666',
  border: '#242442', danger: '#E25555', green: '#4CAF50',
};

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];

const STATUS_META: Record<string, { label: string; emoji: string; color: string }> = {
  pending:    { label: 'Pending',    emoji: '⏳', color: '#FFA726' },
  confirmed:  { label: 'Confirmed',  emoji: '✅', color: '#66BB6A' },
  preparing:  { label: 'Preparing',  emoji: '👨‍🍳', color: '#42A5F5' },
  ready:      { label: 'Ready',      emoji: '🔔', color: '#AB47BC' },
  delivered:  { label: 'Delivered',  emoji: '🎉', color: C.accent },
  cancelled:  { label: 'Cancelled',  emoji: '❌', color: C.danger },
};

interface OrderItem {
  dish: { _id: string; name: string; image?: string; price: number };
  quantity: number;
  size?: string;
  addOns?: string[];
  price: number;
}

interface Order {
  _id: string;
  orderNumber?: string;
  status: string;
  orderType: string;
  tableNumber?: number;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  notes?: string;
  estimatedTime?: number;
  createdAt: string;
  updatedAt: string;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  // Poll for status updates every 15s if order is active
  useEffect(() => {
    if (!order) return;
    const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready'];
    if (!activeStatuses.includes(order.status)) return;
    const interval = setInterval(loadOrder, 15000);
    return () => clearInterval(interval);
  }, [order?.status]);

  const loadOrder = async () => {
    try {
      const res = await orderAPI.getOrder(id);
      const o = res.data?.data || res.data;
      setOrder(o);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel', style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              await orderAPI.cancel(id);
              await loadOrder();
              Alert.alert('Order Cancelled', 'Your order has been cancelled.');
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message || 'Failed to cancel.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const getStatusIndex = (status: string) => STATUS_STEPS.indexOf(status);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: C.text, fontSize: 16 }}>Order not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: C.accent }}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const isCancelled = order.status === 'cancelled';
  const canCancel = ['pending', 'confirmed'].includes(order.status);
  const currentStep = getStatusIndex(order.status);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: C.text, fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

        {/* Status Hero Card */}
        <View style={[styles.statusHero, { borderColor: meta.color + '44' }]}>
          <Text style={styles.statusEmoji}>{meta.emoji}</Text>
          <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
          <Text style={styles.orderNumber}>
            #{order.orderNumber || order._id.slice(-8).toUpperCase()}
          </Text>
          {order.estimatedTime && !isCancelled && (
            <View style={styles.etaBadge}>
              <Text style={styles.etaText}>⏱ Est. {order.estimatedTime} min</Text>
            </View>
          )}
        </View>

        {/* Progress Tracker */}
        {!isCancelled && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Progress</Text>
            <View style={styles.timeline}>
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStep;
                const active = i === currentStep;
                const stepMeta = STATUS_META[step];
                return (
                  <View key={step} style={styles.timelineStep}>
                    <View style={styles.timelineLeft}>
                      <View style={[
                        styles.timelineDot,
                        done && { backgroundColor: stepMeta.color, borderColor: stepMeta.color },
                        active && styles.timelineDotActive,
                      ]}>
                        {done && <Text style={{ fontSize: 10 }}>✓</Text>}
                      </View>
                      {i < STATUS_STEPS.length - 1 && (
                        <View style={[styles.timelineLine, done && { backgroundColor: C.accent + '66' }]} />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineStepLabel, done && { color: C.text }]}>
                        {stepMeta.emoji} {stepMeta.label}
                      </Text>
                      {active && (
                        <Text style={{ color: stepMeta.color, fontSize: 11, marginTop: 2 }}>
                          In progress...
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Order Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Type</Text>
            <Text style={styles.infoVal}>
              {order.orderType === 'dine-in' ? '🪑 Dine In' : '🥡 Takeaway'}
            </Text>
          </View>
          {order.tableNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Table</Text>
              <Text style={styles.infoVal}>#{order.tableNumber}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Placed</Text>
            <Text style={styles.infoVal}>{new Date(order.createdAt).toLocaleString()}</Text>
          </View>
          {order.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Notes</Text>
              <Text style={[styles.infoVal, { flex: 1, textAlign: 'right' }]}>{order.notes}</Text>
            </View>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items ({order.items.length})</Text>
          {order.items.map((item, idx) => (
            <View key={idx} style={[styles.itemRow, idx < order.items.length - 1 && styles.itemDivider]}>
              <Image
                source={{ uri: item.dish?.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200' }}
                style={styles.itemImage}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.dish?.name || 'Item'}</Text>
                {item.size && <Text style={styles.itemSub}>Size: {item.size}</Text>}
                {item.addOns?.length ? (
                  <Text style={styles.itemSub}>+ {item.addOns.join(', ')}</Text>
                ) : null}
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Price Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price Breakdown</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Subtotal</Text>
            <Text style={styles.infoVal}>${order.subtotal?.toFixed(2) || '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Tax (10%)</Text>
            <Text style={styles.infoVal}>${order.tax?.toFixed(2) || '—'}</Text>
          </View>
          <View style={[styles.infoRow, styles.totalRow]}>
            <Text style={styles.totalKey}>Total</Text>
            <Text style={styles.totalVal}>${order.totalAmount?.toFixed(2) || '—'}</Text>
          </View>
        </View>

        {/* Cancel Button */}
        {canCancel && (
          <TouchableOpacity
            style={[styles.cancelBtn, cancelling && { opacity: 0.6 }]}
            onPress={handleCancel}
            disabled={cancelling}
          >
            {cancelling
              ? <ActivityIndicator color={C.danger} />
              : <Text style={styles.cancelBtnText}>Cancel Order</Text>}
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.elevated, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: '800' },
  statusHero: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1.5, padding: 24, alignItems: 'center', marginBottom: 14,
  },
  statusEmoji: { fontSize: 52, marginBottom: 8 },
  statusLabel: { fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  orderNumber: { color: C.sub, fontSize: 13, marginTop: 4 },
  etaBadge: {
    marginTop: 12, backgroundColor: C.accent + '22',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  etaText: { color: C.accent, fontSize: 13, fontWeight: '700' },
  card: {
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 14,
  },
  cardTitle: { color: C.text, fontSize: 15, fontWeight: '800', marginBottom: 14 },
  timeline: { gap: 0 },
  timelineStep: { flexDirection: 'row', gap: 14, minHeight: 50 },
  timelineLeft: { alignItems: 'center', width: 24 },
  timelineDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.elevated, borderWidth: 2, borderColor: C.muted,
    justifyContent: 'center', alignItems: 'center',
  },
  timelineDotActive: {
    borderColor: C.accent, shadowColor: C.accent,
    shadowOpacity: 0.5, shadowRadius: 6, elevation: 4,
  },
  timelineLine: { flex: 1, width: 2, backgroundColor: C.border, marginVertical: 4 },
  timelineContent: { flex: 1, paddingBottom: 16, paddingTop: 2 },
  timelineStepLabel: { color: C.muted, fontSize: 14, fontWeight: '600' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: C.border + '66',
  },
  infoKey: { color: C.sub, fontSize: 14 },
  infoVal: { color: C.text, fontSize: 14, fontWeight: '600' },
  totalRow: { borderBottomWidth: 0, marginTop: 4 },
  totalKey: { color: C.text, fontSize: 16, fontWeight: '800' },
  totalVal: { color: C.accent, fontSize: 20, fontWeight: '900' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  itemDivider: { borderBottomWidth: 1, borderBottomColor: C.border + '66' },
  itemImage: { width: 56, height: 56, borderRadius: 10, resizeMode: 'cover' },
  itemInfo: { flex: 1 },
  itemName: { color: C.text, fontSize: 14, fontWeight: '700' },
  itemSub: { color: C.sub, fontSize: 12, marginTop: 2 },
  itemQty: { color: C.muted, fontSize: 12, marginTop: 3 },
  itemPrice: { color: C.accent, fontSize: 15, fontWeight: '800' },
  cancelBtn: {
    borderWidth: 1.5, borderColor: C.danger, borderRadius: 14,
    padding: 14, alignItems: 'center', marginTop: 4,
  },
  cancelBtnText: { color: C.danger, fontSize: 15, fontWeight: '800' },
});
