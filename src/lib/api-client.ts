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

  // Reviews endpoints
  async getProductReviews(productId: string, params?: { limit?: number; offset?: number; sort?: string }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    return this.request<ProductReviewsResponse>(`/reviews/product/${productId}?${queryParams}`, { requiresAuth: false });
  }

  async createReview(data: { product_id: number; rating: number; title?: string; review_text?: string }) {
    return this.request<{ review: ProductReview }>('/reviews', {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    });
  }

  async updateReview(id: string, data: { rating?: number; title?: string; review_text?: string }) {
    return this.request<{ review: ProductReview }>(`/reviews/${id}`, {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    });
  }

  async deleteReview(id: string) {
    return this.request(`/reviews/${id}`, { method: 'DELETE' });
  }

  async markReviewHelpful(id: string, isHelpful: boolean) {
    return this.request(`/reviews/${id}/helpful`, {
      method: 'POST',
      body: { is_helpful: isHelpful },
    });
  }

  // ===================== FARMING ENDPOINTS =====================

  // Ponds
  async getPonds(userId?: string) {
    const params = userId ? `?user_id=${userId}` : '';
    return this.request<{ data: FarmerPond[] }>(`/farming/ponds${params}`);
  }
  async createPond(data: Record<string, unknown>) {
    return this.request<{ data: FarmerPond }>('/farming/ponds', { method: 'POST', body: data });
  }
  async updatePond(id: string, data: Record<string, unknown>) {
    return this.request<{ data: FarmerPond }>(`/farming/ponds/${id}`, { method: 'PUT', body: data });
  }
  async deletePond(id: string) {
    return this.request(`/farming/ponds/${id}`, { method: 'DELETE' });
  }

  // Incomes
  async getIncomes(userId?: string) {
    const params = userId ? `?user_id=${userId}` : '';
    return this.request<{ data: FarmerIncome[] }>(`/farming/incomes${params}`);
  }
  async createIncome(data: Record<string, unknown>) {
    return this.request<{ data: FarmerIncome }>('/farming/incomes', { method: 'POST', body: data });
  }
  async deleteIncome(id: string) {
    return this.request(`/farming/incomes/${id}`, { method: 'DELETE' });
  }

  // Expenses
  async getExpenses(userId?: string) {
    const params = userId ? `?user_id=${userId}` : '';
    return this.request<{ data: FarmerExpense[] }>(`/farming/expenses${params}`);
  }
  async createExpense(data: Record<string, unknown>) {
    return this.request<{ data: FarmerExpense }>('/farming/expenses', { method: 'POST', body: data });
  }
  async deleteExpense(id: string) {
    return this.request(`/farming/expenses/${id}`, { method: 'DELETE' });
  }

  // Samplings
  async getSamplings(userId?: string) {
    const params = userId ? `?user_id=${userId}` : '';
    return this.request<{ data: FarmerSampling[] }>(`/farming/samplings${params}`);
  }
  async createSampling(data: Record<string, unknown>) {
    return this.request<{ data: FarmerSampling }>('/farming/samplings', { method: 'POST', body: data });
  }
  async deleteSampling(id: string) {
    return this.request(`/farming/samplings/${id}`, { method: 'DELETE' });
  }

  // Dashboard Settings
  async getDashboardSettings() {
    return this.request<{ data: Record<string, unknown> | null }>('/farming/settings');
  }
  async saveDashboardSettings(settings: Record<string, unknown>) {
    return this.request('/farming/settings', { method: 'PUT', body: { settings } });
  }

  // Admin: User Dashboard
  async getAdminUserDashboard(userId: string) {
    return this.request<{ ponds: FarmerPond[]; incomes: FarmerIncome[]; expenses: FarmerExpense[]; summary: Record<string, number> }>(`/farming/admin/user-dashboard/${userId}`);
  }

  // Extras
  async getCategories() {
    return this.request<{ data: Category[] }>('/categories', { requiresAuth: false });
  }
  async getHeroSlides() {
    return this.request<{ data: HeroSlide[] }>('/hero-slides', { requiresAuth: false });
  }
  async getDeliveryRules() {
    return this.request<{ data: DeliveryRule[] }>('/delivery-rules', { requiresAuth: false });
  }
  async getCustomPage(slug: string) {
    return this.request<{ data: CustomPage }>(`/custom-pages/${slug}`, { requiresAuth: false });
  }
  async getSmtpSettings() {
    return this.request<{ data: SmtpSettings }>('/smtp');
  }
  async getProductImages(productId: string) {
    return this.request<{ data: ProductImage[] }>(`/product-images/${productId}`, { requiresAuth: false });
  }

  // Backup endpoints
  async createBackup(scope: string) {
    return this.request('/backup', { method: 'POST', body: { backup_scope: scope } });
  }
  async listBackups() {
    return this.request<{ backups: any[] }>('/backup');
  }
  async restoreBackup(fileId: string) {
    return this.request('/backup/restore', { method: 'POST', body: { file_id: fileId } });
  }
  async downloadBackup(logId?: string, driveFileId?: string) {
    return this.request('/backup/download', { method: 'POST', body: { log_id: logId, drive_file_id: driveFileId } });
  }
  async getBackupStats() {
    return this.request('/backup/stats');
  }
  async cleanupBackups(params: { max_backups?: number; max_size_mb?: number }) {
    return this.request('/backup/cleanup', { method: 'POST', body: params });
  }

  // Google Drive endpoints
  async checkDriveConnection() {
    return this.request<{ connected: boolean; drive_email?: string }>('/backup/drive/check');
  }
  async getDriveAuthUrl(redirectUri: string) {
    return this.request<{ auth_url: string }>('/backup/drive/auth-url', { method: 'POST', body: { redirect_uri: redirectUri } });
  }
  async exchangeDriveCode(code: string, redirectUri: string) {
    return this.request<{ success: boolean; drive_email?: string }>('/backup/drive/exchange', { method: 'POST', body: { code, redirect_uri: redirectUri } });
  }
  async disconnectDrive() {
    return this.request('/backup/drive/disconnect', { method: 'POST' });
  }
  async listDriveBackups() {
    return this.request<{ files: any[] }>('/backup/drive/files');
  }

  // ===================== FILE UPLOAD =====================

  private async uploadFile(endpoint: string, formData: FormData): Promise<ApiResponse<any>> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) return { error: data.error || 'Upload failed' };
      return { data };
    } catch (error) {
      console.error('Upload failed:', error);
      return { error: 'Network error during upload.' };
    }
  }

  async uploadProductImage(file: File, productId?: number, altText?: string, displayOrder?: number, isPrimary?: boolean) {
    const formData = new FormData();
    formData.append('image', file);
    if (productId) formData.append('product_id', String(productId));
    if (altText) formData.append('alt_text', altText);
    if (displayOrder !== undefined) formData.append('display_order', String(displayOrder));
    if (isPrimary) formData.append('is_primary', '1');
    return this.uploadFile('/upload/product-image', formData);
  }

  async uploadProductImages(files: File[], productId?: number) {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    if (productId) formData.append('product_id', String(productId));
    return this.uploadFile('/upload/product-images', formData);
  }

  async uploadProductMainImage(productId: number, file: File) {
    const formData = new FormData();
    formData.append('image', file);
    return this.uploadFile(`/upload/product-main-image/${productId}`, formData);
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.uploadFile('/upload/avatar', formData);
  }

  async uploadGeneralImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    return this.uploadFile('/upload/image', formData);
  }

  async deleteUploadedFile(url: string) {
    return this.request('/upload/file', { method: 'DELETE', body: { url } });
  }
}

