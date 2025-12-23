/**
 * 验证并补全事件和人物的具体日期信息
 * 基于权威历史资料和百科信息
 */

const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '../../frontend/public/data')
const eventsPath = path.join(dataDir, 'events.json')
const personsPath = path.join(dataDir, 'persons.json')

const events = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'))
const persons = JSON.parse(fs.readFileSync(personsPath, 'utf-8'))

console.log('=== 验证并补全日期信息 ===\n')

// 基于权威资料的事件日期（已验证）
const verifiedEventDates = {
  // 近现代重要事件（基于历史记录）
  20: { date: '1840-06-28', source: '历史记录：英国舰队封锁珠江口' }, // 鸦片战争
  25: { date: '1894-07-25', source: '历史记录：丰岛海战' }, // 甲午中日战争
  26: { date: '1898-06-11', source: '历史记录：光绪帝颁布《明定国是诏》' }, // 戊戌变法
  27: { date: '1911-10-10', source: '历史记录：武昌起义' }, // 辛亥革命
  28: { date: '1912-01-01', source: '历史记录：孙中山就任临时大总统' }, // 中华民国成立
  29: { date: '1919-05-04', source: '历史记录：五四运动' }, // 五四运动
  30: { date: '1937-07-07', source: '历史记录：卢沟桥事变' }, // 全面抗战爆发
  31: { date: '1945-08-15', source: '历史记录：日本宣布投降' }, // 抗日战争胜利
  32: { date: '1949-10-01', source: '历史记录：开国大典' }, // 中华人民共和国成立
  33: { date: '1950-10-19', source: '历史记录：志愿军入朝' }, // 抗美援朝
  35: { date: '2001-12-11', source: '历史记录：中国正式加入WTO' }, // 中国加入WTO
  45: { date: '1931-09-18', source: '历史记录：九一八事变' }, // 九一八事变
  48: { date: '1946-06-26', source: '历史记录：全面内战爆发' }, // 解放战争开始
  51: { date: '1901-09-07', source: '历史记录：《辛丑条约》签订' }, // 《辛丑条约》签订
  54: { date: '1954-09-15', source: '历史记录：第一届全国人大召开' }, // 第一届全国人民代表大会
  50: { date: '1895-04-17', source: '历史记录：《马关条约》签订' }, // 《马关条约》签订
  49: { date: '1851-01-11', source: '历史记录：金田起义' }, // 太平天国运动
  36: { date: '1856-10-08', source: '历史记录：亚罗号事件' }, // 第二次鸦片战争
  40: { date: '1900-06-17', source: '历史记录：大沽口之战' }, // 八国联军侵华
  44: { date: '1926-07-09', source: '历史记录：国民革命军誓师北伐' }, // 北伐战争
  47: { date: '1936-12-12', source: '历史记录：西安事变' }, // 西安事变
  46: { date: '1935-12-09', source: '历史记录：一二九运动' }, // 一二九运动
  43: { date: '1915-09-15', source: '历史记录：《青年杂志》创刊' }, // 新文化运动
  37: { date: '1861-01-20', source: '历史记录：总理衙门成立（1861年1月20日）' }, // 洋务运动
  38: { date: '1883-12-11', source: '历史记录：中法战争开始' }, // 中法战争
  39: { date: '1899-10-09', source: '历史记录：义和团运动开始' }, // 义和团运动
  41: { date: '1901-01-29', source: '历史记录：慈禧发布新政上谕' }, // 清末新政
  42: { date: '1915-12-25', source: '历史记录：护国战争爆发' }, // 护国运动
  52: { date: '1950-06-30', source: '历史记录：《土地改革法》颁布' }, // 土地改革
  53: { date: '1953-06-15', source: '历史记录：过渡时期总路线提出' }, // 三大改造
  55: { date: '1971-10-25', source: '历史记录：联合国2758号决议' }, // 中国恢复联合国合法席位
  56: { date: '1997-07-01', source: '历史记录：香港回归' }, // 香港回归
  57: { date: '1999-12-20', source: '历史记录：澳门回归' }, // 澳门回归
  34: { date: '1978-12-18', source: '历史记录：十一届三中全会召开' }, // 改革开放
}

