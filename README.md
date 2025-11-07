# MCP 自动图片分析服务器

基于 GLM-4.5V 模型的 MCP (Model Context Protocol) 服务器，提供智能图片分析功能，支持文件路径和剪贴板两种输入方式。

<a href="https://glama.ai/mcp/servers/@lengbone/mcp-vl">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@lengbone/mcp-vl/badge" alt="Visual Language MCP server" />
</a>

## 功能特性

- 🤖 **智能获取**: 自动从文件路径或剪贴板获取图片
- 💻 **代码内容提取**: 从图片中提取代码文本
- 🏗️ **架构分析**: 分析代码的结构和设计模式
- 🐛 **错误检测**: 识别代码中的错误和问题
- 📚 **文档生成**: 自动生成代码文档
- 🔍 **语言识别**: 自动识别编程语言
- 🎯 **专注代码**: 专门优化用于代码图片分析

## 技术栈

- **运行时**: Node.js 18+
- **框架**: TypeScript
- **模型**: GLM-4.5V (智谱 AI)
- **图片处理**: Sharp
- **协议**: MCP (Model Context Protocol)

## 安装配置

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 智谱 AI API 配置
ZHIPUAI_API_KEY=your_zhipuai_api_key_here
ZHIPUAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4

# MCP 服务器配置
MCP_SERVER_NAME=mcp-vl
MCP_SERVER_VERSION=1.0.0

# 日志级别
LOG_LEVEL=info
```

### 3. 获取智谱 AI API Key

1. 访问 [智谱 AI 开放平台](https://open.bigmodel.cn/)
2. 注册账号并创建 API Key
3. 将 API Key 填入 `.env` 文件

### 4. 构建项目

```bash
pnpm run build
```

## 使用方法

### 在 Claude Code 中配置

#### 方式一：使用 claude mcp add 命令（推荐）

构建项目后，使用以下命令添加 MCP 服务器：

```bash
claude mcp add mcp-vl --scope user --env ZHIPUAI_API_KEY=your_api_key_here \
    -- node /path/mcp-vl/dist/index.js
```

#### 方式二：手动配置

将以下配置添加到你的 Claude Code 配置中：

```json
{
  "mcpServers": {
    "mcp-vl": {
      "command": "node",
      "args": ["/path/mcp-vl/dist/index.js"],
      "env": {
        "ZHIPUAI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Claude 提示词
```
## ⚠️ 图片处理规范 - 非常重要，一定要严格执行
**重要提示：在 Claude 中使用时，禁止使用 read 工具进行读取图片，因为读取图片工具失效了。请使用 mcp-vl 里的 auto_analyze_image 工具进行读取。**
```

### 可用工具

#### auto_analyze_image
自动获取并分析图片（支持文件路径或剪贴板）

```json
{
  "name": "auto_analyze_image",
  "arguments": {
    "imagePath": "/path/to/image.png", // 可选，不提供则使用剪贴板
    "focusArea": "code" // "code", "architecture", "error", "documentation"
  }
}
```

**使用方式：**
1. **文件路径**: 提供图片文件路径进行分析
2. **剪贴板**: 不提供路径，自动从剪贴板获取图片

**分析类型说明：**
- `code`: 提取代码内容，识别编程语言，分析代码结构
- `architecture`: 分析代码架构设计，模块关系，设计模式
- `error`: 检查代码错误，性能问题，安全隐患
- `documentation`: 生成代码文档，函数说明，使用示例

## 开发

### 开发模式运行

```bash
pnpm run dev
```

### 构建项目

```bash
pnpm run build
```

### 代码检查

```bash
pnpm run lint
pnpm run typecheck
```

## 项目结构

```
src/
├── index.ts              # MCP 服务器主入口
├── config/
│   └── index.ts         # 配置管理
├── services/
│   ├── glm-service.ts   # GLM 模型服务
│   └── auto-image-service.ts # 自动图片分析服务
├── types/
│   └── index.ts         # TypeScript 类型定义
└── utils/
    └── logger.ts        # 日志工具
scripts/
└── test-local.ts        # 本地测试脚本
```

## 注意事项

1. **API Key 安全**: 请妥善保管你的智谱 AI API Key
2. **代码图片优化**: 专门针对代码截图优化，建议使用清晰的代码截图
3. **支持格式**: JPEG, PNG, WebP, GIF 等常见格式
4. **网络连接**: 需要稳定的网络连接访问智谱 AI API
5. **最佳实践**: 
   - 使用高对比度的代码编辑器主题
   - 确保代码字体清晰可见
   - 避免截图过大或过小

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！