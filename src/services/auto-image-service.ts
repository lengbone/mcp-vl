import { exec } from 'child_process';
import { promisify } from 'util';
import { GLMService } from './glm-service';
import { ImageAnalysisResult } from '../types/index';
import { logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';

const execAsync = promisify(exec);

export class AutoImageService {
  private glmService: GLMService;
  private tempDir: string;

  constructor() {
    this.glmService = new GLMService();
    this.tempDir = path.join(os.tmpdir(), 'mcp-vl-auto');
  }

  /**
   * 自动获取图片并分析（支持剪贴板、文件路径和网络URL）
   */
  async autoGetAndAnalyzeImage(
    imagePath?: string,
    focusArea: 'code' | 'architecture' | 'error' | 'documentation' = 'code'
  ): Promise<ImageAnalysisResult & { source: string }> {
    try {
      logger.info('开始自动获取图片', { imagePath, focusArea });

      let source: string;
      let finalImagePath: string;

      if (imagePath) {
        // 检查是否为网络URL
        if (this.isUrl(imagePath)) {
          source = 'url';
          finalImagePath = await this.downloadImageFromUrl(imagePath);
          logger.info('从网络URL下载图片', { url: imagePath, path: finalImagePath });
        } else {
          // 如果提供了文件路径，直接使用
          source = 'file';
          finalImagePath = imagePath;

          // 验证文件是否存在
          if (!(await this.fileExists(finalImagePath))) {
            throw new Error(`文件不存在: ${imagePath}`);
          }

          logger.info('使用提供的文件路径', { path: finalImagePath });
        }
      } else {
        // 如果没有提供文件路径，尝试从剪贴板获取
        source = 'clipboard';
        const clipboardImage = await this.getImageFromClipboard();

        if (!clipboardImage) {
          throw new Error('无法获取图片：没有提供文件路径且剪贴板中没有图片');
        }

        finalImagePath = clipboardImage;
        logger.info('从剪贴板获取图片', { path: finalImagePath });
      }

      // 分析图片
      const result = await this.analyzeImageFile(finalImagePath, focusArea);

      // 如果是剪贴板或URL下载的图片，清理临时文件
      if (source === 'clipboard' || source === 'url') {
        await this.cleanupTempFile(finalImagePath);
      }

      return {
        ...result,
        source,
      };
    } catch (error) {
      logger.error('自动获取并分析图片失败', { error });
      throw new Error(`自动处理图片失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 从剪贴板获取图片
   */
  private async getImageFromClipboard(): Promise<string | null> {
    try {
      const timestamp = Date.now();
      const outputPath = path.join(this.tempDir, `clipboard_${timestamp}.png`);
      
      // 确保临时目录存在
      await fs.mkdir(this.tempDir, { recursive: true });

      // 使用 osascript 从剪贴板获取图片
      const script = `
        try
          set the clipboard to (the clipboard as «class PNGf»)
          set theFile to open for access POSIX file "${outputPath}" with write permission
          write (the clipboard as «class PNGf») to theFile
          close access theFile
          return "${outputPath}"
        on error
          return ""
        end try
      `;
      
      const { stdout } = await execAsync(`osascript -e '${script}'`);
      const result = stdout.trim();
      
      if (result && await this.fileExists(result)) {
        logger.info('成功从剪贴板获取图片', { path: result });
        return result;
      }
      
      logger.info('剪贴板中没有图片');
      return null;
    } catch (error) {
      logger.warn('从剪贴板获取图片失败', { error });
      return null;
    }
  }

  
  /**
   * 检查文件是否存在
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 分析图片文件
   */
  private async analyzeImageFile(
    imagePath: string,
    focusArea: 'code' | 'architecture' | 'error' | 'documentation' = 'code'
  ): Promise<ImageAnalysisResult> {
    try {
      // 读取图片文件
      const imageBuffer = await fs.readFile(imagePath);
      
      // 使用 sharp 处理图片
      const sharp = require('sharp');
      const processedImage = await sharp(imageBuffer)
        .jpeg({ quality: 90 })
        .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();

      const base64 = processedImage.toString('base64');

      // 获取基本信息
      const metadata = await sharp(imageBuffer).metadata();
      const fileSize = (imageBuffer.length / 1024).toFixed(2) + ' KB';

      // 使用 GLM 服务分析图片
      const analysisResult = await this.glmService.analyzeCode(base64, focusArea);

      // 解析结果
      let result: ImageAnalysisResult;
      
      try {
        // 尝试解析JSON响应
        const parsed = JSON.parse(analysisResult);
        result = {
          description: parsed.description || parsed.content,
          type: parsed.type,
          layout: parsed.layout,
          issues: parsed.issues,
          details: parsed.details,
          summary: parsed.summary || analysisResult.substring(0, 500),
          confidence: 0.9,
          metadata: {
            format: metadata.format,
            width: metadata.width,
            height: metadata.height,
            fileSize,
          },
        };
      } catch {
        // 如果不是JSON格式，直接使用文本响应
        result = {
          summary: analysisResult,
          confidence: 0.8,
          metadata: {
            format: metadata.format,
            width: metadata.width,
            height: metadata.height,
            fileSize,
          },
        };
      }

      return result;
    } catch (error) {
      logger.error('分析图片文件失败', { path: imagePath, error });
      throw new Error(`分析图片失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 清理临时文件
   */
  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      logger.info('临时文件已清理', { path: filePath });
    } catch (error) {
      logger.warn('清理临时文件失败', { path: filePath, error });
      // 不抛出错误，因为这不是关键操作
    }
  }

  /**
   * 清理所有临时文件
   */
  async cleanupAllTempFiles(): Promise<void> {
    try {
      await fs.rm(this.tempDir, { recursive: true, force: true });
      logger.info('所有临时文件已清理', { dir: this.tempDir });
    } catch (error) {
      logger.warn('清理临时目录失败', { error });
    }
  }

  /**
   * 检查字符串是否为有效的URL
   */
  private isUrl(str: string): boolean {
    try {
      const url = new URL(str);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * 从URL下载图片
   */
  private async downloadImageFromUrl(url: string): Promise<string> {
    try {
      // 确保临时目录存在
      await fs.mkdir(this.tempDir, { recursive: true });

      // 生成唯一的文件名
      const timestamp = Date.now();
      const urlHash = Buffer.from(url).toString('base64').replace(/[+/=]/g, '').substring(0, 8);
      const extension = this.getImageExtensionFromUrl(url);
      const fileName = `downloaded_${timestamp}_${urlHash}.${extension}`;
      const outputPath = path.join(this.tempDir, fileName);

      logger.info('开始下载图片', { url, outputPath });

      // 下载图片
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30秒超时
        maxContentLength: 10 * 1024 * 1024, // 10MB最大文件大小
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      // 保存到临时文件
      await fs.writeFile(outputPath, response.data);

      // 验证文件是否为有效图片
      if (!(await this.isValidImage(outputPath))) {
        await fs.unlink(outputPath);
        throw new Error('下载的文件不是有效的图片格式');
      }

      logger.info('图片下载成功', { url, outputPath, size: response.data.length });
      return outputPath;
    } catch (error) {
      logger.error('从URL下载图片失败', { url, error });
      throw new Error(`下载图片失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 从URL中提取图片扩展名
   */
  private getImageExtensionFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const lastDot = pathname.lastIndexOf('.');

      if (lastDot > 0) {
        const extension = pathname.substring(lastDot + 1).toLowerCase();
        // 支持的图片格式
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
          return extension;
        }
      }
    } catch {
      // 忽略URL解析错误
    }

    // 默认返回png
    return 'png';
  }

  /**
   * 验证文件是否为有效图片
   */
  private async isValidImage(filePath: string): Promise<boolean> {
    try {
      const sharp = require('sharp');
      const metadata = await sharp(filePath).metadata();
      return metadata.format !== undefined && metadata.width !== undefined && metadata.height !== undefined;
    } catch {
      return false;
    }
  }
}