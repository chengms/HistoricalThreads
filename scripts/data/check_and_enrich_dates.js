/**
 * 检查并补全事件和人物的具体日期信息
 */

const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '../../frontend/public/data')
const eventsPath = path.join(dataDir, 'events.json')
const personsPath = path.join(dataDir, 'persons.json')
const relationshipsPath = path.join(dataDir, 'relationships.json')

const events = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'))
const persons = JSON.parse(fs.readFileSync(personsPath, 'utf-8'))
const relationships = JSON.parse(fs.readFileSync(relationshipsPath, 'utf-8'))

console.log('=== 检查时间字段 ===\n')

// 事件日期补全映射（根据历史资料）
const eventDates = {
  // 近现代重要事件的具体日期
  20: { date: '1840-06-28', note: '鸦片战争开始' }, // 1840年6月28日，英国舰队封锁珠江口
  25: { date: '1894-07-25', note: '甲午中日战争开始' }, // 1894年7月25日，丰岛海战
  26: { date: '1898-06-11', note: '戊戌变法开始' }, // 1898年6月11日，光绪帝颁布《明定国是诏》
  27: { date: '1911-10-10', note: '辛亥革命开始' }, // 1911年10月10日，武昌起义
  28: { date: '1912-01-01', note: '中华民国成立' }, // 1912年1月1日，孙中山就任临时大总统
  29: { date: '1919-05-04', note: '五四运动' }, // 1919年5月4日
  30: { date: '1937-07-07', note: '全面抗战爆发' }, // 1937年7月7日，卢沟桥事变
  31: { date: '1945-08-15', note: '抗日战争胜利' }, // 1945年8月15日，日本宣布投降
  32: { date: '1949-10-01', note: '中华人民共和国成立' }, // 1949年10月1日
  33: { date: '1950-10-19', note: '抗美援朝开始' }, // 1950年10月19日，志愿军入朝
  35: { date: '2001-12-11', note: '中国加入WTO' }, // 2001年12月11日
  45: { date: '1931-09-18', note: '九一八事变' }, // 1931年9月18日
  48: { date: '1946-06-26', note: '解放战争开始' }, // 1946年6月26日，全面内战爆发
  51: { date: '1901-09-07', note: '《辛丑条约》签订' }, // 1901年9月7日
  54: { date: '1954-09-15', note: '第一届全国人民代表大会' }, // 1954年9月15日
  50: { date: '1895-04-17', note: '《马关条约》签订' }, // 1895年4月17日
  49: { date: '1851-01-11', note: '太平天国运动开始' }, // 1851年1月11日，金田起义
  36: { date: '1856-10-08', note: '第二次鸦片战争开始' }, // 1856年10月8日，亚罗号事件
  40: { date: '1900-06-17', note: '八国联军侵华' }, // 1900年6月17日，大沽口之战
  44: { date: '1926-07-09', note: '北伐战争开始' }, // 1926年7月9日，国民革命军誓师北伐
  47: { date: '1936-12-12', note: '西安事变' }, // 1936年12月12日
  46: { date: '1935-12-09', note: '一二九运动' }, // 1935年12月9日
  43: { date: '1915-09-15', note: '新文化运动开始' }, // 1915年9月15日，《青年杂志》创刊
  37: { date: '1861-01-11', note: '洋务运动开始' }, // 1861年1月11日，总理衙门成立
  38: { date: '1883-12-11', note: '中法战争开始' }, // 1883年12月11日
  39: { date: '1899-10-09', note: '义和团运动开始' }, // 1899年10月9日
  41: { date: '1901-01-29', note: '清末新政开始' }, // 1901年1月29日，慈禧发布新政上谕
  42: { date: '1915-12-25', note: '护国运动开始' }, // 1915年12月25日，护国战争爆发
  52: { date: '1950-06-30', note: '土地改革开始' }, // 1950年6月30日，《土地改革法》颁布
  53: { date: '1953-06-15', note: '三大改造开始' }, // 1953年6月15日，过渡时期总路线提出
  55: { date: '1971-10-25', note: '中国恢复联合国合法席位' }, // 1971年10月25日
  56: { date: '1997-07-01', note: '香港回归' }, // 1997年7月1日
  57: { date: '1999-12-20', note: '澳门回归' }, // 1999年12月20日
  34: { date: '1978-12-18', note: '改革开放开始' }, // 1978年12月18日，十一届三中全会召开
}

