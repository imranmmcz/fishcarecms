/**
 * MySQL Backend API Client
 * Hostinger-এ ডেপ্লয় করার সময় এই ক্লায়েন্ট ব্যবহার করুন
 */

// API Base URL - Hostinger-এ ডেপ্লয় করার পর আপডেট করুন
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://blog.fishcare.com.bd/api';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  removeToken(): void {
    localStorage.removeItem('auth_token');
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers = {}, requiresAuth = true } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (requiresAuth) {
      const token = this.getToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Request failed' };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Auth endpoints
  async signUp(email: string, password: string, fullName: string, addressData?: {
    mobile?: string;
    division?: string;
    district?: string;
    upazila?: string;
    village?: string;
  }) {
    const response = await this.request<{ user: User; token: string }>('/auth/signup', {
      method: 'POST',
      body: { email, password, full_name: fullName, ...addressData },
      requiresAuth: false,
    });

    if (response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async signIn(email: string, password: string) {
    const response = await this.request<{ user: User; token: string }>('/auth/signin', {
      method: 'POST',
      body: { email, password },
      requiresAuth: false,
    });

    if (response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async signOut() {
    await this.request('/auth/signout', { method: 'POST' });
    this.removeToken();
  }

  async getCurrentUser() {
    return this.request<{ user: User }>('/auth/me');
  }

  async updatePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/password', {
      method: 'PUT',
      body: { currentPassword, newPassword },
    });
  }

  // Users endpoints
  async getUsers(params?: { search?: string; division?: string; district?: string; upazila?: string; limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    return this.request<{ users: User[]; total: number }>(`/users?${queryParams}`);
  }

  async getUser(id: string) {
    return this.request<{ user: User }>(`/users/${id}`);
  }

  async updateUser(id: string, data: Partial<User>) {
    return this.request<{ user: User }>(`/users/${id}`, {
      method: 'PUT',
      body: data as Record<string, unknown>,
    });
  }

  async updateUserRole(id: string, role: 'user' | 'admin') {
    return this.request(`/users/${id}/role`, {
      method: 'PATCH',
      body: { role },
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  // Products endpoints
  async getProducts(params?: { category?: string; search?: string; limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    return this.request<{ products: Product[]; total: number }>(`/products?${queryParams}`, { requiresAuth: false });
  }

  async getProduct(id: string) {
    return this.request<{ product: Product }>(`/products/${id}`, { requiresAuth: false });
  }

  async createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
    return this.request<{ product: Product }>('/products', {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    });
  }

  async updateProduct(id: string, data: Partial<Product>) {
    return this.request<{ product: Product }>(`/products/${id}`, {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, { method: 'DELETE' });
  }

  // Market Prices endpoints
  async getMarketPrices(params?: { division?: string; district?: string; upazila?: string; search?: string; limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    return this.request<{ prices: MarketPrice[]; total: number }>(`/market-prices?${queryParams}`, { requiresAuth: false });
  }

  async createMarketPrice(data: Omit<MarketPrice, 'id' | 'created_at' | 'updated_at'>) {
    return this.request<{ price: MarketPrice }>('/market-prices', {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    });
  }

  async updateMarketPrice(id: string, data: Partial<MarketPrice>) {
    return this.request<{ price: MarketPrice }>(`/market-prices/${id}`, {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    });
  }

  async deleteMarketPrice(id: string) {
    return this.request(`/market-prices/${id}`, { method: 'DELETE' });
  }

  // Settings endpoints
  async getSettings() {
    return this.request<{ settings: SystemSetting[] }>('/settings');
  }

  async updateSetting(key: string, value: string, description?: string) {
    return this.request<{ setting: SystemSetting }>(`/settings/${key}`, {
      method: 'PUT',
      body: { value, description },
    });
  }

  // Ad Settings endpoints
  async getAdSettings() {
    return this.request<{ settings: AdSettings }>('/ad-settings', { requiresAuth: false });
  }

  async updateAdSettings(data: Partial<AdSettings>) {
    return this.request<{ settings: AdSettings }>('/ad-settings', {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    });
  }

  // Page Content endpoints
  async getPageContent(activeOnly = true) {
    return this.request<{ content: PageContent[] }>(`/page-content?active_only=${activeOnly}`, { requiresAuth: false });
  }

  async getPageSection(key: string) {
    return this.request<{ section: PageContent }>(`/page-content/section/${key}`, { requiresAuth: false });
  }

  async createPageContent(data: Omit<PageContent, 'id' | 'created_at' | 'updated_at'>) {
    return this.request<{ section: PageContent }>('/page-content', {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    });
  }

  async updatePageContent(id: string, data: Partial<PageContent>) {
    return this.request<{ section: PageContent }>(`/page-content/${id}`, {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    });
  }

  async deletePageContent(id: string) {
    return this.request(`/page-content/${id}`, { method: 'DELETE' });
  }

  // Orders endpoints
  async getOrders(params?: { status?: string; limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    return this.request<{ orders: Order[]; total: number }>(`/orders?${queryParams}`);
  }

  async getOrder(id: string) {
    return this.request<{ order: Order }>(`/orders/${id}`);
  }

  async createOrder(data: CreateOrderData) {
    return this.request<{ order: Order; message: string }>('/orders', {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    });
  }

  async cancelOrder(id: string) {
    return this.request<{ message: string }>(`/orders/${id}/cancel`, { method: 'POST' });
  }

  async updateOrderStatus(id: string, status: string, note?: string) {
    return this.request<{ order: Order }>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: { status, note },
    });
  }

  async updateOrderShipping(id: string, data: {
    courier_name?: string;
    tracking_number?: string;
    tracking_url?: string;
    estimated_delivery?: string;
  }) {
    return this.request<{ order: Order }>(`/orders/${id}/shipping`, {
      method: 'PATCH',
      body: data,
    });
  }

  async getCourierServices() {
    return this.request<{ couriers: CourierService[] }>('/orders/couriers', { requiresAuth: true });
  }

  async getOrderStats() {
    return this.request<OrderStats>('/orders/stats/summary');
  }
}

// Types
export interface User {
  id: number;
  email: string;
  full_name: string | null;
  mobile: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
  village: string | null;
  role: 'user' | 'admin';
  avatar_url: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  discount_percentage: number;
  category: string;
  image_url: string | null;
  external_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketPrice {
  id: number;
  fish_name: string;
  fish_name_bn: string;
  price_per_kg: number;
  min_price: number | null;
  max_price: number | null;
  division: string;
  district: string;
  upazila: string;
  market_name: string | null;
  price_date: string;
  created_at: string;
  updated_at: string;
}

export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string | null;
  description: string | null;
  updated_at: string;
  updated_by: number | null;
}

export interface AdSettings {
  id: number;
  ad_client_id: string | null;
  header_ad_enabled: boolean;
  header_ad_slot: string | null;
  sidebar_ad_enabled: boolean;
  sidebar_ad_slot: string | null;
  footer_ad_enabled: boolean;
  footer_ad_slot: string | null;
  in_article_ad_enabled: boolean;
  in_article_ad_slot: string | null;
  between_modules_ad_enabled: boolean;
  between_modules_ad_slot: string | null;
}

export interface PageContent {
  id: number;
  section_key: string;
  section_name: string;
  content: Record<string, unknown>;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_price: number;
}

export interface OrderStatusHistory {
  id: number;
  order_id: number;
  status: string;
  note: string | null;
  changed_by: number | null;
  changed_by_name?: string;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'verification_pending';
  payment_method: string;
  payment_trx_id: string | null;
  payment_sender_number: string | null;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  shipping_name: string;
  shipping_mobile: string;
  shipping_division: string | null;
  shipping_district: string | null;
  shipping_upazila: string | null;
  shipping_address: string | null;
  customer_note: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
  // Shipment Tracking fields
  courier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  estimated_delivery: string | null;
  items?: OrderItem[];
  status_history?: OrderStatusHistory[];
  customer_name?: string;
  customer_email?: string;
  item_count?: number;
}

export interface CourierService {
  id: number;
  name: string;
  name_bn: string | null;
  tracking_url_template: string | null;
  is_active: boolean;
  display_order: number;
}

export interface CreateOrderData {
  items: { product_id: number; quantity: number }[];
  shipping_name: string;
  shipping_mobile: string;
  shipping_division?: string;
  shipping_district?: string;
  shipping_upazila?: string;
  shipping_address?: string;
  payment_method?: string;
  customer_note?: string;
  // Manual payment fields (bKash/Nagad)
  payment_trx_id?: string;
  payment_sender_number?: string;
}

export interface OrderStats {
  status_summary: { status: string; count: number; total_amount: number }[];
  today: { count: number; total_amount: number };
  this_month: { count: number; total_amount: number };
  recent_orders: Order[];
  low_stock_products: { id: number; name: string; stock_quantity: number; stock_status: string }[];
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
