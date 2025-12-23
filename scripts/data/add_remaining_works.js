/**
 * 为剩余的6位人物添加代表作品
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

console.log('=== 添加剩余人物的作品 ===\n')

// 要添加的作品
const newWorks = [
  // 李商隐
  {
    title: "无题·相见时难别亦难",
    authorId: 198,
    workType: "poem",
    content: "相见时难别亦难，东风无力百花残。\n春蚕到死丝方尽，蜡炬成灰泪始干。\n晓镜但愁云鬓改，夜吟应觉月光寒。\n蓬山此去无多路，青鸟殷勤为探看。",
    excerpt: "相见时难别亦难，东风无力百花残。\n春蚕到死丝方尽，蜡炬成灰泪始干。",
    dynastyId: 29,
  },
  {
    title: "锦瑟",
    authorId: 198,
    workType: "poem",
    content: "锦瑟无端五十弦，一弦一柱思华年。\n庄生晓梦迷蝴蝶，望帝春心托杜鹃。\n沧海月明珠有泪，蓝田日暖玉生烟。\n此情可待成追忆？只是当时已惘然。",
    excerpt: "锦瑟无端五十弦，一弦一柱思华年。\n庄生晓梦迷蝴蝶，望帝春心托杜鹃。",
    dynastyId: 29,
  },
  {
    title: "夜雨寄北",
    authorId: 198,
    workType: "poem",
    content: "君问归期未有期，巴山夜雨涨秋池。\n何当共剪西窗烛，却话巴山夜雨时。",
    excerpt: "君问归期未有期，巴山夜雨涨秋池。\n何当共剪西窗烛，却话巴山夜雨时。",
    dynastyId: 29,
  },
  // 梁启超
  {
    title: "少年中国说（节选）",
    authorId: 56,
    workType: "essay",
    content: "故今日之责任，不在他人，而全在我少年。少年智则国智，少年富则国富；少年强则国强，少年独立则国独立；少年自由则国自由；少年进步则国进步；少年胜于欧洲，则国胜于欧洲；少年雄于地球，则国雄于地球。\n红日初升，其道大光。河出伏流，一泻汪洋。潜龙腾渊，鳞爪飞扬。乳虎啸谷，百兽震惶。鹰隼试翼，风尘翕张。奇花初胎，矞矞皇皇。干将发硎，有作其芒。天戴其苍，地履其黄。纵有千古，横有八荒。前途似海，来日方长。美哉我少年中国，与天不老！壮哉我中国少年，与国无疆！",
    excerpt: "故今日之责任，不在他人，而全在我少年。少年智则国智，少年富则国富；少年强则国强，少年独立则国独立；",
    year: 1900,
    dynastyId: 16,
  },
  // 谭嗣同
  {
    title: "狱中题壁",
    authorId: 57,
    workType: "poem",
    content: "望门投止思张俭，忍死须臾待杜根。\n我自横刀向天笑，去留肝胆两昆仑。",
    excerpt: "望门投止思张俭，忍死须臾待杜根。\n我自横刀向天笑，去留肝胆两昆仑。",
    year: 1898,
    dynastyId: 16,
  },
  // 康有为
  {
    title: "出都留别诸公",
    authorId: 55,
    workType: "poem",
    content: "天龙作骑万灵从，独立飞来缥缈峰。\n怀抱芳馨兰一握，纵横宙合雾千重。\n眼中战国成争鹿，海内人才孰卧龙？\n抚剑长号归去也，千山风雨啸青锋。",
    excerpt: "天龙作骑万灵从，独立飞来缥缈峰。\n怀抱芳馨兰一握，纵横宙合雾千重。",
    dynastyId: 16,
  },
  // 陈独秀
  {
    title: "告少年",
    authorId: 40,
    workType: "poem",
    content: "太空暗无际，昼见非其形。\n众星点缀之，相远难为明。\n光形无所丽，虚白不自生。\n半日见光彩，我居近日星。\n西海生智者，厚生多发明。\n摄彼阴阳气，建此不夜城。\n局此小宇内，人力终难轻。\n吾身诚渺小，傲然长百灵。\n食以保躯命，色以逢种姓。\n逐此以自足，何以异群生。\n相役复相斫，事惯无人惊。\n伯强今昼出，拍手市上行。\n旁行越邻国，势若吞舟鲸。\n食人及其类，勋旧一朝烹。\n黄金握在手，利剑腰间鸣。\n二者唯君择，逆死顺则生。\n高踞万民上，万民齐屏营。\n有口不得言，伏地传其声。\n是非旦暮变，黑白任其情。\n云雨翻覆手，信义鸿毛轻。\n为恶恐不足，惑众美其名。\n举世附和者，人头而畜鸣。\n忍此以终古，人生昼且冥。\n古人言性恶，今人言竞争。\n强弱判荣辱，自古相吞并。\n天道顺自然，人治求均衡。\n旷观伊古来，善恶常相倾。\n人中有鸾凤，众愚顽不灵。\n哲人间世出，吐辞律以诚。\n忤众非所忌，坷坎终其生。\n千金市骏骨，遗言在史乘。\n求之不可得，沿流阻且长。\n时时发狂言，冒此世不韪。\n",
    excerpt: "太空暗无际，昼见非其形。\n众星点缀之，相远难为明。",
    year: 1915,
    dynastyId: 17,
  },
  // 胡适
  {
    title: "蝴蝶",
    authorId: 67,
    workType: "poem",
    content: "两个黄蝴蝶，双双飞上天。\n不知为什么，一个忽飞还。\n剩下那一个，孤单怪可怜。\n也无心上天，天上太孤单。",
    excerpt: "两个黄蝴蝶，双双飞上天。\n不知为什么，一个忽飞还。",
    year: 1916,
    dynastyId: 35,
  },
  {
    title: "希望",
    authorId: 67,
    workType: "poem",
    content: "我从山中来，带得兰花草，\n种在小园中，希望开花好。\n一日望三回，望到花时过；\n急坏看花人，苞也无一个。\n眼见秋天到，移花供在家；\n明年春风回，祝汝满盆花！",
    excerpt: "我从山中来，带得兰花草，\n种在小园中，希望开花好。",
    year: 1921,
    dynastyId: 35,
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