// Types
export interface User {
  id: number; email: string; full_name: string; role: string;
  mobile?: string; division?: string; district?: string; upazila?: string;
  village?: string; avatar_url?: string; is_active?: boolean;
  created_at: string; updated_at?: string;
}

export interface Product {
  id: number; name: string; description: string | null; price: number;
  discount_percentage: number; category: string; image_url: string | null;
  external_link: string | null; stock_quantity: number; sku: string | null;
  unit: string | null; reorder_level: number; company_id: number | null;
  brand_id: number | null; meta_title: string | null; meta_description: string | null;
  seo_url: string | null; focus_keyword: string | null; image_alt_text: string | null;
  cost_price: number | null; weight_kg: number | null;
  created_at: string; updated_at: string;
}

export interface MarketPrice {
  id: number; fish_name: string; fish_name_bn: string; price_per_kg: number;
  min_price: number | null; max_price: number | null; market_name: string | null;
  division: string; district: string; upazila: string; price_date: string;
  created_at: string; updated_at: string;
}

export interface SystemSetting {
  id: number; setting_key: string; setting_value: string | null;
  description: string | null;
  updated_at: string; updated_by: number | null;
}

export interface AdSettings {
  id: number; ad_client_id: string | null;
  header_ad_enabled: boolean; header_ad_slot: string | null;
  footer_ad_enabled: boolean; footer_ad_slot: string | null;
  sidebar_ad_enabled: boolean; sidebar_ad_slot: string | null;
  in_article_ad_enabled: boolean; in_article_ad_slot: string | null;
  between_modules_ad_enabled: boolean; between_modules_ad_slot: string | null;
}

export interface PageContent {
  id: number; section_key: string; section_name: string;
  content: unknown; is_active: boolean; display_order: number;
  created_at: string; updated_at: string;
}

export interface OrderItem {
  id: number; order_id: number; product_id: number;
  product_name: string; product_image: string | null;
  quantity: number; unit_price: number;
  discount_percentage: number; total_price: number;
}

