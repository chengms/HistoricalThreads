import { useEffect, useRef, useState } from 'react'
import { Card, Select, Input, Space, Typography, Spin, message } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { Network } from 'vis-network/standalone'
import { DataSet } from 'vis-data/standalone'
import 'vis-network/styles/vis-network.min.css'
import '@/styles/network.css'
import { loadPersons, loadRelationships, loadDynasties, searchPersons } from '@/services/dataLoader'
import type { Person, Relationship } from '@/types'

const { Title } = Typography

function getDynastyColor(dynastyKey: number): { background: string; border: string } {
  // dynastyKey=0 for unknown. Use stable HSL mapping for deterministic colors.
  if (dynastyKey === 0) return { background: '#F3F4F6', border: '#9CA3AF' }
  const hue = (dynastyKey * 47) % 360
  const background = `hsl(${hue} 70% 88%)`
  const border = `hsl(${hue} 70% 42%)`
  return { background, border }
}

type DynastyCircleInfo = {
  dynastyKey: number
  label: string
  x: number
  y: number
  radius: number
  color: { background: string; border: string }
}

function goldenAngleSpiralPoints(n: number, radius: number): Array<{ x: number; y: number }> {
  // Vogel spiral to fill a disk evenly.
  const pts: Array<{ x: number; y: number }> = []
  if (n <= 0) return pts
  const ga = Math.PI * (3 - Math.sqrt(5)) // ~2.399...
  for (let k = 0; k < n; k++) {
    const r = radius * Math.sqrt((k + 0.5) / n)
    const t = k * ga
    pts.push({ x: r * Math.cos(t), y: r * Math.sin(t) })
  }
  return pts
}

type PackedCircle = { id: number; r: number; x: number; y: number }

function circlesOverlap(a: PackedCircle, b: PackedCircle, gap: number): boolean {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const minDist = a.r + b.r + gap
  return dx * dx + dy * dy < minDist * minDist
}

function packCircles(keys: number[], radiiByKey: Map<number, number>, gap: number): Map<number, { x: number; y: number }> {
  // Simple greedy packing: place circles one by one near existing circles, choosing a non-overlapping candidate
  // that minimizes bounding-box area (keeps the cluster compact). N is small so brute-force candidates is fine.
  const items = [...keys].map(k => ({ id: k, r: radiiByKey.get(k) || 260 }))
  // place larger circles first for better packing
  items.sort((a, b) => b.r - a.r)

  const placed: PackedCircle[] = []
  const posById = new Map<number, { x: number; y: number }>()

  const evalBBoxArea = (circles: PackedCircle[]): number => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const c of circles) {
      minX = Math.min(minX, c.x - c.r)
      maxX = Math.max(maxX, c.x + c.r)
      minY = Math.min(minY, c.y - c.r)
      maxY = Math.max(maxY, c.y + c.r)
    }
    return (maxX - minX) * (maxY - minY)
  }

  for (const item of items) {
    if (placed.length === 0) {
      const c: PackedCircle = { id: item.id, r: item.r, x: 0, y: 0 }
      placed.push(c)
      posById.set(item.id, { x: 0, y: 0 })
      continue
    }

    const candidates: Array<{ x: number; y: number }> = []

    // candidate positions around each placed circle
    for (const p of placed) {
      const dist = p.r + item.r + gap
      const steps = 24
      for (let i = 0; i < steps; i++) {
        const t = (2 * Math.PI * i) / steps
        candidates.push({ x: p.x + dist * Math.cos(t), y: p.y + dist * Math.sin(t) })
      }
    }

    // also try a few spiral points around origin as fallback
    for (let i = 0; i < 80; i++) {
      const t = i * (Math.PI * (3 - Math.sqrt(5)))
      const rr = 80 * Math.sqrt(i + 1)
      candidates.push({ x: rr * Math.cos(t), y: rr * Math.sin(t) })
    }

    let best: PackedCircle | null = null
    let bestScore = Infinity

    for (const cand of candidates) {
      const c: PackedCircle = { id: item.id, r: item.r, x: cand.x, y: cand.y }
      let ok = true
      for (const p of placed) {
        if (circlesOverlap(c, p, gap)) {
          ok = false
          break
        }
      }
      if (!ok) continue

      const area = evalBBoxArea([...placed, c])
      const centerDist = c.x * c.x + c.y * c.y
      const score = area * 1e-6 + centerDist // keep compact then near origin
      if (score < bestScore) {
        bestScore = score
        best = c
      }
    }

    // if somehow no candidate fits, push it far to the right (should be rare for small N)
    if (!best) {
      const right = Math.max(...placed.map(p => p.x + p.r)) + item.r + gap
      best = { id: item.id, r: item.r, x: right, y: 0 }
    }

    placed.push(best)
    posById.set(item.id, { x: best.x, y: best.y })
  }

  // restore mapping for all keys (including 0 if present)
  const out = new Map<number, { x: number; y: number }>()
  for (const k of keys) {
    out.set(k, posById.get(k) || { x: 0, y: 0 })
  }
  return out
}

