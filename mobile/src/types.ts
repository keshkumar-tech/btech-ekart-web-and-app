// API types (mirrors the Django DRF serializers).

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: "customer" | "admin";
  avatar: string;
  college: string;
  branch: string;
  year: number | null;
  email_verified: boolean;
  date_joined: string;
}

export type ProductType = "notes" | "pyq" | "quantum" | "syllabus" | "combo";

export type PaymentMethod = "razorpay" | "manual_qr";

export interface Branch {
  id: number;
  name: string;
  short_name: string;
  /** Alias of short_name used by the mobile filter chips. */
  code: string;
  slug: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  description: string;
  type: ProductType;
  type_display: string;
  branch: Branch | null;
  category: Category | null;
  subject: { id: number; name: string; code: string } | null;
  semester: number | null;
  year: number | null;
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
  tags_list: string[];
  is_trending: boolean;
  is_new_arrival: boolean;
  /** True when the signed-in user already owns this product. */
  is_owned?: boolean;
  related_products?: Product[];
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  /** Alias of `link` used by the home banner slider. */
  link_url: string;
  badge_text: string;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  total_price: string;
  mrp_price: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  item_count: number;
  /** Alias of item_count for screens that read `count`. */
  count: number;
  subtotal: string;
  mrp_total: string;
  you_save: string;
  /** Alias of you_save for screens that read `savings`. */
  savings: string;
}

export interface Wishlist {
  id: number;
  products: Product[];
  /** Some list endpoints return a paginated envelope; screens tolerate both. */
  results?: Product[];
  count?: number;
  item_count: number;
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

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  status_display: string;
  payment_method: "razorpay" | "manual_qr" | "free";
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
  user_name: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
  product_title?: string;
}

export interface AppNotification {
  id: number;
  kind: string;
  title: string;
  body: string;
  url: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  category: Category | null;
  excerpt: string;
  cover_image: string | null;
  read_minutes: number;
  views: number;
  published_at: string | null;
  created_at: string;
  author_name?: string;
  tags_list?: string[];
  content?: string;
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
