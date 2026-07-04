import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  async findAll(userId: number, query?: { isRead?: boolean; page?: number; pageSize?: number }) {
    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = { userId };
    if (query?.isRead !== undefined) {
      where.isRead = query.isRead;
    }

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          workOrder: {
            select: { id: true, title: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async getUnreadCount(userId: number) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(id: number, userId: number) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new NotFoundException('通知不存在');
    }
    if (notification.userId !== userId) {
      throw new NotFoundException('通知不存在');
    }
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: `已标记 ${result.count} 条通知为已读` };
  }
}
