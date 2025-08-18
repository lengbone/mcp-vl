#!/usr/bin/env node

import { GLMService } from '../src/services/glm-service';
import { ImageService } from '../src/services/image-service';
import { config } from '../src/config/index';
import fs from 'fs/promises';

async function testGLMAPI() {
  console.log('=== 测试 GLM API 连接 ===');
  
  const glmService = new GLMService();
  
  try {
    const messages = [
      {
        role: 'user' as const,
        content: '你好，请简单介绍一下你自己。',
      },
    ];
    
    const response = await glmService.sendMessage(messages);
    const content = response.choices[0]?.message?.content;
    console.log('✅ GLM API 连接成功');
    if (typeof content === 'string') {
      console.log('响应:', content.substring(0, 100) + '...');
    } else {
      console.log('响应:', content);
    }
    return true;
  } catch (error) {
    console.error('❌ GLM API 连接失败:', error instanceof Error ? error.message : '未知错误');
    return false;
  }
}

async function testCodeAnalysis() {
  console.log('\n=== 测试代码图片分析功能 ===');
  
  const imageService = new ImageService();
  
  // 获取命令行参数中的图片路径
  const customImagePath = process.argv[2];
  
  if (!customImagePath) {
    console.log('⚠️  请提供代码图片路径');
    console.log('使用方法: npm run test-local /path/to/code-image.png');
    return false;
  }
  
  try {
    console.log(`测试代码图片: ${customImagePath}`);
    
    // 测试代码分析 - 代码内容
    console.log('\n1. 测试代码内容提取...');
    const codeResult = await imageService.analyzeCodeImage(customImagePath, 'code');
    console.log('✅ 代码内容提取成功');
    console.log('语言:', codeResult.language || '未知');
    console.log('代码内容:', codeResult.codeContent?.substring(0, 200) + '...' || '未提取到代码');
    console.log('摘要:', codeResult.summary?.substring(0, 100) + '...');
    
    // 测试代码分析 - 架构分析
    console.log('\n2. 测试代码架构分析...');
    const archResult = await imageService.analyzeCodeImage(customImagePath, 'architecture');
    console.log('✅ 架构分析成功');
    console.log('架构信息:', archResult.architecture?.substring(0, 100) + '...' || '未分析到架构');
    
    // 测试代码分析 - 错误检查
    console.log('\n3. 测试代码错误检查...');
    const errorResult = await imageService.analyzeCodeImage(customImagePath, 'error');
    console.log('✅ 错误检查成功');
    console.log('发现错误:', errorResult.errors?.length || 0, '个');
    if (errorResult.errors && errorResult.errors.length > 0) {
      console.log('错误列表:', errorResult.errors.slice(0, 3));
    }
    
    // 测试代码分析 - 文档生成
    console.log('\n4. 测试代码文档生成...');
    const docResult = await imageService.analyzeCodeImage(customImagePath, 'documentation');
    console.log('✅ 文档生成成功');
    console.log('文档:', docResult.documentation?.substring(0, 100) + '...' || '未生成文档');
    
    return true;
    
  } catch (error) {
    console.error('❌ 代码分析测试失败:', error instanceof Error ? error.message : '未知错误');
    return false;
  }
}

async function testConfiguration() {
  console.log('=== 检查配置 ===');
  
  if (!config.zhipuAI.apiKey) {
    console.error('❌ ZHIPUAI_API_KEY 未配置');
    return false;
  }
  
  if (config.zhipuAI.apiKey === 'your_zhipuai_api_key_here') {
    console.error('❌ ZHIPUAI_API_KEY 未设置有效值');
    return false;
  }
  
  console.log('✅ 配置检查通过');
  return true;
}

async function main() {
  console.log('🧪 MCP 代码图片识别服务器 - 本地测试');
  console.log('=====================================');
  
  // 检查配置
  const configOk = await testConfiguration();
  if (!configOk) {
    console.log('\n❌ 配置检查失败，请检查 .env 文件');
    process.exit(1);
  }
  
  // 测试 GLM API
  const glmOk = await testGLMAPI();
  if (!glmOk) {
    console.log('\n❌ GLM API 测试失败，请检查 API Key 和网络连接');
    process.exit(1);
  }
  
  // 测试代码分析功能
  await testCodeAnalysis();
  
  console.log('\n🎉 测试完成！');
  console.log('\n📋 提示:');
  console.log('1. 确保在 Claude Code 中配置了 MCP 服务器');
  console.log('2. 使用以下命令测试代码图片:');
  console.log('   npm run test-local /path/to/code-image.png');
  console.log('3. 现在只专注于代码图片分析功能');
}

main().catch(console.error);