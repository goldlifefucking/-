export enum UserRole {
  ADMIN = 'ADMIN',
  WORKER = 'WORKER',
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum WorkOrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  ASSIGNED = 'ASSIGNED',
  PROCESSING = 'PROCESSING',
  PENDING_CONFIRM = 'PENDING_CONFIRM',
  COMPLETED = 'COMPLETED',
  UNRESOLVED = 'UNRESOLVED',
  CANCELLED = 'CANCELLED',
}

export enum AttachmentType {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
}

export enum NotificationType {
  WORK_ORDER_CREATED = 'WORK_ORDER_CREATED',
  WORK_ORDER_ACCEPTED = 'WORK_ORDER_ACCEPTED',
  WORK_ORDER_ASSIGNED = 'WORK_ORDER_ASSIGNED',
  WORK_ORDER_STARTED = 'WORK_ORDER_STARTED',
  WORK_ORDER_RESOLVED = 'WORK_ORDER_RESOLVED',
  WORK_ORDER_CONFIRMED = 'WORK_ORDER_CONFIRMED',
  WORK_ORDER_UNRESOLVED = 'WORK_ORDER_UNRESOLVED',
  WORK_ORDER_CANCELLED = 'WORK_ORDER_CANCELLED',
}

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.PENDING]: '待受理',
  [WorkOrderStatus.ACCEPTED]: '待派单',
  [WorkOrderStatus.ASSIGNED]: '待处理',
  [WorkOrderStatus.PROCESSING]: '处理中',
  [WorkOrderStatus.PENDING_CONFIRM]: '待确认',
  [WorkOrderStatus.COMPLETED]: '已完成',
  [WorkOrderStatus.UNRESOLVED]: '未解决',
  [WorkOrderStatus.CANCELLED]: '已取消',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.LOW]: '低',
  [Priority.MEDIUM]: '中',
  [Priority.HIGH]: '高',
  [Priority.URGENT]: '紧急',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: '管理员',
  [UserRole.WORKER]: '维修人员',
  [UserRole.STUDENT]: '学生',
  [UserRole.TEACHER]: '教师',
};
