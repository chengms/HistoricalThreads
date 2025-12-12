# Twikoo 评论系统配置指南

## 概述

Twikoo 是一款简洁、安全、免费的静态网站评论系统，非常适合静态网站使用。

✅ **免费**：完全免费使用  
✅ **安全**：数据存储在云端，安全可靠  
✅ **简洁**：界面简洁美观  
✅ **易用**：配置简单，易于集成  

## 部署后端服务

Twikoo 需要后端服务来存储评论数据。您可以选择以下方式之一：

### 方案 1: Vercel 部署（推荐，最简单）

1. **访问 Twikoo Vercel 部署页面**：
   - 访问：https://github.com/imaegoo/twikoo
   - 点击 "Deploy to Vercel" 按钮

2. **配置部署**：
   - 使用 GitHub 账号登录 Vercel
   - 选择仓库（可以 fork 到自己的账号）
   - 点击 "Deploy"

3. **获取环境 ID**：
   - 部署完成后，Vercel 会提供一个 URL，例如：`https://your-project.vercel.app`
   - 这个 URL 就是您的 `envId`

### 方案 2: 腾讯云云开发（CloudBase）

1. **注册腾讯云账号**
2. **创建云开发环境**
3. **部署 Twikoo 函数**
4. **获取环境 ID**

详细步骤请参考：[Twikoo 官方文档](https://twikoo.js.org/intro)

### 方案 3: 私有服务器部署

使用 Docker 部署：

```bash
docker pull imaegoo/twikoo
docker run -p 8080:8080 -v ${PWD}/data:/app/data -d imaegoo/twikoo
```

然后配置 Nginx 反向代理。

## 配置前端

### 步骤 1: 设置环境变量

在 `frontend` 目录下创建 `.env` 文件（开发环境）或 `.env.production` 文件（生产环境）：

```env
# Twikoo 环境 ID（后端服务地址）
VITE_TWIKOO_ENV_ID=https://your-twikoo-backend.vercel.app
```

**注意**：
- 如果使用 Vercel 部署，`envId` 就是您的 Vercel 项目 URL
- 如果使用腾讯云云开发，`envId` 是您的云开发环境 ID
- 如果使用私有服务器，`envId` 是您的服务器地址

### 步骤 2: 验证配置

1. 启动开发服务器：`npm run dev`
2. 访问任意详情页（事件或人物）
3. 页面底部应该显示评论区域
4. 如果显示正常，说明配置成功

### 步骤 3: 生产环境配置

如果使用 GitHub Pages 部署，需要在 GitHub Actions 中设置环境变量：

1. 访问仓库设置：`https://github.com/chengms/HistoricalThreads/settings`
2. 进入 **Secrets and variables** > **Actions** > **Variables**
3. 添加变量：
   - **Name**: `VITE_TWIKOO_ENV_ID`
   - **Value**: 您的 Twikoo 后端地址
4. 修改 `.github/workflows/deploy.yml`，在 Build 步骤中添加环境变量：

```yaml
- name: Build
  run: cd frontend && npm run build
  env:
    VITE_TWIKOO_ENV_ID: ${{ vars.VITE_TWIKOO_ENV_ID }}
```

## 使用方式

### 用户评论

1. 访问事件或人物详情页
2. 滚动到页面底部
3. 在评论区域填写昵称、邮箱和评论内容
4. 点击"提交"按钮
5. 评论会显示在页面上

### 管理员管理

1. 访问 Twikoo 管理后台（通常是后端地址 + `/admin`）
2. 可以审核、删除、回复评论
3. 可以配置邮件通知等

## 评论路径

每个详情页的评论是独立的，通过路径区分：

- 事件详情页：`/detail/event/{id}`
- 人物详情页：`/detail/person/{id}`

这样每个事件和人物都有自己独立的评论区域。

## 自定义配置

### 修改语言

在 `TwikooComment` 组件中，可以修改 `lang` 属性：

```tsx
<TwikooComment path={`/detail/${type}/${id}`} lang="zh-CN" />
```

支持的语言：
- `zh-CN`：简体中文（默认）
- `zh-TW`：繁体中文
- `en`：英文

### 修改样式

评论组件的样式可以通过 CSS 自定义。在 `frontend/src/styles/detail.css` 中添加：

```css
/* Twikoo 评论样式 */
#twikoo-comment-container {
  /* 自定义样式 */
}
```

## 故障排查

### 评论区域不显示

1. **检查环境变量**：
   - 确认 `VITE_TWIKOO_ENV_ID` 已正确设置
   - 确认环境变量在构建时可用

2. **检查后端服务**：
   - 确认后端服务正常运行
   - 访问后端地址，应该能看到 Twikoo 的欢迎页面

3. **检查浏览器控制台**：
   - 打开开发者工具（F12）
   - 查看 Console 标签，看是否有错误信息

### 评论提交失败

1. **检查网络连接**
2. **检查后端服务状态**
3. **查看浏览器控制台的错误信息**

### 评论不显示

1. **检查评论是否被审核**（如果启用了审核功能）
2. **检查评论路径是否正确**
3. **清除浏览器缓存后重试**

## 安全建议

1. **启用评论审核**：在 Twikoo 管理后台启用评论审核功能
2. **配置邮件通知**：及时收到新评论通知
3. **定期备份数据**：如果使用私有服务器，定期备份评论数据

## 相关链接

- [Twikoo 官方文档](https://twikoo.js.org/intro)
- [Twikoo GitHub 仓库](https://github.com/imaegoo/twikoo)
- [Vercel 部署指南](https://vercel.com/docs)
- [腾讯云云开发文档](https://cloud.tencent.com/document/product/876)

## 与 GitHub Discussions 的对比

| 特性 | Twikoo | GitHub Discussions |
|------|--------|-------------------|
| 部署方式 | 需要后端服务 | 无需后端 |
| 配置复杂度 | 中等（需要部署后端） | 简单（只需启用） |
| 用户体验 | ✅ 直接在页面评论 | ⚠️ 需要跳转到 GitHub |
| 数据存储 | 云端数据库 | GitHub |
| 审核功能 | ✅ 支持 | ✅ 支持 |
| 邮件通知 | ✅ 支持 | ✅ 支持 |
| 适合场景 | 页面内评论 | 建议和讨论 |

**建议**：
- **页面评论**：使用 Twikoo（用户体验更好）
- **建议提交**：使用 GitHub Discussions（更安全，无需后端）

