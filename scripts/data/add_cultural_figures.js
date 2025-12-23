/**
 * 添加文化人物（诗人、文学家、思想家等）和相关文化事件
 */

const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '../../frontend/public/data')
const personsPath = path.join(dataDir, 'persons.json')
const eventsPath = path.join(dataDir, 'events.json')
const sourcesPath = path.join(dataDir, 'sources.json')

const persons = JSON.parse(fs.readFileSync(personsPath, 'utf-8'))
const events = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'))
const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'))

// 获取下一个可用的ID
const getNextPersonId = () => {
  return Math.max(...persons.map(p => p.id), 0) + 1
}

const getNextEventId = () => {
  return Math.max(...events.map(e => e.id), 0) + 1
}

// 查找source ID（用于关联来源）
const findSourceId = (titlePattern) => {
  const source = sources.find(s => s.title && s.title.includes(titlePattern))
  return source ? source.id : null
}

console.log('=== 添加文化人物和事件 ===\n')

// 要添加的文化人物
const newCulturalPersons = [
  {
    name: "李白",
    nameVariants: ["李太白", "青莲居士", "谪仙人"],
    birthYear: 701,
    deathYear: 762,
    biography: "李白（701年—762年12月），字太白，号青莲居士，又号\"谪仙人\"，唐代伟大的浪漫主义诗人，被后人誉为\"诗仙\"。与杜甫并称为\"李杜\"。李白深受黄老列庄思想影响，有《李太白集》传世，诗作中多以醉时写的，代表作有《望庐山瀑布》《行路难》《蜀道难》《将进酒》《明堂赋》《早发白帝城》等多首。李白所作词赋，宋人已有传记（如文莹《湘山野录》卷上），就其开创意义及艺术成就而言，\"李白词\"享有极为崇高的地位。",
    personType: ["writer", "artist"],
    dynastyId: 24, // 盛唐
    birthplace: "绵州昌隆县（今四川省江油市）",
    sources: [1, 6, 70], // 史记、旧唐书、教材
  },
  {
    name: "杜甫",
    nameVariants: ["杜子美", "杜少陵", "杜工部"],
    birthYear: 712,
    deathYear: 770,
    biography: "杜甫（712年2月12日—770年），字子美，自号少陵野老，唐代伟大的现实主义诗人，与李白合称\"李杜\"。出生于河南巩县，原籍湖北襄阳。为了与另两位诗人李商隐与杜牧即\"小李杜\"区别，杜甫与李白又合称\"大李杜\"，杜甫也常被称为\"老杜\"。杜甫在中国古典诗歌中的影响非常深远，被后人称为\"诗圣\"，他的诗被称为\"诗史\"。后世称其杜拾遗、杜工部，也称他杜少陵、杜草堂。杜甫创作了《春望》《北征》《三吏》《三别》等名作。",
    personType: ["writer", "artist"],
    dynastyId: 25, // 中唐
    birthplace: "河南巩县（今河南省巩义市）",
    sources: [1, 6, 70],
  },
  {
    name: "白居易",
    nameVariants: ["白乐天", "香山居士"],
    birthYear: 772,
    deathYear: 846,
    biography: "白居易（772年—846年），字乐天，号香山居士，又号醉吟先生，祖籍山西太原，生于河南新郑。是唐代伟大的现实主义诗人，唐代三大诗人之一。白居易与元稹共同倡导新乐府运动，世称\"元白\"，与刘禹锡并称\"刘白\"。白居易的诗歌题材广泛，形式多样，语言平易通俗，有\"诗魔\"和\"诗王\"之称。官至翰林学士、左赞善大夫。公元846年，白居易在洛阳逝世，葬于香山。有《白氏长庆集》传世，代表诗作有《长恨歌》《卖炭翁》《琵琶行》等。",
    personType: ["writer", "artist"],
    dynastyId: 25, // 中唐
    birthplace: "河南新郑",
    sources: [6, 70],
  },
  {
    name: "王维",
    nameVariants: ["王摩诘", "诗佛"],
    birthYear: 701,
    deathYear: 761,
    biography: "王维（701年—761年），字摩诘，号摩诘居士。河东蒲州（今山西运城）人，祖籍山西祁县。唐朝诗人、画家。王维出身河东王氏，于唐玄宗开元九年（721年）中进士第，为太乐丞。历官右拾遗、监察御史、河西节度使判官。天宝年间，拜吏部郎中、给事中。安禄山攻陷长安时，被迫受伪职。长安收复后，被责授太子中允。唐肃宗乾元年间任尚书右丞，故世称\"王右丞\"。王维参禅悟理，学庄信道，精通诗、书、画、音乐等，以诗名盛于开元、天宝间，尤长五言，多咏山水田园，与孟浩然合称\"王孟\"，因笃信佛教，有\"诗佛\"之称。",
    personType: ["writer", "artist"],
    dynastyId: 24, // 盛唐
    birthplace: "河东蒲州（今山西运城）",
    sources: [6, 70],
  },
  {
    name: "孟浩然",
    nameVariants: ["孟襄阳"],
    birthYear: 689,
    deathYear: 740,
    biography: "孟浩然（689年—740年），字浩然，号孟山人，襄州襄阳（今湖北襄阳）人，唐代著名的山水田园派诗人，世称\"孟襄阳\"。因他未曾入仕，又称之为\"孟山人\"。孟浩然生当盛唐，早年有志用世，在仕途困顿、痛苦失望后，尚能自重，不媚俗世，修道归隐终身。曾隐居鹿门山。40岁时，游长安，应进士举不第。曾在太学赋诗，名动公卿，一座倾服，为之搁笔。开元二十五年（737年）张九龄招致幕府，后隐居。孟诗绝大部分为五言短篇，多写山水田园和隐居的逸兴以及羁旅行役的心情。其中虽不无愤世嫉俗之词，而更多属于诗人的自我表现。",
    personType: ["writer", "artist"],
    dynastyId: 24, // 盛唐
    birthplace: "襄州襄阳（今湖北襄阳）",
    sources: [6, 70],
  },
  {
    name: "苏轼",
    nameVariants: ["苏东坡", "苏子瞻", "东坡居士"],
    birthYear: 1037,
    deathYear: 1101,
    biography: "苏轼（1037年1月8日—1101年8月24日），字子瞻，一字和仲，号铁冠道人、东坡居士，世称苏东坡、苏仙、坡仙，汉族，眉州眉山（今四川省眉山市）人，祖籍河北栾城，北宋文学家、书法家、美食家、画家，历史治水名人。嘉祐二年（1057年），苏轼进士及第。宋神宗时曾在凤翔、杭州、密州、徐州、湖州等地任职。元丰三年（1080年），因\"乌台诗案\"被贬为黄州团练副使。宋哲宗即位后任翰林学士、侍读学士、礼部尚书等职，并出知杭州、颍州、扬州、定州等地，晚年因新党执政被贬惠州、儋州。宋徽宗时获大赦北还，途中于常州病逝。宋高宗时追赠太师；宋孝宗时追谥\"文忠\"。",
    personType: ["writer", "artist", "philosopher"],
    dynastyId: 27, // 北宋
    birthplace: "眉州眉山（今四川省眉山市）",
    sources: [7, 70],
  },
  {
    name: "辛弃疾",
    nameVariants: ["辛幼安", "稼轩"],
    birthYear: 1140,
    deathYear: 1207,
    biography: "辛弃疾（1140年5月28日—1207年10月3日），原字坦夫，后改字幼安，中年后别号稼轩，山东东路济南府历城县（今山东省济南市历城区）人。南宋官员、将领、文学家，豪放派词人，有\"词中之龙\"之称。与苏轼合称\"苏辛\"，与李清照并称\"济南二安\"。辛弃疾出生时，中原已为金兵所占。21岁参加抗金义军，不久归南宋。历任湖北、江西、湖南、福建、浙东安抚使等职。一生力主抗金。曾上《美芹十论》与《九议》，条陈战守之策。其词抒写力图恢复国家统一的爱国热情，倾诉壮志难酬的悲愤，对当时执政者的屈辱求和颇多谴责；也有不少吟咏祖国河山的作品。",
    personType: ["writer", "artist", "military"],
    dynastyId: 28, // 南宋
    birthplace: "山东东路济南府历城县（今山东省济南市历城区）",
    sources: [7, 70],
  },
  {
    name: "李清照",
    nameVariants: ["易安居士"],
    birthYear: 1084,
    deathYear: 1155,
    biography: "李清照（1084年3月13日—1155年），号易安居士，汉族，齐州章丘（今山东章丘）人。宋代女词人，婉约派代表，有\"千古第一才女\"之称。李清照出生于书香门第，早期生活优裕，其父李格非藏书甚富，她小时候就在良好的家庭环境中打下文学基础。出嫁后与夫赵明诚共同致力于书画金石的搜集整理。金兵入据中原时，流寓南方，境遇孤苦。所作词，前期多写其悠闲生活，后期多悲叹身世，情调感伤。形式上善用白描手法，自辟途径，语言清丽。论词强调协律，崇尚典雅，提出词\"别是一家\"之说，反对以作诗文之法作词。能诗，留存不多，部分篇章感时咏史，情辞慷慨，与其词风不同。",
    personType: ["writer", "artist"],
    dynastyId: 27, // 北宋（主要活动时期）
    birthplace: "齐州章丘（今山东章丘）",
    sources: [7, 70],
  },
  {
    name: "陶渊明",
    nameVariants: ["陶潜", "五柳先生", "靖节先生"],
    birthYear: 365,
    deathYear: 427,
    biography: "陶渊明（约365年—427年），字元亮，晚年更名潜，字渊明。别号五柳先生，私谥靖节，世称靖节先生。浔阳柴桑（今江西省九江市）人。东晋末到刘宋初杰出的诗人、辞赋家、散文家。被誉为\"隐逸诗人之宗\"、\"田园诗派之鼻祖\"。是江西首位文学巨匠。曾任江州祭酒、建威参军、镇军参军、彭泽县令等职，最末一次出仕为彭泽县令，八十多天便弃职而去，从此归隐田园。他是中国第一位田园诗人，被称为\"古今隐逸诗人之宗\"，有《陶渊明集》。",
    personType: ["writer", "artist", "philosopher"],
    dynastyId: 22, // 东晋
    birthplace: "浔阳柴桑（今江西省九江市）",
    sources: [3, 70],
  },
  {
    name: "屈原",
    nameVariants: ["屈平", "灵均"],
    birthYear: -340,
    deathYear: -278,
    biography: "屈原（约公元前340年—公元前278年），芈姓，屈氏，名平，字原，又自云名正则，字灵均，出生于楚国丹阳秭归（今湖北宜昌），战国时期楚国诗人、政治家。楚武王熊通之子屈瑕的后代。少年时受过良好的教育，博闻强识，志向远大。早年受楚怀王信任，任左徒、三闾大夫，兼管内政外交大事。提倡\"美政\"，主张对内举贤任能，修明法度，对外力主联齐抗秦。因遭贵族排挤诽谤，被先后流放至汉北和沅湘流域。楚国郢都被秦军攻破后，自沉于汨罗江，以身殉楚国。",
    personType: ["writer", "artist", "politician"],
    dynastyId: 5, // 战国
    birthplace: "楚国丹阳秭归（今湖北宜昌）",
    sources: [1, 70],
  },
  {
    name: "曹植",
    nameVariants: ["陈思王", "子建"],
    birthYear: 192,
    deathYear: 232,
    biography: "曹植（192年—232年12月27日），字子建，沛国谯县（今安徽省亳州市）人，是曹操与武宣卞皇后所生第三子，生前曾为陈王，去世后谥号\"思\"，因此又称陈思王。曹植是三国时期著名文学家，作为建安文学的代表人物之一与集大成者，他在两晋南北朝时期，被推尊到文章典范的地位。其代表作有《洛神赋》《白马篇》《七哀诗》等。后人因其文学上的造诣而将他与曹操、曹丕合称为\"三曹\"。",
    personType: ["writer", "artist"],
    dynastyId: 8, // 三国
    birthplace: "沛国谯县（今安徽省亳州市）",
    sources: [4, 70],
  },
  {
    name: "陆游",
    nameVariants: ["陆务观", "放翁"],
    birthYear: 1125,
    deathYear: 1210,
    biography: "陆游（1125年11月13日—1210年1月26日），字务观，号放翁，汉族，越州山阴（今浙江绍兴）人，尚书右丞陆佃之孙，南宋文学家、史学家、爱国诗人。陆游生逢北宋灭亡之际，少年时即深受家庭爱国思想的熏陶。宋高宗时，参加礼部考试，因受秦桧排斥而仕途不畅。宋孝宗即位后，赐进士出身，历任福州宁德县主簿、敕令所删定官、隆兴府通判等职，因坚持抗金，屡遭主和派排斥。乾道七年（1171年），应四川宣抚使王炎之邀，投身军旅，任职于南郑幕府。次年，幕府解散，陆游奉诏入蜀，与范成大相知。宋光宗继位后，升为礼部郎中兼实录院检讨官，不久即因\"嘲咏风月\"罢官归居故里。",
    personType: ["writer", "artist"],
    dynastyId: 28, // 南宋
    birthplace: "越州山阴（今浙江绍兴）",
    sources: [7, 70],
  },
  {
    name: "韩愈",
    nameVariants: ["韩昌黎", "韩文公"],
    birthYear: 768,
    deathYear: 824,
    biography: "韩愈（768年—824年12月25日），字退之，河南河阳（今河南省孟州市）人，自称\"郡望昌黎\"，世称\"韩昌黎\"、\"昌黎先生\"。唐代中期官员，文学家、思想家、哲学家。贞元八年（792年），韩愈登进士第，两任节度推官，累官监察御史。后因论事而被贬阳山，历都官员外郎、史馆修撰、中书舍人等职。元和十二年（817年），出任宰相裴度的行军司马，参与讨平\"淮西之乱\"。其后又因谏迎佛骨一事被贬至潮州。晚年官至吏部侍郎，人称\"韩吏部\"。长庆四年（824年），韩愈病逝，年五十七，追赠礼部尚书，谥号\"文\"，故称\"韩文公\"。",
    personType: ["writer", "philosopher"],
    dynastyId: 25, // 中唐
    birthplace: "河南河阳（今河南省孟州市）",
    sources: [6, 70],
  },
  {
    name: "柳宗元",
    nameVariants: ["柳河东", "柳柳州"],
    birthYear: 773,
    deathYear: 819,
    biography: "柳宗元（773年—819年11月28日），字子厚，汉族，河东（现山西运城永济一带）人，唐宋八大家之一，唐代文学家、哲学家、散文家和思想家，世称\"柳河东\"、\"河东先生\"，因官终柳州刺史，又称\"柳柳州\"。柳宗元与韩愈并称为\"韩柳\"，与刘禹锡并称\"刘柳\"，与王维、孟浩然、韦应物并称\"王孟韦柳\"。柳宗元一生留诗文作品达600余篇，其文的成就大于诗。骈文有近百篇，散文论说性强，笔锋犀利，讽刺辛辣，游记写景状物，多所寄托。",
    personType: ["writer", "philosopher"],
    dynastyId: 25, // 中唐
    birthplace: "河东（现山西运城永济一带）",
    sources: [6, 70],
  },
  {
    name: "欧阳修",
    nameVariants: ["欧阳永叔", "醉翁", "六一居士"],
    birthYear: 1007,
    deathYear: 1072,
    biography: "欧阳修（1007年8月1日—1072年9月22日），字永叔，号醉翁，晚号六一居士，吉州永丰（今江西省吉安市永丰县）人，景德四年（1007年）出生于绵州（今四川省绵阳市），北宋政治家、文学家。欧阳修是在宋代文学史上最早开创一代文风的文坛领袖，与韩愈、柳宗元、苏轼、苏洵、苏辙、王安石、曾巩合称\"唐宋八大家\"，并与韩愈、柳宗元、苏轼被后人合称\"千古文章四大家\"。他领导了北宋诗文革新运动，继承并发展了韩愈的古文理论。",
    personType: ["writer", "politician"],
    dynastyId: 27, // 北宋
    birthplace: "绵州（今四川省绵阳市）",
    sources: [7, 70],
  },
  {
    name: "王安石",
    nameVariants: ["王介甫", "半山"],
    birthYear: 1021,
    deathYear: 1086,
    biography: "王安石（1021年12月18日—1086年5月21日），字介甫，号半山。抚州临川（今江西省抚州市）人。中国北宋时期政治家、文学家、思想家、改革家。庆历二年（1042年），王安石进士及第。历任扬州签判、鄞县知县、舒州通判等职，政绩显著。熙宁二年（1069年），被宋神宗升为参知政事，次年拜相，主持变法。因守旧派反对，熙宁七年（1074年）罢相。一年后，宋神宗再次起用，旋又罢相，退居江宁。元祐元年（1086年），保守派得势，新法皆废，郁然病逝于钟山，追赠太傅。绍圣元年（1094年），获谥\"文\"，故世称王文公。",
    personType: ["writer", "politician", "philosopher"],
    dynastyId: 27, // 北宋
    birthplace: "抚州临川（今江西省抚州市）",
    sources: [7, 70],
  },
]

