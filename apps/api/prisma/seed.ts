import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化种子数据...');

  // 创建默认用户
  const users = [
    {
      username: 'admin',
      password: await bcrypt.hash('Admin123456', 10),
      name: '系统管理员',
      role: UserRole.ADMIN,
      phone: '13800000001',
    },
    {
      username: 'repairer',
      password: await bcrypt.hash('Repair123456', 10),
      name: '张维修',
      role: UserRole.WORKER,
      phone: '13800000002',
    },
    {
      username: 'student',
      password: await bcrypt.hash('Student123456', 10),
      name: '李同学',
      role: UserRole.STUDENT,
      phone: '13800000003',
    },
    {
      username: 'teacher',
      password: await bcrypt.hash('Teacher123456', 10),
      name: '王老师',
      role: UserRole.TEACHER,
      phone: '13800000004',
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: user,
    });
    console.log(`  用户已创建: ${user.username} (${user.name})`);
  }

  // 创建默认分类
  const categories = [
    { name: '水电维修', description: '水龙头、马桶、水管、电路等维修', icon: 'tool', sortOrder: 1 },
    { name: '家具维修', description: '床、桌椅、柜子、门窗等维修', icon: 'home', sortOrder: 2 },
    { name: '网络设备', description: '校园网、WiFi、交换机、路由器等', icon: 'wifi', sortOrder: 3 },
    { name: '教学设备', description: '投影仪、电脑、音响、白板等', icon: 'desktop', sortOrder: 4 },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    console.log(`  分类已创建: ${category.name}`);
  }

  console.log('种子数据初始化完成！');
}

main()
  .catch((e) => {
    console.error('种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
