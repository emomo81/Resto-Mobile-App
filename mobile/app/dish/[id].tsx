import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { menuAPI, reviewAPI, userAPI } from '../../src/services/api';
import { useCartStore, useAuthStore } from '../../src/store';

const C = {
  bg: '#12121F', card: '#1A1A2E', elevated: '#242442',
  accent: '#E2A04A', text: '#FFF8F0', sub: '#888', muted: '#666',
  border: '#242442', danger: '#E25555', green: '#4CAF50',
};

const TAG_COLORS: Record<string, string> = {
  bestseller: '#E2A04A', vegan: '#4CAF50', spicy: '#E25555',
  healthy: '#4DB6AC', new: '#7C6FCD', vegetarian: '#66BB6A',
  'gluten-free': '#FF8A65',
};

interface Dish {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: { name: string };
  tags: string[];
  sizes?: { name: string; price: number }[];
  addOns?: { name: string; price: number }[];
  isAvailable: boolean;
  averageRating?: number;
  totalReviews?: number;
}

interface Review {
  _id: string;
  user: { fullName: string; avatar?: string };
  rating: number;
  comment: string;
  createdAt: string;
}

export default function DishDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();

  const [dish, setDish] = useState<Dish | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  const [selectedSize, setSelectedSize] = useState<{ name: string; price: number } | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<{ name: string; price: number }[]>([]);
  const [quantity, setQuantity] = useState(1);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadDish();
  }, [id]);

  const loadDish = async () => {
    try {
      setLoading(true);
      const [dishRes, reviewsRes] = await Promise.all([
        menuAPI.getDish(id),
        reviewAPI.getDishReviews(id, { limit: 10 }),
      ]);
      const d = dishRes.data?.data || dishRes.data;
      setDish(d);
      if (d.sizes?.length > 0) setSelectedSize(d.sizes[0]);
      const r = reviewsRes.data?.data || reviewsRes.data || [];
      setReviews(Array.isArray(r) ? r : []);

      if (isAuthenticated) {
        try {
          const favRes = await userAPI.getFavorites();
          const favs = favRes.data?.data || favRes.data || [];
          setIsFavorite(favs.some((f: any) => (f._id || f) === id));
        } catch {}
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to save favorites.');
      return;
    }
    try {
      await userAPI.toggleFavorite(id);
      setIsFavorite(!isFavorite);
    } catch {}
  };

  const toggleAddOn = (addOn: { name: string; price: number }) => {
    setSelectedAddOns((prev) =>
      prev.find((a) => a.name === addOn.name)
        ? prev.filter((a) => a.name !== addOn.name)
        : [...prev, addOn]
    );
  };

  const totalPrice = () => {
    const base = selectedSize ? selectedSize.price : (dish?.price || 0);
    const addOnTotal = selectedAddOns.reduce((s, a) => s + a.price, 0);
    return (base + addOnTotal) * quantity;
  };

  const handleAddToCart = () => {
    if (!dish) return;
    addItem({
      dishId: dish._id,
      name: dish.name,
      price: selectedSize ? selectedSize.price : dish.price,
      quantity,
      size: selectedSize?.name,
      addOns: selectedAddOns.map((a) => a.name),
      image: dish.image,
    });
    Alert.alert('Added to Cart', `${dish.name} added successfully!`, [
      { text: 'Keep Shopping', style: 'cancel' },
      { text: 'View Cart', onPress: () => router.push('/tabs/cart' as any) },
    ]);
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to leave a review.');
      return;
    }
    if (!reviewComment.trim()) {
      Alert.alert('Comment Required', 'Please write a comment.');
      return;
    }
    try {
      setSubmittingReview(true);
      await reviewAPI.create({ dish: id, rating: reviewRating, comment: reviewComment.trim() });
      setReviewComment('');
      setReviewRating(5);
      setShowReviewForm(false);
      Alert.alert('Thank you!', 'Your review has been submitted.');
      loadDish();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating: number, size = 16, interactive = false, onPress?: (r: number) => void) => (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity key={s} disabled={!interactive} onPress={() => onPress?.(s)}>
          <Text style={{ fontSize: size, color: s <= rating ? '#E2A04A' : '#444' }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  if (!dish) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: C.text, fontSize: 16 }}>Dish not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: C.accent }}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: dish.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800' }}
            style={styles.heroImage}
          />
          <SafeAreaView edges={['top']} style={styles.heroOverlay}>
            <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
              <Text style={{ color: C.text, fontSize: 18 }}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleFavorite} style={styles.circleBtn}>
              <Text style={{ fontSize: 20 }}>{isFavorite ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </SafeAreaView>

          {dish.tags?.length > 0 && (
            <View style={styles.heroTags}>
              {dish.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={[styles.tagChip, { backgroundColor: TAG_COLORS[tag] || '#555' }]}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Title & Rating */}
          <View style={styles.titleRow}>
            <Text style={styles.dishName}>{dish.name}</Text>
            {!dish.isAvailable && (
              <View style={styles.unavailableBadge}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>UNAVAILABLE</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.categoryText}>{dish.category?.name}</Text>
            {dish.averageRating ? (
              <View style={styles.ratingRow}>
                {renderStars(Math.round(dish.averageRating))}
                <Text style={styles.ratingText}>
                  {dish.averageRating.toFixed(1)} ({dish.totalReviews})
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.description}>{dish.description}</Text>

          {/* Size Selection */}
          {dish.sizes && dish.sizes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Size</Text>
              <View style={styles.sizeRow}>
                {dish.sizes.map((size) => (
                  <TouchableOpacity
                    key={size.name}
                    style={[styles.sizeChip, selectedSize?.name === size.name && styles.sizeChipActive]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text style={[styles.sizeLabel, selectedSize?.name === size.name && { color: '#12121F' }]}>
                      {size.name}
                    </Text>
                    <Text style={[styles.sizePrice, selectedSize?.name === size.name && { color: '#12121F' }]}>
                      ${size.price.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Add-Ons */}
          {dish.addOns && dish.addOns.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add-Ons (Optional)</Text>
              {dish.addOns.map((addOn) => {
                const selected = !!selectedAddOns.find((a) => a.name === addOn.name);
                return (
                  <TouchableOpacity
                    key={addOn.name}
                    style={[styles.addOnRow, selected && styles.addOnRowActive]}
                    onPress={() => toggleAddOn(addOn)}
                  >
                    <View style={[styles.checkbox, selected && styles.checkboxActive]}>
                      {selected && <Text style={{ color: '#12121F', fontSize: 11, fontWeight: '800' }}>✓</Text>}
                    </View>
                    <Text style={[styles.addOnName, selected && { color: C.text }]}>{addOn.name}</Text>
                    <Text style={styles.addOnPrice}>+${addOn.price.toFixed(2)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Quantity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyBtn}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{quantity}</Text>
              <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qtyBtn}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reviews */}
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
              <TouchableOpacity onPress={() => setShowReviewForm(!showReviewForm)}>
                <Text style={{ color: C.accent, fontSize: 14 }}>
                  {showReviewForm ? 'Cancel' : '+ Write Review'}
                </Text>
              </TouchableOpacity>
            </View>

            {showReviewForm && (
              <View style={styles.reviewForm}>
                <Text style={styles.formLabel}>Your Rating</Text>
                {renderStars(reviewRating, 28, true, setReviewRating)}
                <Text style={[styles.formLabel, { marginTop: 12 }]}>Your Comment</Text>
                <TextInput
                  style={styles.reviewInput}
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  placeholder="Tell us about your experience..."
                  placeholderTextColor={C.muted}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  style={[styles.submitBtn, submittingReview && { opacity: 0.6 }]}
                  onPress={handleSubmitReview}
                  disabled={submittingReview}
                >
                  {submittingReview
                    ? <ActivityIndicator color="#12121F" />
                    : <Text style={styles.submitBtnText}>Submit Review</Text>}
                </TouchableOpacity>
              </View>
            )}

            {reviews.length === 0 ? (
              <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>
            ) : (
              reviews.map((review) => (
                <View key={review._id} style={styles.reviewCard}>
                  <View style={styles.reviewTop}>
                    <View style={styles.reviewAvatar}>
                      <Text style={{ color: C.text, fontWeight: '700' }}>
                        {review.user?.fullName?.[0] || '?'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewUser}>{review.user?.fullName || 'User'}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {renderStars(review.rating, 13)}
                        <Text style={styles.reviewDate}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))
            )}
          </View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      {dish.isAvailable && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>${totalPrice().toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.addCartBtn} onPress={handleAddToCart}>
            <Text style={styles.addCartText}>Add to Cart 🛒</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  heroContainer: { position: 'relative', height: 320 },
  heroImage: { width: '100%', height: 320, resizeMode: 'cover' },
  heroOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8,
  },
  circleBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(18,18,31,0.75)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroTags: { position: 'absolute', bottom: 16, left: 16, flexDirection: 'row', gap: 8 },
  tagChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  content: { padding: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  dishName: { flex: 1, color: C.text, fontSize: 26, fontWeight: '800', lineHeight: 32 },
  unavailableBadge: { backgroundColor: C.danger, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  categoryText: { color: C.accent, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingText: { color: C.sub, fontSize: 13 },
  description: { color: C.sub, fontSize: 15, lineHeight: 22, marginTop: 12 },
  section: { marginTop: 24 },
  sectionTitle: { color: C.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sizeChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, alignItems: 'center',
  },
  sizeChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  sizeLabel: { color: C.sub, fontSize: 13, fontWeight: '600' },
  sizePrice: { color: C.text, fontSize: 14, fontWeight: '800', marginTop: 2 },
  addOnRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, marginBottom: 8,
  },
  addOnRowActive: { borderColor: C.accent },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: C.muted,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxActive: { backgroundColor: C.accent, borderColor: C.accent },
  addOnName: { flex: 1, color: C.sub, fontSize: 14 },
  addOnPrice: { color: C.accent, fontSize: 14, fontWeight: '700' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  qtyBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.elevated, justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnText: { color: C.text, fontSize: 22, fontWeight: '300' },
  qtyNum: { color: C.text, fontSize: 22, fontWeight: '800', minWidth: 32, textAlign: 'center' },
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  reviewForm: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 16,
  },
  formLabel: { color: C.sub, fontSize: 13, marginBottom: 8 },
  reviewInput: {
    backgroundColor: C.elevated, borderRadius: 10, padding: 12,
    color: C.text, fontSize: 14, marginTop: 4, minHeight: 80, textAlignVertical: 'top',
  },
  submitBtn: { backgroundColor: C.accent, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#12121F', fontSize: 15, fontWeight: '800' },
  noReviews: { color: C.muted, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  reviewCard: {
    backgroundColor: C.card, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 10,
  },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.accent + '33', justifyContent: 'center', alignItems: 'center',
  },
  reviewUser: { color: C.text, fontSize: 14, fontWeight: '700' },
  reviewDate: { color: C.muted, fontSize: 11 },
  reviewComment: { color: C.sub, fontSize: 14, lineHeight: 20 },
  backBtn: { marginTop: 12, padding: 12 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32,
  },
  totalLabel: { color: C.sub, fontSize: 12 },
  totalPrice: { color: C.accent, fontSize: 24, fontWeight: '900' },
  addCartBtn: { backgroundColor: C.accent, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  addCartText: { color: '#12121F', fontSize: 16, fontWeight: '800' },
});
