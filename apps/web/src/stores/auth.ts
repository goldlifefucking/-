import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '../api/auth';
import { UserRole } from '@campus-work-order/shared';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null);
  const token = ref<string | null>(localStorage.getItem('token'));

  const isLoggedIn = computed(() => !!token.value && !!user.value);
  const role = computed(() => user.value?.role);
  const isAdmin = computed(() => role.value === UserRole.ADMIN);
  const isWorker = computed(() => role.value === UserRole.WORKER);
  const isReporter = computed(() => role.value === UserRole.STUDENT || role.value === UserRole.TEACHER);

  const login = async (username: string, password: string) => {
    const res: any = await authApi.login({ username, password });
    token.value = res.access_token;
    user.value = res.user;
    localStorage.setItem('token', res.access_token);
  };

  const fetchProfile = async () => {
    try {
      user.value = await authApi.getProfile();
    } catch {
      logout();
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
  };

  const getHomePath = () => {
    if (!user.value) return '/login';
    switch (user.value.role) {
      case UserRole.ADMIN:
        return '/admin/work-orders';
      case UserRole.WORKER:
        return '/worker/work-orders';
      case UserRole.STUDENT:
      case UserRole.TEACHER:
        return '/my-work-orders';
      default:
        return '/login';
    }
  };

  return {
    user,
    token,
    isLoggedIn,
    role,
    isAdmin,
    isWorker,
    isReporter,
    login,
    fetchProfile,
    logout,
    getHomePath,
  };
});
