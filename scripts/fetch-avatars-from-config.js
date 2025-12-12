/**
 * 从配置文件读取URL并下载头像
 * 
 * 使用方法：
 * 1. 运行: node scripts/find-avatar-urls.js 生成配置文件
 * 2. 编辑 scripts/avatar-urls-config.json，填写图片URL
 * 3. 运行: node scripts/fetch-avatars-from-config.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const outputDir = path.join(__dirname, '../frontend/public/images/persons');
const personsFile = path.join(__dirname, '../frontend/public/data/persons.json');
const configFile = path.join(__dirname, 'avatar-urls-config.json');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 读取配置
if (!fs.existsSync(configFile)) {
  console.log('❌ 配置文件不存在！');
  console.log('   请先运行: node scripts/find-avatar-urls.js\n');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
const persons = JSON.parse(fs.readFileSync(personsFile, 'utf-8'));

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
  console.log('📥 从配置文件下载人物头像...\n');
  console.log('='.repeat(60));

  const avatarUrls = config.avatarUrls || {};
  const urlsWithValue = Object.entries(avatarUrls).filter(([_, value]) => 
    value && value.url && value.url.trim() !== ''
  );

  if (urlsWithValue.length === 0) {
    console.log('⚠️  配置文件中没有有效的URL！');
    console.log('   请编辑 avatar-urls-config.json 文件，填写图片URL\n');
    return;
  }

  console.log(`📋 找到 ${urlsWithValue.length} 个有效的URL\n`);

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (const [personId, configItem] of urlsWithValue) {
    const person = persons.find(p => p.id === parseInt(personId));
    if (!person) {
      console.log(`⚠️  人物 ID ${personId} 不存在，跳过`);
      continue;
    }

    const imageUrl = configItem.url;
    const ext = getExtensionFromUrl(imageUrl);
    const filename = `${personId}-${person.name}.${ext}`;
    const filepath = path.join(outputDir, filename);

    // 如果文件已存在，跳过
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  跳过: ${person.name} (文件已存在)`);
      skipCount++;
      continue;
    }

    // 下载图片
    try {
      console.log(`⬇️  下载: ${person.name}...`);
      console.log(`   URL: ${imageUrl}`);
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

