import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role?: string;
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

interface DishLike {
  _id?: string;
  id?: string;
  name: string;
  price: number;
  image?: string;
  images?: string[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loadUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface CartState {
  items: CartItem[];
  orderType: 'dine-in' | 'takeaway';
  tableNumber: number;
  notes: string;
  addItem: (item: CartItem | DishLike, quantity?: number) => void;
  removeItem: (dishId: string, size?: string) => void;
  updateQuantity: (dishId: string, quantity: number, size?: string) => void;
  clearCart: () => void;
  setOrderType: (type: 'dine-in' | 'takeaway') => void;
  setTableNumber: (n: number) => void;
  setNotes: (n: string) => void;
  total: () => number;
  itemCount: () => number;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  isAuthenticated: false,

  loadUser: async () => {
    const [[, accessToken], [, userStr]] = await AsyncStorage.multiGet(['accessToken', 'user']);
    const user = userStr ? (JSON.parse(userStr) as User) : null;
    if (accessToken && user) {
      set({ accessToken, user, isAuthenticated: true });
      return;
    }
    set({ accessToken: null, user: null, isAuthenticated: false });
  },

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

  register: async (fullName, email, password, phone) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.register({ fullName, email, password, phone });
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
    try {
      await authAPI.logout();
    } catch {
      // Ignore logout API errors and clear local session regardless.
    }
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  orderType: 'dine-in',
  tableNumber: 1,
  notes: '',

  addItem: (item, quantity = 1) => {
    const fallbackDishId =
      '_id' in item && item._id ? item._id : 'id' in item && item.id ? item.id : '';
    const normalized: CartItem = {
      dishId: 'dishId' in item && item.dishId ? item.dishId : fallbackDishId,
      name: item.name,
      price: item.price,
      quantity: 'quantity' in item && typeof item.quantity === 'number' ? item.quantity : quantity,
      size: 'size' in item ? item.size : undefined,
      addOns: 'addOns' in item ? item.addOns : undefined,
      image:
        'image' in item && item.image
          ? item.image
          : 'images' in item && Array.isArray(item.images)
            ? item.images[0]
            : undefined,
    };

    if (!normalized.dishId) {
      return;
    }

    const items = get().items;
    const existing = items.find(
      (i) => i.dishId === normalized.dishId && i.size === normalized.size
    );

    if (existing) {
      set({
        items: items.map((i) =>
          i.dishId === normalized.dishId && i.size === normalized.size
            ? { ...i, quantity: i.quantity + normalized.quantity }
            : i
        ),
      });
      return;
    }

    set({ items: [...items, normalized] });
  },

  removeItem: (dishId, size) =>
    set({
      items: get().items.filter((i) => !(i.dishId === dishId && i.size === size)),
    }),

  updateQuantity: (dishId, quantity, size) => {
    if (quantity <= 0) {
      get().removeItem(dishId, size);
      return;
    }

    set({
      items: get().items.map((i) =>
        i.dishId === dishId && i.size === size ? { ...i, quantity } : i
      ),
    });
  },

  clearCart: () => set({ items: [], notes: '' }),
  setOrderType: (orderType) => set({ orderType }),
  setTableNumber: (tableNumber) => set({ tableNumber }),
  setNotes: (notes) => set({ notes }),

  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));