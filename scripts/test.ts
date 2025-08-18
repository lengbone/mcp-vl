#!/usr/bin/env node

import { GLMService } from '../src/services/glm-service.js';
import { ImageService } from '../src/services/image-service.js';
import { config } from '../src/config/index.js';
import { logger } from '../src/utils/logger.js';

async function testGLMService() {
  console.log('=== 测试 GLM 服务 ===');
  
  const glmService = new GLMService();
  
  try {
    // 测试简单的文本对话
    const messages = [
      {
        role: 'user' as const,
        content: '你好，请简单介绍一下自己。',
      },
    ];
    
    const response = await glmService.sendMessage(messages);
    console.log('✅ GLM API 连接成功');
    console.log('响应:', response.choices[0]?.message?.content);
  } catch (error) {
    console.error('❌ GLM API 连接失败:', error.message);
  }
}

async function testImageService() {
  console.log('\n=== 测试图片服务 ===');
  
  const imageService = new ImageService();
  
  // 注意：这里需要你提供一个测试图片的路径
  const testImagePath = process.argv[2];
  
  if (!testImagePath) {
    console.log('⚠️  请提供测试图片路径: npm run test-image /path/to/image.jpg');
    return;
  }
  
  try {
    console.log(`测试图片: ${testImagePath}`);
    
    // 测试图片读取
    console.log('\n1. 测试图片读取...');
    const readResult = await imageService.readImage(testImagePath);
    console.log('✅ 图片读取成功');
    console.log('描述:', readResult.description.substring(0, 100) + '...');
    
    // 测试图片分析
    console.log('\n2. 测试图片分析...');
    const analyzeResult = await imageService.analyzeImage(testImagePath, 'general');
    console.log('✅ 图片分析成功');
    console.log('分析结果:', analyzeResult.description.substring(0, 100) + '...');
    
    // 测试文字提取
    console.log('\n3. 测试文字提取...');
    const textResult = await imageService.extractText(testImagePath);
    console.log('✅ 文字提取成功');
    console.log('提取的文字:', textResult.text || '未识别到文字');
    
  } catch (error) {
    console.error('❌ 图片服务测试失败:', error.message);
  }
}

async function main() {
  console.log('MCP 图片识别服务器 - 功能测试');
  console.log('=====================================');
  
  // 检查配置
  if (!config.zhipuAI.apiKey) {
    console.error('❌ 请先配置 ZHIPUAI_API_KEY 环境变量');
    process.exit(1);
  }
  
  await testGLMService();
  await testImageService();
  
  console.log('\n测试完成！');
}

main().catch(console.error);