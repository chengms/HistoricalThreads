/**
 * 移除没有明确历史记录的事件日期
 * 只保留有明确历史记录的事件日期
 */

const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '../../frontend/public/data')
const eventsPath = path.join(dataDir, 'events.json')

const events = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'))

console.log('=== 移除不确定的事件日期 ===\n')

// 有明确历史记录的事件ID（这些日期是确定的）
const eventsWithCertainDates = new Set([
  20,  // 鸦片战争：1840-06-28，英国舰队封锁珠江口
  25,  // 甲午中日战争：1894-07-25，丰岛海战
  26,  // 戊戌变法：1898-06-11，光绪帝颁布《明定国是诏》
  27,  // 辛亥革命：1911-10-10，武昌起义
  28,  // 中华民国成立：1912-01-01，孙中山就任临时大总统
  29,  // 五四运动：1919-05-04
  30,  // 全面抗战爆发：1937-07-07，卢沟桥事变
  31,  // 抗日战争胜利：1945-08-15，日本宣布投降
  32,  // 中华人民共和国成立：1949-10-01，开国大典
  33,  // 抗美援朝：1950-10-19，志愿军入朝
  35,  // 中国加入WTO：2001-12-11
  45,  // 九一八事变：1931-09-18
  48,  // 解放战争开始：1946-06-26，全面内战爆发
  51,  // 《辛丑条约》签订：1901-09-07
  54,  // 第一届全国人民代表大会：1954-09-15
  50,  // 《马关条约》签订：1895-04-17
  49,  // 太平天国运动：1851-01-11，金田起义
  36,  // 第二次鸦片战争：1856-10-08，亚罗号事件
  40,  // 八国联军侵华：1900-06-17，大沽口之战
  44,  // 北伐战争：1926-07-09，国民革命军誓师北伐
  47,  // 西安事变：1936-12-12
  46,  // 一二九运动：1935-12-09
  55,  // 中国恢复联合国合法席位：1971-10-25
  56,  // 香港回归：1997-07-01
  57,  // 澳门回归：1999-12-20
  34,  // 改革开放：1978-12-18，十一届三中全会召开
])

// 需要移除日期的事件（历史记录不明确具体日期）
const eventsToRemoveDates = new Set([
  37,  // 洋务运动：开始时间不明确，总理衙门成立只是标志之一
  38,  // 中法战争：开始时间可能有争议
  39,  // 义和团运动：开始时间不明确
  41,  // 清末新政：开始时间可能有争议
  42,  // 护国运动：开始时间可能有争议
  43,  // 新文化运动：开始时间可能有争议，《青年杂志》创刊只是标志之一
  52,  // 土地改革：开始时间可能有争议，《土地改革法》颁布只是标志之一
  53,  // 三大改造：开始时间可能有争议，过渡时期总路线提出只是标志之一
])

let removedCount = 0

events.forEach(event => {
  // 如果事件有日期，但不在确定日期列表中，或者在需要移除列表中
  if (event.eventDate) {
    if (eventsToRemoveDates.has(event.id)) {
      console.log(`[${event.id}] ${event.title}: 移除不确定的日期 ${event.eventDate}`)
      delete event.eventDate
      delete event.eventMonth
      delete event.eventDay
      // 保留eventYear
      removedCount++
    } else if (!eventsWithCertainDates.has(event.id)) {
      // 如果不在确定列表中，也不在移除列表中，可能是新添加的，需要检查
      console.log(`[${event.id}] ${event.title}: 检查日期 ${event.eventDate}（不在确定列表中）`)
    }
  }
})

// 备份原文件
const eventsBackup = eventsPath + '.backup.' + Date.now()
fs.copyFileSync(eventsPath, eventsBackup)
console.log(`\n已备份原文件：${eventsBackup}`)

// 保存更新后的数据
fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2), 'utf-8')

console.log(`\n完成：`)
console.log(`- 移除了 ${removedCount} 个事件的日期（历史记录不明确）`)
console.log(`- 保留了 ${eventsWithCertainDates.size} 个事件的日期（有明确历史记录）`)

