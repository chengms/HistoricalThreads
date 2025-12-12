/**
 * 检查人物头像状态的脚本
 */

const fs = require('fs');
const path = require('path');

const personsFile = path.join(__dirname, '../frontend/public/data/persons.json');
const imagesDir = path.join(__dirname, '../frontend/public/images/persons');

console.log('📊 人物头像状态检查\n');
console.log('='.repeat(60));

// 读取人物数据
const persons = JSON.parse(fs.readFileSync(personsFile, 'utf-8'));

// 检查图片目录
const imagesExist = fs.existsSync(imagesDir);
const images = imagesExist 
  ? fs.readdirSync(imagesDir).filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    )
  : [];

console.log(`\n📁 图片目录: ${imagesDir}`);
console.log(`   存在: ${imagesExist ? '✅' : '❌'}`);
console.log(`   图片数量: ${images.length} 个`);

if (images.length > 0) {
  console.log(`\n   已存在的图片:`);
  images.forEach(img => {
    console.log(`     - ${img}`);
  });
}

// 统计人物头像状态
const withAvatar = persons.filter(p => p.avatarUrl);
const withoutAvatar = persons.filter(p => !p.avatarUrl);

console.log(`\n👥 人物数据统计:`);
console.log(`   总人数: ${persons.length}`);
console.log(`   有头像: ${withAvatar.length} (${(withAvatar.length / persons.length * 100).toFixed(1)}%)`);
console.log(`   无头像: ${withoutAvatar.length} (${(withoutAvatar.length / persons.length * 100).toFixed(1)}%)`);

// 检查头像路径有效性
if (withAvatar.length > 0) {
  console.log(`\n✅ 已配置头像的人物:`);
  withAvatar.forEach(p => {
    const imagePath = path.join(__dirname, '..', p.avatarUrl.replace(/^\//, ''));
    const exists = fs.existsSync(imagePath);
    console.log(`   ${exists ? '✅' : '❌'} ${p.id}. ${p.name} - ${p.avatarUrl}`);
  });
}

// 显示无头像的人物
if (withoutAvatar.length > 0) {
  console.log(`\n⚠️  无头像的人物列表:`);
  withoutAvatar.forEach(p => {
    console.log(`   ${p.id}. ${p.name} (建议: ${p.id}-${p.name}.jpg)`);
  });
}

console.log(`\n${'='.repeat(60)}`);
console.log(`\n💡 提示:`);
console.log(`   1. 将图片保存到: ${imagesDir}`);
console.log(`   2. 文件名格式: {ID}-{姓名}.jpg`);
console.log(`   3. 运行: node scripts/add-avatar-urls.js 自动更新 JSON`);
console.log(`   4. 参考: docs/人物头像收集指南.md\n`);

