/**
 * 为新添加的人物添加代表作品
 */

const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '../../frontend/public/data')
const worksPath = path.join(dataDir, 'works.json')
const personsPath = path.join(dataDir, 'persons.json')

const works = JSON.parse(fs.readFileSync(worksPath, 'utf-8'))
const persons = JSON.parse(fs.readFileSync(personsPath, 'utf-8'))

// 获取下一个可用的ID
const getNextWorkId = () => {
  return Math.max(...works.map(w => w.id), 0) + 1
}

// 查找人物ID
const findPersonId = (name) => {
  const person = persons.find(p => p.name === name)
  return person ? person.id : null
}

console.log('=== 为新添加的人物添加代表作品 ===\n')

// 要添加的作品
const newWorks = [
  // 曹丕
  {
    title: "燕歌行",
    authorId: findPersonId("曹丕"),
    workType: "poem",
    content: "秋风萧瑟天气凉，草木摇落露为霜。\n群燕辞归鹄南翔，念君客游思断肠。\n慊慊思归恋故乡，君何淹留寄他方？\n贱妾茕茕守空房，忧来思君不敢忘，\n不觉泪下沾衣裳。\n援琴鸣弦发清商，短歌微吟不能长。\n明月皎皎照我床，星汉西流夜未央。\n牵牛织女遥相望，尔独何辜限河梁？",
    excerpt: "秋风萧瑟天气凉，草木摇落露为霜。\n群燕辞归鹄南翔，念君客游思断肠。",
    dynastyId: 8,
  },
  {
    title: "典论·论文（节选）",
    authorId: findPersonId("曹丕"),
    workType: "essay",
    content: "文人相轻，自古而然。傅毅之于班固，伯仲之间耳，而固小之，与弟超书曰：\"武仲以能属文为兰台令史，下笔不能自休。\"夫人善于自见，而文非一体，鲜能备善，是以各以所长，相轻所短。里语曰：\"家有弊帚，享之千金。\"斯不自见之患也。",
    excerpt: "文人相轻，自古而然。傅毅之于班固，伯仲之间耳，而固小之。",
    dynastyId: 8,
  },
  // 岳飞
  {
    title: "满江红·怒发冲冠",
    authorId: findPersonId("岳飞"),
    workType: "ci",
    content: "怒发冲冠，凭栏处、潇潇雨歇。抬望眼，仰天长啸，壮怀激烈。三十功名尘与土，八千里路云和月。莫等闲，白了少年头，空悲切。\n靖康耻，犹未雪。臣子恨，何时灭。驾长车，踏破贺兰山缺。壮志饥餐胡虏肉，笑谈渴饮匈奴血。待从头、收拾旧山河，朝天阙。",
    excerpt: "怒发冲冠，凭栏处、潇潇雨歇。抬望眼，仰天长啸，壮怀激烈。",
    dynastyId: 31,
  },
  {
    title: "小重山·昨夜寒蛩不住鸣",
    authorId: findPersonId("岳飞"),
    workType: "ci",
    content: "昨夜寒蛩不住鸣。惊回千里梦，已三更。起来独自绕阶行。人悄悄，帘外月胧明。\n白首为功名。旧山松竹老，阻归程。欲将心事付瑶琴。知音少，弦断有谁听？",
    excerpt: "昨夜寒蛩不住鸣。惊回千里梦，已三更。起来独自绕阶行。",
    dynastyId: 31,
  },
  // 朱德
  {
    title: "太行春感",
    authorId: findPersonId("朱德"),
    workType: "poem",
    content: "远望春光镇日阴，\n太行高耸气森森。\n忠肝不洒中原泪，\n壮志坚持北伐心。\n百战新师惊贼胆，\n三年苦斗献吾身。\n从来燕赵多豪杰，\n驱逐倭儿共一樽。",
    excerpt: "远望春光镇日阴，\n太行高耸气森森。\n忠肝不洒中原泪，\n壮志坚持北伐心。",
    year: 1939,
    dynastyId: 18,
  },
  {
    title: "出太行",
    authorId: findPersonId("朱德"),
    workType: "poem",
    content: "群峰壁立太行头，\n天险黄河一望收。\n两岸烽烟红似火，\n此行当可慰同仇。",
    excerpt: "群峰壁立太行头，\n天险黄河一望收。\n两岸烽烟红似火，\n此行当可慰同仇。",
    year: 1940,
    dynastyId: 18,
  },
  // 陈毅
  {
    title: "梅岭三章",
    authorId: findPersonId("陈毅"),
    workType: "poem",
    content: "断头今日意如何？\n创业艰难百战多。\n此去泉台招旧部，\n旌旗十万斩阎罗。\n\n南国烽烟正十年，\n此头须向国门悬。\n后死诸君多努力，\n捷报飞来当纸钱。\n\n投身革命即为家，\n血雨腥风应有涯。\n取义成仁今日事，\n人间遍种自由花。",
    excerpt: "断头今日意如何？\n创业艰难百战多。\n此去泉台招旧部，\n旌旗十万斩阎罗。",
    year: 1936,
    dynastyId: 18,
  },
  {
    title: "青松",
    authorId: findPersonId("陈毅"),
    workType: "poem",
    content: "大雪压青松，\n青松挺且直。\n要知松高洁，\n待到雪化时。",
    excerpt: "大雪压青松，\n青松挺且直。\n要知松高洁，\n待到雪化时。",
    year: 1960,
    dynastyId: 18,
  },
  // 鲁迅
  {
    title: "狂人日记（节选）",
    authorId: findPersonId("鲁迅"),
    workType: "novel",
    content: "今天晚上，很好的月光。\n我不见他，已是三十多年；今天见了，精神分外爽快。才知道以前的三十多年，全是发昏；然而须十分小心。不然，那赵家的狗，何以看我两眼呢？\n我怕得有理。\n今天全没月光，我知道不妙。早上小心出门，赵贵翁的眼色便怪：似乎怕我，似乎想害我。还有七八个人，交头接耳的议论我，又怕我看见。一路上的人，都是如此。其中最凶的一个人，张着嘴，对我笑了一笑；我便从头直冷到脚跟，晓得他们布置，都已妥当了。",
    excerpt: "今天晚上，很好的月光。\n我不见他，已是三十多年；今天见了，精神分外爽快。",
    year: 1918,
    dynastyId: 17,
  },
  {
    title: "阿Q正传（节选）",
    authorId: findPersonId("鲁迅"),
    workType: "novel",
    content: "我要给阿Q做正传，已经不止一两年了。但一面要做，一面又往回想，这足见我不是一个\"立言\"的人，因为从来不朽之笔，须传不朽之人，于是人以文传，文以人传——究竟谁靠谁传，渐渐的不甚了然起来，而终于归结到传阿Q，仿佛思想里有鬼似的。",
    excerpt: "我要给阿Q做正传，已经不止一两年了。但一面要做，一面又往回想。",
    year: 1921,
    dynastyId: 17,
  },
  // 郭沫若
  {
    title: "天狗",
    authorId: findPersonId("郭沫若"),
    workType: "poem",
    content: "我是一条天狗呀！\n我把月来吞了，\n我把日来吞了，\n我把一切的星球来吞了，\n我把全宇宙来吞了。\n我便是我了！\n\n我是月的光，\n我是日的光，\n我是一切星球的光，\n我是X光线的光，\n我是全宇宙的Energy的总量！",
    excerpt: "我是一条天狗呀！\n我把月来吞了，\n我把日来吞了，\n我把一切的星球来吞了。",
    year: 1920,
    dynastyId: 17,
  },
  {
    title: "女神（节选）",
    authorId: findPersonId("郭沫若"),
    workType: "poem",
    content: "我是一条天狗呀！\n我把月来吞了，\n我把日来吞了，\n我把一切的星球来吞了，\n我把全宇宙来吞了。\n我便是我了！",
    excerpt: "我是一条天狗呀！\n我把月来吞了，\n我把日来吞了。",
    year: 1921,
    dynastyId: 17,
  },
  // 茅盾
  {
    title: "子夜（节选）",
    authorId: findPersonId("茅盾"),
    workType: "novel",
    content: "太阳刚刚下了地平线。软风一阵一阵地吹上人面，怪痒痒的。苏州河的浊水幻成了金绿色，轻轻地，悄悄地，向西流去。黄浦的夕潮不知怎的已经涨上了，现在沿这苏州河两岸的各色船只都浮得高高地，舱面比码头还高了约莫半尺。风吹来外滩公园里的音乐，却只有那炒豆似的铜鼓声最分明，也最叫人兴奋。",
    excerpt: "太阳刚刚下了地平线。软风一阵一阵地吹上人面，怪痒痒的。",
    year: 1933,
    dynastyId: 18,
  },
  {
    title: "林家铺子（节选）",
    authorId: findPersonId("茅盾"),
    workType: "novel",
    content: "林小姐这天从学校回来就撅起着小嘴唇。她掼下了书包，并不照例到镜台前梳头发搽粉，却倒在床上看着帐顶出神。小花噗的也跳上床来，挨着林小姐的腰部摩擦，咪呜咪呜地叫了两声。林小姐本能地伸手到小花头上摸了一下，随即翻一个身，把脸埋在枕头里，就叫道：\"妈呀！\"",
    excerpt: "林小姐这天从学校回来就撅起着小嘴唇。她掼下了书包，并不照例到镜台前梳头发搽粉。",
    year: 1932,
    dynastyId: 18,
  },
  // 巴金
  {
    title: "家（节选）",
    authorId: findPersonId("巴金"),
    workType: "novel",
    content: "风刮得很紧，雪片像扯破了的棉絮一样在空中飞舞，没有目的地四处飘落。左右两边墙脚各有一条白色的路，好像给中间满是水泥的石板路镶了两道宽边。\n街上有行人和两人抬的轿子。他们斗不过风雪，显出了畏缩的样子。雪片愈落愈多，白茫茫地布满在天空中，向四处落下，落在伞上，落在轿顶上，落在轿夫的笠上，落在行人的脸上。",
    excerpt: "风刮得很紧，雪片像扯破了的棉絮一样在空中飞舞，没有目的地四处飘落。",
    year: 1931,
    dynastyId: 18,
  },
  // 老舍
  {
    title: "骆驼祥子（节选）",
    authorId: findPersonId("老舍"),
    workType: "novel",
    content: "我们所要介绍的是祥子，不是骆驼，因为\"骆驼\"只是个外号；那么，我们就先说祥子，随手儿把骆驼与祥子那点关系说过去，也就算了。\n北平的洋车夫有许多派：年轻力壮，腿脚灵利的，讲究赁漂亮的车，拉\"整天儿\"，爱什么时候出车与收车都有自由；拉出车来，在固定的\"车口\"或宅门一放，专等坐快车的主儿；弄好了，也许一下子弄个一块两块的；碰巧了，也许白耗一天，连\"车份儿\"也没着落，但也不在乎。",
    excerpt: "我们所要介绍的是祥子，不是骆驼，因为\"骆驼\"只是个外号。",
    year: 1936,
    dynastyId: 18,
  },
  {
    title: "茶馆（节选）",
    authorId: findPersonId("老舍"),
    workType: "play",
    content: "时间 一八九八年（戊戌）初秋，康梁等的维新运动失败了。早半天。\n地点 北京，裕泰大茶馆。\n人物 王利发——男。最初与我们见面，他才二十多岁。因父亲早死，他很年轻就作了裕泰茶馆的掌柜。精明、有些自私，而心眼不坏。",
    excerpt: "时间 一八九八年（戊戌）初秋，康梁等的维新运动失败了。早半天。",
    year: 1957,
    dynastyId: 18,
  },
  // 冰心
  {
    title: "繁星（节选）",
    authorId: findPersonId("冰心"),
    workType: "poem",
    content: "繁星闪烁着——\n深蓝的太空，\n何曾听得见他们对语？\n沉默中，\n微光里，\n他们深深的互相颂赞了。",
    excerpt: "繁星闪烁着——\n深蓝的太空，\n何曾听得见他们对语？",
    year: 1923,
    dynastyId: 18,
  },
  {
    title: "春水（节选）",
    authorId: findPersonId("冰心"),
    workType: "poem",
    content: "春水！\n又是一年了，\n还这般的微微吹动。\n可以再照一个影儿么？\n春水温静的答谢我说：\n\"我的朋友！\n我从来未曾留下一个影儿，\n不但对你是如此。\"",
    excerpt: "春水！\n又是一年了，\n还这般的微微吹动。",
    year: 1923,
    dynastyId: 18,
  },
  // 徐志摩
  {
    title: "再别康桥",
    authorId: findPersonId("徐志摩"),
    workType: "poem",
    content: "轻轻的我走了，\n正如我轻轻的来；\n我轻轻的招手，\n作别西天的云彩。\n\n那河畔的金柳，\n是夕阳中的新娘；\n波光里的艳影，\n在我的心头荡漾。\n\n软泥上的青荇，\n油油的在水底招摇；\n在康河的柔波里，\n我甘心做一条水草！\n\n那榆荫下的一潭，\n不是清泉，是天上虹；\n揉碎在浮藻间，\n沉淀着彩虹似的梦。\n\n寻梦？撑一支长篙，\n向青草更青处漫溯；\n满载一船星辉，\n在星辉斑斓里放歌。\n\n但我不能放歌，\n悄悄是别离的笙箫；\n夏虫也为我沉默，\n沉默是今晚的康桥！\n\n悄悄的我走了，\n正如我悄悄的来；\n我挥一挥衣袖，\n不带走一片云彩。",
    excerpt: "轻轻的我走了，\n正如我轻轻的来；\n我轻轻的招手，\n作别西天的云彩。",
    year: 1928,
    dynastyId: 17,
  },
  {
    title: "翡冷翠的一夜",
    authorId: findPersonId("徐志摩"),
    workType: "poem",
    content: "你真的走了，明天？那我，那我，……\n你也不用管，迟早有那一天；\n你愿意记着我，就记着我，\n要不然趁早忘了这世界上\n有我，省得想起时空着恼，\n只当是一个梦，一个幻想；\n只当是前天我们见的残红，\n怯怜怜的在风前抖擞，一瓣，\n两瓣，落地，叫人踩，变泥……",
    excerpt: "你真的走了，明天？那我，那我，……\n你也不用管，迟早有那一天；",
    year: 1925,
    dynastyId: 17,
  },
  // 闻一多
  {
    title: "死水",
    authorId: findPersonId("闻一多"),
    workType: "poem",
    content: "这是一沟绝望的死水，\n清风吹不起半点漪沦。\n不如多扔些破铜烂铁，\n爽性泼你的剩菜残羹。\n\n也许铜的要绿成翡翠，\n铁罐上锈出几瓣桃花；\n再让油腻织一层罗绮，\n霉菌给他蒸出些云霞。\n\n让死水酵成一沟绿酒，\n漂满了珍珠似的白沫；\n小珠们笑声变成大珠，\n又被偷酒的花蚊咬破。\n\n那么一沟绝望的死水，\n也就夸得上几分鲜明。\n如果青蛙耐不住寂寞，\n又算死水叫出了歌声。\n\n这是一沟绝望的死水，\n这里断不是美的所在，\n不如让给丑恶来开垦，\n看它造出个什么世界。",
    excerpt: "这是一沟绝望的死水，\n清风吹不起半点漪沦。\n不如多扔些破铜烂铁，\n爽性泼你的剩菜残羹。",
    year: 1926,
    dynastyId: 17,
  },
  {
    title: "红烛",
    authorId: findPersonId("闻一多"),
    workType: "poem",
    content: "红烛啊！\n这样红的烛！\n诗人啊！\n吐出你的心来比比，\n可是一般颜色？\n\n红烛啊！\n是谁制的蜡——给你躯体？\n是谁点的火——点着灵魂？\n为何更须烧蜡成灰，\n然后才放光出？\n一误再误；\n矛盾！冲突！",
    excerpt: "红烛啊！\n这样红的烛！\n诗人啊！\n吐出你的心来比比，\n可是一般颜色？",
    year: 1923,
    dynastyId: 17,
  },
  // 朱自清
  {
    title: "背影（节选）",
    authorId: findPersonId("朱自清"),
    workType: "prose",
    content: "我与父亲不相见已二年余了，我最不能忘记的是他的背影。\n那年冬天，祖母死了，父亲的差使也交卸了，正是祸不单行的日子。我从北京到徐州，打算跟着父亲奔丧回家。到徐州见着父亲，看见满院狼藉的东西，又想起祖母，不禁簌簌地流下眼泪。父亲说：\"事已如此，不必难过，好在天无绝人之路！\"\n回家变卖典质，父亲还了亏空；又借钱办了丧事。这些日子，家中光景很是惨淡，一半为了丧事，一半为了父亲赋闲。丧事完毕，父亲要到南京谋事，我也要回北京念书，我们便同行。",
    excerpt: "我与父亲不相见已二年余了，我最不能忘记的是他的背影。",
    year: 1925,
    dynastyId: 17,
  },
  {
    title: "荷塘月色（节选）",
    authorId: findPersonId("朱自清"),
    workType: "prose",
    content: "这几天心里颇不宁静。今晚在院子里坐着乘凉，忽然想起日日走过的荷塘，在这满月的光里，总该另有一番样子吧。月亮渐渐地升高了，墙外马路上孩子们的欢笑，已经听不见了；妻在屋里拍着闰儿，迷迷糊糊地哼着眠歌。我悄悄地披了大衫，带上门出去。\n沿着荷塘，是一条曲折的小煤屑路。这是一条幽僻的路；白天也少人走，夜晚更加寂寞。荷塘四面，长着许多树，蓊蓊郁郁的。路的一旁，是些杨柳，和一些不知道名字的树。没有月光的晚上，这路上阴森森的，有些怕人。今晚却很好，虽然月光也还是淡淡的。",
    excerpt: "这几天心里颇不宁静。今晚在院子里坐着乘凉，忽然想起日日走过的荷塘。",
    year: 1927,
    dynastyId: 17,
  },
  // 郁达夫
  {
    title: "沉沦（节选）",
    authorId: findPersonId("郁达夫"),
    workType: "novel",
    content: "他近来觉得孤冷得可怜。\n他的早熟的性情，竟把他挤到与世人绝不相容的境地去，世人与他的中间介在的那一道屏障，愈筑愈高了。\n天气一天一天的清凉起来，他的学校开学之后，已经快半个月了。那一天正是九月的二十二日。\n晴天一碧，万里无云，终古常新的皎日，依旧在她的轨道上，一程一程的在那里行走。从南方吹来的微风，同醒酒的琼浆一般，带着一种香气，一阵阵的拂上面来。",
    excerpt: "他近来觉得孤冷得可怜。\n他的早熟的性情，竟把他挤到与世人绝不相容的境地去。",
    year: 1921,
    dynastyId: 17,
  },
  {
    title: "春风沉醉的晚上（节选）",
    authorId: findPersonId("郁达夫"),
    workType: "novel",
    content: "在沪上闲居了半年，因为失业的结果，我的寓所迁移了三处。最初我住在静安寺路南的一间同鸟笼似的永也没有太阳晒着的自由的监房里。这些自由的监房的住民，除了几个同强盗小窃一样的凶恶裁缝之外，都是些可怜的无名文士，我当时所以送了那地方一个Yellow Grub Street的称号。",
    excerpt: "在沪上闲居了半年，因为失业的结果，我的寓所迁移了三处。",
    year: 1923,
    dynastyId: 17,
  },
  // 沈从文
  {
    title: "边城（节选）",
    authorId: findPersonId("沈从文"),
    workType: "novel",
    content: "由四川过湖南去，靠东有一条官路。这官路将近湘西边境到了一个地方名为\"茶峒\"的小山城时，有一小溪，溪边有座白色小塔，塔下住了一户单独的人家。这人家只一个老人，一个女孩子，一只黄狗。\n小溪流下去，绕山岨流，约三里便汇入茶峒的大河。人若过溪越小山走去，则只一里路就到了茶峒城边。溪流如弓背，山路如弓弦，故远近有了小小差异。小溪宽约二十丈，河床为大片石头作成。静静的水即或深到一篙不能落底，却依然清澈透明，河中游鱼来去皆可以计数。",
    excerpt: "由四川过湖南去，靠东有一条官路。这官路将近湘西边境到了一个地方名为\"茶峒\"的小山城时。",
    year: 1934,
    dynastyId: 18,
  },
  {
    title: "长河（节选）",
    authorId: findPersonId("沈从文"),
    workType: "novel",
    content: "辰河中部小口岸吕家坪，河下游约有四里一个小土坡，名叫\"枫树坳\"，坳上有个滕姓祠堂。祠堂前后十几株老枫木树，叶子已被几个霜打得一片深红，如火焰燃。祠堂位置在山坳上，地点较高，向对河望去，但见千山草黄，起野火处有白烟如云。村落中乡下人为耕牛过冬预备的稻草，傍近树根堆积，无不如塔如坟。",
    excerpt: "辰河中部小口岸吕家坪，河下游约有四里一个小土坡，名叫\"枫树坳\"。",
    year: 1943,
    dynastyId: 18,
  },
]

// 过滤掉找不到作者ID的作品
const validWorks = newWorks.filter(w => w.authorId !== null && w.authorId !== undefined)

let worksAdded = 0

validWorks.forEach(workData => {
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
  
  const author = persons.find(p => p.id === workData.authorId)
  console.log(`[${newWork.id}] 添加 ${workData.title} (作者: ${author ? author.name : '?'}, ID: ${workData.authorId})`)
})

// 备份原文件
if (worksAdded > 0) {
  const worksBackup = worksPath + '.backup.' + Date.now()
  fs.copyFileSync(worksPath, worksBackup)
  console.log(`\n已备份原文件：${worksBackup}`)
  
  // 保存更新后的数据
  fs.writeFileSync(worksPath, JSON.stringify(works, null, 2), 'utf-8')
  
  console.log(`\n添加完成：`)
  console.log(`- 添加了 ${worksAdded} 部作品`)
  console.log(`- 总作品数：${works.length}`)
} else {
  console.log('\n没有需要添加的作品')
}

