/**
 * 工具函数
 */

import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 延迟函数
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 确保目录存在
 */
export async function ensureDir(dirPath) {
  await fs.ensureDir(dirPath)
}

/**
 * 保存 JSON 文件
 */
export async function saveJSON(filePath, data) {
  await fs.ensureDir(path.dirname(filePath))
  await fs.writeJSON(filePath, data, { spaces: 2 })
}

/**
 * 读取 JSON 文件
 */
export async function readJSON(filePath) {
  try {
    return await fs.readJSON(filePath)
  } catch (error) {
    return []
  }
}

/**
 * 下载文件
 */
export async function downloadFile(url, filePath) {
  try {
    const axios = (await import('axios')).default
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    await ensureDir(path.dirname(filePath))
    const writer = fs.createWriteStream(filePath)
    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
  } catch (error) {
    console.error(`下载文件失败: ${url}`, error.message)
    return false
  }
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(url) {
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)
  return match ? match[1] : 'jpg'
}

/**
 * 清理文件名
 */
export function sanitizeFileName(name) {
  return name
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
}

