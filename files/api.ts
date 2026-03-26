import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
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
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

export const menuAPI = {
  getCategories: () => api.get('/categories'),
  getDishes: (params?: any) => api.get('/dishes', { params }),
  getFeatured: () => api.get('/dishes/featured'),
  getDish: (id: string) => api.get(`/dishes/${id}`),
};

export const orderAPI = {
  create: (data: any) => api.post('/orders', data),
  getMyOrders: (params?: any) => api.get('/orders/my', { params }),
  getOrder: (id: string) => api.get(`/orders/${id}`),
  cancel: (id: string) => api.patch(`/orders/${id}/cancel`),
};

export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: any) => api.patch('/users/me', data),
  getFavorites: () => api.get('/users/me/favorites'),
  toggleFavorite: (dishId: string) => api.post(`/users/me/favorites/${dishId}`),
};

export const reviewAPI = {
  create: (data: any) => api.post('/reviews', data),
  getDishReviews: (dishId: string, params?: any) =>
    api.get(`/reviews/dish/${dishId}`, { params }),
};

export const promotionAPI = {
  getActive: () => api.get('/promotions/active'),
};

export default api;
