import axios, { type AxiosInstance } from 'axios';
import { message } from 'ant-design-vue';
import router from '../router';

const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
});

// 请求拦截器：附加 Token
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器：统一错误处理
http.interceptors.response.use(
  (response) => response.data?.data ?? response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      message.error('登录已过期，请重新登录');
      router.push('/login');
    } else if (error.response?.status === 403) {
      message.error('没有权限执行此操作');
    } else {
      const msg = error.response?.data?.message || error.message || '请求失败';
      message.error(Array.isArray(msg) ? msg[0] : msg);
    }
    return Promise.reject(error);
  },
);

export default http;
