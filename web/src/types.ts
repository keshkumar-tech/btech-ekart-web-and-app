// Shared API types (mirrors the Django DRF serializers).

export type Role = "customer" | "admin";

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: Role;
  avatar: string;
  college: string;
  branch: string;
  year: number | null;
  email_verified: boolean;
  date_joined: string;
}

export type ProductType = "notes" | "pyq" | "quantum" | "syllabus" | "combo";

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  is_active: boolean;
}

export interface Branch {
  id: number;
  name: string;
  short_name: string;
  slug: string;
  is_active: boolean;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  branch: Branch | null;
  semester: number;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  description: string;
  type: ProductType;
  type_display: string;
  category: Category | null;
  branch: Branch | null;
  subject: Subject | null;
  year: number | null;
  semester: number | null;
  subject_code: string;
  price: string;
  mrp: string;
  discount: number;
  you_save: number;
  cover_image: string | null;
  page_count: number;
  rating: string;
  rating_count: number;
  sold_count: number;
  tags: string;
  tags_list: string[];
  is_active: boolean;
  is_trending: boolean;
  is_new_arrival: boolean;
  created_at: string;
}

export interface ProductDetail extends Product {
  related_products: Product[];
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  badge_text: string;
  is_active: boolean;
}

export interface SiteSetting {
  id: number;
  key: string;
  value: string;
  image: string | null;
}

export interface Coupon {
  id: number;
  code: string;
  description: string;
  discount_type: "percent" | "flat";
  value: string;
  min_order_amount: string;
  max_discount: string | null;
  valid_from?: string;
  valid_to: string | null;
  usage_limit: number | null;
  used_count: number;
  per_user_limit: number;
  is_active: boolean;
  created_at?: string;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  total_price: string;
  mrp_price: string;
  added_at: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  item_count: number;
  subtotal: string;
  mrp_total: string;
  you_save: string;
  updated_at: string;
}

export interface Wishlist {
  id: number;
  products: Product[];
  item_count: number;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  product: Product;
  title: string;
  price: string;
  mrp: string;
  quantity: number;
  total_price: string;
  download_count: number;
  downloads_remaining: number;
}

export type OrderStatus =
  | "pending"
  | "pending_verification"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

export type PaymentMethod = "razorpay" | "manual_qr" | "free";

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  status_display: string;
  payment_method: PaymentMethod;
  payment_method_display: string;
  subtotal: string;
  discount_amount: string;
  coupon_code: string;
  total_amount: string;
  utr_number: string;
  admin_note: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  invoice_number: string;
  paid_at: string | null;
  total_items: number;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface LibraryItem {
  order_item_id: number;
  order_number: string;
  purchased_at: string | null;
  title: string;
  product_slug: string;
  cover_image: string | null;
  type: ProductType;
  subject_code: string;
  page_count: number;
  download_count: number;
  downloads_remaining: number;
  download_url: string;
  has_pdf: boolean;
}

export interface Review {
  id: number;
  product: number;
  product_title: string;
  product_slug?: string;
  user: number;
  user_name: string;
  user_avatar: string;
  user_email?: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  order: number;
  post_count: number;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  category: BlogCategory | null;
  author_name: string;
  excerpt: string;
  cover_image: string | null;
  tags_list: string[];
  tags?: string;
  read_minutes: number;
  views: number;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  content?: string;
  updated_at?: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface RazorpayCheckoutData {
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  order_number: string;
  name: string;
  description: string;
  prefill: { name?: string; email?: string; contact?: string };
}

export interface ManualQRData {
  order_number: string;
  amount: string;
  upi_qr_image: string;
  support_email: string;
  support_phone: string;
  whatsapp_link: string;
  status: OrderStatus;
}

// ---- Admin dashboard types ----

export interface OverviewStats {
  total_revenue: string;
  revenue_today: string;
  revenue_week: string;
  revenue_month: string;
  total_orders: number;
  paid_orders: number;
  pending_orders: number;
  pending_verification: number;
  refunded_orders: number;
  total_customers: number;
  total_products: number;
  products_sold: number;
}

export interface RevenuePoint {
  period: string | null;
  revenue: string;
  orders: number;
}

export interface TopProduct {
  product_id: number;
  title: string;
  units_sold: number;
  revenue: string;
}

export interface RevenueChartData {
  period: string;
  series: RevenuePoint[];
  top_products: TopProduct[];
  top_branches: {
    branch_short: string | null;
    units_sold: number;
    revenue: string;
  }[];
  category_breakdown: {
    product_type: string;
    units_sold: number;
    revenue: string;
  }[];
  coupons: {
    code: string;
    discount_type: string;
    value: string;
    used_count: number;
    times_used: number;
  }[];
}

export interface AdminCustomer {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: Role;
  college: string;
  branch: string;
  year: number | null;
  email_verified: boolean;
  is_active: boolean;
  date_joined: string;
  total_spent: string;
  orders_count: number;
}

export interface AdminCustomerDetail {
  profile: AdminCustomer;
  total_spent: string;
  orders_count: number;
  paid_orders_count: number;
  purchases: {
    id: number;
    order_number: string;
    title: string;
    price: string;
    quantity: number;
    total_price: string;
    payment_method: string;
    payment_method_key: string;
    status: string;
    purchased_at: string | null;
    order_created_at: string;
  }[];
  orders: Order[];
  cart: {
    product_id: number;
    title: string;
    quantity: number;
    price: string;
  }[];
  wishlist: {
    product_id: number;
    title: string;
    price: string;
    slug: string;
  }[];
  payments: {
    id: number;
    gateway: string;
    status: string;
    amount: string;
    razorpay_payment_id: string;
    method: string;
    utr_number: string;
    created_at: string;
  }[];
}
