// In-app notifications. The same endpoints serve the admin panel and the
// storefront — the server scopes everything to the signed-in user.
import { http } from "@/lib/api";

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

export const notificationsService = {
  list: (params: { unread?: boolean; limit?: number } = {}) =>
    http.get<AppNotification[]>("/api/notifications/", {
      params: {
        ...(params.unread ? { unread: "true" } : {}),
        ...(params.limit ? { limit: params.limit } : {}),
      },
    }),
  unreadCount: () =>
    http.get<{
      count: number;
      latest: { id: number; title: string; kind: string } | null;
    }>("/api/notifications/unread-count/"),
  markRead: (id: number) =>
    http.post<AppNotification>(`/api/notifications/${id}/read/`),
  markAllRead: () =>
    http.post<{ detail: string; updated: number }>(
      "/api/notifications/read-all/",
    ),
};
