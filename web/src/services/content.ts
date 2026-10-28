// Reviews, blog and site-settings API calls.
import { http } from "@/lib/api";
import type { BlogCategory, BlogPost, Paginated, Review } from "@/types";

export const reviewsService = {
  forProduct: (slug: string) =>
    http
      .get<Review[] | Paginated<Review>>(`/api/reviews/product/${slug}/`)
      .then((d) => (Array.isArray(d) ? d : d.results)),
  create: (
    slug: string,
    payload: {
      product: number;
      rating: number;
      title?: string;
      comment: string;
    },
  ) =>
    http.post<Review & { pending_approval?: boolean; detail?: string }>(
      `/api/reviews/product/${slug}/`,
      payload,
    ),
  publicList: (limit = 20) =>
    http.get<Review[]>("/api/reviews/public/", { params: { limit } }),
  mine: () => http.get<Review[]>("/api/reviews/mine/"),
  remove: (id: number) => http.delete(`/api/reviews/${id}/`),

  // ---- Admin moderation (custom admin panel) ----
  adminList: (
    params: { page?: number; q?: string; is_approved?: string } = {},
  ) => http.get<Paginated<Review>>("/api/reviews/admin/reviews/", { params }),
  adminUpdate: (id: number, payload: { is_approved: boolean }) =>
    http.patch<Review>(`/api/reviews/admin/reviews/${id}/`, payload),
  adminDelete: (id: number) => http.delete(`/api/reviews/admin/reviews/${id}/`),
};

export const blogService = {
  categories: () =>
    http
      .get<Paginated<BlogCategory> | BlogCategory[]>("/api/blog/categories/")
      .then(unwrap),
  posts: (
    params: { page?: number; q?: string; category__slug?: string } = {},
  ) => http.get<Paginated<BlogPost>>("/api/blog/posts/", { params }),
  post: (slug: string) => http.get<BlogPost>(`/api/blog/posts/${slug}/`),

  // ---- Admin CRUD (custom admin panel) ----
  adminCategories: () =>
    http.get<BlogCategory[]>("/api/blog/admin/categories/"),
  adminCreateCategory: (payload: Partial<BlogCategory>) =>
    http.post<BlogCategory>("/api/blog/admin/categories/", payload),
  adminUpdateCategory: (id: number, payload: Partial<BlogCategory>) =>
    http.patch<BlogCategory>(`/api/blog/admin/categories/${id}/`, payload),
  adminDeleteCategory: (id: number) =>
    http.delete(`/api/blog/admin/categories/${id}/`),

  adminPosts: (params: { page?: number; q?: string } = {}) =>
    http.get<Paginated<BlogPost>>("/api/blog/admin/posts/", { params }),
  adminPost: (id: number) => http.get<BlogPost>(`/api/blog/admin/posts/${id}/`),
  adminCreatePost: (payload: FormData | Record<string, unknown>) =>
    http.post<BlogPost>("/api/blog/admin/posts/", payload),
  adminUpdatePost: (id: number, payload: FormData | Record<string, unknown>) =>
    http.patch<BlogPost>(`/api/blog/admin/posts/${id}/`, payload),
  adminDeletePost: (id: number) => http.delete(`/api/blog/admin/posts/${id}/`),
};

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}
