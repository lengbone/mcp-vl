export interface ImageAnalysisResult {
  description?: string;
  content?: string;
  type?: string;
  layout?: string;
  issues?: string[];
  details?: string;
  summary: string;
  confidence: number;
  metadata?: {
    format?: string;
    width?: number;
    height?: number;
    fileSize?: string;
  };
}

export interface CodeAnalysisResult extends ImageAnalysisResult {
  codeContent?: string;
  language?: string;
  architecture?: string;
  errors?: string[];
  documentation?: string;
}

export interface GLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

export interface GLMRequest {
  model: string;
  messages: GLMMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface GLMResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: GLMMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface MCPToolConfig {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}