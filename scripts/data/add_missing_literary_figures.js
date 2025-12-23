/**
 * 添加缺失的文学人物和历史人物
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

console.log('=== 添加缺失的文学人物和历史人物 ===\n')

// 要添加的人物
const newPersons = [
  // 历史人物
  {
    name: "曹丕",
    nameVariants: ["魏文帝", "子桓"],
    birthYear: 187,
    deathYear: 226,
    biography: "曹丕（187年—226年6月29日），字子桓，沛国谯县（今安徽省亳州市）人。三国时期政治家、文学家，曹魏开国皇帝（220年—226年在位）。魏武帝曹操次子，与正室卞夫人的嫡长子。曹丕文武双全，八岁能提笔为文，善骑射，好击剑，博览古今经传，通晓诸子百家学说。建安二十二年（217年），曹丕被立为魏王世子。建安二十五年（220年），曹操逝世，曹丕继任丞相、魏王。同年，受禅登基，以魏代汉，结束了汉朝四百多年的统治，建立了魏国。曹丕在位期间，平定边患，击退鲜卑，和匈奴、氐、羌等外族修好，恢复汉朝在西域的建置。黄初七年（226年），曹丕病逝于洛阳，时年四十岁。",
    personType: ["writer", "politician"],
    dynastyId: findDynastyId("三国"),
    birthplace: "沛国谯县（今安徽省亳州市）",
    sources: [4, 70],
  },
  {
    name: "岳飞",
    nameVariants: ["岳鹏举", "岳武穆"],
    birthYear: 1103,
    deathYear: 1142,
    biography: "岳飞（1103年3月24日—1142年1月27日），字鹏举，相州汤阴（今河南省汤阴县）人。南宋时期抗金名将、军事家、战略家、民族英雄、书法家、诗人，位列南宋\"中兴四将\"之首。岳飞从二十岁起，曾先后四次从军。自建炎二年（1128年）遇宗泽至绍兴十一年（1141年）止，先后参与、指挥大小战斗数百次。金军攻打江南时，独树一帜，力主抗金，收复建康。绍兴四年（1134年），收复襄阳六郡。绍兴六年（1136年），率师北伐，顺利攻取商州、虢州等地。绍兴十年（1140年），完颜宗弼毁盟攻宋，岳飞挥师北伐，两河人民奔走相告，各地义军纷纷响应，夹击金军。岳家军先后收复郑州、洛阳等地，在郾城、颍昌大败金军，进军朱仙镇。",
    personType: ["writer", "military", "politician"],
    dynastyId: findDynastyId("南宋"),
    birthplace: "相州汤阴（今河南省汤阴县）",
    sources: [7, 70],
  },
  {
    name: "朱德",
    nameVariants: ["朱玉阶", "朱总司令"],
    birthYear: 1886,
    deathYear: 1976,
    biography: "朱德（1886年12月1日—1976年7月6日），字玉阶，原名朱代珍，曾用名朱建德，四川仪陇人。伟大的马克思主义者，伟大的无产阶级革命家、政治家、军事家，中国人民解放军的主要缔造者之一，中华人民共和国的开国元勋，是以毛泽东同志为核心的党的第一代中央领导集体的重要成员。",
    personType: ["writer", "military", "politician"],
    dynastyId: findDynastyId("中华人民共和国"),
    birthplace: "四川仪陇",
    sources: [69, 70],
  },
  {
    name: "陈毅",
    nameVariants: ["陈仲弘", "陈老总"],
    birthYear: 1901,
    deathYear: 1972,
    biography: "陈毅（1901年8月26日—1972年1月6日），男，名世俊，字仲弘，四川乐至人，中国共产党员，中华人民共和国十大元帅之一。中国人民解放军创建人和领导人之一，伟大的无产阶级革命家、政治家、军事家、外交家、诗人。",
    personType: ["writer", "military", "politician"],
    dynastyId: findDynastyId("中华人民共和国"),
    birthplace: "四川乐至",
    sources: [69, 70],
  },
  // 现代作家
  {
    name: "鲁迅",
    nameVariants: ["周树人", "豫才"],
    birthYear: 1881,
    deathYear: 1936,
    biography: "鲁迅（1881年9月25日—1936年10月19日），原名周树人，字豫才，浙江绍兴人。著名文学家、思想家、革命家、教育家、民主战士，新文化运动的重要参与者，中国现代文学的奠基人之一。",
    personType: ["writer"],
    dynastyId: findDynastyId("民国"),
    birthplace: "浙江绍兴",
    sources: [70],
  },
  {
    name: "郭沫若",
    nameVariants: ["郭开贞", "郭鼎堂"],
    birthYear: 1892,
    deathYear: 1978,
    biography: "郭沫若（1892年11月16日—1978年6月12日），原名郭开贞，字鼎堂，号尚武，笔名沫若、麦克昂、郭鼎堂、石沱、高汝鸿、羊易之等。中国现代作家、历史学家、考古学家、政治家。",
    personType: ["writer", "politician"],
    dynastyId: findDynastyId("中华人民共和国"),
    birthplace: "四川乐山",
    sources: [69, 70],
  },
  {
    name: "茅盾",
    nameVariants: ["沈雁冰", "沈德鸿"],
    birthYear: 1896,
    deathYear: 1981,
    biography: "茅盾（1896年7月4日—1981年3月27日），原名沈德鸿，字雁冰，浙江桐乡人。中国现代作家、文学评论家、文化活动家以及社会活动家。",
    personType: ["writer"],
    dynastyId: findDynastyId("中华人民共和国"),
    birthplace: "浙江桐乡",
    sources: [69, 70],
  },
  {
    name: "巴金",
    nameVariants: ["李尧棠", "芾甘"],
    birthYear: 1904,
    deathYear: 2005,
    biography: "巴金（1904年11月25日—2005年10月17日），原名李尧棠，字芾甘，四川成都人。中国现代作家、翻译家、社会活动家、无党派爱国民主人士。",
    personType: ["writer"],
    dynastyId: findDynastyId("中华人民共和国"),
    birthplace: "四川成都",
    sources: [69, 70],
  },
  {
    name: "老舍",
    nameVariants: ["舒庆春", "舒舍予"],
    birthYear: 1899,
    deathYear: 1966,
    biography: "老舍（1899年2月3日—1966年8月24日），原名舒庆春，字舍予，另有笔名絜青、鸿来、非我等。中国现代小说家、作家、语言大师、人民艺术家、北京人艺编剧，新中国第一位获得\"人民艺术家\"称号的作家。",
    personType: ["writer"],
    dynastyId: findDynastyId("中华人民共和国"),
    birthplace: "北京",
    sources: [69, 70],
  },
  {
    name: "冰心",
    nameVariants: ["谢婉莹", "冰心女士"],
    birthYear: 1900,
    deathYear: 1999,
    biography: "冰心（1900年10月5日—1999年2月28日），原名谢婉莹，福建长乐人。中国现代作家、诗人、翻译家、社会活动家、散文家。",
    personType: ["writer"],
    dynastyId: findDynastyId("中华人民共和国"),
    birthplace: "福建长乐",
    sources: [69, 70],
  },
  {
    name: "徐志摩",
    nameVariants: ["徐章垿", "云中鹤"],
    birthYear: 1897,
    deathYear: 1931,
    biography: "徐志摩（1897年1月15日—1931年11月19日），原名章垿，字槱森，留学美国时改名志摩。浙江海宁人。中国现代诗人、散文家，新月派代表诗人。",
    personType: ["writer"],
    dynastyId: findDynastyId("民国"),
    birthplace: "浙江海宁",
    sources: [70],
  },
  {
    name: "闻一多",
    nameVariants: ["闻家骅", "闻亦多"],
    birthYear: 1899,
    deathYear: 1946,
    biography: "闻一多（1899年11月24日—1946年7月15日），本名闻家骅，字友三，生于湖北省黄冈市浠水县，中国现代诗人、学者、民主战士。",
    personType: ["writer"],
    dynastyId: findDynastyId("民国"),
    birthplace: "湖北省黄冈市浠水县",
    sources: [70],
  },
  {
    name: "朱自清",
    nameVariants: ["朱自华", "佩弦"],
    birthYear: 1898,
    deathYear: 1948,
    biography: "朱自清（1898年11月22日—1948年8月12日），原名自华，号实秋，后改名自清，字佩弦。原籍浙江绍兴，出生于江苏省东海县（今连云港市东海县平明镇），后随父定居扬州。中国现代散文家、诗人、学者、民主战士。",
    personType: ["writer"],
    dynastyId: findDynastyId("民国"),
    birthplace: "江苏省东海县",
    sources: [70],
  },
  {
    name: "郁达夫",
    nameVariants: ["郁文", "达夫"],
    birthYear: 1896,
    deathYear: 1945,
    biography: "郁达夫（1896年12月7日—1945年9月17日），原名郁文，字达夫，浙江富阳人。中国现代作家、革命烈士。",
    personType: ["writer"],
    dynastyId: findDynastyId("民国"),
    birthplace: "浙江富阳",
    sources: [70],
  },
  {
    name: "沈从文",
    nameVariants: ["沈岳焕", "休芸芸"],
    birthYear: 1902,
    deathYear: 1988,
    biography: "沈从文（1902年12月28日—1988年5月10日），原名沈岳焕，乳名茂林，字崇文，笔名休芸芸、甲辰、上官碧、璇若等，湖南凤凰县人。中国现代作家、历史文物研究者。",
    personType: ["writer"],
    dynastyId: findDynastyId("中华人民共和国"),
    birthplace: "湖南凤凰",
    sources: [69, 70],
  },
]

let personsAdded = 0

// 添加人物
newPersons.forEach(personData => {
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
console.log(`- 添加了 ${personsAdded} 位人物`)

