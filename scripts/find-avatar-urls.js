/**
 * 查找人物头像URL的辅助脚本
 * 生成一个包含图片URL的配置文件，方便批量下载
 * 
 * 使用方法：
 * node scripts/find-avatar-urls.js
 */

const fs = require('fs');
const path = require('path');

const personsFile = path.join(__dirname, '../frontend/public/data/persons.json');
const outputFile = path.join(__dirname, 'avatar-urls-config.json');

// 读取人物数据
const persons = JSON.parse(fs.readFileSync(personsFile, 'utf-8'));

// 生成配置文件模板
const config = {
  description: '人物头像URL配置',
  instructions: [
    '1. 访问 https://commons.wikimedia.org/ 搜索人物名称',
    '2. 找到合适的图片，右键复制图片地址',
    '3. 将URL填写到对应的ID或名称下',
    '4. 保存文件后运行: node scripts/fetch-avatars-simple.js'
  ],
  avatarUrls: {}
};

// 为每个人物创建占位符
persons.forEach(person => {
  config.avatarUrls[person.id] = {
    name: person.name,
    url: '', // 在这里填写图片URL
    comment: `建议搜索: ${person.name} 或 ${person.nameVariants?.join(', ') || ''}`
  };
});

// 保存配置文件
fs.writeFileSync(
  outputFile,
  JSON.stringify(config, null, 2),
  'utf-8'
);

console.log('✅ 已生成配置文件:', outputFile);
console.log(`\n📝 共 ${persons.length} 个人物需要添加URL`);
console.log('\n💡 下一步:');
console.log('   1. 编辑 avatar-urls-config.json 文件');
console.log('   2. 为每个人物填写图片URL');
console.log('   3. 运行: node scripts/fetch-avatars-simple.js\n');

