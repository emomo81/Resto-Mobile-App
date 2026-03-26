import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: { fullName: string; email: string; password: string; phone?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

export const menuAPI = {
  getCategories: () => api.get('/categories'),
  getDishes: (params?: Record<string, string | undefined>) => api.get('/dishes', { params }),
  getFeatured: () => api.get('/dishes/featured'),
  getDish: (id: string) => api.get(`/dishes/${id}`),
};

export const orderAPI = {
  create: (data: {
    items: Array<{ dish: string; quantity: number; size?: string; addOns?: string[] }>;
    orderType: 'dine-in' | 'takeaway';
    tableNumber?: number;
    notes?: string;
    paymentMethod?: string;
  }) => api.post('/orders', data),
  getMyOrders: (params?: Record<string, string | undefined>) => api.get('/orders/my', { params }),
  getOrder: (id: string) => api.get(`/orders/${id}`),
  cancel: (id: string) => api.patch(`/orders/${id}/cancel`),
};

export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: Record<string, unknown>) => api.patch('/users/me', data),
  getFavorites: () => api.get('/users/me/favorites'),
  toggleFavorite: (dishId: string) => api.post(`/users/me/favorites/${dishId}`),
};

export const reviewAPI = {
  create: (data: { dish: string; rating: number; comment: string }) => api.post('/reviews', data),
  getDishReviews: (dishId: string, params?: { limit?: number }) =>
    api.get(`/reviews/dish/${dishId}`, { params }),
};

export const promotionAPI = {
  getActive: () => api.get('/promotions/active'),
};

export default api;