export default function NetworkPage() {
  const navigate = useNavigate()
  const networkRef = useRef<HTMLDivElement>(null)
  const networkInstanceRef = useRef<Network | null>(null)
  const dynastyCirclesRef = useRef<DynastyCircleInfo[]>([])
  const dynastyCircleByKeyRef = useRef<Map<number, DynastyCircleInfo>>(new Map())
  const personDynastyKeyRef = useRef<Map<number, number>>(new Map())
  const transitionPersonIdsRef = useRef<Set<number>>(new Set())
  const [dynasty, setDynasty] = useState<string>('all')
  const [searchText, setSearchText] = useState<string>('')
  const [persons, setPersons] = useState<Person[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [dynasties, setDynasties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 加载数据
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [personsData, relationshipsData, dynastiesData] = await Promise.all([
          loadPersons(),
          loadRelationships(),
          loadDynasties(),
        ])
        setPersons(personsData)
        setRelationships(relationshipsData)
        setDynasties(dynastiesData)
      } catch (error) {
        console.error('加载数据失败:', error)
        message.error('加载数据失败，请刷新页面重试')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // 筛选和搜索
  useEffect(() => {
    async function filterData() {
      let filteredPersons = await loadPersons()
      
      if (dynasty !== 'all') {
        filteredPersons = filteredPersons.filter(p => p.dynastyId === Number(dynasty))
      }
      
      if (searchText) {
        const searched = await searchPersons(searchText)
        filteredPersons = searched.filter(p => 
          dynasty === 'all' || p.dynastyId === Number(dynasty)
        )
      }
      
      setPersons(filteredPersons)
      
      // 筛选相关关系
      const allRelationships = await loadRelationships()
      const personIds = new Set(filteredPersons.map(p => p.id))
      const filteredRelationships = allRelationships.filter(r => 
        personIds.has(r.fromPersonId) && personIds.has(r.toPersonId)
      )
      setRelationships(filteredRelationships)
    }
    filterData()
  }, [dynasty, searchText])

  // 更新网络图
  useEffect(() => {
    if (!networkRef.current || loading || !persons.length) return

    const nodeMap = new Map(persons.map(p => [p.id, p]))
    const relationshipMap = new Map<string, Relationship>()
    const dynastyNameById = new Map<number, string>(
      (dynasties || []).map((d: any) => [Number(d.id), String(d.name)])
    )
    const dynastyStartById = new Map<number, number>(
      (dynasties || []).map((d: any) => [Number(d.id), Number(d.startYear ?? 0)])
    )
    const personDynastyKeyById = new Map<number, number>()
    persons.forEach(p => {
      const dk = typeof p.dynastyId === 'number' ? p.dynastyId : 0
      personDynastyKeyById.set(p.id, dk)
    })
    personDynastyKeyRef.current = personDynastyKeyById
    
    relationships.forEach(rel => {
      const key = `${rel.fromPersonId}-${rel.toPersonId}`
      if (!relationshipMap.has(key) && nodeMap.has(rel.fromPersonId) && nodeMap.has(rel.toPersonId)) {
        relationshipMap.set(key, rel)
      }
    })

    // Dynasty clustering:
    // - Create a fixed "anchor" node per dynasty, laid out on a big circle.
    // - Add hidden physics edges from each person to their dynasty anchor,
    //   so same-dynasty people are attracted and visually cluster together.
    const dynastyKeys = Array.from(
      new Set(persons.map(p => (typeof p.dynastyId === 'number' ? p.dynastyId : 0)))
    ).sort((a, b) => {
      // prefer chronological order if available
      if (a === 0) return 1
      if (b === 0) return -1
      const sa = dynastyStartById.get(a) ?? 0
      const sb = dynastyStartById.get(b) ?? 0
      if (sa !== sb) return sa - sb
      return a - b
    })

    const anchorPosByDynasty = new Map<number, { x: number; y: number }>()

    // Ring layout inside each dynasty:
    // - Pre-group persons by dynasty
    // - Assign initial x/y on a small circle around the dynasty anchor
    const personsByDynasty = new Map<number, Person[]>()
    for (const p of persons) {
      const dk = typeof p.dynastyId === 'number' ? p.dynastyId : 0
      const arr = personsByDynasty.get(dk) || []
      arr.push(p)
      personsByDynasty.set(dk, arr)
    }

    const ringRadiusByDynasty = new Map<number, number>() // "boundary ring" for transition people (near circle border)
    const circleRadiusByDynasty = new Map<number, number>() // visible dynasty circle radius
    const indexByPersonId = new Map<number, number>()
    const countByDynasty = new Map<number, number>()
    for (const [dk, list] of personsByDynasty.entries()) {
      const sorted = [...list].sort((a, b) => (a.id || 0) - (b.id || 0))
      const n = Math.max(1, sorted.length)
      countByDynasty.set(dk, n)
      sorted.forEach((p, idx) => indexByPersonId.set(p.id, idx))
      // Circle radius should visibly scale with count.
      // Use sub-linear scaling to keep layout readable while still showing differences.
      // Clamp avoids circles becoming too tiny/huge.
      const circleR = Math.min(560, Math.max(170, Math.round(140 + 34 * Math.pow(n, 0.85))))
      circleRadiusByDynasty.set(dk, circleR)
      ringRadiusByDynasty.set(dk, Math.max(110, circleR - 55))
    }

    // Pack dynasty circles tightly (no big empty hole). Circles can be almost touching.
    const CIRCLE_GAP = 6
    const packed = packCircles(dynastyKeys, circleRadiusByDynasty, CIRCLE_GAP)
    for (const dk of dynastyKeys) {
      anchorPosByDynasty.set(dk, packed.get(dk) || { x: 0, y: 0 })
    }

    // Determine "transition" persons: have relationships to other dynasties (in original rel set).
    const transitionPersonIds = new Set<number>()
    for (const rel of relationships) {
      const a = rel.fromPersonId
      const b = rel.toPersonId
      const da = personDynastyKeyById.get(a) ?? 0
      const db = personDynastyKeyById.get(b) ?? 0
      if (da !== db) {
        transitionPersonIds.add(a)
        transitionPersonIds.add(b)
      }
    }
    transitionPersonIdsRef.current = transitionPersonIds

    const personNodes = persons.map(person => {
      const dynastyKey = typeof person.dynastyId === 'number' ? person.dynastyId : 0
      const dynastyName = dynastyKey === 0 ? '未知朝代' : (dynastyNameById.get(dynastyKey) || `朝代 ${dynastyKey}`)
      const color = getDynastyColor(dynastyKey)

      const idx = indexByPersonId.get(person.id) ?? 0
      const n = countByDynasty.get(dynastyKey) ?? 1
      const anchorPos = anchorPosByDynasty.get(dynastyKey) || { x: 0, y: 0 }
      const circleR = circleRadiusByDynasty.get(dynastyKey) || 260

      // Place transition people on the boundary ring; others inside the circle.
      const isTransition = transitionPersonIds.has(person.id)
      const angle = (2 * Math.PI * (idx < 0 ? 0 : idx)) / n
      let x = anchorPos.x
      let y = anchorPos.y

      if (isTransition) {
        const r = ringRadiusByDynasty.get(dynastyKey) || Math.max(110, circleR - 55)
        x = anchorPos.x + r * Math.cos(angle)
        y = anchorPos.y + r * Math.sin(angle)
      } else {
        // Fill disk inside (leave margin to avoid crossing boundary)
        const innerR = Math.max(90, circleR - 140)
        // deterministic spiral point using idx
        const pts = goldenAngleSpiralPoints(n, innerR)
        const p = pts[idx % pts.length] || { x: 0, y: 0 }
        x = anchorPos.x + p.x
        y = anchorPos.y + p.y
      }

      return {
        id: person.id,
        label: person.name,
        // keep original "group" as personType for potential future styling
        group: person.personType?.[0] || 'other',
        // fixed layout within dynasty circle (keeps nodes inside)
        x,
        y,
        physics: false,
        color: {
          background: color.background,
          border: color.border,
          highlight: { background: color.background, border: color.border },
        },
        borderWidth: 2,
        title: `${person.name}\n朝代：${dynastyName}\n${(person.biography || '').substring(0, 120)}...`,
      }
    })

    // Do NOT render dynasty anchor nodes (they looked like stray tags inside big empty space).
    const nodes = new DataSet([...personNodes])

    // Only show relationships inside the same dynasty circle
    const edgesData = Array.from(relationshipMap.values()).flatMap(rel => {
      const fromDk = personDynastyKeyById.get(rel.fromPersonId) ?? 0
      const toDk = personDynastyKeyById.get(rel.toPersonId) ?? 0
      if (fromDk !== toDk) return []
      return [{
      id: `${rel.fromPersonId}-${rel.toPersonId}`,
      from: rel.fromPersonId,
      to: rel.toPersonId,
      label: getRelationshipLabel(rel.relationshipType),
      color: { color: getRelationshipColor(rel.relationshipType) },
      }]
    })

    const edges = new DataSet([...edgesData])

    // Prepare dynasty boundary circles for background drawing
    dynastyCirclesRef.current = dynastyKeys.map(dk => {
      const anchorPos = anchorPosByDynasty.get(dk) || { x: 0, y: 0 }
      const radius = circleRadiusByDynasty.get(dk) || 260
      const label = dk === 0 ? '未知朝代' : (dynastyNameById.get(dk) || `朝代 ${dk}`)
      return {
        dynastyKey: dk,
        label,
        x: anchorPos.x,
        y: anchorPos.y,
        radius,
        color: getDynastyColor(dk),
      }
    })
    dynastyCircleByKeyRef.current = new Map(dynastyCirclesRef.current.map(c => [c.dynastyKey, c]))

    if (networkInstanceRef.current) {
      networkInstanceRef.current.setData({ nodes, edges })
    } else {
      const network = new Network(
        networkRef.current,
        { nodes, edges },
        {
          nodes: {
            // 'dot' 的 label 默认在节点外；用 'circle' 让人名显示在小圆内
            shape: 'circle',
            size: 34,
            font: {
              size: 14,
              color: '#111827',
              align: 'center',
              vadjust: 0,
            },
          },
          edges: {
            width: 2,
            arrows: {
              to: {
                enabled: true,
                scaleFactor: 0.5,
              },
            },
            font: {
              size: 12,
              align: 'middle',
            },
          },
          physics: {
            enabled: true,
            solver: 'forceAtlas2Based',
            forceAtlas2Based: {
              gravitationalConstant: -50,
              centralGravity: 0.01,
              springLength: 140,
              springConstant: 0.08,
              damping: 0.6,
            },
            stabilization: {
              iterations: 200,
            },
          },
          interaction: {
            hover: true,
            tooltipDelay: 200,
          },
        }
      )

      // Draw dynasty boundary circles behind the network
      network.on('beforeDrawing', (ctx: CanvasRenderingContext2D) => {
        const circles = dynastyCirclesRef.current
        if (!circles || circles.length === 0) return

        for (const c of circles) {
          ctx.save()
          ctx.beginPath()
          ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255,255,255,0.28)'
          ctx.fill()
          ctx.lineWidth = 2
          ctx.strokeStyle = c.color.border
          ctx.stroke()

          // label near top of circle
          ctx.font = 'bold 16px Microsoft YaHei'
          ctx.fillStyle = '#111827'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(c.label, c.x, c.y - c.radius + 22)
          ctx.restore()
        }
      })
      
      // 添加点击事件，跳转到详情页
      network.on('click', (params: any) => {
        if (params.nodes && params.nodes.length > 0) {
          const personId = params.nodes[0]
          navigate(`/detail/person/${personId}`)
        }
      })

      // Constrain dragging: keep person nodes inside their dynasty circle.
      const clampToCircle = (x: number, y: number, cx: number, cy: number, r: number) => {
        const dx = x - cx
        const dy = y - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist <= r || dist === 0) return { x, y }
        const s = r / dist
        return { x: cx + dx * s, y: cy + dy * s }
      }

      network.on('dragging', (params: any) => {
        const ids: number[] = (params.nodes || []).filter((id: any) => typeof id === 'number')
        if (!ids.length) return
        const positions = network.getPositions(ids)
        for (const id of ids) {
          const dynastyKey = personDynastyKeyRef.current.get(id) ?? 0
          const circle = dynastyCircleByKeyRef.current.get(dynastyKey)
          if (!circle) continue
          const pos = positions[id]
          if (!pos) continue

          // allow transition people to touch border, others stay slightly inside
          const isTransition = transitionPersonIdsRef.current.has(id)
          const margin = isTransition ? 10 : 40
          const limitR = Math.max(30, circle.radius - margin)
          const clamped = clampToCircle(pos.x, pos.y, circle.x, circle.y, limitR)
          if (clamped.x !== pos.x || clamped.y !== pos.y) {
            network.moveNode(id, clamped.x, clamped.y)
          }
        }
      })

      // Ensure final position is ALWAYS inside the circle (hard constraint).
      network.on('dragEnd', (params: any) => {
        const ids: number[] = (params.nodes || []).filter((id: any) => typeof id === 'number')
        if (!ids.length) return

        const positions = network.getPositions(ids)
        const updates: any[] = []

        for (const id of ids) {
          const dynastyKey = personDynastyKeyRef.current.get(id) ?? 0
          const circle = dynastyCircleByKeyRef.current.get(dynastyKey)
          if (!circle) continue
          const pos = positions[id]
          if (!pos) continue

          const isTransition = transitionPersonIdsRef.current.has(id)
          const margin = isTransition ? 10 : 40
          const limitR = Math.max(30, circle.radius - margin)
          const clamped = clampToCircle(pos.x, pos.y, circle.x, circle.y, limitR)

          if (clamped.x !== pos.x || clamped.y !== pos.y) {
            network.moveNode(id, clamped.x, clamped.y)
            updates.push({ id, x: clamped.x, y: clamped.y })
          }
        }

        // Persist clamped positions so next interactions start inside the boundary.
        try {
          if (updates.length) {
            // @ts-expect-error vis-network internal data set
            network.body?.data?.nodes?.update?.(updates)
          }
        } catch {
          // ignore
        }
      })
      
      networkInstanceRef.current = network
    }
  }, [persons, relationships, dynasties, loading])

  const getRelationshipLabel = (type: string): string => {
    const labels: Record<string, string> = {
      teacher_student: '师生',
      colleague: '同僚',
      enemy: '敌对',
      family: '家族',
      friend: '朋友',
      mentor: '导师',
      influence: '影响',
      cooperation: '合作',
    }
    return labels[type] || type
  }

  const getRelationshipColor = (type: string): string => {
    const colors: Record<string, string> = {
      teacher_student: '#2B7CE9',
      colleague: '#97C2FC',
      enemy: '#FF6B6B',
      family: '#4ECDC4',
      friend: '#95E1D3',
      mentor: '#F38181',
      influence: '#848484',
      cooperation: '#FFA07A',
    }
    return colors[type] || '#848484'
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-6">
        <Spin size="large" className="w-full flex justify-center items-center" style={{ minHeight: '700px' }} />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-6">
      <Title level={2} className="mb-6">关系图谱</Title>

      <Card className="mb-6">
        <Space size="large" wrap>
          <Select
            style={{ width: 150 }}
            value={dynasty}
            onChange={setDynasty}
            options={[
              { label: '全部朝代', value: 'all' },
              ...dynasties.map(d => ({ label: d.name, value: d.id.toString() })),
            ]}
          />
          <Input
            placeholder="搜索人物..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Space>
      </Card>

      <Card>
        <div ref={networkRef} style={{ height: '700px' }} />
      </Card>
    </div>
  )
}

