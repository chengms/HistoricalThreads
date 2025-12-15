# Kimi API 配置指南

## 📋 概述

爬虫系统现在支持两种 AI 提供商：
- **Kimi (Moonshot AI)** - 推荐，价格更优惠
- **OpenAI** - 备选方案

## 🔑 获取 Kimi API Key

### 1. 注册账号

访问 [Moonshot AI 平台](https://platform.moonshot.cn/)

### 2. 创建 API Key

1. 登录后进入控制台
2. 找到 "API Keys" 或 "密钥管理"
3. 点击 "创建新密钥"
4. 复制生成的 API Key

### 3. 查看可用模型

Kimi 提供以下模型：
- `moonshot-v1-8k` - 8K 上下文，适合一般使用
- `moonshot-v1-32k` - 32K 上下文，适合长文本
- `moonshot-v1-128k` - 128K 上下文，适合超长文本

## ⚙️ 配置方法

### 方法 1: 使用 Kimi API（推荐）

在 `scripts/crawler/.env` 文件中配置：

```env
# Kimi API 配置
KIMI_API_KEY=your-kimi-api-key-here
KIMI_MODEL=moonshot-v1-8k
```

### 方法 2: 使用 OpenAI API

```env
# OpenAI API 配置
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4
```

### 优先级说明

系统会按以下优先级选择 AI 提供商：
1. **Kimi API** - 如果配置了 `KIMI_API_KEY`，优先使用
2. **OpenAI API** - 如果只配置了 `OPENAI_API_KEY`，使用 OpenAI
3. **默认列表** - 如果都没有配置，使用默认列表（无 AI 功能）

## 🚀 使用示例

### 1. 配置 Kimi API

```bash
cd scripts/crawler
cp .env.example .env
```

编辑 `.env` 文件：
```env
KIMI_API_KEY=sk-xxxxxxxxxxxxx
KIMI_MODEL=moonshot-v1-8k
```

### 2. 运行爬虫

```bash
npm start 汉朝
```

系统会自动使用 Kimi API 进行：
- 自动发现历史人物和事件
- AI 审核内容准确性
- 验证人物与事件关联

## 💰 费用对比

### Kimi API 价格（参考）

- `moonshot-v1-8k`: 约 ¥0.012/1K tokens（输入）
- `moonshot-v1-32k`: 约 ¥0.024/1K tokens（输入）
- `moonshot-v1-128k`: 约 ¥0.06/1K tokens（输入）

### OpenAI 价格（参考）

- `gpt-4`: 约 $0.03/1K tokens（输入）
- `gpt-3.5-turbo`: 约 $0.0015/1K tokens（输入）

**建议**：Kimi API 通常比 OpenAI 更便宜，推荐使用。

## 🔍 验证配置

运行爬虫时，系统会显示当前使用的 AI 提供商：

```bash
$ npm start 汉朝

🚀 自动历史数据爬虫启动
============================================================
📋 计划处理朝代: 汉朝
🤖 AI 提供商: Kimi (Moonshot AI)
============================================================
```

如果没有配置 API Key，会显示：

```
⚠️  AI API Key 未配置，将使用默认列表
```

## ⚠️ 注意事项

1. **API Key 安全**
   - 不要将 `.env` 文件提交到 Git
   - 确保 `.env` 在 `.gitignore` 中

2. **使用限制**
   - 注意 API 的速率限制
   - 监控 API 使用量和费用
   - 建议设置使用限额

3. **模型选择**
   - 一般使用：`moonshot-v1-8k`
   - 长文本：`moonshot-v1-32k`
   - 超长文本：`moonshot-v1-128k`

4. **网络访问**
   - 确保可以访问 `api.moonshot.cn`
   - 如果网络受限，可能需要代理

## 🐛 故障排查

### 问题 1: API Key 无效

**错误**：`API 调用失败` 或 `401 Unauthorized`

**解决**：
1. 检查 API Key 是否正确
2. 确认 API Key 未过期
3. 检查账户余额是否充足

### 问题 2: 模型不存在

**错误**：`Model not found`

**解决**：
1. 检查模型名称是否正确
2. 确认账户有权限使用该模型
3. 尝试使用 `moonshot-v1-8k`

### 问题 3: 网络连接失败

**错误**：`Failed to connect` 或 `Timeout`

**解决**：
1. 检查网络连接
2. 确认可以访问 `api.moonshot.cn`
3. 检查防火墙设置
4. 尝试使用代理

## 📚 相关文档

- [自动爬虫使用指南](./自动爬虫使用指南.md)
- [爬虫 README](../scripts/crawler/README.md)
- [Moonshot AI 官方文档](https://platform.moonshot.cn/docs)

## 💡 使用建议

1. **首次使用**：建议先用 `moonshot-v1-8k` 测试
2. **批量处理**：确认无误后再批量使用
3. **费用控制**：设置 API 使用限额
4. **定期检查**：监控 API 使用情况