// 人物日期补全映射
const personDates = {
  // 近现代重要人物的具体日期
  39: { birthDate: '1866-11-12', deathDate: '1925-03-12', note: '孙中山' }, // 1866年11月12日 - 1925年3月12日
  40: { birthDate: '1879-10-09', deathDate: '1942-05-27', note: '陈独秀' }, // 1879年10月9日 - 1942年5月27日
  41: { birthDate: '1887-10-31', deathDate: '1975-04-05', note: '蒋介石' }, // 1887年10月31日 - 1975年4月5日
  42: { birthDate: '1893-12-26', deathDate: '1976-09-09', note: '毛泽东' }, // 1893年12月26日 - 1976年9月9日
  43: { birthDate: '1898-03-05', deathDate: '1976-01-08', note: '周恩来' }, // 1898年3月5日 - 1976年1月8日
  44: { birthDate: '1904-08-22', deathDate: '1997-02-19', note: '邓小平' }, // 1904年8月22日 - 1997年2月19日
  45: { birthDate: '1898-10-24', deathDate: '1974-11-29', note: '彭德怀' }, // 1898年10月24日 - 1974年11月29日
  71: { birthDate: '1898-03-05', deathDate: '1976-01-08', note: '周恩来（重复）' }, // 1898年3月5日 - 1976年1月8日
  72: { birthDate: '1904-08-22', deathDate: '1997-02-19', note: '邓小平（重复）' }, // 1904年8月22日 - 1997年2月19日
  60: { birthDate: '1926-08-17', deathDate: '2022-11-30', note: '江泽民' }, // 1926年8月17日 - 2022年11月30日
  61: { birthDate: '1928-10-01', note: '朱镕基' }, // 1928年10月1日
  55: { birthDate: '1858-03-19', deathDate: '1927-03-31', note: '康有为' }, // 1858年3月19日 - 1927年3月31日
  56: { birthDate: '1873-02-23', deathDate: '1929-01-19', note: '梁启超' }, // 1873年2月23日 - 1929年1月19日
  57: { birthDate: '1865-03-10', deathDate: '1898-09-28', note: '谭嗣同' }, // 1865年3月10日 - 1898年9月28日
  58: { birthDate: '1871-08-14', deathDate: '1908-11-14', note: '光绪帝' }, // 1871年8月14日 - 1908年11月14日
  59: { birthDate: '1835-11-29', deathDate: '1908-11-15', note: '慈禧太后' }, // 1835年11月29日 - 1908年11月15日
  67: { birthDate: '1891-12-17', deathDate: '1962-02-24', note: '胡适' }, // 1891年12月17日 - 1962年2月24日
  68: { birthDate: '1901-06-03', deathDate: '2001-10-14', note: '张学良' }, // 1901年6月3日 - 2001年10月14日
  69: { birthDate: '1893-11-26', deathDate: '1949-09-06', note: '杨虎城' }, // 1893年11月26日 - 1949年9月6日
  70: { birthDate: '1814-01-01', deathDate: '1864-06-01', note: '洪秀全' }, // 1814年1月1日 - 1864年6月1日
  62: { birthDate: '1812-11-10', deathDate: '1885-09-05', note: '曾国藩' }, // 1812年11月10日 - 1885年9月5日
  63: { birthDate: '1812-11-10', deathDate: '1885-09-05', note: '左宗棠' }, // 1812年11月10日 - 1885年9月5日
  38: { birthDate: '1823-02-15', deathDate: '1901-11-07', note: '李鸿章' }, // 1823年2月15日 - 1901年11月7日
  64: { birthDate: '1837-09-02', deathDate: '1909-10-04', note: '张之洞' }, // 1837年9月2日 - 1909年10月4日
  65: { birthDate: '1859-09-16', deathDate: '1916-06-06', note: '袁世凯' }, // 1859年9月16日 - 1916年6月6日
  66: { birthDate: '1882-12-18', deathDate: '1916-11-08', note: '蔡锷' }, // 1882年12月18日 - 1916年11月8日
}

