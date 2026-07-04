import http from './http';

export const usersApi = {
  findAll: (params?: { role?: string; keyword?: string }) =>
    http.get('/users', { params }),
  findWorkers: () => http.get('/users/workers'),
  create: (data: any) => http.post('/users', data),
  update: (id: number, data: any) => http.patch(`/users/${id}`, data),
  remove: (id: number) => http.delete(`/users/${id}`),
};
