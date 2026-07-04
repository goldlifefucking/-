import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { UserRole } from '@campus-work-order/shared';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true, title: '登录' },
  },
  // 管理员路由
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, roles: [UserRole.ADMIN] },
    children: [
      { path: '', redirect: '/admin/work-orders' },
      { path: 'work-orders', name: 'AdminWorkOrders', component: () => import('../views/WorkOrdersView.vue'), meta: { title: '工单管理' } },
      { path: 'work-orders/:id', name: 'AdminWorkOrderDetail', component: () => import('../views/WorkOrderDetailView.vue'), meta: { title: '工单详情' } },
      { path: 'users', name: 'AdminUsers', component: () => import('../views/admin/UsersView.vue'), meta: { title: '用户管理' } },
      { path: 'categories', name: 'AdminCategories', component: () => import('../views/admin/CategoriesView.vue'), meta: { title: '分类管理' } },
      { path: 'dashboard', name: 'AdminDashboard', component: () => import('../views/admin/DashboardView.vue'), meta: { title: '数据统计' } },
    ],
  },
  // 维修人员路由
  {
    path: '/worker',
    component: () => import('../layouts/WorkerLayout.vue'),
    meta: { requiresAuth: true, roles: [UserRole.WORKER] },
    children: [
      { path: '', redirect: '/worker/work-orders' },
      { path: 'work-orders', name: 'WorkerWorkOrders', component: () => import('../views/WorkOrdersView.vue'), meta: { title: '我的维修工单' } },
      { path: 'work-orders/:id', name: 'WorkerWorkOrderDetail', component: () => import('../views/WorkOrderDetailView.vue'), meta: { title: '工单详情' } },
    ],
  },
  // 报修人路由（学生/教师）
  {
    path: '/',
    component: () => import('../layouts/ReporterLayout.vue'),
    meta: { requiresAuth: true, roles: [UserRole.STUDENT, UserRole.TEACHER] },
    children: [
      { path: '', redirect: '/my-work-orders' },
      { path: 'my-work-orders', name: 'MyWorkOrders', component: () => import('../views/WorkOrdersView.vue'), meta: { title: '我的报修' } },
      { path: 'work-orders/:id', name: 'ReporterWorkOrderDetail', component: () => import('../views/WorkOrderDetailView.vue'), meta: { title: '工单详情' } },
      { path: 'submit', name: 'SubmitWorkOrder', component: () => import('../views/SubmitWorkOrderView.vue'), meta: { title: '提交报修' } },
      { path: 'notifications', name: 'Notifications', component: () => import('../views/NotificationsView.vue'), meta: { title: '通知中心' } },
    ],
  },
  // 公共通知页面（管理员和维修人员也能访问）
  {
    path: '/notifications',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'AdminNotifications', component: () => import('../views/NotificationsView.vue'), meta: { title: '通知中心' } },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/errors/NotFoundView.vue'),
    meta: { public: true, title: '页面不存在' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 校园工单管理系统` : '校园工单管理系统';

  const authStore = useAuthStore();

  // 如果有 token 但没有用户信息，先获取
  if (authStore.token && !authStore.user) {
    await authStore.fetchProfile();
  }

  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth);
  const allowedRoles = to.matched.reduce<string[]>((acc, r) => {
    const roles = r.meta.roles as string[] | undefined;
    return roles ? [...acc, ...roles] : acc;
  }, []);

  if (!requiresAuth) {
    // 已登录用户访问登录页，跳转到首页
    if (to.name === 'Login' && authStore.isLoggedIn) {
      next(authStore.getHomePath());
    } else {
      next();
    }
    return;
  }

  // 需要认证但未登录
  if (!authStore.isLoggedIn) {
    next('/login');
    return;
  }

  // 角色检查
  if (allowedRoles.length > 0 && !allowedRoles.includes(authStore.user.role)) {
    next(authStore.getHomePath());
    return;
  }

  next();
});

export default router;
