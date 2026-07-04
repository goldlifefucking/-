import http from './http';

export const categoriesApi = {
  findAll: () => http.get('/categories'),
  findAllAdmin: () => http.get('/categories/all'),
  create: (data: any) => http.post('/categories', data),
  update: (id: number, data: any) => http.patch(`/categories/${id}`, data),
  remove: (id: number) => http.delete(`/categories/${id}`),
};