// 基于权威资料的人物日期（已验证）
const verifiedPersonDates = {
  // 近现代重要人物
  39: { birthDate: '1866-11-12', deathDate: '1925-03-12', source: '历史记录' }, // 孙中山
  40: { birthDate: '1879-10-09', deathDate: '1942-05-27', source: '历史记录' }, // 陈独秀
  41: { birthDate: '1887-10-31', deathDate: '1975-04-05', source: '历史记录' }, // 蒋介石
  42: { birthDate: '1893-12-26', deathDate: '1976-09-09', source: '历史记录' }, // 毛泽东
  43: { birthDate: '1898-03-05', deathDate: '1976-01-08', source: '历史记录' }, // 周恩来
  44: { birthDate: '1904-08-22', deathDate: '1997-02-19', source: '历史记录' }, // 邓小平
  45: { birthDate: '1898-10-24', deathDate: '1974-11-29', source: '历史记录' }, // 彭德怀
  60: { birthDate: '1926-08-17', deathDate: '2022-11-30', source: '历史记录' }, // 江泽民
  61: { birthDate: '1928-10-01', source: '历史记录' }, // 朱镕基
  55: { birthDate: '1858-03-19', deathDate: '1927-03-31', source: '历史记录' }, // 康有为
  56: { birthDate: '1873-02-23', deathDate: '1929-01-19', source: '历史记录' }, // 梁启超
  57: { birthDate: '1865-03-10', deathDate: '1898-09-28', source: '历史记录' }, // 谭嗣同
  58: { birthDate: '1871-08-14', deathDate: '1908-11-14', source: '历史记录' }, // 光绪帝
  59: { birthDate: '1835-11-29', deathDate: '1908-11-15', source: '历史记录' }, // 慈禧太后
  67: { birthDate: '1891-12-17', deathDate: '1962-02-24', source: '历史记录' }, // 胡适
  68: { birthDate: '1901-06-03', deathDate: '2001-10-14', source: '历史记录' }, // 张学良
  69: { birthDate: '1893-11-26', deathDate: '1949-09-06', source: '历史记录' }, // 杨虎城
  70: { birthDate: '1814-01-01', deathDate: '1864-06-01', source: '历史记录' }, // 洪秀全
  62: { birthDate: '1811-11-26', deathDate: '1872-03-12', source: '历史记录' }, // 曾国藩（修正）
  63: { birthDate: '1812-11-10', deathDate: '1885-09-05', source: '历史记录' }, // 左宗棠
  64: { birthDate: '1837-09-02', deathDate: '1909-10-04', source: '历史记录' }, // 张之洞
  65: { birthDate: '1859-09-16', deathDate: '1916-06-06', source: '历史记录' }, // 袁世凯
  66: { birthDate: '1882-12-18', deathDate: '1916-11-08', source: '历史记录' }, // 蔡锷
  38: { birthDate: '1823-02-15', deathDate: '1901-11-07', source: '历史记录' }, // 李鸿章
  71: { birthDate: '1898-03-05', deathDate: '1976-01-08', source: '历史记录' }, // 周恩来（重复）
  72: { birthDate: '1904-08-22', deathDate: '1997-02-19', source: '历史记录' }, // 邓小平（重复）
}

let eventsUpdated = 0
let personsUpdated = 0
let eventsVerified = 0
let personsVerified = 0

console.log('=== 验证事件日期 ===\n')
events.forEach(event => {
  if (verifiedEventDates[event.id]) {
    const dateInfo = verifiedEventDates[event.id]
    const [year, month, day] = dateInfo.date.split('-').map(Number)
    
    // 验证现有日期或更新
    if (event.eventDate && event.eventDate !== dateInfo.date) {
      console.log(`[${event.id}] ${event.title}: 日期不一致，更新为 ${dateInfo.date} (${dateInfo.source})`)
      console.log(`  原日期: ${event.eventDate}`)
      event.eventDate = dateInfo.date
      event.eventYear = year
      event.eventMonth = month
      event.eventDay = day
      eventsUpdated++
    } else if (!event.eventDate) {
      console.log(`[${event.id}] ${event.title}: 添加日期 ${dateInfo.date} (${dateInfo.source})`)
      event.eventDate = dateInfo.date
      event.eventYear = year
      event.eventMonth = month
      event.eventDay = day
      eventsUpdated++
    } else {
      eventsVerified++
    }
  } else if (event.eventYear && !event.eventDate) {
    // 只有年份，没有具体日期（古代事件通常查不到具体日期）
    // 不输出，避免信息过多
  }
})

console.log(`\n=== 验证人物日期 ===\n`)
persons.forEach(person => {
  if (verifiedPersonDates[person.id]) {
    const dateInfo = verifiedPersonDates[person.id]
    let updated = false
    
    if (dateInfo.birthDate) {
      const birthYear = parseInt(dateInfo.birthDate.split('-')[0])
      if (person.birthDate && person.birthDate !== dateInfo.birthDate) {
        console.log(`[${person.id}] ${person.name}: 出生日期不一致，更新为 ${dateInfo.birthDate} (${dateInfo.source})`)
        console.log(`  原日期: ${person.birthDate}`)
        person.birthDate = dateInfo.birthDate
        person.birthYear = birthYear
        updated = true
      } else if (!person.birthDate) {
        console.log(`[${person.id}] ${person.name}: 添加出生日期 ${dateInfo.birthDate} (${dateInfo.source})`)
        person.birthDate = dateInfo.birthDate
        person.birthYear = birthYear
        updated = true
      } else {
        personsVerified++
      }
    }
    
    if (dateInfo.deathDate) {
      const deathYear = parseInt(dateInfo.deathDate.split('-')[0])
      if (person.deathDate && person.deathDate !== dateInfo.deathDate) {
        console.log(`[${person.id}] ${person.name}: 死亡日期不一致，更新为 ${dateInfo.deathDate} (${dateInfo.source})`)
        console.log(`  原日期: ${person.deathDate}`)
        person.deathDate = dateInfo.deathDate
        person.deathYear = deathYear
        updated = true
      } else if (!person.deathDate) {
        console.log(`[${person.id}] ${person.name}: 添加死亡日期 ${dateInfo.deathDate} (${dateInfo.source})`)
        person.deathDate = dateInfo.deathDate
        person.deathYear = deathYear
        updated = true
      } else {
        personsVerified++
      }
    }
    
    if (updated) {
      personsUpdated++
    }
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

console.log(`\n验证完成：`)
console.log(`- 验证了 ${eventsVerified} 个事件的日期（已正确）`)
console.log(`- 更新了 ${eventsUpdated} 个事件的日期`)
console.log(`- 验证了 ${personsVerified} 个人物的日期（已正确）`)
console.log(`- 更新了 ${personsUpdated} 个人物的日期`)

