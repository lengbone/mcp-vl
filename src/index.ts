#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from './config/index';
import { GLMService } from './services/glm-service';
import { AutoImageService } from './services/auto-image-service';
import { logger } from './utils/logger';

class MCPServer {
  private server: Server;
  private glmService: GLMService;
  private autoImageService: AutoImageService;

  constructor() {
    this.server = new Server(
      {
        name: config.server.name,
        version: config.server.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.glmService = new GLMService();
    this.autoImageService = new AutoImageService();

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'auto_analyze_image',
            description: '自动获取并分析图片（支持文件路径或剪贴板）',
            inputSchema: {
              type: 'object',
              properties: {
                imagePath: {
                  type: 'string',
                  description: '图片文件路径（可选，不提供则使用剪贴板）',
                },
                focusArea: {
                  type: 'string',
                  enum: ['code', 'architecture', 'error', 'documentation'],
                  description: '分析重点区域',
                  default: 'code',
                },
              },
              required: [],
            },
          },
        ],
      };
    });

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result;

        const typedArgs = args as any;
        
        if (name === 'auto_analyze_image') {
          result = await this.autoImageService.autoGetAndAnalyzeImage(
            typedArgs.imagePath,
            typedArgs.focusArea || 'code'
          );
        } else {
          throw new Error(`未知工具: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error(`工具调用失败: ${name}`, error);
        return {
          content: [
            {
              type: 'text',
              text: `错误: ${error instanceof Error ? error.message : '未知错误'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('MCP 图片识别服务器已启动 (stdio模式)');
  }
}

// 启动服务器
const mcpServer = new MCPServer();
mcpServer.run().catch((error) => {
  logger.error('服务器启动失败', error);
  process.exit(1);
});