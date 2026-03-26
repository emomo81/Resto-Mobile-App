import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, TextInput, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCartStore } from '../../src/store';
import { orderAPI } from '../../src/services/api';

const C = {
  bg: '#12121F', card: '#1A1A2E', elevated: '#242442',
  accent: '#E2A04A', text: '#FFF8F0', sub: '#888', muted: '#666',
  border: '#242442', danger: '#E25555', green: '#4CAF50',
};

export default function CartScreen() {
  const router = useRouter();
  const { items, orderType, tableNumber, notes, total, itemCount,
    updateQuantity, removeItem, clearCart, setOrderType, setTableNumber, setNotes } = useCartStore();
  const [isPlacing, setIsPlacing] = useState(false);

  const subtotal = total();
  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax;

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    if (orderType === 'dine-in' && !tableNumber) {
      Alert.alert('Table Required', 'Please enter a table number for dine-in orders.');
      return;
    }
    setIsPlacing(true);
    try {
      const orderData = {
        items: items.map(i => ({ dish: i.dishId, quantity: i.quantity, size: i.size, addOns: i.addOns })),
        orderType,
        tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
        notes,
        paymentMethod: 'cash',
      };
      const res = await orderAPI.create(orderData);
      clearCart();
      Alert.alert('Order Placed! 🎉', `Your order #${res.data.order?._id?.slice(-6).toUpperCase() || 'XXXX'} has been placed successfully.`, [
        { text: 'Track Order', onPress: () => router.push('/tabs/orders') },
        { text: 'OK', onPress: () => router.push('/tabs') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>My Cart</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Add some delicious dishes to get started</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/tabs/menu')}>
            <Text style={styles.browseBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Cart</Text>
        <TouchableOpacity onPress={() => Alert.alert('Clear Cart', 'Remove all items?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: clearCart },
        ])}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 200 }}>
        {/* Order Type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Order Type</Text>
          <View style={styles.typeRow}>
            {(['dine-in', 'takeaway'] as const).map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.typeBtn, orderType === type && styles.typeBtnActive]}
                onPress={() => setOrderType(type)}
              >
                <Text style={styles.typeIcon}>{type === 'dine-in' ? '🍽️' : '🥡'}</Text>
                <Text style={[styles.typeText, orderType === type && styles.typeTextActive]}>
                  {type === 'dine-in' ? 'Dine In' : 'Takeaway'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {orderType === 'dine-in' && (
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Table Number</Text>
              <TextInput
                style={styles.tableInput}
                value={String(tableNumber)}
                onChangeText={v => setTableNumber(Number(v) || 1)}
                keyboardType="number-pad"
                placeholderTextColor={C.muted}
                placeholder="1"
              />
            </View>
          )}
        </View>

        {/* Cart Items */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Items ({itemCount()})</Text>
          {items.map((item) => (
            <View key={`${item.dishId}-${item.size}`} style={styles.cartItem}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, { backgroundColor: C.elevated, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 24 }}>🍽️</Text>
                </View>
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                {item.size && <Text style={styles.itemMeta}>Size: {item.size}</Text>}
                <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
              <View style={styles.qtyControl}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.dishId, item.quantity - 1)}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.dishId, item.quantity + 1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Special Instructions</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any allergies, dietary needs, or special requests..."
            placeholderTextColor={C.muted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (10%)</Text>
              <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={[styles.summaryValue, { color: C.green }]}>Free</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${grandTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.bottomBar}>
        <View style={styles.totalPreview}>
          <Text style={styles.totalPreviewLabel}>Total</Text>
          <Text style={styles.totalPreviewValue}>${grandTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderBtn, isPlacing && { opacity: 0.7 }]}
          onPress={handlePlaceOrder}
          disabled={isPlacing}
        >
          {isPlacing ? (
            <ActivityIndicator color="#12121F" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 24, fontWeight: '700', color: C.text },
  clearText: { color: C.danger, fontSize: 14, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: C.sub, textAlign: 'center', marginBottom: 24 },
  browseBtn: { backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 },
  browseBtnText: { color: '#12121F', fontWeight: '700', fontSize: 15 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: { flex: 1, backgroundColor: C.card, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.border, gap: 6 },
  typeBtnActive: { borderColor: C.accent, backgroundColor: `${C.accent}18` },
  typeIcon: { fontSize: 22 },
  typeText: { color: C.sub, fontWeight: '600', fontSize: 14 },
  typeTextActive: { color: C.accent },
  tableRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  tableLabel: { color: C.text, fontSize: 14, fontWeight: '600' },
  tableInput: { color: C.accent, fontSize: 18, fontWeight: '700', textAlign: 'right', minWidth: 50 },
  cartItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.border, gap: 12 },
  itemImage: { width: 64, height: 64, borderRadius: 10 },
  itemInfo: { flex: 1 },
  itemName: { color: C.text, fontSize: 15, fontWeight: '600', marginBottom: 2 },
  itemMeta: { color: C.sub, fontSize: 12, marginBottom: 4 },
  itemPrice: { color: C.accent, fontSize: 15, fontWeight: '700' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.elevated, borderRadius: 10, overflow: 'hidden' },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { color: C.accent, fontSize: 18, fontWeight: '700' },
  qtyText: { color: C.text, fontWeight: '700', fontSize: 15, paddingHorizontal: 8 },
  notesInput: { backgroundColor: C.card, borderRadius: 12, padding: 14, color: C.text, borderWidth: 1, borderColor: C.border, height: 90, textAlignVertical: 'top', fontSize: 14 },
  summaryCard: { backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { color: C.sub, fontSize: 14 },
  summaryValue: { color: C.text, fontSize: 14, fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12, marginBottom: 0, marginTop: 4 },
  totalLabel: { color: C.text, fontSize: 16, fontWeight: '700' },
  totalValue: { color: C.accent, fontSize: 18, fontWeight: '800' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 32, flexDirection: 'row', alignItems: 'center', gap: 16 },
  totalPreview: { flex: 1 },
  totalPreviewLabel: { color: C.sub, fontSize: 12 },
  totalPreviewValue: { color: C.accent, fontSize: 20, fontWeight: '800' },
  placeOrderBtn: { flex: 2, backgroundColor: C.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  placeOrderText: { color: '#12121F', fontSize: 16, fontWeight: '800' },
});
