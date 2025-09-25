'use client'

import { useEffect, useRef } from 'react'
import * as am5 from '@amcharts/amcharts5'
import * as am5hierarchy from '@amcharts/amcharts5/hierarchy'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'

interface AmChartsHierarchyVisualizationProps {
  data: {
    processedNodes: any[]
    processedLinks: any[]
  }
}

export default function AmChartsHierarchyVisualization({ data }: AmChartsHierarchyVisualizationProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<am5.Root | null>(null)

  const CONFIG = {
    nodeColor: '#3498db',
    linkColor: '#95a5a6',
    maxDepth: 2,
    centerStrength: 1.0,
    manyBodyStrength: -6,
    nodeRadius: 40,            // 👈 rayon cible
  }

  useEffect(() => {
    if (!chartRef.current || !data?.processedNodes || !data?.processedLinks) return

    if (rootRef.current) {
      rootRef.current.dispose()
      rootRef.current = null
    }

    const root = am5.Root.new(chartRef.current)
    rootRef.current = root
    root.setThemes([am5themes_Animated.new(root)])

    // Container simple (pas de zoom)
    const container = root.container.children.push(
      am5.Container.new(root, {
        width: am5.percent(100),
        height: am5.percent(100),
        maskContent: false,
        interactive: true
      })
    )

    // Série
    const series = container.children.push(
      am5hierarchy.ForceDirected.new(root, {
        singleBranchOnly: false,
        downDepth: CONFIG.maxDepth,
        topDepth: 1,
        initialDepth: 1,
        valueField: 'value',
        categoryField: 'name',
        childDataField: 'children',
        idField: 'name',
        linkWithField: 'linkWith',
        manyBodyStrength: CONFIG.manyBodyStrength,
        centerStrength: CONFIG.centerStrength,
        nodePadding: 8,

        // 👇 Taille des cercles (fixe)
        minRadius: CONFIG.nodeRadius,
        maxRadius: CONFIG.nodeRadius
      })
    )

    // Styles
// Styles
series.get('colors')?.setAll({ step: 2 })
series.links.template.setAll({
  strength: 0.5,
  stroke: am5.color(CONFIG.linkColor),
  strokeWidth: 2
})
series.nodes.template.setAll({
  tooltipText: '{name}',
  cursorOverStyle: 'pointer'
})

// 👇 couleur + style direct sur le "background"
series.nodes.template.get("background")?.setAll({
  fill: am5.color(CONFIG.nodeColor),
  fillOpacity: 0.8,
  stroke: am5.color(CONFIG.nodeColor),
  strokeWidth: 1,
  strokeOpacity: 0.8
})

  

    // Données
    const prepareHierarchicalData = () => {
      const nodeMap = new Map<string, any>()

      data.processedNodes.forEach((node: any) => {
        nodeMap.set(node.id, { name: node.id, value: 1, children: [], isEntity: true })
      })

      data.processedLinks.forEach((link: any) => {
        if (!nodeMap.has(link.source)) nodeMap.set(link.source, { name: link.source, value: 1, children: [], isEntity: false })
        if (!nodeMap.has(link.target)) nodeMap.set(link.target, { name: link.target, value: 1, children: [], isEntity: false })
      })

      const childrenSet = new Set<string>()
      data.processedLinks.forEach((link: any) => {
        const parent = nodeMap.get(link.source)
        const child = nodeMap.get(link.target)
        if (parent && child) {
          if (!parent.children.find((c: any) => c.name === child.name)) {
            parent.children.push({ name: child.name, value: child.value, isEntity: child.isEntity })
          }
          childrenSet.add(link.target)
        }
      })

      const rootNodes = Array.from(nodeMap.values()).filter((n: any) => !childrenSet.has(n.name) && n.children.length > 0)

      if (rootNodes.length === 0) {
        return { name: 'Données', value: 0, children: Array.from(nodeMap.values()) }
      } else if (rootNodes.length === 1) {
        return rootNodes[0]
      } else {
        return { name: 'Graphe', value: 0, children: rootNodes }
      }
    }

    const chartData = prepareHierarchicalData()
    series.data.setAll([chartData])
    series.set('selectedDataItem', series.dataItems[0])
    series.appear(700, 70)

    return () => {
      if (rootRef.current) {
        rootRef.current.dispose()
        rootRef.current = null
      }
    }
  }, [data])

  return (
    <div className="w-full h-full relative overflow-visible">
      <div
        ref={chartRef}
        className="w-full h-full"
        style={{ minHeight: '550px' }}
      />
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3 text-xs text-gray-600 pointer-events-auto">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full" />
          <span>amCharts Hierarchy Layout</span>
        </div>
        <div className="mt-1">
          {data?.processedNodes?.length || 0} entités • {data?.processedLinks?.length || 0} liens
        </div>
        <div className="mt-1 text-xs text-gray-500">Zoom/Pan désactivés • Nœuds radius = {3}</div>
      </div>
    </div>
  )
}
