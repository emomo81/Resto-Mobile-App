import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, RefreshControl, Dimensions, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { menuAPI, promotionAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/store';

const { width } = Dimensions.get('window');

function HeroBanner({ promotions }: { promotions: any[] }) {
  if (!promotions.length) return null;
  const promo = promotions[0];
  return (
    <View style={styles.hero}>
      <Image
        source={{ uri: promo.image || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800' }}
        style={styles.heroImage}
      />
      <View style={styles.heroOverlay} />
      <View style={styles.heroContent}>
        <Text style={styles.heroBadge}>🔥 Special Offer</Text>
        <Text style={styles.heroTitle}>{promo.title}</Text>
        <Text style={styles.heroSubtitle}>{promo.description}</Text>
        <View style={styles.heroDiscount}>
          <Text style={styles.heroDiscountText}>
            {promo.discountType === 'percentage'
              ? `${promo.discountValue}% OFF`
              : `$${promo.discountValue} OFF`}
          </Text>
        </View>
      </View>
    </View>
  );
}

function CategoryChip({ category, selected, onPress }: any) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

function DishCard({ dish, onPress }: { dish: any; onPress: () => void }) {
  const tags: Record<string, string> = {
    spicy: '🌶️', vegan: '🌱', bestseller: '⭐', new: '✨',
    'gluten-free': '🌾', vegetarian: '🥦', healthy: '💚',
  };
  return (
    <TouchableOpacity style={styles.dishCard} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={{ uri: dish.images?.[0] || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400' }}
        style={styles.dishImage}
      />
      <View style={styles.dishInfo}>
        {dish.tags?.length > 0 && (
          <View style={styles.tagRow}>
            {dish.tags.slice(0, 2).map((t: string) => (
              <Text key={t} style={styles.tag}>{tags[t] || ''} {t}</Text>
            ))}
          </View>
        )}
        <Text style={styles.dishName} numberOfLines={1}>{dish.name}</Text>
        <Text style={styles.dishDesc} numberOfLines={2}>{dish.description}</Text>
        <View style={styles.dishFooter}>
          <Text style={styles.dishPrice}>${dish.price.toFixed(2)}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.star}>⭐</Text>
            <Text style={styles.ratingText}>
              {dish.rating?.average?.toFixed(1) || '—'} ({dish.rating?.count || 0})
            </Text>
          </View>
        </View>
        <Text style={styles.prepTime}>🕐 {dish.preparationTime} min</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [featured, setFeatured] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [dishes, setDishes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [featRes, catRes, promoRes] = await Promise.all([
        menuAPI.getFeatured(),
        menuAPI.getCategories(),
        promotionAPI.getActive(),
      ]);
      setFeatured(featRes.data.data || []);
      setCategories(catRes.data.data || []);
      setPromotions(promoRes.data.data || []);
    } catch (e) {
      // offline fallback — show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const loadDishes = useCallback(async (catId?: string) => {
    try {
      const res = await menuAPI.getDishes(catId ? { category: catId } : undefined);
      setDishes(res.data.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadDishes(selectedCat || undefined);
  }, [selectedCat]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
    loadDishes(selectedCat || undefined);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#E2A04A" />
        <Text style={styles.loaderText}>Loading menu...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E2A04A" />
      }
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <View>
          <Text style={styles.greetSub}>Good evening 👋</Text>
          <Text style={styles.greetName}>
            {user?.fullName?.split(' ')[0] || 'Guest'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => router.push('/tabs/menu' as any)}
        >
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Promo Banner */}
      <HeroBanner promotions={promotions} />

      {/* Featured */}
      {featured.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⭐ Featured Dishes</Text>
            <TouchableOpacity onPress={() => router.push('/tabs/menu' as any)}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
            {featured.map((dish) => (
              <TouchableOpacity
                key={dish._id}
                style={styles.featCard}
                onPress={() => router.push(`/dish/${dish._id}` as any)}
              >
                <Image
                  source={{ uri: dish.images?.[0] || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400' }}
                  style={styles.featImage}
                />
                <View style={styles.featOverlay} />
                <View style={styles.featContent}>
                  <Text style={styles.featName} numberOfLines={1}>{dish.name}</Text>
                  <Text style={styles.featPrice}>${dish.price.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse by Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
          <CategoryChip
            category={{ name: 'All' }}
            selected={!selectedCat}
            onPress={() => setSelectedCat(null)}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat._id}
              category={cat}
              selected={selectedCat === cat._id}
              onPress={() => setSelectedCat(cat._id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Dishes Grid */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCat
              ? categories.find((c) => c._id === selectedCat)?.name
              : 'All Dishes'}
          </Text>
          <Text style={styles.dishCount}>{dishes.length} items</Text>
        </View>
        {dishes.length === 0 ? (
          <Text style={styles.empty}>No dishes found</Text>
        ) : (
          dishes.map((dish) => (
            <DishCard
              key={dish._id}
              dish={dish}
              onPress={() => router.push(`/dish/${dish._id}` as any)}
            />
          ))
        )}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121F' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#12121F', gap: 12 },
  loaderText: { color: '#888', fontSize: 14 },

  greeting: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
  },
  greetSub: { color: '#888', fontSize: 13 },
  greetName: { color: '#FFF8F0', fontSize: 24, fontWeight: '700', marginTop: 2 },
  searchBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#242442', alignItems: 'center', justifyContent: 'center',
  },
  searchIcon: { fontSize: 20 },

  hero: { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', height: 200, marginBottom: 8 },
  heroImage: { width: '100%', height: '100%', position: 'absolute' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(18,18,31,0.6)' },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  heroBadge: {
    color: '#E2A04A', fontSize: 12, fontWeight: '700',
    backgroundColor: 'rgba(226,160,74,0.15)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, alignSelf: 'flex-start', marginBottom: 8,
  },
  heroTitle: { color: '#FFF8F0', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  heroSubtitle: { color: '#ccc', fontSize: 13 },
  heroDiscount: {
    position: 'absolute', top: 20, right: 20,
    backgroundColor: '#E2A04A', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6,
  },
  heroDiscountText: { color: '#1A1A2E', fontWeight: '800', fontSize: 14 },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { color: '#FFF8F0', fontSize: 18, fontWeight: '700' },
  seeAll: { color: '#E2A04A', fontSize: 13, fontWeight: '600' },
  dishCount: { color: '#888', fontSize: 13 },
  hScroll: { marginLeft: -4 },

  featCard: {
    width: 160, height: 120, borderRadius: 14, overflow: 'hidden',
    marginRight: 12, position: 'relative',
  },
  featImage: { width: '100%', height: '100%' },
  featOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(18,18,31,0.5)' },
  featContent: { position: 'absolute', bottom: 10, left: 10, right: 10 },
  featName: { color: '#FFF8F0', fontWeight: '700', fontSize: 13 },
  featPrice: { color: '#E2A04A', fontWeight: '700', fontSize: 14, marginTop: 2 },

  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#242442', marginRight: 10, marginBottom: 4,
  },
  chipSelected: { backgroundColor: '#E2A04A' },
  chipText: { color: '#888', fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: '#1A1A2E' },

  dishCard: {
    flexDirection: 'row', backgroundColor: '#1A1A2E', borderRadius: 16,
    marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#242442',
  },
  dishImage: { width: 110, height: 110 },
  dishInfo: { flex: 1, padding: 12 },
  tagRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  tag: { color: '#888', fontSize: 10, backgroundColor: '#242442', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  dishName: { color: '#FFF8F0', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  dishDesc: { color: '#888', fontSize: 12, lineHeight: 17, marginBottom: 8 },
  dishFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dishPrice: { color: '#E2A04A', fontSize: 16, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  star: { fontSize: 12 },
  ratingText: { color: '#888', fontSize: 12 },
  prepTime: { color: '#666', fontSize: 11, marginTop: 4 },
  empty: { color: '#555', textAlign: 'center', paddingVertical: 40 },
});
