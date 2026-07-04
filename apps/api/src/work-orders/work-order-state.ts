import { WorkOrderStatus } from '@prisma/client';

/**
 * 工单状态转换规则表
 * key: 当前状态, value: 允许转换到的状态数组
 */
export const STATUS_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WorkOrderStatus.PENDING]: [WorkOrderStatus.ACCEPTED, WorkOrderStatus.CANCELLED],
  [WorkOrderStatus.ACCEPTED]: [WorkOrderStatus.ASSIGNED, WorkOrderStatus.CANCELLED],
  [WorkOrderStatus.ASSIGNED]: [WorkOrderStatus.PROCESSING, WorkOrderStatus.CANCELLED],
  [WorkOrderStatus.PROCESSING]: [WorkOrderStatus.PENDING_CONFIRM, WorkOrderStatus.CANCELLED],
  [WorkOrderStatus.PENDING_CONFIRM]: [WorkOrderStatus.COMPLETED, WorkOrderStatus.UNRESOLVED],
  [WorkOrderStatus.UNRESOLVED]: [WorkOrderStatus.ASSIGNED],
  [WorkOrderStatus.COMPLETED]: [],
  [WorkOrderStatus.CANCELLED]: [],
};

/**
 * 验证状态转换是否合法
 */
export function canTransition(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * 获取当前状态的下一个允许状态
 */
export function getNextStates(current: WorkOrderStatus): WorkOrderStatus[] {
  return STATUS_TRANSITIONS[current] ?? [];
}

/**
 * 状态对应的中文标签
 */
export const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.PENDING]: '待受理',
  [WorkOrderStatus.ACCEPTED]: '待派单',
  [WorkOrderStatus.ASSIGNED]: '待处理',
  [WorkOrderStatus.PROCESSING]: '处理中',
  [WorkOrderStatus.PENDING_CONFIRM]: '待确认',
  [WorkOrderStatus.COMPLETED]: '已完成',
  [WorkOrderStatus.UNRESOLVED]: '未解决',
  [WorkOrderStatus.CANCELLED]: '已取消',
};

/**
 * 状态对应的操作动作名称
 */
export const ACTION_LABELS: Record<string, string> = {
  CREATE: '创建工单',
  ACCEPT: '受理',
  ASSIGN: '派单',
  START: '开始处理',
  RESOLVE: '提交处理结果',
  CONFIRM: '确认完成',
  UNRESOLVE: '反馈未解决',
  CANCEL: '取消工单',
  REASSIGN: '重新派单',
};
