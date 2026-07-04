<template>
  <div class="submit-view">
    <h2 class="page-title">提交报修</h2>

    <a-card>
      <a-form
        :model="form"
        layout="vertical"
        @finish="handleSubmit"
        class="submit-form"
      >
        <a-form-item
          name="title"
          label="标题"
          :rules="[{ required: true, message: '请输入标题', min: 2 }]"
        >
          <a-input
            v-model:value="form.title"
            placeholder="简要描述问题，如：宿舍水龙头漏水"
            :maxlength="50"
            show-count
          />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :xs="24" :sm="12">
            <a-form-item
              name="categoryId"
              label="分类"
              :rules="[{ required: true, message: '请选择分类' }]"
            >
              <a-select
                v-model:value="form.categoryId"
                placeholder="请选择报修分类"
              >
                <a-select-option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :xs="24" :sm="12">
            <a-form-item name="priority" label="优先级" :rules="[{ required: true, message: '请选择优先级' }]">
              <a-select v-model:value="form.priority" placeholder="请选择优先级">
                <a-select-option value="LOW">低</a-select-option>
                <a-select-option value="MEDIUM">中</a-select-option>
                <a-select-option value="HIGH">高</a-select-option>
                <a-select-option value="URGENT">紧急</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item name="location" label="位置">
          <a-input
            v-model:value="form.location"
            placeholder="如：3栋205宿舍、教学楼A301"
            :maxlength="100"
          />
        </a-form-item>

        <a-form-item
          name="description"
          label="详细描述"
          :rules="[{ required: true, message: '请输入问题描述', min: 5 }]"
        >
          <a-textarea
            v-model:value="form.description"
            :rows="5"
            placeholder="请详细描述问题情况，包括何时发现、具体表现等"
            :maxlength="500"
            show-count
          />
        </a-form-item>

        <a-form-item label="现场图片">
          <FileUpload v-model="form.attachments" :max-count="6" />
          <div class="upload-tip">支持 JPG、PNG、GIF、WebP 格式，单张不超过 5MB，最多 6 张</div>
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button type="primary" html-type="submit" :loading="submitting">
              提交报修
            </a-button>
            <a-button @click="handleReset">重置</a-button>
            <a-button @click="$router.back()">取消</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { categoriesApi } from '../api/categories';
import { workOrdersApi } from '../api/work-orders';
import { Priority } from '@campus-work-order/shared';
import FileUpload from '../components/FileUpload.vue';

const router = useRouter();

const categories = ref<any[]>([]);
const submitting = ref(false);

const form = reactive({
  title: '',
  categoryId: undefined as number | undefined,
  priority: Priority.MEDIUM as string,
  location: '',
  description: '',
  attachments: [] as string[],
});

const handleSubmit = async () => {
  submitting.value = true;
  try {
    await workOrdersApi.create({
      title: form.title,
      description: form.description,
      location: form.location || undefined,
      priority: form.priority as Priority,
      categoryId: form.categoryId!,
      attachments: form.attachments.length > 0 ? form.attachments : undefined,
    });
    message.success('报修提交成功');
    router.push('/my-work-orders');
  } catch {
    // 错误已在拦截器中处理
  } finally {
    submitting.value = false;
  }
};

const handleReset = () => {
  form.title = '';
  form.categoryId = undefined;
  form.priority = Priority.MEDIUM;
  form.location = '';
  form.description = '';
  form.attachments = [];
};

onMounted(async () => {
  categories.value = await categoriesApi.findAll();
});
</script>

<style scoped lang="scss">
.submit-form {
  max-width: 700px;
}

.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