export interface OrderStatusHistory {
  id: number; order_id: number;
  old_status: string; new_status: string;
  notes: string | null;
  changed_by_name?: string;
  created_at: string;
}

export interface Order {
  id: number; order_number: string; user_id?: number | null;
  customer_name?: string; customer_phone?: string; customer_email?: string | null;
  shipping_address?: string; division?: string | null; district?: string | null;
  upazila?: string | null;
  shipping_name?: string; shipping_mobile?: string;
  shipping_division?: string; shipping_district?: string; shipping_upazila?: string;
  status?: string; payment_method?: string; payment_status?: string;
  subtotal?: number; discount_amount?: number; shipping_cost?: number; total_amount?: number;
  notes?: string | null; transaction_id?: string | null; sender_number?: string | null;
  payment_trx_id?: string; payment_sender_number?: string;
  customer_note?: string; admin_note?: string;
  courier_name?: string; tracking_number?: string; tracking_url?: string;
  estimated_delivery?: string; shipped_at?: string | null; delivered_at?: string | null;
  created_at: string; updated_at: string;
  items?: OrderItem[];
  status_history?: OrderStatusHistory[];
  item_count?: number;
  [key: string]: any;
}

export interface CourierService {
  id: number; name: string; name_bn?: string;
  api_base_url?: string | null;
  api_key?: string | null;
  tracking_url_template?: string | null;
  is_active: boolean;
  display_order: number;
}

export interface CreateOrderData {
  customer_name?: string; customer_phone?: string; customer_email?: string;
  shipping_address?: string; division?: string; district?: string; upazila?: string;
  shipping_name?: string; shipping_mobile?: string;
  shipping_division?: string; shipping_district?: string; shipping_upazila?: string;
  payment_method?: string; notes?: string; customer_note?: string;
  items: { product_id: number; quantity: number }[];
  subtotal?: number; discount_amount?: number;
  shipping_cost?: number; total_amount?: number;
  payment_trx_id?: string; payment_sender_number?: string;
}

export interface OrderStats {
  total_orders: number; pending_orders: number;
  total_revenue: number;
  recent_orders: Order[];
  low_stock_products: { id: number; name: string; stock_quantity: number; stock_status: string }[];
  status_summary?: any;
  today?: any;
  this_month?: any;
  [key: string]: any;
}

export interface ProductReview {
  id: number; product_id: number; user_id: number | null;
  rating: number; title: string | null; comment: string | null;
  review_text?: string | null;
  is_approved: boolean; is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string; updated_at: string;
  user_name: string | null; user_avatar: string | null;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: Record<number, number>;
  rating_breakdown?: Record<number, number>;
}

export interface ProductReviewsResponse {
  reviews: ProductReview[];
  stats: ReviewStats;
  total: number;
  user_review?: any;
  limit: number;
  offset: number;
}

// Farming Types
export interface FarmerPond {
  id: number; user_id: number; name: string; area: number; area_unit: string;
  depth: number; depth_unit: string; fish_types: string[] | null; fish_count: number;
  fish_stock_entries: unknown[] | null; stocking_date: string | null;
  total_stocking_cost: number; status: string; notes: string | null;
  created_at: string; updated_at: string;
}
export interface FarmerIncome {
  id: number; user_id: number; date: string; category: string; description: string | null;
  amount: number; pond_name: string | null; fish_type: string | null;
  fish_weight: number | null; fish_price: number | null; created_at: string;
}
export interface FarmerExpense {
  id: number; user_id: number; date: string; category: string; description: string | null;
  amount: number; pond_name: string | null; created_at: string;
}
export interface FarmerSampling {
  id: number; user_id: number; pond_id: number | null; pond_name: string; date: string;
  fish_entries: unknown[] | null; total_fish: number; total_weight: number;
  avg_weight: number; notes: string | null; created_at: string;
}
export interface Category {
  id: number; name: string; name_bn: string; slug: string; description: string | null;
  icon: string | null; is_active: boolean; display_order: number;
}
export interface HeroSlide {
  id: number; title: string; subtitle: string | null; tagline: string | null;
  button_text: string | null; button_link: string | null; background_type: string | null;
  background_value: string | null; is_active: boolean; display_order: number;
}
export interface DeliveryRule {
  id: number; rule_type: string; district_name: string | null; min_value: number;
  max_value: number | null; charge_amount: number; is_active: boolean; priority: number;
}
export interface CustomPage {
  id: number; title: string; title_bn: string | null; slug: string; content: string | null;
  content_type: string; meta_title: string | null; meta_description: string | null; status: string;
}
export interface SmtpSettings {
  id: number; smtp_host: string; smtp_port: number; smtp_secure: boolean;
  smtp_user: string; smtp_password: string; smtp_from_name: string;
  smtp_from_email: string; is_enabled: boolean;
}
export interface ProductImage {
  id: number; product_id: number; image_url: string; alt_text: string | null;
  display_order: number; is_primary: boolean;
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
