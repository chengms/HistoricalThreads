/**
 * 人物头像下载脚本
 * 
 * 使用方法：
 * 1. 安装依赖：npm install axios fs path
 * 2. 修改下面的图片URL列表
 * 3. 运行：node scripts/download-person-avatars.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 人物头像URL映射（需要手动填写）
const avatarUrls = {
  // 格式：人物ID: 图片URL
  // 1: 'https://example.com/dayu.jpg',
  // 2: 'https://example.com/shangtang.jpg',
  // ... 更多人物
};

// 输出目录
const outputDir = path.join(__dirname, '../frontend/public/images/persons');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 读取人物数据
const personsData = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../frontend/public/data/persons.json'),
    'utf-8'
  )
);

/**
 * 下载图片
 */
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
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
    }).on('error', reject);
  });
}

/**
 * 更新 persons.json 文件，添加 avatarUrl 字段
 */
function updatePersonsJson() {
  const updatedPersons = personsData.map(person => {
    const filename = `${person.id}-${person.name}.jpg`;
    const avatarUrl = `/images/persons/${filename}`;
    
    return {
      ...person,
      avatarUrl: fs.existsSync(path.join(outputDir, filename)) 
        ? avatarUrl 
        : undefined
    };
  });

  fs.writeFileSync(
    path.join(__dirname, '../frontend/public/data/persons.json'),
    JSON.stringify(updatedPersons, null, 2),
    'utf-8'
  );

  console.log('✅ 已更新 persons.json 文件');
}

/**
 * 主函数
 */
async function main() {
  console.log('开始下载人物头像...\n');

  let successCount = 0;
  let failCount = 0;

  for (const [personId, url] of Object.entries(avatarUrls)) {
    const person = personsData.find(p => p.id === parseInt(personId));
    if (!person) {
      console.log(`⚠️  人物 ID ${personId} 不存在，跳过`);
      continue;
    }

    const filename = `${personId}-${person.name}.jpg`;
    const filepath = path.join(outputDir, filename);

    try {
      console.log(`下载中: ${person.name} (${url})`);
      await downloadImage(url, filepath);
      console.log(`✅ 成功: ${filename}\n`);
      successCount++;
    } catch (error) {
      console.error(`❌ 失败: ${person.name} - ${error.message}\n`);
      failCount++;
    }
  }

  console.log(`\n下载完成！`);
  console.log(`成功: ${successCount} 个`);
  console.log(`失败: ${failCount} 个`);

  // 更新 JSON 文件
  updatePersonsJson();
}

// 运行
if (Object.keys(avatarUrls).length === 0) {
  console.log('⚠️  请先在脚本中填写人物头像URL映射');
  console.log('格式：avatarUrls = { 1: "https://...", 2: "https://...", ... }');
} else {
  main().catch(console.error);
}

