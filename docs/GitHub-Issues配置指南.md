# GitHub Issues 配置指南

## 概述

提交建议功能现在支持将建议自动提交到 GitHub Issues，这样可以：
- 方便追踪和统计建议
- 便于团队协作审核
- 自动创建 Issue，无需手动操作

## 配置步骤

### 1. 创建 GitHub Personal Access Token

1. 访问 [GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 填写 Token 名称，例如：`HistoricalThreads Suggestions`
4. 选择过期时间（建议选择较长时间或不过期）
5. 勾选权限：`public_repo`（创建 issues 需要此权限）
6. 点击 "Generate token"
7. **重要**：复制生成的 Token（只显示一次）

### 2. 配置环境变量

#### 开发环境

在 `frontend` 目录下创建 `.env` 文件：

```env
# GitHub API 配置
VITE_GITHUB_TOKEN=your_github_personal_access_token_here
VITE_GITHUB_REPO=chengms/HistoricalThreads
```

#### 生产环境（GitHub Pages）

由于 GitHub Pages 是静态站点，无法直接使用环境变量。有以下几种方案：

**方案 1：使用 GitHub Secrets（推荐）**

1. 在 GitHub 仓库设置中添加 Secrets：
   - 访问仓库 Settings > Secrets and variables > Actions
   - 添加 Secret：`GITHUB_TOKEN`（值为你的 Personal Access Token）

2. 修改 GitHub Actions 工作流，在构建时注入环境变量

**方案 2：使用 GitHub Actions 自动创建 Issue**

修改 GitHub Actions 工作流，添加一个步骤来处理建议提交。

**方案 3：使用 GitHub Discussions API**

使用 GitHub Discussions 代替 Issues，无需 Token（但需要仓库启用 Discussions）。

### 3. 验证配置

1. 启动开发服务器：`npm run dev`
2. 访问提交建议页面
3. 填写并提交一个测试建议
4. 检查是否成功创建 GitHub Issue

## 提交流程

系统会按以下优先级尝试提交：

1. **GitHub Issues**（如果配置了 Token）
   - 自动创建 Issue
   - 标题格式：`[建议] 用户输入的标题`
   - 内容包含完整的建议信息
   - 自动添加标签：`suggestion` 和类型标签

2. **后端 API**（如果 GitHub 不可用）
   - 提交到 `/api/suggestions`
   - 保存到数据库

3. **本地存储**（如果以上都不可用）
   - 保存到浏览器 localStorage
   - 键名：`suggestions`

## Issue 格式

创建的 Issue 包含以下信息：

- **建议类型**：新增事件、新增人物等
- **时间**：用户填写的时间
- **详细描述**：用户填写的描述
- **信息来源**：所有来源的详细信息
- **联系方式**：姓名和邮箱
- **提交时间**：自动记录

## 安全注意事项

⚠️ **重要**：
- 不要将 `.env` 文件提交到 Git
- Token 具有仓库访问权限，请妥善保管
- 如果 Token 泄露，立即在 GitHub 设置中撤销
- 生产环境建议使用 GitHub Secrets 或服务器端代理

## 故障排查

### Issue 创建失败

1. 检查 Token 是否正确
2. 检查 Token 是否有 `public_repo` 权限
3. 检查仓库名称是否正确
4. 查看浏览器控制台的错误信息

### 环境变量未生效

1. 确保 `.env` 文件在 `frontend` 目录下
2. 确保变量名以 `VITE_` 开头
3. 重启开发服务器
4. 检查 `.env` 文件是否被 `.gitignore` 忽略

## 相关链接

- [GitHub Personal Access Tokens](https://github.com/settings/tokens)
- [GitHub Issues API](https://docs.github.com/en/rest/issues/issues)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

