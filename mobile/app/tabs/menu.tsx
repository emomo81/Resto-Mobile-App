import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Image, ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { menuAPI } from '../../src/services/api';
import { useCartStore } from '../../src/store';
import { SafeAreaView } from 'react-native-safe-area-context';

const TAGS = ['All', 'bestseller', 'vegan', 'spicy', 'healthy', 'new', 'vegetarian', 'gluten-free'];

export default function MenuScreen() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [catRes, dishRes] = await Promise.all([
        menuAPI.getCategories(),
        menuAPI.getDishes({ category: selectedCategory || undefined, tag: selectedTag !== 'All' ? selectedTag : undefined }),
      ]);
      setCategories(catRes.data.data || []);
      setDishes(dishRes.data.data || []);
    } catch { } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedTag]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = dishes.filter((d) =>
    !search || d.name.toLowerCase().includes(search.toLowerCase())
  );

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search dishes..."
            placeholderTextColor="#666"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        <TouchableOpacity
          style={[styles.chip, !selectedCategory && styles.chipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {categories.map((c) => (
          <TouchableOpacity
            key={c._id}
            style={[styles.chip, selectedCategory === c._id && styles.chipActive]}
            onPress={() => setSelectedCategory(c._id)}
          >
            <Text style={[styles.chipText, selectedCategory === c._id && styles.chipTextActive]}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tags */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll} contentContainerStyle={styles.filterContent}>
        {TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.tagChip, selectedTag === tag && styles.tagChipActive]}
            onPress={() => setSelectedTag(tag)}
          >
            <Text style={[styles.tagText, selectedTag === tag && styles.tagTextActive]}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color="#E2A04A" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E2A04A" />}
          ListEmptyComponent={<Text style={styles.empty}>No dishes found</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/dish/${item._id}` as any)}>
              <Image source={{ uri: item.images?.[0] || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400' }} style={styles.cardImg} />
              {item.isFeatured && <View style={styles.badge}><Text style={styles.badgeText}>Featured</Text></View>}
              <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardPrice}>${item.price.toFixed(2)}</Text>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() =>
                      addItem({
                        dishId: item._id,
                        name: item.name,
                        price: item.price,
                        quantity: 1,
                        image: item.images?.[0],
                      })
                    }
                  >
                    <Text style={styles.addBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121F' },
  searchRow: { paddingHorizontal: 16, paddingVertical: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#242442' },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: '#FFF8F0', paddingVertical: 12, fontSize: 15 },
  filterScroll: { maxHeight: 50 },
  tagScroll: { maxHeight: 44 },
  filterContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: '#242442' },
  chipActive: { backgroundColor: '#E2A04A', borderColor: '#E2A04A' },
  chipText: { color: '#888', fontSize: 13 },
  chipTextActive: { color: '#12121F', fontWeight: '700' },
  tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: '#242442' },
  tagChipActive: { backgroundColor: '#242442', borderColor: '#E2A04A' },
  tagText: { color: '#666', fontSize: 12 },
  tagTextActive: { color: '#E2A04A', fontWeight: '600' },
  listContent: { padding: 16, gap: 12 },
  row: { gap: 12 },
  card: { flex: 1, backgroundColor: '#1A1A2E', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#242442' },
  cardImg: { width: '100%', height: 120 },
  badge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#E2A04A', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#12121F', fontSize: 10, fontWeight: '700' },
  cardBody: { padding: 10 },
  cardName: { color: '#FFF8F0', fontWeight: '700', fontSize: 13, marginBottom: 4 },
  cardDesc: { color: '#888', fontSize: 11, lineHeight: 15, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardPrice: { color: '#E2A04A', fontWeight: '700', fontSize: 14 },
  addBtn: { backgroundColor: '#E2A04A', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#12121F', fontSize: 20, fontWeight: '700', lineHeight: 24 },
  empty: { color: '#666', textAlign: 'center', marginTop: 60, fontSize: 15 },
});
