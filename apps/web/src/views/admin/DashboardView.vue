<template>
  <div class="dashboard-view">
    <div class="page-header">
      <h2 class="page-title">数据统计</h2>
    </div>

    <!-- 统计卡片 -->
    <a-row :gutter="[16, 16]" class="stat-cards">
      <a-col :xs="12" :sm="12" :md="6">
        <div class="stat-card stat-total">
          <div class="stat-icon">
            <FileTextOutlined />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">总工单数</div>
          </div>
        </div>
      </a-col>
      <a-col :xs="12" :sm="12" :md="6">
        <div class="stat-card stat-pending">
          <div class="stat-icon">
            <ClockCircleOutlined />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pending }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </div>
      </a-col>
      <a-col :xs="12" :sm="12" :md="6">
        <div class="stat-card stat-completed">
          <div class="stat-icon">
            <CheckCircleOutlined />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
      </a-col>
      <a-col :xs="12" :sm="12" :md="6">
        <div class="stat-card stat-unresolved">
          <div class="stat-icon">
            <CloseCircleOutlined />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.unresolved }}</div>
            <div class="stat-label">未解决</div>
          </div>
        </div>
      </a-col>
    </a-row>

    <!-- 图表区 -->
    <a-row :gutter="[16, 16]" class="chart-row">
      <a-col :xs="24" :lg="12">
        <div class="chart-card">
          <h3 class="chart-title">工单状态分布</h3>
          <div ref="pieChartRef" class="chart-container"></div>
        </div>
      </a-col>
      <a-col :xs="24" :lg="12">
        <div class="chart-card">
          <h3 class="chart-title">各分类工单数量</h3>
          <div ref="barChartRef" class="chart-container"></div>
        </div>
      </a-col>
    </a-row>

    <a-spin v-if="loading" class="page-spin" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, shallowRef } from 'vue';
import * as echarts from 'echarts';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons-vue';
import { workOrdersApi } from '../../api/work-orders';
import {
  WorkOrderStatus,
  WORK_ORDER_STATUS_LABELS,
} from '@campus-work-order/shared';

const loading = ref(false);
const pieChartRef = ref<HTMLElement>();
const barChartRef = ref<HTMLElement>();

// 使用 shallowRef 避免深层响应式带来的性能问题
const pieChart = shallowRef<echarts.ECharts>();
const barChart = shallowRef<echarts.ECharts>();

const stats = reactive({
  total: 0,
  pending: 0,
  completed: 0,
  unresolved: 0,
});

// 待处理包含的状态：待受理、待派单、待处理、处理中、待确认
const PENDING_STATUSES = [
  WorkOrderStatus.PENDING,
  WorkOrderStatus.ACCEPTED,
  WorkOrderStatus.ASSIGNED,
  WorkOrderStatus.PROCESSING,
  WorkOrderStatus.PENDING_CONFIRM,
];

const handleResize = () => {
  pieChart.value?.resize();
  barChart.value?.resize();
};

const processStats = (data: any) => {
  // 兼容多种返回结构
  stats.total = data.total ?? data.totalCount ?? 0;

  // 状态分布数据，兼容多种字段名
  const statusDist: { status: string; count: number }[] =
    data.statusDistribution || data.statusCounts || data.byStatus || [];

  if (Array.isArray(statusDist)) {
    // 数组形式 [{ status, count }]
    const map: Record<string, number> = {};
    statusDist.forEach((item: any) => {
      const key = item.status || item.name;
      map[key] = item.count ?? item.value ?? 0;
    });
    stats.completed = map[WorkOrderStatus.COMPLETED] ?? 0;
    stats.unresolved = map[WorkOrderStatus.UNRESOLVED] ?? 0;
    stats.pending = PENDING_STATUSES.reduce((sum, s) => sum + (map[s] ?? 0), 0);
  } else if (typeof statusDist === 'object') {
    // 对象形式 { PENDING: n, ... }
    stats.completed = statusDist[WorkOrderStatus.COMPLETED] ?? 0;
    stats.unresolved = statusDist[WorkOrderStatus.UNRESOLVED] ?? 0;
    stats.pending = PENDING_STATUSES.reduce(
      (sum, s) => sum + (statusDist[s] ?? 0),
      0,
    );
  }

  // 兼容直接提供汇总字段的情况
  if (data.pending !== undefined) stats.pending = data.pending;
  if (data.completed !== undefined) stats.completed = data.completed;
  if (data.unresolved !== undefined) stats.unresolved = data.unresolved;
};

