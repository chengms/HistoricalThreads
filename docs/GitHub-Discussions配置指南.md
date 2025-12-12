# GitHub Discussions 配置指南

## 概述

使用 GitHub Discussions 来收集用户建议，这是**最安全且方便**的方案：

✅ **无需 Token**：不需要 Personal Access Token，完全安全  
✅ **无需配置**：只需在仓库中启用 Discussions 功能  
✅ **用户友好**：用户可以直接在 GitHub 上查看和讨论建议  
✅ **易于管理**：可以在 GitHub 上直接回复和管理建议  

## 配置步骤

### 步骤 1: 启用 Discussions 功能

1. 访问仓库设置：`https://github.com/chengms/HistoricalThreads/settings`
2. 在左侧菜单中找到 **Features**（功能）部分
3. 找到 **Discussions** 选项
4. 勾选 **Discussions** 复选框
5. 点击 **Save changes**

### 步骤 2: 创建建议类别（可选）

1. 访问 Discussions 页面：`https://github.com/chengms/HistoricalThreads/discussions`
2. 点击 **New discussion** 按钮
3. 在创建讨论时，可以创建自定义类别，例如：
   - **建议** (Suggestions)
   - **反馈** (Feedback)
   - **问题报告** (Bug Reports)

### 步骤 3: 获取类别 ID（用于预填充链接）

1. 访问 Discussions 页面
2. 查看 URL，类别 ID 通常在 URL 参数中
3. 或者使用浏览器开发者工具查看网络请求

**注意**：如果使用预填充链接方式，类别 ID 是可选的。用户可以在提交时选择类别。

## 工作原理

### 方案 A: 预填充链接（推荐，已实现）

当用户提交建议时，系统会：

1. 格式化建议内容为 Markdown
2. 生成一个 GitHub Discussions 创建链接
3. 在新标签页中打开链接，预填充标题和内容
4. 用户确认后点击 "Start discussion" 提交

**优点**：
- ✅ 完全安全，无需 Token
- ✅ 用户可以在提交前预览和编辑
- ✅ 支持所有 GitHub Discussions 功能

### 方案 B: GraphQL API（需要 Token，不推荐）

如果需要自动创建讨论，可以使用 GraphQL API，但需要：
- Personal Access Token（有安全风险）
- 获取仓库 ID 和类别 ID
- 使用 GraphQL 查询和变更

**不推荐**，因为需要暴露 Token 或使用服务器端代理。

## 使用方式

### 用户提交建议

1. 用户填写建议表单
2. 点击"提交建议"按钮
3. 系统生成预填充的 GitHub Discussions 链接
4. 在新标签页中打开 GitHub 创建讨论页面
5. 用户确认内容后点击 "Start discussion" 提交

### 管理员管理建议

1. 访问 Discussions 页面：`https://github.com/chengms/HistoricalThreads/discussions`
2. 查看所有建议讨论
3. 可以回复、标记、分类建议
4. 可以关闭已处理的建议

## 建议格式

系统会自动格式化建议内容，包含：

- **建议类型**：新增事件、新增人物等
- **时间**：用户填写的时间
- **详细描述**：用户填写的描述
- **信息来源**：所有来源的详细信息
- **联系方式**：姓名和邮箱（可选，用户可以选择是否包含）
- **提交时间**：自动记录

## 隐私和安全

### 用户隐私

- 联系方式（姓名和邮箱）是**可选的**
- 用户可以选择是否在建议中包含联系方式
- 如果包含，信息会公开在 GitHub Discussions 中

### 安全优势

- ✅ 无需在客户端存储 Token
- ✅ 无需服务器端处理
- ✅ 所有数据存储在 GitHub（安全可靠）
- ✅ 用户可以直接在 GitHub 上管理自己的建议

## 故障排查

### Discussions 功能未启用

**问题**：点击链接后显示 404 或无法创建讨论

**解决**：
1. 确认已在仓库设置中启用 Discussions
2. 确认你有仓库的写入权限
3. 等待几分钟让设置生效

### 链接无法打开

**问题**：点击链接后没有反应

**解决**：
1. 检查浏览器是否阻止了弹窗
2. 允许网站打开新标签页
3. 手动复制链接到新标签页打开

### 预填充内容格式错误

**问题**：GitHub 页面显示格式混乱

**解决**：
1. 检查 Markdown 格式是否正确
2. 用户可以在提交前手动编辑内容
3. 报告问题以便修复格式化逻辑

## 相关链接

- [GitHub Discussions 文档](https://docs.github.com/en/discussions)
- [GitHub Discussions API](https://docs.github.com/en/graphql/guides/using-the-graphql-api-for-discussions)
- [Markdown 语法](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github)

## 与 GitHub Issues 的对比

| 特性 | GitHub Discussions | GitHub Issues |
|------|-------------------|---------------|
| 需要 Token | ❌ 不需要 | ✅ 需要 |
| 安全性 | ✅ 高（无需 Token） | ⚠️ 需要保护 Token |
| 配置复杂度 | ✅ 简单（只需启用） | ⚠️ 需要配置 Token |
| 用户交互 | ✅ 支持讨论和回复 | ✅ 支持评论和回复 |
| 分类管理 | ✅ 支持类别 | ✅ 支持标签 |
| 自动创建 | ⚠️ 需要用户确认 | ✅ 可以自动创建 |

**结论**：GitHub Discussions 更适合公开收集建议，更安全且用户友好。

