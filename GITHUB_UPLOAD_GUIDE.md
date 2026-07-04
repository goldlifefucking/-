# 上传项目到 GitHub 操作指南

## 第一步：在 GitHub 上创建空仓库

1. 打开浏览器，访问 https://github.com/new
2. 登录你的 GitHub 账号（goldlifefucking）
3. 填写仓库信息：
   - **Repository name**: `神的第二条命`
   - **Description**: `校园工单管理系统 - Vue3 + NestJS + PostgreSQL + Docker`
   - **可见性**: 选择 **Public**
   - **⚠️ 重要**: 不要勾选 "Add a README file"、不要选 "Add .gitignore"、不要选 "Choose a license"（因为本地已有这些文件）
4. 点击 **Create repository** 按钮

## 第二步：回到终端推送代码

创建好仓库后，在项目目录下执行以下命令（复制粘贴即可）：

```bash
cd "D:/校园工单管理系统"

# 添加远程仓库
git remote add origin https://github.com/goldlifefucking/神的第二条命.git

# 推送到 GitHub
git push -u origin main
```

## 第三步：身份验证

推送时会弹出认证窗口，有两种情况：

### 情况 A：Git Credential Manager 弹窗（最常见）
Windows 上安装 Git 时通常自带 Credential Manager：
1. 弹出 "Sign in to GitHub" 窗口
2. 点击 **"Sign in with your browser"**
3. 浏览器打开 GitHub 授权页面，点击 **"Authorize"**
4. 授权成功后自动完成推送

### 情况 B：要求输入用户名和密码
如果弹出命令行输入提示：
1. **Username**: 输入 `goldlifefucking`
2. **Password**: 不要输入登录密码！需要使用 Personal Access Token (PAT)
   - 访问 https://github.com/settings/tokens/new
   - Note: 填写 `campus-workorder`
   - Expiration: 选 30 天
   - 勾选 `repo` 权限
   - 点击 **Generate token**
   - 复制生成的 token，粘贴到密码输入框

## 第四步：验证

推送成功后：
1. 访问 https://github.com/goldlifefucking/神的第二条命
2. 确认能看到所有项目文件
3. README.md 会自动显示在仓库首页

## 常见问题

### Q: 推送时报错 "failed to push some refs"
```bash
git push -u origin main --force
```

### Q: 中文仓库名 URL 编码问题
如果中文仓库名导致 remote URL 出错，可以重新设置：
```bash
git remote remove origin
git remote add origin https://github.com/goldlifefucking/神的第二条命.git
```

### Q: 想改用 SSH 方式推送
```bash
git remote remove origin
git remote add origin git@github.com:goldlifefucking/神的第二条命.git
```
（前提是已配置 SSH Key）

### Q: 后续更新代码后如何推送
```bash
git add -A
git commit -m "描述你改了什么"
git push
```
