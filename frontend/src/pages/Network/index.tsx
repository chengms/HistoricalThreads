import { useState, useEffect, useRef } from 'react'
import { Card, Select, Input, Space, Typography, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { Network } from 'vis-network/standalone'
import type { DataSet } from 'vis-data/standalone'
import 'vis-network/styles/vis-network.min.css'
import '@/styles/network.css'
import { loadPersons, loadRelationships, loadDynasties, searchPersons } from '@/services/dataLoader'
import type { Person, Relationship } from '@/types'

const { Title } = Typography

export default function NetworkPage() {
  const networkRef = useRef<HTMLDivElement>(null)
  const networkInstanceRef = useRef<Network | null>(null)
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
    
    relationships.forEach(rel => {
      const key = `${rel.fromPersonId}-${rel.toPersonId}`
      if (!relationshipMap.has(key) && nodeMap.has(rel.fromPersonId) && nodeMap.has(rel.toPersonId)) {
        relationshipMap.set(key, rel)
      }
    })

    const nodes = new DataSet(
      persons.map(person => ({
        id: person.id,
        label: person.name,
        group: person.personType[0] || 'other',
        title: `${person.name}\n${person.biography?.substring(0, 100)}...`,
      }))
    )

    const edges = new DataSet(
      Array.from(relationshipMap.values()).map(rel => ({
        from: rel.fromPersonId,
        to: rel.toPersonId,
        label: getRelationshipLabel(rel.relationshipType),
        color: { color: getRelationshipColor(rel.relationshipType) },
      }))
    )

    if (networkInstanceRef.current) {
      networkInstanceRef.current.setData({ nodes, edges })
    } else {
      const network = new Network(
        networkRef.current,
        { nodes, edges },
        {
          nodes: {
            shape: 'dot',
            size: 30,
            font: {
              size: 16,
              color: '#000',
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
      networkInstanceRef.current = network
    }
  }, [persons, relationships, loading])

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

