// Catalog API calls: taxonomy, products, banners, preview.
import { http } from "@/lib/api";
import type {
  Banner,
  Branch,
  Category,
  Paginated,
  Product,
  ProductDetail,
  SiteSetting,
  Subject,
} from "@/types";

export interface ProductQuery {
  page?: number;
  page_size?: number;
  q?: string;
  type?: string;
  branch__short_name?: string;
  semester?: number | string;
  year?: number | string;
  category__slug?: string;
  price__gte?: number | string;
  price__lte?: number | string;
  rating__gte?: number | string;
  is_trending?: boolean | string;
  is_new_arrival?: boolean | string;
  ordering?: string;
  // Allow any extra DRF filter param.
  [key: string]: unknown;
}

function toParams(query: Record<string, unknown>): Record<string, string> {
  const params: Record<string, string> = {};
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params[k] = String(v);
  });
  return params;
}

export const catalogService = {
  categories: () =>
    http
      .get<Paginated<Category> | Category[]>("/api/catalog/categories/")
      .then(unwrap),
  branches: () =>
    http
      .get<Paginated<Branch> | Branch[]>("/api/catalog/branches/")
      .then(unwrap),
  banners: () =>
    http
      .get<Paginated<Banner> | Banner[]>("/api/catalog/banners/")
      .then(unwrap),
  subjects: (
    params: { branch?: string; semester?: number | string; q?: string } = {},
  ) =>
    http
      .get<
        Paginated<Subject> | Subject[]
      >("/api/catalog/subjects/", { params: toParams(params) })
      .then(unwrap),
  products: (query: ProductQuery = {}) =>
    http.get<Paginated<Product>>("/api/catalog/products/", {
      params: toParams(query),
    }),
  product: (slug: string) =>
    http.get<ProductDetail>(`/api/catalog/products/${slug}/`),
  previewUrl: (slug: string) => {
    const base = import.meta.env.VITE_API_BASE_URL || "";
    return `${base}/api/catalog/products/${slug}/preview/`;
  },

  // ---- Admin CRUD (custom admin panel; Django admin is NOT used) ----
  adminProducts: (query: ProductQuery = {}) =>
    http.get<Paginated<Product>>("/api/catalog/admin/products/", {
      params: toParams(query),
    }),
  adminProduct: (id: number) =>
    http.get<Product>(`/api/catalog/admin/products/${id}/`),
  adminCreateProduct: (payload: FormData | Partial<Product>) =>
    http.post<Product>("/api/catalog/admin/products/", payload),
  adminUpdateProduct: (id: number, payload: FormData | Partial<Product>) =>
    http.patch<Product>(`/api/catalog/admin/products/${id}/`, payload),
  adminDeleteProduct: (id: number) =>
    http.delete(`/api/catalog/admin/products/${id}/`),

  // Taxonomy CRUD
  adminCategories: () => http.get<Category[]>("/api/catalog/admin/categories/"),
  adminCreateCategory: (payload: Partial<Category>) =>
    http.post<Category>("/api/catalog/admin/categories/", payload),
  adminUpdateCategory: (id: number, payload: Partial<Category>) =>
    http.patch<Category>(`/api/catalog/admin/categories/${id}/`, payload),
  adminDeleteCategory: (id: number) =>
    http.delete(`/api/catalog/admin/categories/${id}/`),

  adminBranchesAll: () => http.get<Branch[]>("/api/catalog/admin/branches/"),
  adminCreateBranch: (payload: Partial<Branch>) =>
    http.post<Branch>("/api/catalog/admin/branches/", payload),
  adminUpdateBranch: (id: number, payload: Partial<Branch>) =>
    http.patch<Branch>(`/api/catalog/admin/branches/${id}/`, payload),
  adminDeleteBranch: (id: number) =>
    http.delete(`/api/catalog/admin/branches/${id}/`),

  adminSubjects: () => http.get<Subject[]>("/api/catalog/admin/subjects/"),
  adminCreateSubject: (payload: Record<string, unknown>) =>
    http.post<Subject>("/api/catalog/admin/subjects/", payload),
  adminUpdateSubject: (id: number, payload: Record<string, unknown>) =>
    http.patch<Subject>(`/api/catalog/admin/subjects/${id}/`, payload),
  adminDeleteSubject: (id: number) =>
    http.delete(`/api/catalog/admin/subjects/${id}/`),

  // Banners CRUD (FormData for image upload)
  adminBannersAll: () => http.get<Banner[]>("/api/catalog/admin/banners/"),
  adminCreateBanner: (payload: FormData | Partial<Banner>) =>
    http.post<Banner>("/api/catalog/admin/banners/", payload),
  adminUpdateBanner: (id: number, payload: FormData | Partial<Banner>) =>
    http.patch<Banner>(`/api/catalog/admin/banners/${id}/`, payload),
  adminDeleteBanner: (id: number) =>
    http.delete(`/api/catalog/admin/banners/${id}/`),

  // Site settings CRUD (FormData for image upload)
  adminSettings: () => http.get<SiteSetting[]>("/api/catalog/admin/settings/"),
  adminCreateSetting: (payload: FormData | Partial<SiteSetting>) =>
    http.post<SiteSetting>("/api/catalog/admin/settings/", payload),
  adminUpdateSetting: (id: number, payload: FormData | Partial<SiteSetting>) =>
    http.patch<SiteSetting>(`/api/catalog/admin/settings/${id}/`, payload),
  adminDeleteSetting: (id: number) =>
    http.delete(`/api/catalog/admin/settings/${id}/`),
};

// Some list endpoints are paginated, some are plain arrays — normalise both.
function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}
