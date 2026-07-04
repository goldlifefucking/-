import { IsString, MinLength, IsEnum, IsOptional, IsBoolean, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'newuser' })
  @IsString()
  @MinLength(2)
  username: string;

  @ApiProperty({ description: '密码', example: 'Password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: '姓名', example: '张三' })
  @IsString()
  name: string;

  @ApiProperty({ description: '角色', enum: UserRole, example: UserRole.STUDENT })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ description: '手机号' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '姓名' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '角色', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: '手机号' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '新密码（留空则不修改）' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