const initPieChart = (statusDist: any) => {
  if (!pieChartRef.value) return;
  pieChart.value = echarts.init(pieChartRef.value);

  let pieData: { name: string; value: number }[] = [];

  if (Array.isArray(statusDist)) {
    pieData = statusDist.map((item: any) => ({
      name: WORK_ORDER_STATUS_LABELS[item.status || item.name] || item.name,
      value: item.count ?? item.value ?? 0,
    }));
  } else if (statusDist && typeof statusDist === 'object') {
    pieData = Object.entries(statusDist).map(([key, val]) => ({
      name: WORK_ORDER_STATUS_LABELS[key as WorkOrderStatus] || key,
      value: val as number,
    }));
  }

  pieData = pieData.filter((d) => d.value > 0);

  pieChart.value.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      type: 'scroll',
    },
    color: ['#faad14', '#d48806', '#13c2c2', '#1677ff', '#722ed1', '#52c41a', '#ff4d4f', '#bfbfbf'],
    series: [
      {
        name: '工单状态',
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: pieData,
      },
    ],
  });
};

const initBarChart = (categoryDist: any) => {
  if (!barChartRef.value) return;
  barChart.value = echarts.init(barChartRef.value);

  let barData: { name: string; value: number }[] = [];

  if (Array.isArray(categoryDist)) {
    barData = categoryDist.map((item: any) => ({
      name: item.name || item.category || item.categoryName,
      value: item.count ?? item.value ?? 0,
    }));
  } else if (categoryDist && typeof categoryDist === 'object') {
    barData = Object.entries(categoryDist).map(([key, val]) => ({
      name: key,
      value: val as number,
    }));
  }

  barData.sort((a, b) => b.value - a.value);

  const names = barData.map((d) => d.name);
  const values = barData.map((d) => d.value);

  barChart.value.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        rotate: names.length > 5 ? 30 : 0,
        interval: 0,
      },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
    },
    series: [
      {
        name: '工单数量',
        type: 'bar',
        data: values,
        barMaxWidth: 40,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#4096ff' },
            { offset: 1, color: '#1677ff' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  });
};

const fetchStats = async () => {
  loading.value = true;
  try {
    const res: any = await workOrdersApi.getStats();
    processStats(res);

    const statusDist =
      res.statusDistribution || res.statusCounts || res.byStatus || {};
    const categoryDist =
      res.categoryDistribution || res.categoryCounts || res.byCategory || [];

    initPieChart(statusDist);
    initBarChart(categoryDist);
  } catch {
    // 错误已在拦截器中处理，初始化空图表
    initPieChart({});
    initBarChart([]);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStats();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  pieChart.value?.dispose();
  barChart.value?.dispose();
});
</script>

<style scoped lang="scss">
.dashboard-view {
  .page-header {
    margin-bottom: 16px;
  }

  .page-title {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
  }

  .stat-cards {
    margin-bottom: 8px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s, box-shadow 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: #fff;
    flex-shrink: 0;
  }

  .stat-total .stat-icon {
    background: linear-gradient(135deg, #4096ff, #1677ff);
  }

  .stat-pending .stat-icon {
    background: linear-gradient(135deg, #ffc53d, #faad14);
  }

  .stat-completed .stat-icon {
    background: linear-gradient(135deg, #73d13d, #52c41a);
  }

  .stat-unresolved .stat-icon {
    background: linear-gradient(135deg, #ff7875, #ff4d4f);
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #1a1a2e;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 13px;
    color: #999;
    margin-top: 4px;
  }

  .chart-row {
    margin-top: 8px;
  }

  .chart-card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }

  .chart-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 16px;
    color: #1a1a2e;
  }

  .chart-container {
    width: 100%;
    height: 340px;
  }

  .page-spin {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}

@media (max-width: 768px) {
  .dashboard-view {
    .stat-card {
      padding: 12px;
      gap: 10px;
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      font-size: 22px;
      border-radius: 8px;
    }

    .stat-value {
      font-size: 22px;
    }

    .chart-container {
      height: 280px;
    }
  }
}
</style>
