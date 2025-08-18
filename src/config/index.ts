import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // 智谱 AI 配置
  zhipuAI: {
    apiKey: process.env.ZHIPUAI_API_KEY || '',
    baseURL: process.env.ZHIPUAI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4.5v',
  },

  // MCP 服务器配置
  server: {
    name: process.env.MCP_SERVER_NAME || 'mcp-vl',
    version: process.env.MCP_SERVER_VERSION || '1.0.0',
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // 默认模型参数
  modelDefaults: {
    temperature: 0.7,
    maxTokens: 1000,
  },
};