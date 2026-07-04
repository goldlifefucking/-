import http from './http';

export const notificationsApi = {
  findAll: (params?: { isRead?: boolean; page?: number; pageSize?: number }) =>
    http.get('/notifications', { params }),
  getUnreadCount: () => http.get('/notifications/unread-count'),
  markAsRead: (id: number) => http.patch(`/notifications/${id}/read`),
  markAllAsRead: () => http.patch('/notifications/read-all'),
};
