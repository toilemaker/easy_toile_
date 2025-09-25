'use client'

import { useEffect, useRef, useState } from 'react'

interface EChartsVisualizationProps {
  data: any
}

export default function EChartsVisualization({ data }: EChartsVisualizationProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!chartRef.current || !data.processedNodes || !data.processedLinks) {
      setIsLoading(false)
      return
    }

    console.log('ECharts: Initializing with data:', { 
      nodes: data.processedNodes?.length, 
      links: data.processedLinks?.length,
      visualizationLib: data.visualizationLib 
    })

    setIsLoading(true)

    // Dynamic import of ECharts
    const initChart = async () => {
      try {
        const echarts = await import('echarts')
        console.log('ECharts: Library loaded successfully')
        
        // Initialize ECharts instance
        if (chartInstance.current) {
          chartInstance.current.dispose()
        }
        chartInstance.current = echarts.init(chartRef.current)
        console.log('ECharts: Instance created')

        // Transform data for ECharts format - ensure unique IDs and names
        const nodeIds = new Set()
        const nodeNames = new Set()
        const idMapping = new Map()
        
        const nodes = data.processedNodes.map((node: any, index: number) => {
          // Generate unique ID
          let uniqueId = node.id
          let idCounter = 1
          while (nodeIds.has(uniqueId)) {
            uniqueId = `${node.id}_${idCounter}`
            idCounter++
          }
          nodeIds.add(uniqueId)
          idMapping.set(node.id, uniqueId)
          
          // Generate unique name
          let uniqueName = node.label || uniqueId
          let nameCounter = 1
          while (nodeNames.has(uniqueName)) {
            uniqueName = `${node.label || uniqueId}_${nameCounter}`
            nameCounter++
          }
          nodeNames.add(uniqueName)
          
          return {
            id: uniqueId,
            name: uniqueName,
            symbolSize: Math.max(node.size * 2, 20),
            itemStyle: {
              color: node.color
            },
            label: {
              show: true,
              fontSize: 12
            },
            category: 0,
            x: Math.random() * 800,
            y: Math.random() * 600
          }
        })

        const links = data.processedLinks.map((link: any) => ({
          source: idMapping.get(link.source) || link.source,
          target: idMapping.get(link.target) || link.target,
          lineStyle: {
            color: link.color,
            width: Math.max(Math.sqrt(link.weight) * 2, 1)
          }
        }))

        console.log('ECharts: Transformed data:', { 
          nodesCount: nodes.length, 
          linksCount: links.length,
          sampleNode: nodes[0],
          sampleLink: links[0]
        })

        // ECharts graph configuration
        const option = {
          title: {
            text: data.projectSettings?.title || 'Visualisation de Graphe',
            left: 'center',
            textStyle: {
              fontSize: 18,
              fontWeight: 'bold'
            }
          },
          tooltip: {
            trigger: 'item',
            formatter: function (params: any) {
              if (params.dataType === 'node') {
                return `<strong>${params.data.name}</strong><br/>ID: ${params.data.id}<br/>Taille: ${Math.round(params.data.symbolSize / 2)}`
              } else if (params.dataType === 'edge') {
                return `${params.data.source} → ${params.data.target}<br/>Poids: ${Math.round(params.data.lineStyle.width / 2)}`
              }
              return ''
            }
          },
          animationDurationUpdate: 1500,
          animationEasingUpdate: 'quinticInOut',
          series: [
            {
              name: 'Graph',
              type: 'graph',
              layout: 'force',
              data: nodes,
              links: links,
              categories: [{ name: 'Nodes' }],
              roam: true,
              focusNodeAdjacency: true,
              draggable: true,
              symbolSize: 50,
              itemStyle: {
                borderColor: '#fff',
                borderWidth: 2,
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.3)'
              },
              label: {
                show: true,
                position: 'right',
                formatter: '{b}',
                fontSize: 12,
                fontWeight: 'bold'
              },
              lineStyle: {
                color: 'source',
                curveness: 0.1,
                opacity: 0.8
              },
              emphasis: {
                focus: 'adjacency',
                lineStyle: {
                  width: 8
                }
              },
              force: {
                repulsion: 1000,
                gravity: 0.1,
                edgeLength: 100,
                layoutAnimation: true,
                friction: 0.6
              },
              animation: true,
              animationDuration: 1000,
              animationEasing: 'cubicOut'
            }
          ]
        }

        // Set option and render
        chartInstance.current.setOption(option, true)
        console.log('ECharts: Chart rendered successfully')
        setIsLoading(false)

        // Handle resize
        const handleResize = () => {
          if (chartInstance.current) {
            chartInstance.current.resize()
          }
        }

        window.addEventListener('resize', handleResize)

        return () => {
          window.removeEventListener('resize', handleResize)
        }
      } catch (error) {
        console.error('Error loading ECharts:', error)
        setIsLoading(false)
      }
    }

    initChart()

    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [data])

  return (
    <div className="w-full h-full relative bg-white">
      <div 
        ref={chartRef} 
        className="w-full h-full min-h-[600px] relative z-10"
        style={{ 
          width: '100%', 
          height: '100vh',
          backgroundColor: '#ffffff'
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Chargement d'ECharts...</p>
          </div>
        </div>
      )}
      {!isLoading && !chartInstance.current && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 z-20">
          <div className="text-center">
            <p className="text-red-600">Erreur: ECharts n'a pas pu s'initialiser</p>
            <p className="text-sm text-gray-600 mt-2">Vérifiez la console pour plus de détails</p>
          </div>
        </div>
      )}
    </div>
  )
}
