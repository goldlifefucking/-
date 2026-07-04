import http from './http';

export const workOrdersApi = {
  findAll: (params?: any) => http.get('/work-orders', { params }),
  getStats: () => http.get('/work-orders/stats'),
  findOne: (id: number) => http.get(`/work-orders/${id}`),
  create: (data: any) => http.post('/work-orders', data),
  accept: (id: number) => http.post(`/work-orders/${id}/accept`),
  assign: (id: number, data: { workerId: number }) =>
    http.post(`/work-orders/${id}/assign`, data),
  start: (id: number) => http.post(`/work-orders/${id}/start`),
  resolve: (id: number, data: { resolution: string; attachments?: string[] }) =>
    http.post(`/work-orders/${id}/resolve`, data),
  confirm: (id: number) => http.post(`/work-orders/${id}/confirm`),
  unresolve: (id: number, data: { feedback: string }) =>
    http.post(`/work-orders/${id}/unresolve`, data),
  cancel: (id: number, data?: { reason?: string }) =>
    http.post(`/work-orders/${id}/cancel`, data || {}),
};
