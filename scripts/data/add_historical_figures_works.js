/**
 * 为历史人物（非文学家/艺术家类型）添加文学作品
 */

const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '../../frontend/public/data')
const worksPath = path.join(dataDir, 'works.json')

const works = JSON.parse(fs.readFileSync(worksPath, 'utf-8'))

// 获取下一个可用的ID
const getNextWorkId = () => {
  return Math.max(...works.map(w => w.id), 0) + 1
}

console.log('=== 为历史人物添加文学作品 ===\n')

// 要添加的作品
const newWorks = [
  // 刘邦
  {
    title: "大风歌",
    authorId: 11,
    workType: "poem",
    content: "大风起兮云飞扬，\n威加海内兮归故乡，\n安得猛士兮守四方！",
    excerpt: "大风起兮云飞扬，\n威加海内兮归故乡，\n安得猛士兮守四方！",
    year: -195,
    dynastyId: 21,
  },
  // 项羽
  {
    title: "垓下歌",
    authorId: 12,
    workType: "poem",
    content: "力拔山兮气盖世，\n时不利兮骓不逝。\n骓不逝兮可奈何，\n虞兮虞兮奈若何！",
    excerpt: "力拔山兮气盖世，\n时不利兮骓不逝。\n骓不逝兮可奈何，\n虞兮虞兮奈若何！",
    year: -202,
    dynastyId: 21,
  },
  // 汉武帝
  {
    title: "秋风辞",
    authorId: 13,
    workType: "poem",
    content: "秋风起兮白云飞，\n草木黄落兮雁南归。\n兰有秀兮菊有芳，\n怀佳人兮不能忘。\n泛楼船兮济汾河，\n横中流兮扬素波。\n箫鼓鸣兮发棹歌，\n欢乐极兮哀情多。\n少壮几时兮奈老何！",
    excerpt: "秋风起兮白云飞，\n草木黄落兮雁南归。\n兰有秀兮菊有芳，\n怀佳人兮不能忘。",
    dynastyId: 21,
  },
  // 诸葛亮
  {
    title: "出师表（节选）",
    authorId: 20,
    workType: "essay",
    content: "先帝创业未半而中道崩殂，今天下三分，益州疲弊，此诚危急存亡之秋也。然侍卫之臣不懈于内，忠志之士忘身于外者，盖追先帝之殊遇，欲报之于陛下也。诚宜开张圣听，以光先帝遗德，恢弘志士之气，不宜妄自菲薄，引喻失义，以塞忠谏之路也。\n宫中府中，俱为一体，陟罚臧否，不宜异同。若有作奸犯科及为忠善者，宜付有司论其刑赏，以昭陛下平明之理，不宜偏私，使内外异法也。\n侍中、侍郎郭攸之、费祎、董允等，此皆良实，志虑忠纯，是以先帝简拔以遗陛下。愚以为宫中之事，事无大小，悉以咨之，然后施行，必能裨补阙漏，有所广益。",
    excerpt: "先帝创业未半而中道崩殂，今天下三分，益州疲弊，此诚危急存亡之秋也。",
    year: 227,
    dynastyId: 8,
  },
  // 隋炀帝
  {
    title: "春江花月夜",
    authorId: 21,
    workType: "poem",
    content: "暮江平不动，\n春花满正开。\n流波将月去，\n潮水带星来。",
    excerpt: "暮江平不动，\n春花满正开。\n流波将月去，\n潮水带星来。",
    dynastyId: 11,
  },
  // 唐太宗（李世民）
  {
    title: "赐萧瑀",
    authorId: 22,
    workType: "poem",
    content: "疾风知劲草，\n板荡识诚臣。\n勇夫安识义，\n智者必怀仁。",
    excerpt: "疾风知劲草，\n板荡识诚臣。\n勇夫安识义，\n智者必怀仁。",
    dynastyId: 12,
  },
  {
    title: "咏风",
    authorId: 22,
    workType: "poem",
    content: "萧条起关塞，\n摇飏下蓬瀛。\n拂林花乱彩，\n响谷鸟分声。\n披云罗影散，\n泛水织文生。\n劳歌大风曲，\n威加四海清。",
    excerpt: "萧条起关塞，\n摇飏下蓬瀛。\n拂林花乱彩，\n响谷鸟分声。",
    dynastyId: 12,
  },
  // 林则徐
  {
    title: "赴戍登程口占示家人",
    authorId: 29,
    workType: "poem",
    content: "力微任重久神疲，再竭衰庸定不支。\n苟利国家生死以，岂因祸福避趋之。\n谪居正是君恩厚，养拙刚于戍卒宜。\n戏与山妻谈故事，试吟断送老头皮。",
    excerpt: "力微任重久神疲，再竭衰庸定不支。\n苟利国家生死以，岂因祸福避趋之。",
    year: 1842,
    dynastyId: 16,
  },
  // 曾国藩
  {
    title: "家书（节选）",
    authorId: 62,
    workType: "essay",
    content: "盖士人读书，第一要有志，第二要有识，第三要有恒。有志则不甘为下流；有识则知学问无尽，不敢以一得自足，如河伯之观海，如井蛙之窥天，皆无识者也；有恒则断无不成之事。此三者缺一不可。",
    excerpt: "盖士人读书，第一要有志，第二要有识，第三要有恒。",
    dynastyId: 16,
  },
  // 毛泽东
  {
    title: "沁园春·雪",
    authorId: 42,
    workType: "ci",
    content: "北国风光，千里冰封，万里雪飘。望长城内外，惟余莽莽；大河上下，顿失滔滔。山舞银蛇，原驰蜡象，欲与天公试比高。须晴日，看红装素裹，分外妖娆。\n江山如此多娇，引无数英雄竞折腰。惜秦皇汉武，略输文采；唐宗宋祖，稍逊风骚。一代天骄，成吉思汗，只识弯弓射大雕。俱往矣，数风流人物，还看今朝。",
    excerpt: "北国风光，千里冰封，万里雪飘。望长城内外，惟余莽莽；大河上下，顿失滔滔。",
    year: 1936,
    dynastyId: 18,
  },
  {
    title: "沁园春·长沙",
    authorId: 42,
    workType: "ci",
    content: "独立寒秋，湘江北去，橘子洲头。看万山红遍，层林尽染；漫江碧透，百舸争流。鹰击长空，鱼翔浅底，万类霜天竞自由。怅寥廓，问苍茫大地，谁主沉浮？\n携来百侣曾游，忆往昔峥嵘岁月稠。恰同学少年，风华正茂；书生意气，挥斥方遒。指点江山，激扬文字，粪土当年万户侯。曾记否，到中流击水，浪遏飞舟？",
    excerpt: "独立寒秋，湘江北去，橘子洲头。看万山红遍，层林尽染；漫江碧透，百舸争流。",
    year: 1925,
    dynastyId: 17,
  },
]

let worksAdded = 0

newWorks.forEach(workData => {
  // 检查是否已存在
  const exists = works.find(w => w.title === workData.title && w.authorId === workData.authorId)
  if (exists) {
    console.log(`[跳过] ${workData.title} (作者ID: ${workData.authorId}) 已存在`)
    return
  }
  
  const newWork = {
    id: getNextWorkId() + worksAdded,
    ...workData
  }
  
  works.push(newWork)
  worksAdded++
  console.log(`[${newWork.id}] 添加 ${workData.title} (作者ID: ${workData.authorId})`)
})

// 备份原文件
const worksBackup = worksPath + '.backup.' + Date.now()
fs.copyFileSync(worksPath, worksBackup)
console.log(`\n已备份原文件：${worksBackup}`)

// 保存更新后的数据
fs.writeFileSync(worksPath, JSON.stringify(works, null, 2), 'utf-8')

console.log(`\n添加完成：`)
console.log(`- 添加了 ${worksAdded} 部作品`)
console.log(`- 总作品数：${works.length}`)

