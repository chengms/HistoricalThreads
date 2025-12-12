/**
 * 自动查找并下载人物头像脚本
 * 
 * 使用方法：
 * node scripts/fetch-person-avatars.js
 * 
 * 注意：需要安装依赖
 * npm install axios cheerio
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 输出目录
const outputDir = path.join(__dirname, '../frontend/public/images/persons');
const personsFile = path.join(__dirname, '../frontend/public/data/persons.json');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 读取人物数据
const persons = JSON.parse(fs.readFileSync(personsFile, 'utf-8'));

// 人物头像URL映射（从公开资源获取）
// 这些是示例URL，实际使用时需要替换为真实的图片URL
const avatarUrlMap = {
  // 可以从以下来源获取：
  // 1. Wikimedia Commons
  // 2. 百度百科
  // 3. 其他公开资源
};

/**
 * 从 Wikimedia Commons 搜索图片
 */
async function searchWikimediaCommons(personName) {
  // Wikimedia Commons API
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(personName)}&srnamespace=6&srlimit=5`;
  
  try {
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.query && data.query.search && data.query.search.length > 0) {
      // 获取第一个结果的图片URL
      const firstResult = data.query.search[0];
      const imageTitle = firstResult.title.replace('File:', '');
      const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageTitle)}`;
      return imageUrl;
    }
  } catch (error) {
    console.error(`搜索 Wikimedia Commons 失败: ${error.message}`);
  }
  
  return null;
}

/**
 * 下载图片
 */
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    if (!url || !url.startsWith('http')) {
      reject(new Error('无效的URL'));
      return;
    }

    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, (response) => {
      // 检查重定向
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      // 检查Content-Type
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        reject(new Error('不是图片文件'));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    });

    request.on('error', reject);
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('下载超时'));
    });
  });
}

/**
 * 获取文件扩展名
 */
function getExtensionFromUrl(url) {
  const match = url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
  return match ? match[1].toLowerCase() : 'jpg';
}

/**
 * 主函数
 */
async function main() {
  console.log('🔍 开始查找并下载人物头像...\n');
  console.log('='.repeat(60));

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (const person of persons) {
    const filename = `${person.id}-${person.name}.jpg`;
    const filepath = path.join(outputDir, filename);

    // 如果文件已存在，跳过
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  跳过: ${person.name} (文件已存在)`);
      skipCount++;
      continue;
    }

    // 检查是否有预定义的URL
    let imageUrl = avatarUrlMap[person.id] || avatarUrlMap[person.name];

    // 如果没有预定义URL，尝试搜索
    if (!imageUrl) {
      console.log(`🔍 搜索: ${person.name}...`);
      
      // 尝试从 Wikimedia Commons 搜索
      try {
        imageUrl = await searchWikimediaCommons(person.name);
        if (imageUrl) {
          console.log(`   ✅ 找到: ${imageUrl}`);
        }
      } catch (error) {
        console.log(`   ⚠️  搜索失败: ${error.message}`);
      }
    }

    if (!imageUrl) {
      console.log(`❌ 未找到: ${person.name} (请手动添加URL到 avatarUrlMap)`);
      failCount++;
      continue;
    }

    // 下载图片
    try {
      const ext = getExtensionFromUrl(imageUrl);
      const finalFilepath = path.join(outputDir, `${person.id}-${person.name}.${ext}`);
      
      console.log(`⬇️  下载中: ${person.name}...`);
      await downloadImage(imageUrl, finalFilepath);
      console.log(`✅ 成功: ${person.name} -> ${path.basename(finalFilepath)}\n`);
      successCount++;
    } catch (error) {
      console.error(`❌ 失败: ${person.name} - ${error.message}\n`);
      failCount++;
    }

    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('='.repeat(60));
  console.log(`\n📊 统计结果:`);
  console.log(`   成功: ${successCount} 个`);
  console.log(`   失败: ${failCount} 个`);
  console.log(`   跳过: ${skipCount} 个`);
  console.log(`   总计: ${persons.length} 个\n`);

  // 更新 JSON 文件
  if (successCount > 0) {
    console.log('🔄 更新 persons.json 文件...');
    const updateScript = require('./add-avatar-urls.js');
    // 直接调用更新逻辑
    const updatedPersons = persons.map(person => {
      const files = fs.readdirSync(outputDir).filter(file => 
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
      );
      const matchingImage = files.find(img => {
        const filename = img.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
        return filename.startsWith(`${person.id}-`) || 
               filename.includes(person.name);
      });

      if (matchingImage) {
        return {
          ...person,
          avatarUrl: `/images/persons/${matchingImage}`
        };
      }
      return person;
    });

    fs.writeFileSync(
      personsFile,
      JSON.stringify(updatedPersons, null, 2),
      'utf-8'
    );
    console.log('✅ 已更新 persons.json\n');
  }
}

// 检查是否安装了必要的依赖
try {
  require('axios');
} catch (e) {
  console.log('⚠️  需要安装依赖: npm install axios');
  console.log('   或者使用 Node.js 18+ 的内置 fetch API\n');
}

// 运行
main().catch(console.error);

