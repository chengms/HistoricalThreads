## 教材信息源（textbook sources）工作流

这个目录用于把“国内小学/初中/高中教材里出现过的历史事件、人物、文化名人”等内容，做成**可追溯的信息源体系**，并最终关联到项目的 `events.json / persons.json`。

### 目标
- **先有可引用的“教材书目 sources”**：把每一本教材/册别作为一个 `Source`（`sourceType = textbook`），包含出版社/ISBN/版次/学段/册别等字段。
- 后续再做“条目级别引用”：把事件/人物与某本教材的页码/章节对应起来（可以在 `events/persons` 的 `sources` 里引用该教材 Source 的 id）。

### 文件说明
- `textbook_sources_seed.json`：教材书目种子清单（你可以不断补全/追加）。
- `merge_textbook_sources.py`：把 seed 合并进 `frontend/public/data/sources.json`，自动分配 id、避免重复。

### 使用方法
在仓库根目录执行：

```bash
python scripts/textbooks/merge_textbook_sources.py
```

脚本会：
- 读取 `frontend/public/data/sources.json`
- 读取 `scripts/textbooks/textbook_sources_seed.json`
- 以（标题 + 出版社 + ISBN + 版次 + 学段/年级/册别/学科）作为去重依据
- 自动为新增条目分配递增 `id`
- 写回 `frontend/public/data/sources.json`

### 建议的“下一步”范围确认（你选一个更现实的起点）
- 只做**历史教材**：统编版义务教育《历史》（七/八/九年级上下册）+ 高中《中外历史纲要》（必修上下）等
- 还是连同**语文教材**一起做（会大幅增加“作家/诗人/文化名人”覆盖面）

### 条目级整理（把教材页码/章节映射到事件/人物）
如果你要把“教材里出现过的事件/人物”做成可追溯信息源，推荐用 `citations`（页码/章节）而不是只加一个 `sourceId`。

- 编辑 `mappings_template.json`，按条目逐条填写（ISBN 可不填）
- 运行脚本写回 `events.json / persons.json`：

```bash
python scripts/textbooks/apply_mappings.py
```

你也可以指定自定义映射文件（推荐按教材拆分多个文件）：

```bash
python scripts/textbooks/apply_mappings.py --mappings scripts/textbooks/mappings_grade7_up.json
```

只想验证匹配情况、不写入文件：

```bash
python scripts/textbooks/apply_mappings.py --mappings scripts/textbooks/mappings_grade7_up.json --dry-run
```

### 用 Excel 批量填写页码/章节（推荐）
映射 JSON 直接编辑也行，但更推荐用 CSV（Excel 友好）：

1) 导出 CSV（建议加 `--excel-bom`，避免 Excel 打开乱码）：

```bash
python scripts/textbooks/export_mappings_csv.py --in scripts/textbooks/mappings_grade7_up.json --out C:\Temp\mappings_grade7_up.csv --excel-bom
```

2) 用 Excel 打开 `mappings_grade7_up.csv`，主要填写：
- `chapter`（课题/单元/小栏目名）
- `page`（页码范围）
- `note`（可选备注）
- `verified`（可选：填 1/0 或 true/false）

3) 回写到 mappings JSON：

```bash
python scripts/textbooks/import_mappings_csv.py --mappings scripts/textbooks/mappings_grade7_up.json --csv C:\Temp\mappings_grade7_up.csv
```

4) dry-run 验证 + 正式写入 events/persons：

```bash
python scripts/textbooks/apply_mappings.py --mappings scripts/textbooks/mappings_grade7_up.json --dry-run
python scripts/textbooks/apply_mappings.py --mappings scripts/textbooks/mappings_grade7_up.json
```

### 校验 mappings 质量（推荐每次填完先跑）
在写入数据前先校验能避免很多低级错误（sourceTitle 写错/条目没匹配/重复行等）：

```bash
python scripts/textbooks/validate_mappings.py --mappings scripts/textbooks/mappings_grade7_up.json
```

默认情况下，如果某条映射的 `chapter/page/line/note` 都为空，脚本**不会写入 citations**（避免骨架文件产生大量空引用），但会维护 `sources` 的关联。
如果你确实希望“即使没页码也先生成 citations”，可以加：

```bash
python scripts/textbooks/apply_mappings.py --mappings scripts/textbooks/mappings_grade7_up.json --write-empty-citations
```

### 生成“七上/先秦~秦统一”映射骨架（推荐起点）
如果你想先快速得到一个可编辑的骨架文件（事件 + 相关人物，页码/章节留空），可以用下面脚本从当前数据集中生成：

```bash
python scripts/textbooks/generate_mappings_skeleton.py ^
  --preset grade7_up ^
  --out scripts/textbooks/mappings_grade7_up.json ^
  --include-persons
```

`--preset` 支持：
- `grade7_up` / `grade7_down`
- `grade8_up` / `grade8_down`
- `grade9_up` / `grade9_down`
- `hs_outline_up` / `hs_outline_down`

你也可以用 `--year-min/--year-max` 覆盖预设的默认范围。



