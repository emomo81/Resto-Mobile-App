import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  favorites: string[];
}

interface CartItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  addOns?: string[];
  image?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

interface CartState {
  items: CartItem[];
  orderType: 'dine-in' | 'takeaway';
  tableNumber: number;
  notes: string;
  addItem: (item: CartItem) => void;
  removeItem: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  clearCart: () => void;
  setOrderType: (type: 'dine-in' | 'takeaway') => void;
  setTableNumber: (n: number) => void;
  setNotes: (n: string) => void;
  total: () => number;
  itemCount: () => number;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.login({ email, password });
      const { accessToken, refreshToken, user } = res.data;
      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
        ['user', JSON.stringify(user)],
      ]);
      set({ user, accessToken, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.register(data);
      const { accessToken, refreshToken, user } = res.data;
      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
        ['user', JSON.stringify(user)],
      ]);
      set({ user, accessToken, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try { await authAPI.logout(); } catch {}
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  loadUser: async () => {
    const [token, userStr] = await AsyncStorage.multiGet(['accessToken', 'user']);
    const accessToken = token[1];
    const user = userStr[1] ? JSON.parse(userStr[1]) : null;
    if (accessToken && user) {
      set({ accessToken, user, isAuthenticated: true });
    }
  },
}));

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  orderType: 'dine-in',
  tableNumber: 1,
  notes: '',

  addItem: (newItem) => {
    const items = get().items;
    const existing = items.find(
      (i) => i.dishId === newItem.dishId && i.size === newItem.size
    );
    if (existing) {
      set({
        items: items.map((i) =>
          i.dishId === newItem.dishId && i.size === newItem.size
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        ),
      });
    } else {
      set({ items: [...items, newItem] });
    }
  },

  removeItem: (dishId) =>
    set({ items: get().items.filter((i) => i.dishId !== dishId) }),

  updateQuantity: (dishId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(dishId);
    } else {
      set({
        items: get().items.map((i) =>
          i.dishId === dishId ? { ...i, quantity } : i
        ),
      });
    }
  },

  clearCart: () => set({ items: [], notes: '' }),

  setOrderType: (orderType) => set({ orderType }),
  setTableNumber: (tableNumber) => set({ tableNumber }),
  setNotes: (notes) => set({ notes }),

  total: () =>
    get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  itemCount: () =>
    get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
