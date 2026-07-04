import { IsString, MinLength, IsOptional, IsEnum, IsInt, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority } from '@prisma/client';

export class CreateWorkOrderDto {
  @ApiProperty({ description: '工单标题', example: '宿舍水龙头漏水' })
  @IsString()
  @MinLength(2)
  title: string;

  @ApiProperty({ description: '问题描述', example: '3栋205宿舍洗手台水龙头持续漏水' })
  @IsString()
  @MinLength(5)
  description: string;

  @ApiPropertyOptional({ description: '位置', example: '3栋205宿舍' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: '优先级', enum: Priority, example: Priority.MEDIUM })
  @IsEnum(Priority)
  priority: Priority;

  @ApiProperty({ description: '分类ID', example: 1 })
  @IsInt()
  categoryId: number;

  @ApiPropertyOptional({ description: '附件URL列表（处理前图片）', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class AssignWorkOrderDto {
  @ApiProperty({ description: '维修人员ID', example: 2 })
  @IsInt()
  workerId: number;
}

export class ResolveWorkOrderDto {
  @ApiProperty({ description: '处理说明', example: '已更换水龙头芯，漏水问题已解决' })
  @IsString()
  @MinLength(5)
  resolution: string;

  @ApiPropertyOptional({ description: '处理后图片URL列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class UnresolveWorkOrderDto {
  @ApiProperty({ description: '反馈内容', example: '漏水问题仍然存在' })
  @IsString()
  @MinLength(5)
  feedback: string;
}

export class CancelWorkOrderDto {
  @ApiPropertyOptional({ description: '取消原因' })
  @IsOptional()
  @IsString()
  reason?: string;
}
