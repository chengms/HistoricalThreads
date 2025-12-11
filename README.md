# 中国历史时间线网站

一个交互式的中国历史时间线网站，通过时间线和关系图谱可视化展示中国历史事件、人物及其相互关系。

## ✨ 核心功能

- 🕐 **时间线展示**：按时间顺序展示历史事件和人物活动
- 🕸️ **关系图谱**：可视化展示人物之间的关系网络
- 🔍 **智能搜索**：支持全文搜索和高级筛选
- 📚 **权威来源**：每条信息标注官方权威来源
- 💡 **用户建议**：允许用户提交内容建议和修正
- 📱 **响应式设计**：支持多设备访问

## 🛠️ 技术栈

### 前端
- React 18 + TypeScript
- Vite
- Ant Design 5.x
- vis-timeline (时间线可视化)
- vis-network (关系图谱可视化)
- Tailwind CSS
- Framer Motion (动画)

### 后端
- Node.js + Express
- PostgreSQL
- Prisma ORM
- JWT 认证

## 📁 项目结构

```
historical-threads/
├── frontend/          # 前端应用
├── backend/           # 后端服务
├── docs/              # 项目文档
└── README.md
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
cd frontend
npm install
```

### 启动开发服务器

```bash
cd frontend
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
cd frontend
npm run build
```

构建产物在 `frontend/dist` 目录，可直接部署到任何静态托管服务。

## 📦 部署

本项目采用**全静态部署**方案，支持以下平台：

- **GitHub Pages**: 免费，适合开源项目
- **Vercel**: 免费，自动部署，推荐 ⭐
- **Netlify**: 免费，功能丰富
- **阿里云 OSS / 腾讯云 COS**: 国内访问快

详细部署说明请查看 [静态部署文档](./docs/静态部署文档.md)

### 快速部署到 Vercel

1. 推送代码到 GitHub
2. 访问 https://vercel.com
3. 导入 GitHub 仓库
4. 配置构建命令：`cd frontend && npm install && npm run build`
5. 配置输出目录：`frontend/dist`
6. 点击部署

### 更新数据

1. 编辑 `frontend/public/data/*.json` 文件
2. 推送到 GitHub（Vercel/Netlify 自动重新部署）
3. 或手动重新构建和部署

## 📖 文档

详细文档请查看 `docs/` 目录：

- [项目需求文档](./docs/项目需求文档.md)
- [技术架构文档](./docs/技术架构文档.md)
- [数据库设计文档](./docs/数据库设计文档.md)
- [UI设计文档](./docs/UI设计文档.md)

## 🎨 设计特色

- **大气磅礴**：体现中国历史的厚重感
- **现代简约**：采用现代化设计语言
- **流畅交互**：自然流畅的动画效果
- **信息清晰**：层次分明，易于理解

## 📝 开发计划

- [x] 项目文档和架构设计
- [x] 前端基础框架搭建
- [x] 时间线组件开发
- [x] 关系图谱组件开发
- [x] 详情页功能
- [x] 全局搜索功能
- [x] 用户建议功能
- [x] 错误处理和优化
- [ ] 后端API开发（可选，当前使用静态数据）
- [ ] 数据管理后台
- [ ] 性能优化（大数据量支持）
- [ ] 响应式设计优化

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

