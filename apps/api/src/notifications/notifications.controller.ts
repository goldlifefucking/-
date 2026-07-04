import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@ApiTags('通知')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '获取通知列表' })
  findAll(
    @CurrentUser('id') userId: number,
    @Query('isRead') isRead?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.notificationsService.findAll(userId, {
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      page: page ? +page : 1,
      pageSize: pageSize ? +pageSize : 20,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: '获取未读通知数量' })
  getUnreadCount(@CurrentUser('id') userId: number) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: '全部标记已读' })
  markAllAsRead(@CurrentUser('id') userId: number) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '标记单条通知为已读' })
  markAsRead(@Param('id') id: string, @CurrentUser('id') userId: number) {
    return this.notificationsService.markAsRead(+id, userId);
  }
}