// 要添加的文化事件
const newCulturalEvents = [
  {
    title: "李白创作《将进酒》",
    description: "李白创作了著名的《将进酒》，这首诗以豪放的风格表达了诗人对人生的感慨和对自由的追求，是李白诗歌的代表作之一，体现了盛唐诗歌的浪漫主义特色。",
    eventYear: 752,
    eventType: "cultural",
    dynastyId: 24, // 盛唐
    location: "嵩山",
    persons: [], // 将在添加人物后关联
    sources: [6, 70],
  },
  {
    title: "杜甫创作《春望》",
    description: "杜甫在安史之乱期间创作了《春望》，这首诗深刻反映了战乱给人民带来的苦难，体现了杜甫诗歌的现实主义特色，是杜甫\"诗史\"风格的代表作。",
    eventYear: 757,
    eventType: "cultural",
    dynastyId: 25, // 中唐
    location: "长安",
    persons: [],
    sources: [6, 70],
  },
  {
    title: "新乐府运动",
    description: "白居易和元稹共同倡导新乐府运动，主张诗歌要反映现实，关注民生，语言要通俗易懂。这一运动对唐代诗歌发展产生了重要影响，推动了现实主义诗歌的繁荣。",
    eventYear: 815,
    eventType: "cultural",
    dynastyId: 25, // 中唐
    location: "长安",
    persons: [],
    sources: [6, 70],
  },
  {
    title: "古文运动",
    description: "韩愈和柳宗元倡导古文运动，反对骈文，提倡古文，主张\"文以载道\"，强调文章要有思想内容。这一运动对后世文学发展产生了深远影响，使古文成为文学创作的主流。",
    eventYear: 800,
    eventType: "cultural",
    dynastyId: 25, // 中唐
    location: "长安",
    persons: [],
    sources: [6, 70],
  },
  {
    title: "苏轼创作《水调歌头·明月几时有》",
    description: "苏轼创作了著名的《水调歌头·明月几时有》，这首词以中秋为背景，表达了对亲人的思念和对人生的感慨，是苏轼词作的代表作之一，体现了豪放派词风的特色。",
    eventYear: 1076,
    eventType: "cultural",
    dynastyId: 27, // 北宋
    location: "密州",
    persons: [],
    sources: [7, 70],
  },
]

