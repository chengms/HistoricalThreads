/**
 * 添加课本中所有出现过的诗人
 */

const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '../../frontend/public/data')
const personsPath = path.join(dataDir, 'persons.json')
const dynastiesPath = path.join(dataDir, 'dynasties.json')

const persons = JSON.parse(fs.readFileSync(personsPath, 'utf-8'))
const dynasties = JSON.parse(fs.readFileSync(dynastiesPath, 'utf-8'))

// 获取下一个可用的ID
const getNextPersonId = () => {
  return Math.max(...persons.map(p => p.id), 0) + 1
}

// 查找朝代ID
const findDynastyId = (name) => {
  const dynasty = dynasties.find(d => d.name === name || d.name.includes(name))
  return dynasty ? dynasty.id : null
}

console.log('=== 添加课本中的诗人 ===\n')

// 要添加的诗人（基于中小学语文课本）
const newPoets = [
  {
    name: "王之涣",
    nameVariants: ["季凌"],
    birthYear: 688,
    deathYear: 742,
    biography: "王之涣（688年—742年），字季凌，祖籍并州晋阳（今山西太原），盛唐时期的著名诗人。以善于描写边塞风光著称。其代表作有《登鹳雀楼》、《凉州词》等。\"欲穷千里目，更上一层楼\"是千古传诵的名句。",
    personType: ["writer", "artist"],
    dynastyId: findDynastyId("盛唐") || findDynastyId("唐朝"),
    birthplace: "并州晋阳（今山西太原）",
    sources: [6, 70],
  },
  {
    name: "刘禹锡",
    nameVariants: ["刘梦得", "刘宾客"],
    birthYear: 772,
    deathYear: 842,
    biography: "刘禹锡（772年—842年），字梦得，河南洛阳人，一说彭城（今江苏徐州）人，自称\"家本荥上，籍占洛阳\"，又自言系出中山，其先为中山靖王刘胜。唐朝文学家、哲学家，有\"诗豪\"之称。刘禹锡诗文俱佳，涉猎题材广泛，与柳宗元并称\"刘柳\"，与韦应物、白居易合称\"三杰\"，并与白居易合称\"刘白\"。",
    personType: ["writer", "philosopher"],
    dynastyId: findDynastyId("中唐") || findDynastyId("唐朝"),
    birthplace: "河南洛阳",
    sources: [6, 70],
  },
  {
    name: "李商隐",
    nameVariants: ["李义山", "玉溪生"],
    birthYear: 813,
    deathYear: 858,
    biography: "李商隐（约813年—约858年），字义山，号玉溪（谿）生、樊南生，祖籍怀州河内（今河南沁阳市），生于郑州荥阳（今河南郑州荥阳市）。晚唐著名诗人，和杜牧合称\"小李杜\"。李商隐是晚唐乃至整个唐代，为数不多的刻意追求诗美的诗人。他擅长诗歌写作，骈文文学价值也很高。其诗构思新奇，风格秾丽，尤其是一些爱情诗和无题诗写得缠绵悱恻，优美动人，广为传诵。",
    personType: ["writer", "artist"],
    dynastyId: findDynastyId("晚唐") || findDynastyId("唐朝"),
    birthplace: "郑州荥阳（今河南郑州荥阳市）",
    sources: [6, 70],
  },
  {
    name: "杜牧",
    nameVariants: ["杜牧之", "樊川居士"],
    birthYear: 803,
    deathYear: 852,
    biography: "杜牧（803年—852年），字牧之，号樊川居士，京兆万年（今陕西西安）人，唐代杰出的诗人、散文家。杜牧的诗歌以七言绝句著称，内容以咏史抒怀为主，其诗英发俊爽，多切经世之物，在晚唐成就颇高。杜牧人称\"小杜\"，以别于杜甫，\"大杜\"。与李商隐并称\"小李杜\"。",
    personType: ["writer", "artist"],
    dynastyId: findDynastyId("晚唐") || findDynastyId("唐朝"),
    birthplace: "京兆万年（今陕西西安）",
    sources: [6, 70],
  },
  {
    name: "王昌龄",
    nameVariants: ["王少伯", "王龙标"],
    birthYear: 698,
    deathYear: 757,
    biography: "王昌龄（698年—757年），字少伯，唐朝时期大臣，著名边塞诗人。王昌龄与李白、高适、王维、王之涣、岑参等人交往深厚。其诗以七绝见长，尤以登第之前赴西北边塞所作边塞诗最著，有\"诗家夫子王江宁\"之誉，又被后人誉为\"七绝圣手\"。",
    personType: ["writer", "artist"],
    dynastyId: findDynastyId("盛唐") || findDynastyId("唐朝"),
    birthplace: "京兆长安（今陕西西安）",
    sources: [6, 70],
  },
  {
    name: "高适",
    nameVariants: ["高达夫", "高常侍"],
    birthYear: 704,
    deathYear: 765,
    biography: "高适（704年—765年），字达夫，一字仲武，渤海蓨（今河北景县）人，后迁居宋州宋城（今河南商丘睢阳）。安东都护高侃之孙，唐代大臣、诗人。曾任刑部侍郎、散骑常侍，封渤海县侯，世称高常侍。于永泰元年正月病逝，卒赠礼部尚书，谥号忠。作为著名边塞诗人，高适与岑参并称\"高岑\"，与岑参、王昌龄、王之涣合称\"边塞四诗人\"。",
    personType: ["writer", "artist", "military"],
    dynastyId: findDynastyId("盛唐") || findDynastyId("唐朝"),
    birthplace: "渤海蓨（今河北景县）",
    sources: [6, 70],
  },
  {
    name: "岑参",
    nameVariants: ["岑嘉州"],
    birthYear: 715,
    deathYear: 770,
    biography: "岑参（715年—770年），荆州江陵（今湖北江陵县）人或南阳棘阳（今河南南阳市）人，唐代诗人，与高适并称\"高岑\"。岑参工诗，长于七言歌行，对边塞风光，军旅生活，以及少数民族的文化风俗有亲切的感受，故其边塞诗尤多佳作。",
    personType: ["writer", "artist"],
    dynastyId: findDynastyId("盛唐") || findDynastyId("唐朝"),
    birthplace: "荆州江陵（今湖北江陵县）",
    sources: [6, 70],
  },
  {
    name: "贺知章",
    nameVariants: ["季真", "四明狂客"],
    birthYear: 659,
    deathYear: 744,
    biography: "贺知章（659年—744年），字季真，晚年自号\"四明狂客\"、\"秘书外监\"，越州永兴（今浙江杭州萧山区）人。唐代诗人、书法家。贺知章与张若虚、张旭、包融并称\"吴中四士\"；与李白、李适之等谓\"饮中八仙\"；又与陈子昂、卢藏用、宋之问、王适、毕构、李白、孟浩然、王维、司马承祯等称为\"仙宗十友\"。",
    personType: ["writer", "artist"],
    dynastyId: findDynastyId("盛唐") || findDynastyId("唐朝"),
    birthplace: "越州永兴（今浙江杭州萧山区）",
    sources: [6, 70],
  },
  {
    name: "范仲淹",
    nameVariants: ["范希文", "范文正"],
    birthYear: 989,
    deathYear: 1052,
    biography: "范仲淹（989年10月1日—1052年6月19日），字希文，苏州吴县（今江苏省苏州市）人。北宋杰出的思想家、政治家、文学家。范仲淹政绩卓著，文学成就突出。他倡导的\"先天下之忧而忧，后天下之乐而乐\"思想和仁人志士节操，对后世影响深远。有《范文正公文集》传世。",
    personType: ["writer", "politician", "philosopher"],
    dynastyId: findDynastyId("北宋"),
    birthplace: "苏州吴县（今江苏省苏州市）",
    sources: [7, 70],
  },
  {
    name: "晏殊",
    nameVariants: ["晏同叔", "晏元献"],
    birthYear: 991,
    deathYear: 1055,
    biography: "晏殊（991年—1055年2月27日），字同叔，江南西路抚州临川县（今江西进贤）人。北宋政治家、文学家。晏殊以词著于文坛，尤擅小令，风格含蓄婉丽，与其子晏几道，被称为\"大晏\"和\"小晏\"，又与欧阳修并称\"晏欧\"。",
    personType: ["writer", "politician"],
    dynastyId: findDynastyId("北宋"),
    birthplace: "抚州临川县（今江西进贤）",
    sources: [7, 70],
  },
  {
    name: "秦观",
    nameVariants: ["秦少游", "秦太虚", "淮海居士"],
    birthYear: 1049,
    deathYear: 1100,
    biography: "秦观（1049年—1100年9月17日），字少游，一字太虚，号淮海居士，别号邗沟居士，高邮军武宁乡左厢里（今江苏省高邮市三垛镇少游村）人。北宋婉约派词人，被尊为婉约派一代词宗，儒客大家。",
    personType: ["writer", "artist"],
    dynastyId: findDynastyId("北宋"),
    birthplace: "高邮军武宁乡（今江苏省高邮市）",
    sources: [7, 70],
  },
  {
    name: "李煜",
    nameVariants: ["李重光", "南唐后主"],
    birthYear: 937,
    deathYear: 978,
    biography: "李煜（937年8月15日—978年8月13日），原名从嘉，字重光，号钟隐，又号钟峰白莲居士，世称南唐后主、李后主。南唐末代君主，五代十国时南唐国君。李煜精书法、工绘画、通音律，诗文均有一定造诣，尤以词的成就最高。李煜的词，继承了晚唐以来温庭筠、韦庄等花间派词人的传统，又受李璟、冯延巳等的影响，语言明快、形象生动、用情真挚，风格鲜明，其亡国后词作更是题材广阔，含意深沉，在晚唐五代词中别树一帜，对后世词坛影响深远。",
    personType: ["writer", "artist", "politician"],
    dynastyId: findDynastyId("五代十国") || findDynastyId("南唐"),
    birthplace: "金陵（今江苏南京）",
    sources: [7, 70],
  },
  {
    name: "文天祥",
    nameVariants: ["文履善", "文文山", "文丞相"],
    birthYear: 1236,
    deathYear: 1283,
    biography: "文天祥（1236年6月6日—1283年1月9日），初名云孙，字履善，又字宋瑞，自号文山、浮休道人。江西吉州庐陵（今江西省吉安市青原区富田镇）人，南宋末政治家、文学家，爱国诗人，抗元名臣、民族英雄，与陆秀夫、张世杰并称为\"宋末三杰\"。",
    personType: ["writer", "politician", "military"],
    dynastyId: findDynastyId("南宋"),
    birthplace: "吉州庐陵（今江西省吉安市）",
    sources: [7, 70],
  },
  {
    name: "杨万里",
    nameVariants: ["杨诚斋"],
    birthYear: 1127,
    deathYear: 1206,
    biography: "杨万里（1127年10月29日—1206年6月15日），字廷秀，号诚斋，自号诚斋野客。吉州吉水（今江西省吉水县黄桥镇湴塘村）人。南宋文学家、官员，与陆游、尤袤、范成大并称为南宋\"中兴四大诗人\"。",
    personType: ["writer", "artist"],
    dynastyId: findDynastyId("南宋"),
    birthplace: "吉州吉水（今江西省吉水县）",
    sources: [7, 70],
  },
  {
    name: "朱熹",
    nameVariants: ["朱子", "元晦", "晦庵"],
    birthYear: 1130,
    deathYear: 1200,
    biography: "朱熹（1130年10月18日—1200年4月23日），字元晦，又字仲晦，号晦庵，晚称晦翁。祖籍徽州府婺源县（今江西省婺源），生于南剑州尤溪（今属福建省三明市）。中国南宋时期理学家、思想家、哲学家、教育家、诗人。",
    personType: ["philosopher", "writer", "philosopher"],
    dynastyId: findDynastyId("南宋"),
    birthplace: "南剑州尤溪（今属福建省三明市）",
    sources: [7, 70],
  },
  {
    name: "于谦",
    nameVariants: ["于廷益", "于少保"],
    birthYear: 1398,
    deathYear: 1457,
    biography: "于谦（1398年5月13日—1457年2月16日），字廷益，号节庵，官至少保，世称于少保，汉族，浙江杭州府钱塘县（今浙江省杭州市上城区）人。明朝名臣、民族英雄、军事家、政治家。",
    personType: ["writer", "politician", "military"],
    dynastyId: findDynastyId("明朝"),
    birthplace: "浙江杭州府钱塘县（今浙江省杭州市）",
    sources: [9, 70],
  },
  {
    name: "龚自珍",
    nameVariants: ["龚定庵", "龚璱人"],
    birthYear: 1792,
    deathYear: 1841,
    biography: "龚自珍（1792年8月22日—1841年9月26日），字璱人，号定庵。汉族，浙江仁和（今杭州）人。晚年居住昆山羽琌山馆，又号羽琌山民。清代思想家、诗人、文学家和改良主义的先驱者。",
    personType: ["writer", "philosopher"],
    dynastyId: findDynastyId("清朝"),
    birthplace: "浙江仁和（今杭州）",
    sources: [10, 70],
  },
  {
    name: "贾岛",
    nameVariants: ["贾阆仙", "贾浪仙"],
    birthYear: 779,
    deathYear: 843,
    biography: "贾岛（779年—843年），字阆仙，一作浪仙，唐朝河北道幽州范阳（今河北涿州）人。自号\"碣石山人\"。唐代诗人，人称\"诗奴\"。",
    personType: ["writer", "artist"],
    dynastyId: findDynastyId("中唐") || findDynastyId("唐朝"),
    birthplace: "幽州范阳（今河北涿州）",
    sources: [6, 70],
  },
  {
    name: "曹操",
    nameVariants: ["魏武帝", "孟德"],
    birthYear: 155,
    deathYear: 220,
    biography: "曹操（155年—220年3月15日），一名吉利。字孟德，小字阿瞒。是沛国谯县（今安徽亳州）人，太尉曹嵩之子、汉相国曹参之后。是东汉末年权臣、丞相、魏王，政治家、军事家、文学家、诗人、书法家，曹魏政权奠基者。曹操的诗歌，今存20多篇，全部是乐府诗体。内容大体上可分三类。一类是关涉时事的，一类是以表述理想为主的，一类是游仙诗。",
    personType: ["writer", "politician", "military"],
    dynastyId: findDynastyId("三国"),
    birthplace: "沛国谯县（今安徽亳州）",
    sources: [4, 70],
  },
]

let personsAdded = 0

// 添加诗人
newPoets.forEach(personData => {
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

// 备份原文件
const personsBackup = personsPath + '.backup.' + Date.now()
fs.copyFileSync(personsPath, personsBackup)
console.log(`\n已备份原文件：${personsBackup}`)

// 保存更新后的数据
fs.writeFileSync(personsPath, JSON.stringify(persons, null, 2), 'utf-8')

console.log(`\n添加完成：`)
console.log(`- 添加了 ${personsAdded} 个课本中的诗人`)

