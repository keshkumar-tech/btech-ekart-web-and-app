// In-app notifications — same endpoints as the web storefront. The server
// scopes every row to the signed-in user.
import { http } from "@/lib/api";
import type { AppNotification } from "@/types";

export const notificationsService = {
  list: (params: { unread?: boolean; limit?: number } = {}) =>
    http.get<AppNotification[]>("/api/notifications/", {
      params: {
        ...(params.unread ? { unread: "true" } : {}),
        ...(params.limit ? { limit: String(params.limit) } : {}),
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
