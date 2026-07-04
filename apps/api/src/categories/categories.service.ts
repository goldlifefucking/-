import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findAllAdmin() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException('分类名称已存在');
    }
    return this.prisma.category.create({
      data: {
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findOne(id);
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.icon !== undefined) data.icon = dto.icon;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    const workOrderCount = await this.prisma.workOrder.count({ where: { categoryId: id } });
    if (workOrderCount > 0) {
      throw new ConflictException('该分类下已有工单，无法删除');
    }
    await this.prisma.category.delete({ where: { id } });
    return { message: '分类已删除' };
  }
}
