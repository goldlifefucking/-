import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkOrdersService } from './work-orders.service';
import {
  CreateWorkOrderDto,
  AssignWorkOrderDto,
  ResolveWorkOrderDto,
  UnresolveWorkOrderDto,
  CancelWorkOrderDto,
} from './dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('工单管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/work-orders')
export class WorkOrdersController {
  constructor(private workOrdersService: WorkOrdersService) {}

  @Get()
  @ApiOperation({ summary: '获取工单列表（按角色过滤）' })
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('categoryId') categoryId?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.workOrdersService.findAll(user, {
      status,
      priority,
      categoryId,
      keyword,
      page: page ? +page : 1,
      pageSize: pageSize ? +pageSize : 10,
    });
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '获取工单统计数据（管理员，大屏用）' })
  getStats() {
    return this.workOrdersService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取工单详情' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workOrdersService.findOne(+id, user);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.TEACHER)
  @ApiOperation({ summary: '创建工单（报修人）' })
  create(@Body() dto: CreateWorkOrderDto, @CurrentUser('id') userId: number) {
    return this.workOrdersService.create(dto, userId);
  }

  @Post(':id/accept')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '受理工单（管理员）' })
  accept(@Param('id') id: string, @CurrentUser('id') userId: number) {
    return this.workOrdersService.accept(+id, userId);
  }

  @Post(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '派单（管理员）' })
  assign(
    @Param('id') id: string,
    @Body() dto: AssignWorkOrderDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.workOrdersService.assign(+id, userId, dto);
  }

  @Post(':id/start')
  @UseGuards(RolesGuard)
  @Roles(UserRole.WORKER)
  @ApiOperation({ summary: '开始处理（维修人员）' })
  start(@Param('id') id: string, @CurrentUser('id') userId: number) {
    return this.workOrdersService.start(+id, userId);
  }

  @Post(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.WORKER)
  @ApiOperation({ summary: '提交处理结果（维修人员）' })
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveWorkOrderDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.workOrdersService.resolve(+id, userId, dto);
  }

  @Post(':id/confirm')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.TEACHER)
  @ApiOperation({ summary: '确认完成（报修人）' })
  confirm(@Param('id') id: string, @CurrentUser('id') userId: number) {
    return this.workOrdersService.confirm(+id, userId);
  }

  @Post(':id/unresolve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.TEACHER)
  @ApiOperation({ summary: '反馈未解决（报修人）' })
  unresolve(
    @Param('id') id: string,
    @Body() dto: UnresolveWorkOrderDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.workOrdersService.unresolve(+id, userId, dto);
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '取消工单（管理员）' })
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelWorkOrderDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.workOrdersService.cancel(+id, userId, dto);
  }
}
