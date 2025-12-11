# 中国历史时间线网站

一个交互式的中国历史时间线网站，通过时间线和关系图谱可视化展示中国历史事件、人物及其相互关系。

🌐 **在线访问**: [https://chengms.cc/HistoricalThreads/](https://chengms.cc/HistoricalThreads/)

## ✨ 核心功能

- 🕐 **时间线展示**：按时间顺序展示历史事件，支持点击查看详情，可按朝代和事件类型筛选
- 🕸️ **关系图谱**：可视化展示历史人物之间的关系网络，支持点击节点查看人物详情
- 🔍 **智能搜索**：全局搜索功能，支持搜索历史事件和人物，支持按朝代筛选
- 📚 **权威来源**：每条信息标注官方权威来源，确保信息可靠性
- 💡 **用户建议**：允许用户提交内容建议和修正，帮助完善数据
- 📱 **响应式设计**：支持多设备访问，适配桌面和移动端
- 🎯 **详情页面**：展示事件和人物的详细信息，包括相关人物、关系和来源

## 🛠️ 技术栈

### 前端
- React 18 + TypeScript
- Vite
- Ant Design 5.x
- vis-timeline (时间线可视化)
- vis-network (关系图谱可视化)
- Tailwind CSS
- Framer Motion (动画)

### 后端（可选）
- Node.js + Express（已配置但当前使用静态数据）
- PostgreSQL（已配置但当前使用静态数据）
- Prisma ORM
- JWT 认证

**当前状态**：项目使用静态 JSON 数据，无需后端即可运行。后端代码已准备，可根据需要启用。

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

本项目采用**全静态部署**方案，已配置 GitHub Pages 自动部署。

### 🌟 GitHub Pages 自动部署（已配置）

项目已配置 GitHub Actions 工作流，每次推送到 `main` 分支会自动部署到 GitHub Pages。

**访问地址**: [https://chengms.cc/HistoricalThreads/](https://chengms.cc/HistoricalThreads/)

**部署流程**：
1. 推送代码到 `main` 分支
2. GitHub Actions 自动触发构建和部署
3. 等待 2-5 分钟完成部署
4. 访问上述地址查看网站

**查看部署状态**：
- 访问 [Actions 页面](https://github.com/chengms/HistoricalThreads/actions) 查看部署进度
- 绿色勾号表示部署成功

详细部署说明请查看：
- [GitHub Pages 部署指南](./docs/GitHub Pages部署指南.md)
- [快速部署步骤](./docs/快速部署步骤.md)
- [静态部署文档](./docs/静态部署文档.md)

### 其他部署平台

项目也支持部署到以下平台：

- **Vercel**: 免费，自动部署
- **Netlify**: 免费，功能丰富
- **阿里云 OSS / 腾讯云 COS**: 国内访问快

### 更新数据

1. 编辑 `frontend/public/data/*.json` 文件
2. 推送到 GitHub（自动触发重新部署）
3. 等待部署完成即可看到更新

## 📖 文档

详细文档请查看 `docs/` 目录：

- [项目需求文档](./docs/项目需求文档.md) - 完整的功能需求说明
- [技术架构文档](./docs/技术架构文档.md) - 技术选型和架构设计
- [数据库设计文档](./docs/数据库设计文档.md) - 数据模型设计
- [UI设计文档](./docs/UI设计文档.md) - 界面设计规范
- [快速开始指南](./docs/快速开始指南.md) - 本地开发指南
- [GitHub Pages 部署指南](./docs/GitHub Pages部署指南.md) - 部署到 GitHub Pages
- [快速部署步骤](./docs/快速部署步骤.md) - 快速部署说明

## 🎨 设计特色

- **大气磅礴**：体现中国历史的厚重感
- **现代简约**：采用现代化设计语言，使用 Ant Design 组件库
- **流畅交互**：自然流畅的动画效果，使用 Framer Motion
- **信息清晰**：层次分明，易于理解
- **错误处理**：完善的错误边界和错误提示
- **加载优化**：优雅的加载状态提示

## 📝 开发计划

### ✅ 已完成

- [x] 项目文档和架构设计
- [x] 前端基础框架搭建（React + TypeScript + Vite）
- [x] 时间线组件开发（vis-timeline，支持点击跳转）
- [x] 关系图谱组件开发（vis-network，支持点击跳转）
- [x] 详情页功能（事件和人物详情展示）
- [x] 全局搜索功能（首页和导航栏搜索）
- [x] 用户建议功能（表单提交）
- [x] 错误处理和优化（错误边界、加载状态）
- [x] GitHub Pages 自动部署配置
- [x] TypeScript 类型完善

### 🚧 进行中 / 计划中

- [ ] 后端API开发（可选，当前使用静态数据）
- [ ] 数据管理后台
- [ ] 性能优化（大数据量支持、代码分割）
- [ ] 响应式设计优化（移动端体验）
- [ ] 单元测试和集成测试
- [ ] PWA 支持（离线访问）
- [ ] 国际化支持（多语言）

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 数据贡献

如果你发现历史数据有误或想添加新内容：
1. 编辑 `frontend/public/data/*.json` 文件
2. 确保数据格式正确
3. 提交 Pull Request

## 🐛 问题反馈

如果发现问题或有建议，请提交 [Issue](https://github.com/chengms/HistoricalThreads/issues)。

## 📄 许可证

MIT License

Copyright (c) 2025 Chengms

## 🙏 致谢

- [vis-timeline](https://github.com/visjs/vis-timeline) - 时间线可视化库
- [vis-network](https://github.com/visjs/vis-network) - 关系图谱可视化库
- [Ant Design](https://ant.design/) - UI 组件库
- [React](https://react.dev/) - UI 框架
- [Vite](https://vitejs.dev/) - 构建工具

## 📊 项目状态

![GitHub Actions](https://github.com/chengms/HistoricalThreads/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)

