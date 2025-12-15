# 测试文件说明

本目录包含项目的测试脚本，用于验证各种功能是否正常工作。

## 📁 目录结构

```
tests/
├── README.md                    # 本文件
├── twikoo/                     # Twikoo 评论系统测试
│   ├── test-api.mjs            # 测试 Twikoo API 提交评论
│   └── test-get-comments.mjs   # 测试获取评论列表
└── image-upload/                # 图片上传功能测试
    └── test-upload.mjs          # 测试图片上传 API
```

## 🧪 测试脚本

### 1. Twikoo API 测试

#### `twikoo/test-api.mjs`
测试 Twikoo API 提交评论功能。

**使用方法：**
```bash
cd frontend
node tests/twikoo/test-api.mjs
```

**前置条件：**
- 在 `frontend/.env` 中配置 `VITE_TWIKOO_ENV_ID`

**测试内容：**
- 验证 API 端点格式
- 测试评论提交功能
- 检查响应格式

#### `twikoo/test-get-comments.mjs`
测试获取评论列表功能。

**使用方法：**
```bash
cd frontend
node tests/twikoo/test-get-comments.mjs
```

**测试内容：**
- 测试 `GET_RECENT_COMMENTS` 事件
- 验证评论列表响应格式
- 检查评论数据解析

### 2. 图片上传测试

#### `image-upload/test-upload.mjs`
测试图片上传到图床服务。

**使用方法：**
```bash
cd frontend
node tests/image-upload/test-upload.mjs
```

**前置条件：**
- 在 `frontend/.env` 中配置 `VITE_IMAGE_UPLOAD_API`

**测试内容：**
- 测试图片 base64 编码
- 验证上传 API 请求
- 检查返回的图片 URL

## ⚙️ 环境变量配置

测试脚本需要以下环境变量（在 `frontend/.env` 文件中配置）：

```env
# Twikoo 评论系统
VITE_TWIKOO_ENV_ID=https://your-twikoo-backend.netlify.app/.netlify/functions/twikoo

# 图床上传 API
VITE_IMAGE_UPLOAD_API=https://cms-images.netlify.app/.netlify/functions/upload-image
```

## 📝 运行所有测试

可以创建一个测试运行脚本，依次执行所有测试：

```bash
# 在 frontend 目录下
node tests/twikoo/test-api.mjs
node tests/twikoo/test-get-comments.mjs
node tests/image-upload/test-upload.mjs
```

## 🔍 测试输出说明

### 成功输出示例
```
✅ API 测试成功！
   响应: { id: "...", accessToken: "..." }
```

### 失败输出示例
```
❌ 测试失败: 错误信息
   状态码: 500
   响应: { error: "..." }
```

## 📚 相关文档

- [Twikoo 评论系统配置指南](../docs/Twikoo评论系统配置指南.md)
- [图床上传配置指南](../docs/图床上传配置指南.md)
- [Twikoo 本地测试指南](../docs/Twikoo本地测试指南.md)
- [图片上传功能本地测试指南](../docs/图片上传功能本地测试指南.md)

## ⚠️ 注意事项

1. **环境变量**：确保所有必需的环境变量都已正确配置
2. **网络连接**：测试需要能够访问外部 API 服务
3. **API 限制**：注意 API 的速率限制，避免频繁测试
4. **测试数据**：测试脚本使用模拟数据，不会影响生产环境

## 🛠️ 添加新测试

创建新的测试脚本时，请遵循以下规范：

1. **文件命名**：使用 `test-*.mjs` 格式
2. **目录结构**：按功能分类放在相应子目录
3. **错误处理**：包含完整的错误处理和日志输出
4. **文档说明**：在脚本开头添加使用说明

示例：
```javascript
/**
 * 测试脚本名称
 * 
 * 用途：描述测试目的
 * 
 * 使用方法：
 *   node tests/category/test-name.mjs
 * 
 * 前置条件：
 *   - 环境变量配置
 *   - 其他要求
 */
```
