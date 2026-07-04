import http from './http';

export const authApi = {
  login: (data: { username: string; password: string }) =>
    http.post('/auth/login', data),
  getProfile: () => http.get('/auth/profile'),
};
