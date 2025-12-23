/**
 * 为缺少作品的人物添加代表作品
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

console.log('=== 添加缺少的作品 ===\n')

// 要添加的作品
const newWorks = [
  // 曹操
  {
    title: "观沧海",
    authorId: 17,
    workType: "poem",
    content: "东临碣石，以观沧海。\n水何澹澹，山岛竦峙。\n树木丛生，百草丰茂。\n秋风萧瑟，洪波涌起。\n日月之行，若出其中。\n星汉灿烂，若出其里。\n幸甚至哉，歌以咏志。",
    excerpt: "东临碣石，以观沧海。\n水何澹澹，山岛竦峙。\n树木丛生，百草丰茂。",
    year: 207,
    dynastyId: 8,
  },
  {
    title: "短歌行",
    authorId: 17,
    workType: "poem",
    content: "对酒当歌，人生几何！\n譬如朝露，去日苦多。\n慨当以慷，忧思难忘。\n何以解忧？唯有杜康。\n青青子衿，悠悠我心。\n但为君故，沉吟至今。\n呦呦鹿鸣，食野之苹。\n我有嘉宾，鼓瑟吹笙。\n明明如月，何时可掇？\n忧从中来，不可断绝。\n越陌度阡，枉用相存。\n契阔谈讌，心念旧恩。\n月明星稀，乌鹊南飞。\n绕树三匝，何枝可依？\n山不厌高，海不厌深。\n周公吐哺，天下归心。",
    excerpt: "对酒当歌，人生几何！\n譬如朝露，去日苦多。\n慨当以慷，忧思难忘。",
    dynastyId: 8,
  },
  // 王安石
  {
    title: "登飞来峰",
    authorId: 26,
    workType: "poem",
    content: "飞来山上千寻塔，闻说鸡鸣见日升。\n不畏浮云遮望眼，自缘身在最高层。",
    excerpt: "飞来山上千寻塔，闻说鸡鸣见日升。\n不畏浮云遮望眼，自缘身在最高层。",
    dynastyId: 30,
  },
  {
    title: "泊船瓜洲",
    authorId: 26,
    workType: "poem",
    content: "京口瓜洲一水间，钟山只隔数重山。\n春风又绿江南岸，明月何时照我还？",
    excerpt: "京口瓜洲一水间，钟山只隔数重山。\n春风又绿江南岸，明月何时照我还？",
    dynastyId: 30,
  },
  // 白居易
  {
    title: "赋得古原草送别",
    authorId: 78,
    workType: "poem",
    content: "离离原上草，一岁一枯荣。\n野火烧不尽，春风吹又生。\n远芳侵古道，晴翠接荒城。\n又送王孙去，萋萋满别情。",
    excerpt: "离离原上草，一岁一枯荣。\n野火烧不尽，春风吹又生。",
    dynastyId: 28,
  },
  {
    title: "琵琶行",
    authorId: 78,
    workType: "poem",
    content: "浔阳江头夜送客，枫叶荻花秋瑟瑟。\n主人下马客在船，举酒欲饮无管弦。\n醉不成欢惨将别，别时茫茫江浸月。\n忽闻水上琵琶声，主人忘归客不发。\n寻声暗问弹者谁？琵琶声停欲语迟。\n移船相近邀相见，添酒回灯重开宴。\n千呼万唤始出来，犹抱琵琶半遮面。\n转轴拨弦三两声，未成曲调先有情。\n弦弦掩抑声声思，似诉平生不得志。\n低眉信手续续弹，说尽心中无限事。\n轻拢慢捻抹复挑，初为《霓裳》后《六幺》。\n大弦嘈嘈如急雨，小弦切切如私语。\n嘈嘈切切错杂弹，大珠小珠落玉盘。\n间关莺语花底滑，幽咽泉流冰下难。\n冰泉冷涩弦凝绝，凝绝不通声暂歇。\n别有幽愁暗恨生，此时无声胜有声。\n银瓶乍破水浆迸，铁骑突出刀枪鸣。\n曲终收拨当心画，四弦一声如裂帛。\n东船西舫悄无言，唯见江心秋月白。",
    excerpt: "浔阳江头夜送客，枫叶荻花秋瑟瑟。\n主人下马客在船，举酒欲饮无管弦。",
    dynastyId: 28,
  },
  // 陶渊明
  {
    title: "饮酒·其五",
    authorId: 117,
    workType: "poem",
    content: "结庐在人境，而无车马喧。\n问君何能尔？心远地自偏。\n采菊东篱下，悠然见南山。\n山气日夕佳，飞鸟相与还。\n此中有真意，欲辨已忘言。",
    excerpt: "结庐在人境，而无车马喧。\n问君何能尔？心远地自偏。\n采菊东篱下，悠然见南山。",
    dynastyId: 22,
  },
  {
    title: "归园田居·其一",
    authorId: 117,
    workType: "poem",
    content: "少无适俗韵，性本爱丘山。\n误落尘网中，一去三十年。\n羁鸟恋旧林，池鱼思故渊。\n开荒南野际，守拙归园田。\n方宅十余亩，草屋八九间。\n榆柳荫后檐，桃李罗堂前。\n暧暧远人村，依依墟里烟。\n狗吠深巷中，鸡鸣桑树颠。\n户庭无尘杂，虚室有余闲。\n久在樊笼里，复得返自然。",
    excerpt: "少无适俗韵，性本爱丘山。\n误落尘网中，一去三十年。\n羁鸟恋旧林，池鱼思故渊。",
    dynastyId: 22,
  },
  // 屈原
  {
    title: "离骚（节选）",
    authorId: 127,
    workType: "poem",
    content: "长太息以掩涕兮，哀民生之多艰。\n余虽好修姱以鞿羁兮，謇朝谇而夕替。\n既替余以蕙纕兮，又申之以揽茝。\n亦余心之所善兮，虽九死其犹未悔。\n怨灵修之浩荡兮，终不察夫民心。\n众女嫉余之蛾眉兮，谣诼谓余以善淫。\n固时俗之工巧兮，偭规矩而改错。\n背绳墨以追曲兮，竞周容以为度。\n忳郁邑余侘傺兮，吾独穷困乎此时也。\n宁溘死以流亡兮，余不忍为此态也。\n鸷鸟之不群兮，自前世而固然。\n何方圜之能周兮，夫孰异道而相安？\n屈心而抑志兮，忍尤而攘诟。\n伏清白以死直兮，固前圣之所厚。",
    excerpt: "长太息以掩涕兮，哀民生之多艰。\n余虽好修姱以鞿羁兮，謇朝谇而夕替。\n既替余以蕙纕兮，又申之以揽茝。",
    dynastyId: 5,
  },
  // 曹植
  {
    title: "七步诗",
    authorId: 138,
    workType: "poem",
    content: "煮豆燃豆萁，豆在釜中泣。\n本是同根生，相煎何太急？",
    excerpt: "煮豆燃豆萁，豆在釜中泣。\n本是同根生，相煎何太急？",
    dynastyId: 8,
  },
  {
    title: "洛神赋（节选）",
    authorId: 138,
    workType: "prose",
    content: "其形也，翩若惊鸿，婉若游龙。荣曜秋菊，华茂春松。髣髴兮若轻云之蔽月，飘飖兮若流风之回雪。远而望之，皎若太阳升朝霞；迫而察之，灼若芙蕖出渌波。\n秾纤得衷，修短合度。肩若削成，腰如约素。延颈秀项，皓质呈露。芳泽无加，铅华弗御。云髻峨峨，修眉联娟。丹唇外朗，皓齿内鲜。明眸善睐，靥辅承权。瑰姿艳逸，仪静体闲。柔情绰态，媚于语言。",
    excerpt: "其形也，翩若惊鸿，婉若游龙。荣曜秋菊，华茂春松。",
    dynastyId: 8,
  },
  // 韩愈
  {
    title: "师说",
    authorId: 163,
    workType: "essay",
    content: "古之学者必有师。师者，所以传道受业解惑也。人非生而知之者，孰能无惑？惑而不从师，其为惑也，终不解矣。\n生乎吾前，其闻道也固先乎吾，吾从而师之；生乎吾后，其闻道也亦先乎吾，吾从而师之。吾师道也，夫庸知其年之先后生于吾乎？是故无贵无贱，无长无少，道之所存，师之所存也。",
    excerpt: "古之学者必有师。师者，所以传道受业解惑也。人非生而知之者，孰能无惑？",
    dynastyId: 28,
  },
  {
    title: "早春呈水部张十八员外",
    authorId: 163,
    workType: "poem",
    content: "天街小雨润如酥，草色遥看近却无。\n最是一年春好处，绝胜烟柳满皇都。",
    excerpt: "天街小雨润如酥，草色遥看近却无。\n最是一年春好处，绝胜烟柳满皇都。",
    dynastyId: 28,
  },
  // 柳宗元
  {
    title: "江雪",
    authorId: 177,
    workType: "poem",
    content: "千山鸟飞绝，万径人踪灭。\n孤舟蓑笠翁，独钓寒江雪。",
    excerpt: "千山鸟飞绝，万径人踪灭。\n孤舟蓑笠翁，独钓寒江雪。",
    dynastyId: 28,
  },
  {
    title: "小石潭记",
    authorId: 177,
    workType: "prose",
    content: "从小丘西行百二十步，隔篁竹，闻水声，如鸣珮环，心乐之。伐竹取道，下见小潭，水尤清冽。全石以为底，近岸，卷石底以出，为坻，为屿，为嵁，为岩。青树翠蔓，蒙络摇缀，参差披拂。\n潭中鱼可百许头，皆若空游无所依。日光下澈，影布石上，佁然不动；俶尔远逝，往来翕忽，似与游者相乐。\n潭西南而望，斗折蛇行，明灭可见。其岸势犬牙差互，不可知其源。",
    excerpt: "从小丘西行百二十步，隔篁竹，闻水声，如鸣珮环，心乐之。",
    dynastyId: 28,
  },
  // 欧阳修
  {
    title: "醉翁亭记",
    authorId: 192,
    workType: "prose",
    content: "环滁皆山也。其西南诸峰，林壑尤美。望之蔚然而深秀者，琅琊也。山行六七里，渐闻水声潺潺，而泻出于两峰之间者，酿泉也。峰回路转，有亭翼然临于泉上者，醉翁亭也。作亭者谁？山之僧智仙也。名之者谁？太守自谓也。太守与客来饮于此，饮少辄醉，而年又最高，故自号曰醉翁也。醉翁之意不在酒，在乎山水之间也。山水之乐，得之心而寓之酒也。",
    excerpt: "环滁皆山也。其西南诸峰，林壑尤美。望之蔚然而深秀者，琅琊也。",
    dynastyId: 30,
  },
  {
    title: "生查子·元夕",
    authorId: 192,
    workType: "ci",
    content: "去年元夜时，花市灯如昼。\n月上柳梢头，人约黄昏后。\n今年元夜时，月与灯依旧。\n不见去年人，泪湿春衫袖。",
    excerpt: "去年元夜时，花市灯如昼。\n月上柳梢头，人约黄昏后。",
    dynastyId: 30,
  },
  // 刘禹锡
  {
    title: "陋室铭",
    authorId: 195,
    workType: "essay",
    content: "山不在高，有仙则名。水不在深，有龙则灵。斯是陋室，惟吾德馨。苔痕上阶绿，草色入帘青。谈笑有鸿儒，往来无白丁。可以调素琴，阅金经。无丝竹之乱耳，无案牍之劳形。南阳诸葛庐，西蜀子云亭。孔子云：何陋之有？",
    excerpt: "山不在高，有仙则名。水不在深，有龙则灵。斯是陋室，惟吾德馨。",
    dynastyId: 28,
  },
  {
    title: "酬乐天扬州初逢席上见赠",
    authorId: 195,
    workType: "poem",
    content: "巴山楚水凄凉地，二十三年弃置身。\n怀旧空吟闻笛赋，到乡翻似烂柯人。\n沉舟侧畔千帆过，病树前头万木春。\n今日听君歌一曲，暂凭杯酒长精神。",
    excerpt: "巴山楚水凄凉地，二十三年弃置身。\n怀旧空吟闻笛赋，到乡翻似烂柯人。",
    dynastyId: 28,
  },
  // 杜牧（修复：清明应该是杜牧的，不是李商隐的）
  {
    title: "山行",
    authorId: 202,
    workType: "poem",
    content: "远上寒山石径斜，白云生处有人家。\n停车坐爱枫林晚，霜叶红于二月花。",
    excerpt: "远上寒山石径斜，白云生处有人家。\n停车坐爱枫林晚，霜叶红于二月花。",
    dynastyId: 29,
  },
  {
    title: "江南春",
    authorId: 202,
    workType: "poem",
    content: "千里莺啼绿映红，水村山郭酒旗风。\n南朝四百八十寺，多少楼台烟雨中。",
    excerpt: "千里莺啼绿映红，水村山郭酒旗风。\n南朝四百八十寺，多少楼台烟雨中。",
    dynastyId: 29,
  },
  // 高适
  {
    title: "别董大",
    authorId: 213,
    workType: "poem",
    content: "千里黄云白日曛，北风吹雁雪纷纷。\n莫愁前路无知己，天下谁人不识君。",
    excerpt: "千里黄云白日曛，北风吹雁雪纷纷。\n莫愁前路无知己，天下谁人不识君。",
    dynastyId: 27,
  },
  // 岑参
  {
    title: "白雪歌送武判官归京",
    authorId: 220,
    workType: "poem",
    content: "北风卷地白草折，胡天八月即飞雪。\n忽如一夜春风来，千树万树梨花开。\n散入珠帘湿罗幕，狐裘不暖锦衾薄。\n将军角弓不得控，都护铁衣冷难着。\n瀚海阑干百丈冰，愁云惨淡万里凝。\n中军置酒饮归客，胡琴琵琶与羌笛。\n纷纷暮雪下辕门，风掣红旗冻不翻。\n轮台东门送君去，去时雪满天山路。\n山回路转不见君，雪上空留马行处。",
    excerpt: "北风卷地白草折，胡天八月即飞雪。\n忽如一夜春风来，千树万树梨花开。",
    dynastyId: 27,
  },
  // 贺知章
  {
    title: "咏柳",
    authorId: 228,
    workType: "poem",
    content: "碧玉妆成一树高，万条垂下绿丝绦。\n不知细叶谁裁出，二月春风似剪刀。",
    excerpt: "碧玉妆成一树高，万条垂下绿丝绦。\n不知细叶谁裁出，二月春风似剪刀。",
    dynastyId: 27,
  },
  {
    title: "回乡偶书",
    authorId: 228,
    workType: "poem",
    content: "少小离家老大回，乡音无改鬓毛衰。\n儿童相见不相识，笑问客从何处来。",
    excerpt: "少小离家老大回，乡音无改鬓毛衰。\n儿童相见不相识，笑问客从何处来。",
    dynastyId: 27,
  },
  // 范仲淹
  {
    title: "岳阳楼记",
    authorId: 237,
    workType: "prose",
    content: "庆历四年春，滕子京谪守巴陵郡。越明年，政通人和，百废具兴。乃重修岳阳楼，增其旧制，刻唐贤今人诗赋于其上。属予作文以记之。\n予观夫巴陵胜状，在洞庭一湖。衔远山，吞长江，浩浩汤汤，横无际涯；朝晖夕阴，气象万千。此则岳阳楼之大观也，前人之述备矣。然则北通巫峡，南极潇湘，迁客骚人，多会于此，览物之情，得无异乎？\n若夫霪雨霏霏，连月不开，阴风怒号，浊浪排空；日星隐曜，山岳潜形；商旅不行，樯倾楫摧；薄暮冥冥，虎啸猿啼。登斯楼也，则有去国怀乡，忧谗畏讥，满目萧然，感极而悲者矣。\n至若春和景明，波澜不惊，上下天光，一碧万顷；沙鸥翔集，锦鳞游泳；岸芷汀兰，郁郁青青。而或长烟一空，皓月千里，浮光跃金，静影沉璧，渔歌互答，此乐何极！登斯楼也，则有心旷神怡，宠辱偕忘，把酒临风，其喜洋洋者矣。\n嗟夫！予尝求古仁人之心，或异二者之为，何哉？不以物喜，不以己悲；居庙堂之高则忧其民；处江湖之远则忧其君。是进亦忧，退亦忧。然则何时而乐耶？其必曰\"先天下之忧而忧，后天下之乐而乐\"乎。噫！微斯人，吾谁与归？",
    excerpt: "庆历四年春，滕子京谪守巴陵郡。越明年，政通人和，百废具兴。",
    year: 1046,
    dynastyId: 30,
  },
  {
    title: "渔家傲·秋思",
    authorId: 237,
    workType: "ci",
    content: "塞下秋来风景异，衡阳雁去无留意。四面边声连角起，千嶂里，长烟落日孤城闭。\n浊酒一杯家万里，燕然未勒归无计。羌管悠悠霜满地，人不寐，将军白发征夫泪。",
    excerpt: "塞下秋来风景异，衡阳雁去无留意。四面边声连角起，千嶂里，长烟落日孤城闭。",
    dynastyId: 30,
  },
  // 晏殊
  {
    title: "浣溪沙·一曲新词酒一杯",
    authorId: 247,
    workType: "ci",
    content: "一曲新词酒一杯，去年天气旧亭台。夕阳西下几时回？\n无可奈何花落去，似曾相识燕归来。小园香径独徘徊。",
    excerpt: "一曲新词酒一杯，去年天气旧亭台。夕阳西下几时回？",
    dynastyId: 30,
  },
  // 秦观
  {
    title: "鹊桥仙·纤云弄巧",
    authorId: 258,
    workType: "ci",
    content: "纤云弄巧，飞星传恨，银汉迢迢暗度。金风玉露一相逢，便胜却人间无数。\n柔情似水，佳期如梦，忍顾鹊桥归路。两情若是久长时，又岂在朝朝暮暮。",
    excerpt: "纤云弄巧，飞星传恨，银汉迢迢暗度。金风玉露一相逢，便胜却人间无数。",
    dynastyId: 30,
  },
  // 李煜
  {
    title: "虞美人·春花秋月何时了",
    authorId: 270,
    workType: "ci",
    content: "春花秋月何时了？往事知多少。小楼昨夜又东风，故国不堪回首月明中。\n雕栏玉砌应犹在，只是朱颜改。问君能有几多愁？恰似一江春水向东流。",
    excerpt: "春花秋月何时了？往事知多少。小楼昨夜又东风，故国不堪回首月明中。",
    dynastyId: 10,
  },
  {
    title: "相见欢·无言独上西楼",
    authorId: 270,
    workType: "ci",
    content: "无言独上西楼，月如钩。寂寞梧桐深院锁清秋。\n剪不断，理还乱，是离愁。别是一般滋味在心头。",
    excerpt: "无言独上西楼，月如钩。寂寞梧桐深院锁清秋。",
    dynastyId: 10,
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

// 修复：将"清明"的作者从李商隐改为杜牧
const qingmingWork = works.find(w => w.title === '清明')
if (qingmingWork && qingmingWork.authorId !== 202) {
  console.log(`\n[修复] 将"清明"的作者从ID ${qingmingWork.authorId} 改为 202 (杜牧)`)
  qingmingWork.authorId = 202
}

// 备份原文件
const worksBackup = worksPath + '.backup.' + Date.now()
fs.copyFileSync(worksPath, worksBackup)
console.log(`\n已备份原文件：${worksBackup}`)

// 保存更新后的数据
fs.writeFileSync(worksPath, JSON.stringify(works, null, 2), 'utf-8')

console.log(`\n添加完成：`)
console.log(`- 添加了 ${worksAdded} 部作品`)
console.log(`- 总作品数：${works.length}`)