let personsAdded = 0
let eventsAdded = 0

// 添加文化人物
console.log('=== 添加文化人物 ===\n')
newCulturalPersons.forEach(personData => {
  // 检查是否已存在
  const exists = persons.find(p => p.name === personData.name)
  if (exists) {
    console.log(`[跳过] ${personData.name} 已存在（ID: ${exists.id}）`)
    return
  }
  
  const newPerson = {
    id: getNextPersonId() + personsAdded,
    ...personData,
    citations: personData.sources.map(sourceId => ({
      sourceId,
      note: "待补页码"
    }))
  }
  
  persons.push(newPerson)
  personsAdded++
  console.log(`[${newPerson.id}] 添加 ${personData.name} (${personData.dynastyId ? '朝代ID: ' + personData.dynastyId : '无朝代'})`)
})

// 添加文化事件
console.log(`\n=== 添加文化事件 ===\n`)
newCulturalEvents.forEach(eventData => {
  // 检查是否已存在
  const exists = events.find(e => e.title === eventData.title)
  if (exists) {
    console.log(`[跳过] ${eventData.title} 已存在（ID: ${exists.id}）`)
    return
  }
  
  const newEvent = {
    id: getNextEventId() + eventsAdded,
    ...eventData,
    citations: eventData.sources.map(sourceId => ({
      sourceId,
      note: "待补页码"
    }))
  }
  
  events.push(newEvent)
  eventsAdded++
  console.log(`[${newEvent.id}] 添加 ${eventData.title} (${eventData.eventYear}年)`)
})

