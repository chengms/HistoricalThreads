/**
 * 简化版头像获取脚本
 * 使用预定义的图片URL或手动添加
 * 
 * 使用方法：
 * 1. 编辑下面的 avatarUrls 对象，添加图片URL
 * 2. 运行: node scripts/fetch-avatars-simple.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const outputDir = path.join(__dirname, '../frontend/public/images/persons');
const personsFile = path.join(__dirname, '../frontend/public/data/persons.json');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 读取人物数据
const persons = JSON.parse(fs.readFileSync(personsFile, 'utf-8'));

// ============================================
// 在这里添加人物头像URL映射
// 格式: 人物ID 或 人物名称: 图片URL
// ============================================
const avatarUrls = {
  // 示例（请替换为真实URL）:
  // 8: 'https://upload.wikimedia.org/wikipedia/commons/thumb/.../Qin_Shi_Huang.jpg',
  // 17: 'https://upload.wikimedia.org/wikipedia/commons/thumb/.../Cao_Cao.jpg',
  // '诸葛亮': 'https://example.com/zhugeliang.jpg',
  
  // 可以从以下网站获取图片URL：
  // 1. Wikimedia Commons: https://commons.wikimedia.org/
  // 2. 百度百科图片链接
  // 3. 其他公开图片资源
};

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
      // 处理重定向
      if (response.statusCode === 301 || response.statusCode === 302) {
        request.destroy();
        return downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const contentType = response.headers['content-type'] || '';
      if (!contentType.startsWith('image/')) {
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
    request.setTimeout(15000, () => {
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
  console.log('📥 开始下载人物头像...\n');
  console.log('='.repeat(60));

  if (Object.keys(avatarUrls).length === 0) {
    console.log('⚠️  请在脚本中填写 avatarUrls 对象！');
    console.log('\n示例：');
    console.log('const avatarUrls = {');
    console.log('  8: "https://example.com/qinshihuang.jpg",');
    console.log('  17: "https://example.com/caocao.jpg",');
    console.log('  ...');
    console.log('};');
    console.log('\n💡 提示：');
    console.log('   1. 访问 https://commons.wikimedia.org/ 搜索人物名称');
    console.log('   2. 找到合适的图片，右键复制图片地址');
    console.log('   3. 将URL添加到 avatarUrls 对象中');
    console.log('   4. 重新运行此脚本\n');
    return;
  }

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (const person of persons) {
    // 查找URL（支持ID或名称）
    let imageUrl = avatarUrls[person.id] || avatarUrls[person.name];
    
    if (!imageUrl) {
      continue; // 跳过没有URL的人物
    }

    const ext = getExtensionFromUrl(imageUrl);
    const filename = `${person.id}-${person.name}.${ext}`;
    const filepath = path.join(outputDir, filename);

    // 如果文件已存在，询问是否覆盖
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  跳过: ${person.name} (文件已存在)`);
      skipCount++;
      continue;
    }

    // 下载图片
    try {
      console.log(`⬇️  下载: ${person.name}...`);
      await downloadImage(imageUrl, filepath);
      console.log(`✅ 成功: ${filename}\n`);
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
  console.log(`   跳过: ${skipCount} 个\n`);

  // 更新 JSON 文件
  if (successCount > 0) {
    console.log('🔄 更新 persons.json 文件...');
    
    const existingImages = fs.readdirSync(outputDir).filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    const updatedPersons = persons.map(person => {
      const matchingImage = existingImages.find(img => {
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

// 运行
main().catch(console.error);

