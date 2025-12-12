/**
 * 为人物数据添加 avatarUrl 字段的辅助脚本
 * 
 * 使用方法：
 * node scripts/add-avatar-urls.js
 */

const fs = require('fs');
const path = require('path');

const personsFile = path.join(__dirname, '../frontend/public/data/persons.json');
const imagesDir = path.join(__dirname, '../frontend/public/images/persons');

// 读取人物数据
const persons = JSON.parse(fs.readFileSync(personsFile, 'utf-8'));

// 检查图片目录是否存在
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log('✅ 已创建图片目录:', imagesDir);
}

// 获取已存在的图片文件
const existingImages = fs.existsSync(imagesDir)
  ? fs.readdirSync(imagesDir).filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    )
  : [];

console.log(`\n找到 ${existingImages.length} 个图片文件\n`);

// 更新人物数据
let updatedCount = 0;
const updatedPersons = persons.map(person => {
  // 查找匹配的图片文件
  const matchingImage = existingImages.find(img => {
    const filename = img.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
    return filename.startsWith(`${person.id}-`) || 
           filename.includes(person.name);
  });

  if (matchingImage) {
    const avatarUrl = `/images/persons/${matchingImage}`;
    if (!person.avatarUrl || person.avatarUrl !== avatarUrl) {
      updatedCount++;
      return {
        ...person,
        avatarUrl
      };
    }
  }

  return person;
});

// 保存更新后的数据
fs.writeFileSync(
  personsFile,
  JSON.stringify(updatedPersons, null, 2),
  'utf-8'
);

console.log(`✅ 已更新 ${updatedCount} 个人物的 avatarUrl 字段`);
console.log(`📝 已保存到: ${personsFile}\n`);

// 显示未找到图片的人物
const withoutAvatar = updatedPersons.filter(p => !p.avatarUrl);
if (withoutAvatar.length > 0) {
  console.log(`⚠️  以下 ${withoutAvatar.length} 个人物还没有头像：\n`);
  withoutAvatar.forEach(p => {
    console.log(`  - ${p.id}. ${p.name} (建议文件名: ${p.id}-${p.name}.jpg)`);
  });
  console.log('\n请参考 docs/人物头像收集指南.md 添加头像');
}

