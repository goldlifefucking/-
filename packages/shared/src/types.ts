import { UserRole, Priority, WorkOrderStatus, AttachmentType, NotificationType } from './enums';

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrder {
  id: number;
  title: string;
  description: string;
  location: string | null;
  priority: Priority;
  status: WorkOrderStatus;
  resolution: string | null;
  feedback: string | null;
  categoryId: number;
  category?: Category;
  reporterId: number;
  reporter?: User;
  workerId: number | null;
  worker?: User | null;
  attachments: Attachment[];
  logs: WorkOrderLog[];
  acceptedAt: string | null;
  assignedAt: string | null;
  startedAt: string | null;
  resolvedAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: number;
  workOrderId: number;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  type: AttachmentType;
  createdAt: string;
}

export interface WorkOrderLog {
  id: number;
  workOrderId: number;
  userId: number;
  user?: User;
  action: string;
  fromStatus: WorkOrderStatus | null;
  toStatus: WorkOrderStatus | null;
  detail: string | null;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  workOrderId: number | null;
  title: string;
  content: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface CreateWorkOrderRequest {
  title: string;
  description: string;
  location?: string;
  priority: Priority;
  categoryId: number;
  attachmentIds?: number[];
}

export interface AssignWorkOrderRequest {
  workerId: number;
}

export interface ResolveWorkOrderRequest {
  resolution: string;
  attachmentIds?: number[];
}

export interface UnresolveWorkOrderRequest {
  feedback: string;
}
