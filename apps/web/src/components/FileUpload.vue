<template>
  <div class="file-upload">
    <a-upload
      list-type="picture-card"
      :file-list="fileList"
      :before-upload="handleBeforeUpload"
      :custom-request="handleCustomRequest"
      @remove="handleRemove"
      @preview="handlePreview"
      accept="image/jpeg,image/png,image/gif,image/webp"
      :multiple="true"
    >
      <div v-if="fileList.length < maxCount">
        <PlusOutlined />
        <div class="upload-text">上传图片</div>
      </div>
    </a-upload>

    <a-modal :open="previewVisible" :title="previewTitle" :footer="null" @cancel="previewVisible = false">
      <img :src="previewImage" alt="预览" style="width: 100%" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import type { UploadFile, UploadProps } from 'ant-design-vue';
import { filesApi } from '../api/files';

const props = withDefaults(
  defineProps<{
    modelValue?: string[];
    maxCount?: number;
  }>(),
  {
    modelValue: () => [],
    maxCount: 6,
  },
);

const emit = defineEmits<{
  'update:modelValue': [urls: string[]];
}>();

const fileList = ref<UploadFile[]>([]);
const previewVisible = ref(false);
const previewImage = ref('');
const previewTitle = ref('');

// 同步外部 modelValue
watch(
  () => props.modelValue,
  (urls) => {
    if (urls.length === 0 && fileList.value.length === 0) return;
    const existingUrls = fileList.value.map((f) => f.response?.url).filter(Boolean);
    if (JSON.stringify(existingUrls) !== JSON.stringify(urls)) {
      fileList.value = urls.map((url, index) => ({
        uid: `existing-${index}`,
        name: url.split('/').pop() || 'image',
        status: 'done' as const,
        url,
        response: { url },
      }));
    }
  },
  { immediate: true },
);

// 图片压缩
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const maxWidth = 1280;
        const maxHeight = 1280;
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name, { type: file.type });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          0.8,
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const handleBeforeUpload = (file: File) => {
  const isImage = file.type.match(/\/(jpg|jpeg|png|gif|webp)$/);
  if (!isImage) {
    message.error('仅支持 JPG、PNG、GIF、WebP 格式的图片');
    return false;
  }
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    message.error('图片大小不能超过 5MB');
    return false;
  }
  return true;
};

const handleCustomRequest: UploadProps['customRequest'] = async (options) => {
  const { file, onSuccess, onError } = options;
  try {
    // 压缩图片
    const compressedFile = await compressImage(file as File);
    const res: any = await filesApi.upload(compressedFile);
    onSuccess?.(res);
    emitUrls();
    message.success('上传成功');
  } catch (err) {
    onError?.(err as any);
    message.error('上传失败');
  }
};

const handleRemove = (file: UploadFile) => {
  fileList.value = fileList.value.filter((f) => f.uid !== file.uid);
  emitUrls();
  return true;
};

const handlePreview = (file: UploadFile) => {
  previewImage.value = file.url || file.response?.url || '';
  previewTitle.value = file.name || '图片预览';
  previewVisible.value = true;
};

const emitUrls = () => {
  const urls = fileList.value
    .map((f) => f.response?.url || f.url)
    .filter(Boolean) as string[];
  emit('update:modelValue', urls);
};

// 暴露给父组件获取已上传的 URL 列表
defineExpose({
  getUrls: () =>
    fileList.value
      .map((f) => f.response?.url || f.url)
      .filter(Boolean) as string[],
});
</script>

<style scoped lang="scss">
.upload-text {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
