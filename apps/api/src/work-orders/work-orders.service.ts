import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { WorkOrderStatus, NotificationType, UserRole, AttachmentType } from '@prisma/client';
import { canTransition } from './work-order-state';
import {
  CreateWorkOrderDto,
  AssignWorkOrderDto,
  ResolveWorkOrderDto,
  UnresolveWorkOrderDto,
  CancelWorkOrderDto,
} from './dto';

@Injectable()
export class WorkOrdersService {
  constructor(
    private prisma: PrismaService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  /**
   * 创建工单（报修人）
   */
  async create(dto: CreateWorkOrderDto, reporterId: number) {
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category || !category.isActive) {
      throw new BadRequestException('分类不存在或已禁用');
    }

    return this.prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.create({
        data: {
          title: dto.title,
          description: dto.description,
          location: dto.location,
          priority: dto.priority,
          categoryId: dto.categoryId,
          reporterId,
          attachments:
            dto.attachments && dto.attachments.length > 0
              ? {
                  create: dto.attachments.map((url) => ({
                    url,
                    filename: url.split('/').pop() || 'unknown',
                    mimeType: this.guessMimeType(url),
                    size: 0,
                    type: AttachmentType.BEFORE,
                  })),
                }
              : undefined,
        },
        include: { category: true, reporter: { select: this.userSelect() }, attachments: true },
      });

      // 记录日志
      await tx.workOrderLog.create({
        data: {
          workOrderId: workOrder.id,
          userId: reporterId,
          action: 'CREATE',
          toStatus: WorkOrderStatus.PENDING,
          detail: `创建工单: ${dto.title}`,
        },
      });

      // 通知管理员
      const admins = await tx.user.findMany({
        where: { role: UserRole.ADMIN, isActive: true },
        select: { id: true },
      });
      for (const admin of admins) {
        const notification = await tx.notification.create({
          data: {
            userId: admin.id,
            workOrderId: workOrder.id,
            title: '新工单待受理',
            content: `${workOrder.reporter.name} 提交了工单「${workOrder.title}」`,
            type: NotificationType.WORK_ORDER_CREATED,
          },
        });
        this.realtimeGateway.emitNotificationCreated(admin.id, notification);
      }

      // 推送工单更新
      this.realtimeGateway.emitWorkOrderUpdated(reporterId, workOrder);
      for (const admin of admins) {
        this.realtimeGateway.emitWorkOrderUpdated(admin.id, workOrder);
      }

      return workOrder;
    });
  }

  /**
   * 查询工单列表（按角色过滤）
   */
  async findAll(user: { id: number; role: UserRole }, query?: {
    status?: string;
    priority?: string;
    categoryId?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    // 按角色过滤
    if (user.role === UserRole.WORKER) {
      where.workerId = user.id;
    } else if (user.role === UserRole.STUDENT || user.role === UserRole.TEACHER) {
      where.reporterId = user.id;
    }
    // ADMIN 看全部

    if (query?.status) where.status = query.status;
    if (query?.priority) where.priority = query.priority;
    if (query?.categoryId) where.categoryId = +query.categoryId;
    if (query?.keyword) {
      where.OR = [
        { title: { contains: query.keyword, mode: 'insensitive' } },
        { description: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.workOrder.findMany({
        where,
        include: {
          category: true,
          reporter: { select: this.userSelect() },
          worker: { select: this.userSelect() },
          attachments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.workOrder.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  /**
   * 查询工单详情
   */
  async findOne(id: number, user: { id: number; role: UserRole }) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
      include: {
        category: true,
        reporter: { select: this.userSelect() },
        worker: { select: this.userSelect() },
        attachments: true,
        logs: {
          include: { user: { select: this.userSelect() } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }

    // 数据权限检查
    if (
      user.role === UserRole.STUDENT ||
      user.role === UserRole.TEACHER
    ) {
      if (workOrder.reporterId !== user.id) {
        throw new ForbiddenException('无权查看此工单');
      }
    } else if (user.role === UserRole.WORKER) {
      if (workOrder.workerId !== user.id) {
        throw new ForbiddenException('无权查看此工单');
      }
    }

    return workOrder;
  }

  /**
   * 受理工单（管理员）
   */
  async accept(id: number, userId: number) {
    return this.transition(id, userId, WorkOrderStatus.ACCEPTED, 'ACCEPT', {
      fromStatuses: [WorkOrderStatus.PENDING],
      timeField: 'acceptedAt',
      notifyUser: 'reporterId',
      notifyTitle: '工单已受理',
      notifyContent: (wo) => `您的工单「${wo.title}」已被管理员受理，等待派单`,
      notifyType: NotificationType.WORK_ORDER_ACCEPTED,
    });
  }

  /**
   * 派单（管理员）
   */
  async assign(id: number, userId: number, dto: AssignWorkOrderDto) {
    const workOrder = await this.getWorkOrder(id);
    if (!canTransition(workOrder.status, WorkOrderStatus.ASSIGNED)) {
      throw new BadRequestException(
        `当前状态「${workOrder.status}」不允许派单`,
      );
    }

    const worker = await this.prisma.user.findUnique({ where: { id: dto.workerId } });
    if (!worker || worker.role !== UserRole.WORKER || !worker.isActive) {
      throw new BadRequestException('指定的维修人员不存在或不可用');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id },
        data: {
          status: WorkOrderStatus.ASSIGNED,
          workerId: dto.workerId,
          assignedAt: new Date(),
        },
        include: {
          category: true,
          reporter: { select: this.userSelect() },
          worker: { select: this.userSelect() },
          attachments: true,
        },
      });

      await tx.workOrderLog.create({
        data: {
          workOrderId: id,
          userId,
          action: 'ASSIGN',
          fromStatus: workOrder.status,
          toStatus: WorkOrderStatus.ASSIGNED,
          detail: `派单给维修人员: ${worker.name}`,
        },
      });

      // 通知维修人员
      const notification = await tx.notification.create({
        data: {
          userId: dto.workerId,
          workOrderId: id,
          title: '新工单待处理',
          content: `您被分配了工单「${workOrder.title}」，请及时处理`,
          type: NotificationType.WORK_ORDER_ASSIGNED,
        },
      });
      this.realtimeGateway.emitNotificationCreated(dto.workerId, notification);
      this.realtimeGateway.emitWorkOrderUpdated(dto.workerId, updated);

      // 通知报修人
      const reporterNotification = await tx.notification.create({
        data: {
          userId: workOrder.reporterId,
          workOrderId: id,
          title: '工单已派单',
          content: `您的工单「${workOrder.title}」已派单给 ${worker.name}`,
          type: NotificationType.WORK_ORDER_ASSIGNED,
        },
      });
      this.realtimeGateway.emitNotificationCreated(workOrder.reporterId, reporterNotification);
      this.realtimeGateway.emitWorkOrderUpdated(workOrder.reporterId, updated);

      return updated;
    });
  }

  /**
   * 开始处理（维修人员）
   */
  async start(id: number, userId: number) {
    const workOrder = await this.getWorkOrder(id);
    if (workOrder.workerId !== userId) {
      throw new ForbiddenException('您不是此工单的指派维修人员');
    }
    return this.transition(id, userId, WorkOrderStatus.PROCESSING, 'START', {
      fromStatuses: [WorkOrderStatus.ASSIGNED],
      timeField: 'startedAt',
      notifyUser: 'reporterId',
      notifyTitle: '维修人员已开始处理',
      notifyContent: (wo) => `您的工单「${wo.title}」维修人员已开始处理`,
      notifyType: NotificationType.WORK_ORDER_STARTED,
    });
  }

  /**
   * 提交处理结果（维修人员）
   */
  async resolve(id: number, userId: number, dto: ResolveWorkOrderDto) {
    const workOrder = await this.getWorkOrder(id);
    if (workOrder.workerId !== userId) {
      throw new ForbiddenException('您不是此工单的指派维修人员');
    }
    if (!canTransition(workOrder.status, WorkOrderStatus.PENDING_CONFIRM)) {
      throw new BadRequestException(`当前状态「${workOrder.status}」不允许提交结果`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id },
        data: {
          status: WorkOrderStatus.PENDING_CONFIRM,
          resolution: dto.resolution,
          resolvedAt: new Date(),
          attachments:
            dto.attachments && dto.attachments.length > 0
              ? {
                  create: dto.attachments.map((url) => ({
                    url,
                    filename: url.split('/').pop() || 'unknown',
                    mimeType: this.guessMimeType(url),
                    size: 0,
                    type: AttachmentType.AFTER,
                  })),
                }
              : undefined,
        },
        include: {
          category: true,
          reporter: { select: this.userSelect() },
          worker: { select: this.userSelect() },
          attachments: true,
        },
      });

      await tx.workOrderLog.create({
        data: {
          workOrderId: id,
          userId,
          action: 'RESOLVE',
          fromStatus: workOrder.status,
          toStatus: WorkOrderStatus.PENDING_CONFIRM,
          detail: `提交处理结果: ${dto.resolution}`,
        },
      });

      // 通知报修人确认
      const notification = await tx.notification.create({
        data: {
          userId: workOrder.reporterId,
          workOrderId: id,
          title: '工单待确认',
          content: `您的工单「${workOrder.title}」维修人员已提交处理结果，请确认`,
          type: NotificationType.WORK_ORDER_RESOLVED,
        },
      });
      this.realtimeGateway.emitNotificationCreated(workOrder.reporterId, notification);
      this.realtimeGateway.emitWorkOrderUpdated(workOrder.reporterId, updated);

      return updated;
    });
  }

  /**
   * 确认完成（报修人）
   */
  async confirm(id: number, userId: number) {
    return this.transition(id, userId, WorkOrderStatus.COMPLETED, 'CONFIRM', {
      fromStatuses: [WorkOrderStatus.PENDING_CONFIRM],
      timeField: 'confirmedAt',
      ownershipCheck: 'reporterId',
      notifyUser: 'workerId',
      notifyTitle: '工单已完成',
      notifyContent: (wo) => `工单「${wo.title}」已被报修人确认完成`,
      notifyType: NotificationType.WORK_ORDER_CONFIRMED,
    });
  }

  /**
   * 反馈未解决（报修人）
   */
  async unresolve(id: number, userId: number, dto: UnresolveWorkOrderDto) {
    const workOrder = await this.getWorkOrder(id);
    if (workOrder.reporterId !== userId) {
      throw new ForbiddenException('您不是此工单的报修人');
    }
    if (!canTransition(workOrder.status, WorkOrderStatus.UNRESOLVED)) {
      throw new BadRequestException(`当前状态「${workOrder.status}」不允许反馈未解决`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id },
        data: {
          status: WorkOrderStatus.UNRESOLVED,
          feedback: dto.feedback,
        },
        include: {
          category: true,
          reporter: { select: this.userSelect() },
          worker: { select: this.userSelect() },
          attachments: true,
        },
      });

      await tx.workOrderLog.create({
        data: {
          workOrderId: id,
          userId,
          action: 'UNRESOLVE',
          fromStatus: workOrder.status,
          toStatus: WorkOrderStatus.UNRESOLVED,
          detail: `反馈未解决: ${dto.feedback}`,
        },
      });

      // 通知管理员和维修人员
      const admins = await tx.user.findMany({
        where: { role: UserRole.ADMIN, isActive: true },
        select: { id: true },
      });
      const notifyTargets = [...admins.map((a) => a.id)];
      if (workOrder.workerId) notifyTargets.push(workOrder.workerId);

      for (const targetId of notifyTargets) {
        const notification = await tx.notification.create({
          data: {
            userId: targetId,
            workOrderId: id,
            title: '工单反馈未解决',
            content: `工单「${workOrder.title}」报修人反馈未解决: ${dto.feedback}`,
            type: NotificationType.WORK_ORDER_UNRESOLVED,
          },
        });
        this.realtimeGateway.emitNotificationCreated(targetId, notification);
        this.realtimeGateway.emitWorkOrderUpdated(targetId, updated);
      }

      return updated;
    });
  }

  /**
   * 取消工单（管理员）
   */
  async cancel(id: number, userId: number, dto: CancelWorkOrderDto) {
    const workOrder = await this.getWorkOrder(id);
    if (!canTransition(workOrder.status, WorkOrderStatus.CANCELLED)) {
      throw new BadRequestException(`当前状态「${workOrder.status}」不允许取消`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id },
        data: {
          status: WorkOrderStatus.CANCELLED,
          cancelledAt: new Date(),
        },
        include: {
          category: true,
          reporter: { select: this.userSelect() },
          worker: { select: this.userSelect() },
          attachments: true,
        },
      });

      await tx.workOrderLog.create({
        data: {
          workOrderId: id,
          userId,
          action: 'CANCEL',
          fromStatus: workOrder.status,
          toStatus: WorkOrderStatus.CANCELLED,
          detail: dto.reason || '管理员取消工单',
        },
      });

      // 通知报修人
      const notification = await tx.notification.create({
        data: {
          userId: workOrder.reporterId,
          workOrderId: id,
          title: '工单已取消',
          content: `您的工单「${workOrder.title}」已被管理员取消${dto.reason ? '：' + dto.reason : ''}`,
          type: NotificationType.WORK_ORDER_CANCELLED,
        },
      });
      this.realtimeGateway.emitNotificationCreated(workOrder.reporterId, notification);
      this.realtimeGateway.emitWorkOrderUpdated(workOrder.reporterId, updated);

      // 通知维修人员（如果已派单）
      if (workOrder.workerId) {
        const workerNotification = await tx.notification.create({
          data: {
            userId: workOrder.workerId,
            workOrderId: id,
            title: '工单已取消',
            content: `工单「${workOrder.title}」已被管理员取消`,
            type: NotificationType.WORK_ORDER_CANCELLED,
          },
        });
        this.realtimeGateway.emitNotificationCreated(workOrder.workerId, workerNotification);
        this.realtimeGateway.emitWorkOrderUpdated(workOrder.workerId, updated);
      }

      return updated;
    });
  }

  /**
   * 获取统计数据（大屏用）
   */
  async getStats() {
    const [
      total,
      pending,
      processing,
      completed,
      unresolved,
      cancelled,
      byCategory,
    ] = await Promise.all([
      this.prisma.workOrder.count(),
      this.prisma.workOrder.count({ where: { status: WorkOrderStatus.PENDING } }),
      this.prisma.workOrder.count({ where: { status: { in: [WorkOrderStatus.ACCEPTED, WorkOrderStatus.ASSIGNED, WorkOrderStatus.PROCESSING, WorkOrderStatus.PENDING_CONFIRM] } } }),
      this.prisma.workOrder.count({ where: { status: WorkOrderStatus.COMPLETED } }),
      this.prisma.workOrder.count({ where: { status: WorkOrderStatus.UNRESOLVED } }),
      this.prisma.workOrder.count({ where: { status: WorkOrderStatus.CANCELLED } }),
      this.prisma.workOrder.groupBy({
        by: ['categoryId'],
        _count: true,
      }),
    ]);

    const categories = await this.prisma.category.findMany();
    const categoryStats = byCategory.map((item) => ({
      categoryId: item.categoryId,
      categoryName: categories.find((c) => c.id === item.categoryId)?.name || '未知',
      count: item._count,
    }));

    return {
      total,
      pending,
      processing,
      completed,
      unresolved,
      cancelled,
      categoryStats,
    };
  }

  // ==================== 私有辅助方法 ====================

  private async getWorkOrder(id: number) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
      include: {
        category: true,
        reporter: { select: this.userSelect() },
        worker: { select: this.userSelect() },
        attachments: true,
      },
    });
    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }
    return workOrder;
  }

  private async transition(
    id: number,
    userId: number,
    toStatus: WorkOrderStatus,
    action: string,
    options: {
      fromStatuses: WorkOrderStatus[];
      timeField?: string;
      ownershipCheck?: 'reporterId' | 'workerId';
      notifyUser?: 'reporterId' | 'workerId';
      notifyTitle: string;
      notifyContent: (wo: any) => string;
      notifyType: NotificationType;
    },
  ) {
    const workOrder = await this.getWorkOrder(id);

    if (!options.fromStatuses.includes(workOrder.status)) {
      throw new BadRequestException(
        `当前状态「${workOrder.status}」不允许此操作`,
      );
    }

    if (options.ownershipCheck === 'reporterId' && workOrder.reporterId !== userId) {
      throw new ForbiddenException('您不是此工单的报修人');
    }
    if (options.ownershipCheck === 'workerId' && workOrder.workerId !== userId) {
      throw new ForbiddenException('您不是此工单的指派维修人员');
    }

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = { status: toStatus };
      if (options.timeField) {
        updateData[options.timeField] = new Date();
      }

      const updated = await tx.workOrder.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          reporter: { select: this.userSelect() },
          worker: { select: this.userSelect() },
          attachments: true,
        },
      });

      await tx.workOrderLog.create({
        data: {
          workOrderId: id,
          userId,
          action,
          fromStatus: workOrder.status,
          toStatus,
          detail: options.notifyTitle,
        },
      });

      // 通知相关用户
      if (options.notifyUser) {
        const notifyUserId = workOrder[options.notifyUser];
        if (notifyUserId) {
          const notification = await tx.notification.create({
            data: {
              userId: notifyUserId,
              workOrderId: id,
              title: options.notifyTitle,
              content: options.notifyContent(workOrder),
              type: options.notifyType,
            },
          });
          this.realtimeGateway.emitNotificationCreated(notifyUserId, notification);
          this.realtimeGateway.emitWorkOrderUpdated(notifyUserId, updated);
        }
      }

      // 推送给操作者自己
      this.realtimeGateway.emitWorkOrderUpdated(userId, updated);

      return updated;
    });
  }

  private userSelect() {
    return {
      id: true,
      username: true,
      name: true,
      role: true,
      phone: true,
      avatar: true,
    };
  }

  private guessMimeType(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    return mimeMap[ext || ''] || 'application/octet-stream';
  }
}
