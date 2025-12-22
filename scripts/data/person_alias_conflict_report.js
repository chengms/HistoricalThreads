/**
 * 扫描人物别名冲突/重复建档（不写入原始数据）：
 * - 若某个 alias（name 或 nameVariants）同时属于多个 personId，则视为冲突
 *
 * 输出：
 * - scripts/reports/person_alias_conflicts.json
 *
 * 用法（仓库根目录）：
 *   node scripts/data/person_alias_conflict_report.js
 */

const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'frontend', 'public', 'data')
const REPORT_DIR = path.join(ROOT, 'scripts', 'reports')

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function saveJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}

function normToken(s) {
  return String(s || '').trim()
}

function main() {
  const persons = readJSON(path.join(DATA_DIR, 'persons.json'))

  const aliasToPersonIds = new Map() // alias -> Set<id>
  const personBrief = new Map() // id -> {id,name,dynastyId}

  for (const p of persons) {
    if (!p || typeof p.id !== 'number') continue
    const name = normToken(p.name)
    personBrief.set(p.id, { id: p.id, name, dynastyId: p.dynastyId ?? null })

    const tokens = []
    if (name) tokens.push(name)
    if (Array.isArray(p.nameVariants)) {
      for (const v of p.nameVariants) {
        const t = normToken(v)
        if (t) tokens.push(t)
      }
    }

    for (const t of tokens) {
      const set = aliasToPersonIds.get(t) || new Set()
      set.add(p.id)
      aliasToPersonIds.set(t, set)
    }
  }

  const conflicts = []
  for (const [alias, ids] of aliasToPersonIds.entries()) {
    if (ids.size <= 1) continue
    const list = [...ids].map(id => personBrief.get(id) || { id, name: '', dynastyId: null })
    conflicts.push({ alias, personCount: ids.size, persons: list })
  }

  conflicts.sort((a, b) => {
    if (b.personCount !== a.personCount) return b.personCount - a.personCount
    return String(a.alias).localeCompare(String(b.alias), 'zh-Hans-CN')
  })

  ensureDir(REPORT_DIR)
  const outPath = path.join(REPORT_DIR, 'person_alias_conflicts.json')
  saveJSON(outPath, {
    generatedAt: new Date().toISOString(),
    totalPersons: persons.length,
    conflictAliases: conflicts.length,
    items: conflicts,
  })

  console.log('[person_alias_conflict_report] done', {
    report: outPath,
    conflictAliases: conflicts.length,
  })
}

main()


