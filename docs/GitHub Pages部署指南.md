# GitHub Pages 部署指南

## 一、启用 GitHub Pages

### 1. 在 GitHub 仓库中启用 Pages

1. 进入你的 GitHub 仓库：`https://github.com/chengms/HistoricalThreads`
2. 点击 **Settings**（设置）
3. 在左侧菜单中找到 **Pages**（页面）
4. 在 **Source**（源）部分：
   - 选择 **GitHub Actions** 作为部署源
   - 或者选择 **Deploy from a branch**，然后选择 `gh-pages` 分支和 `/ (root)` 目录

### 2. 检查 GitHub Actions 工作流

1. 点击仓库顶部的 **Actions** 标签
2. 你应该能看到 "Deploy to GitHub Pages" 工作流正在运行
3. 等待部署完成（通常需要 2-5 分钟）

### 3. 访问你的网站

部署完成后，你的网站将在以下地址可用：
- `https://chengms.github.io/HistoricalThreads/`

## 二、自动部署

每次你推送代码到 `main` 分支时，GitHub Actions 会自动：
1. 安装依赖
2. 构建项目
3. 部署到 GitHub Pages

## 三、手动触发部署

如果需要手动触发部署：
1. 进入 **Actions** 标签
2. 选择 "Deploy to GitHub Pages" 工作流
3. 点击 **Run workflow** 按钮

## 四、常见问题

### 问题 1：404 错误
- 确保 `vite.config.ts` 中的 `base` 路径设置为 `/HistoricalThreads/`
- 检查 GitHub Pages 设置中的源分支是否正确

### 问题 2：资源加载失败
- 确保所有资源路径使用相对路径或正确的 base 路径
- 检查浏览器控制台的错误信息

### 问题 3：部署失败
- 检查 GitHub Actions 日志中的错误信息
- 确保 `frontend/package.json` 中的构建脚本正确
- 确保 Node.js 版本兼容（项目使用 Node.js 18+）

## 五、自定义域名（可选）

如果你想使用自定义域名：
1. 在仓库根目录创建 `CNAME` 文件
2. 在文件中写入你的域名（例如：`history.example.com`）
3. 在 GitHub Pages 设置中配置 DNS 记录

## 六、验证部署

部署成功后，你可以：
1. 访问网站并测试所有功能
2. 检查时间线、关系图谱、搜索等功能是否正常
3. 测试响应式设计在不同设备上的表现