// 关联人物和事件
console.log(`\n=== 关联人物和事件 ===\n`)
// 找到新添加的人物ID
const personIdMap = {}
persons.forEach(p => {
  personIdMap[p.name] = p.id
})

// 关联事件中的人物
events.forEach(event => {
  if (event.title === "李白创作《将进酒》" && personIdMap["李白"]) {
    if (!event.persons) event.persons = []
    event.persons.push(personIdMap["李白"])
    console.log(`关联 ${event.title} 与 李白`)
  }
  if (event.title === "杜甫创作《春望》" && personIdMap["杜甫"]) {
    if (!event.persons) event.persons = []
    event.persons.push(personIdMap["杜甫"])
    console.log(`关联 ${event.title} 与 杜甫`)
  }
  if (event.title === "新乐府运动" && personIdMap["白居易"]) {
    if (!event.persons) event.persons = []
    event.persons.push(personIdMap["白居易"])
    console.log(`关联 ${event.title} 与 白居易`)
  }
  if (event.title === "古文运动" && personIdMap["韩愈"] && personIdMap["柳宗元"]) {
    if (!event.persons) event.persons = []
    event.persons.push(personIdMap["韩愈"])
    event.persons.push(personIdMap["柳宗元"])
    console.log(`关联 ${event.title} 与 韩愈、柳宗元`)
  }
  if (event.title === "苏轼创作《水调歌头·明月几时有》" && personIdMap["苏轼"]) {
    if (!event.persons) event.persons = []
    event.persons.push(personIdMap["苏轼"])
    console.log(`关联 ${event.title} 与 苏轼`)
  }
})

// 备份原文件
const personsBackup = personsPath + '.backup.' + Date.now()
const eventsBackup = eventsPath + '.backup.' + Date.now()
fs.copyFileSync(personsPath, personsBackup)
fs.copyFileSync(eventsPath, eventsBackup)
console.log(`\n已备份原文件：${personsBackup}`)
console.log(`已备份原文件：${eventsBackup}`)

// 保存更新后的数据
fs.writeFileSync(personsPath, JSON.stringify(persons, null, 2), 'utf-8')
fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2), 'utf-8')

console.log(`\n添加完成：`)
console.log(`- 添加了 ${personsAdded} 个文化人物`)
console.log(`- 添加了 ${eventsAdded} 个文化事件`)