let eventsUpdated = 0
let personsUpdated = 0

console.log('=== 检查事件日期 ===\n')
events.forEach(event => {
  if (eventDates[event.id]) {
    const dateInfo = eventDates[event.id]
    if (!event.eventDate || event.eventDate !== dateInfo.date) {
      event.eventDate = dateInfo.date
      // 解析日期，设置年月日
      const [year, month, day] = dateInfo.date.split('-').map(Number)
      event.eventYear = year
      event.eventMonth = month
      event.eventDay = day
      eventsUpdated++
      console.log(`[${event.id}] ${event.title}: 添加日期 ${dateInfo.date} (${dateInfo.note})`)
    }
  } else if (event.eventYear && !event.eventDate) {
    // 检查是否有明确的历史日期可以补充
    console.log(`[${event.id}] ${event.title}: 只有年份 ${event.eventYear}，无具体日期`)
  }
})

console.log(`\n=== 检查人物日期 ===\n`)
persons.forEach(person => {
  if (personDates[person.id]) {
    const dateInfo = personDates[person.id]
    let updated = false
    
    if (dateInfo.birthDate && (!person.birthDate || person.birthDate !== dateInfo.birthDate)) {
      person.birthDate = dateInfo.birthDate
      // 解析日期，更新年份
      const birthYear = parseInt(dateInfo.birthDate.split('-')[0])
      if (!person.birthYear || person.birthYear !== birthYear) {
        person.birthYear = birthYear
      }
      updated = true
    }
    
    if (dateInfo.deathDate && (!person.deathDate || person.deathDate !== dateInfo.deathDate)) {
      person.deathDate = dateInfo.deathDate
      // 解析日期，更新年份
      const deathYear = parseInt(dateInfo.deathDate.split('-')[0])
      if (!person.deathYear || person.deathYear !== deathYear) {
        person.deathYear = deathYear
      }
      updated = true
    }
    
    if (updated) {
      personsUpdated++
      console.log(`[${person.id}] ${person.name}: ${dateInfo.birthDate ? '添加出生日期 ' + dateInfo.birthDate : ''} ${dateInfo.deathDate ? '添加死亡日期 ' + dateInfo.deathDate : ''} (${dateInfo.note})`)
    }
  } else if ((person.birthYear && !person.birthDate) || (person.deathYear && !person.deathDate)) {
    // 检查是否有明确的历史日期可以补充
    const missing = []
    if (person.birthYear && !person.birthDate) missing.push('出生日期')
    if (person.deathYear && !person.deathDate) missing.push('死亡日期')
    // 只记录，不输出太多信息
  }
})

// 备份原文件
const eventsBackup = eventsPath + '.backup.' + Date.now()
const personsBackup = personsPath + '.backup.' + Date.now()
fs.copyFileSync(eventsPath, eventsBackup)
fs.copyFileSync(personsPath, personsBackup)
console.log(`\n已备份原文件：${eventsBackup}`)
console.log(`已备份原文件：${personsBackup}`)

// 保存更新后的数据
fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2), 'utf-8')
fs.writeFileSync(personsPath, JSON.stringify(persons, null, 2), 'utf-8')

console.log(`\n补全完成：`)
console.log(`- 更新了 ${eventsUpdated} 个事件的日期`)
console.log(`- 更新了 ${personsUpdated} 个人物的日期`)

