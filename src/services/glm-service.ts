import axios from 'axios';
import { config } from '../config/index';
import { GLMRequest, GLMResponse, GLMMessage } from '../types/index';
import { logger } from '../utils/logger';

export class GLMService {
  private headers = {
    'Authorization': `Bearer ${config.zhipuAI.apiKey}`,
    'Content-Type': 'application/json',
  };

  async sendMessage(messages: GLMMessage[], options?: {
    temperature?: number;
    maxTokens?: number;
  }): Promise<GLMResponse> {
    try {
      const request: GLMRequest = {
        model: config.zhipuAI.model,
        messages,
        temperature: options?.temperature ?? config.modelDefaults.temperature,
        max_tokens: options?.maxTokens ?? config.modelDefaults.maxTokens,
      };

      logger.info('发送请求到 GLM API', { model: request.model, messageCount: messages.length });

      const response = await axios.post<GLMResponse>(
        `${config.zhipuAI.baseURL}/chat/completions`,
        request,
        { headers: this.headers }
      );

      logger.info('GLM API 响应成功', {
        id: response.data.id,
        usage: response.data.usage,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('GLM API 请求失败', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        throw new Error(`GLM API 错误: ${error.response?.data?.error?.message || error.message}`);
      }
      logger.error('GLM 服务未知错误', error);
      throw error;
    }
  }

  async analyzeImage(imageBase64: string, prompt: string): Promise<string> {
    const messages: GLMMessage[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ];

    const response = await this.sendMessage(messages);
    return response.choices[0]?.message?.content as string || '';
  }

  async analyzeCode(imageBase64: string, focusArea: 'code' | 'architecture' | 'error' | 'documentation' = 'code'): Promise<string> {
    let prompt = '';
    
    switch (focusArea) {
      case 'code':
        prompt = `请描述这张图片的内容，包括：
1. 图片中显示了什么
2. 包含了哪些文字内容
3. 有什么视觉元素和布局
4. 整体的视觉效果

请提供客观的描述，不要进行代码分析。`;
        break;
        
      case 'architecture':
        prompt = `请描述这张图片的视觉结构和布局：
1. 图片的整体布局
2. 主要的视觉元素
3. 文字和图形的排列方式
4. 颜色和样式的特点`;
        break;
        
      case 'error':
        prompt = `请描述这张图片中可能需要注意的地方：
1. 图片的清晰度
2. 文字的可读性
3. 视觉上的问题点
4. 需要特别关注的地方`;
        break;
        
      case 'documentation':
        prompt = `请详细描述这张图片的内容：
1. 图片的主题和内容
2. 包含的所有文字信息
3. 视觉元素和布局
4. 整体的视觉印象`;
        break;
    }
    
    return await this.analyzeImage(imageBase64, prompt);
  }
}