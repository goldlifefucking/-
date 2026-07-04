<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">校园工单管理系统</h1>
        <p class="login-subtitle">校园报修与维修工单管理平台</p>
      </div>

      <a-form
        :model="form"
        layout="vertical"
        @finish="handleLogin"
        class="login-form"
      >
        <a-form-item
          name="username"
          :rules="[{ required: true, message: '请输入用户名' }]"
        >
          <a-input
            v-model:value="form.username"
            size="large"
            placeholder="用户名"
            @pressEnter="handleLogin"
          >
            <template #prefix><UserOutlined /></template>
          </a-input>
        </a-form-item>

        <a-form-item
          name="password"
          :rules="[{ required: true, message: '请输入密码' }]"
        >
          <a-input-password
            v-model:value="form.password"
            size="large"
            placeholder="密码"
            @pressEnter="handleLogin"
          >
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            size="large"
            block
            :loading="loading"
            html-type="submit"
          >
            登 录
          </a-button>
        </a-form-item>
      </a-form>

      <div class="demo-accounts">
        <p class="demo-title">演示账号</p>
        <a-row :gutter="[8, 8]">
          <a-col :span="12" v-for="acc in demoAccounts" :key="acc.username">
            <div class="demo-account" @click="fillAccount(acc)">
              <span class="demo-role">{{ acc.role }}</span>
              <span class="demo-cred">{{ acc.username }} / {{ acc.password }}</span>
            </div>
          </a-col>
        </a-row>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  username: '',
  password: '',
});

const loading = ref(false);

const demoAccounts = [
  { role: '管理员', username: 'admin', password: 'Admin123456' },
  { role: '维修人员', username: 'repairer', password: 'Repair123456' },
  { role: '学生', username: 'student', password: 'Student123456' },
  { role: '教师', username: 'teacher', password: 'Teacher123456' },
];

const fillAccount = (acc: { username: string; password: string }) => {
  form.username = acc.username;
  form.password = acc.password;
};

const handleLogin = async () => {
  if (!form.username || !form.password) return;
  loading.value = true;
  try {
    await authStore.login(form.username, form.password);
    message.success(`欢迎回来，${authStore.user?.name}`);
    router.push(authStore.getHomePath());
  } catch {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 420px;
  max-width: 90vw;
  background: #fff;
  border-radius: 12px;
  padding: 40px 36px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #999;
}

.login-form {
  margin-bottom: 24px;
}

.demo-accounts {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.demo-title {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
}

.demo-account {
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: #e8f0fe;
  }
}

.demo-role {
  font-size: 12px;
  font-weight: 600;
  color: #1677ff;
}

.demo-cred {
  font-size: 11px;
  color: #666;
}

@media (max-width: 480px) {
  .login-card {
    padding: 24px 20px;
  }

  .login-title {
    font-size: 22px;
  }
}
</style>
