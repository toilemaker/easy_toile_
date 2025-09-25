'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowLeft, Download, RotateCcw, Settings2, ExternalLink, Filter, Search } from 'lucide-react'
import * as d3 from 'd3'
import EChartsVisualization from './EChartsVisualization'
import GoJSVisualization from './GoJSVisualization'
import AmChartsVisualization from './AmChartsVisualization'
import AmChartsHierarchyVisualization from './AmChartsHierarchyVisualization'
import JointJSVisualization from './JointJSVisualization'

interface VisualizationScreenProps {
  data: any
  onBack: () => void
  onExport: (data: any) => void
}

export default function VisualizationScreen({ data, onBack, onExport }: VisualizationScreenProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [simulation, setSimulation] = useState<d3.Simulation<any, any> | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [activeFilters, setActiveFilters] = useState<{[key: string]: string}>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredData, setFilteredData] = useState<{
    nodes: any[]
    links: any[]
  }>({
    nodes: [],
    links: []
  })

  // Fonction pour obtenir les valeurs uniques d'une colonne selon la cible
  const getUniqueValuesForFilter = (column: string, target: 'nodes' | 'links') => {
    if (target === 'nodes' && data.processedNodes) {
      const values = data.processedNodes.map((node: any) => node[column]).filter(Boolean)
      return Array.from(new Set(values)).sort()
    } else if (target === 'links' && data.processedLinks) {
      const values = data.processedLinks.map((link: any) => link[column]).filter(Boolean)
      return Array.from(new Set(values)).sort()
    }
    return []
  }

  // Fonction pour appliquer les filtres et la recherche
  const applyFilters = useCallback(() => {
    let filteredNodes = data.processedNodes || []
    let filteredLinks = data.processedLinks || []

    // Appliquer la recherche textuelle
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      filteredNodes = filteredNodes.filter((node: any) => {
        // Rechercher dans toutes les propriétés du nœud
        return Object.values(node).some((value: any) => 
          String(value).toLowerCase().includes(searchLower)
        )
      })
    }

    // Vérifier s'il y a des filtres actifs
    const hasActiveFilters = Object.values(activeFilters).some(value => value && value !== '')

    if (hasActiveFilters) {
      // Appliquer les filtres actifs
      Object.entries(activeFilters).forEach(([filterId, selectedValue]) => {
        if (selectedValue && selectedValue !== '') {
          const filter = data.filters?.find((f: any) => f.id === filterId)
          if (filter && filter.type === 'qualitative') {
            if (filter.target === 'nodes') {
              filteredNodes = filteredNodes.filter((node: any) => 
                node[filter.column] === selectedValue
              )
            } else if (filter.target === 'links') {
              filteredLinks = filteredLinks.filter((link: any) => 
                link[filter.column] === selectedValue
              )
            }
          }
        }
      })
    }

    // Filtrer les liens pour ne garder que ceux connectés aux nœuds visibles
    const nodeIds = new Set(filteredNodes.map((node: any) => node.id))
    filteredLinks = filteredLinks.filter((link: any) => 
      nodeIds.has(link.source) && nodeIds.has(link.target)
    )

    setFilteredData({ nodes: filteredNodes, links: filteredLinks })
  }, [data.processedNodes, data.processedLinks, data.filters, activeFilters, searchTerm])

  // Effet pour initialiser les données filtrées au premier chargement
  useEffect(() => {
    setFilteredData({
      nodes: data.processedNodes || [],
      links: data.processedLinks || []
    })
  }, [data.processedNodes, data.processedLinks])

  // Effet pour appliquer les filtres quand ils changent
  useEffect(() => {
    if (Object.keys(activeFilters).length > 0) {
      applyFilters()
    }
  }, [activeFilters, applyFilters])

  // Fonction pour gérer le changement de filtre
  const handleFilterChange = (filterId: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterId]: value
    }))
  }

  // Paramètres du logo
  const logoWidth = 18  // en unités Tailwind (w-16 = 64px)
  const logoHeight = 16 // en unités Tailwind (h-16 = 64px)

  useEffect(() => {
    if (!svgRef.current || !filteredData.nodes || !filteredData.links) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = 800
    const height = 600
    const margin = { top: 20, right: 20, bottom: 20, left: 20 }

    // Configuration du zoom pour D3.js uniquement
    if (data.visualizationLib === 'd3js') {
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          container.attr('transform', event.transform)
          setZoomLevel(event.transform.k)
          setTranslateX(event.transform.x)
          setTranslateY(event.transform.y)
        })

      svg.call(zoom)
    }

    // Ajout d'un gestionnaire de clic sur le background pour désélectionner
    svg.on('click', (event) => {
      // Vérifier si le clic n'est pas sur un nœud ou un lien
      const target = event.target
      if (!target.closest('circle') && !target.closest('path')) {
        setSelectedNode(null)
      }
    })

    const container = svg.append('g')

    // Définition des marqueurs de flèche pour le milieu
    const defs = svg.append('defs')
    
    defs.append('marker')
      .attr('id', 'arrowhead-mid')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 5)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#666')
      .style('stroke', 'none')

    // Création de la simulation de force avec les données filtrées
    const sim = d3.forceSimulation(filteredData.nodes as any)
      .force('link', d3.forceLink(filteredData.links as any).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.size + 5))

    setSimulation(sim as any)

    // Création des liens avec données filtrées (courbes sans flèches)
    const links = container.append('g')
      .selectAll('path')
      .data(filteredData.links)
      .enter()
      .append('path')
      .attr('stroke', (d: any) => d.color)
      .attr('stroke-width', (d: any) => Math.sqrt(d.weight) * 2)
      .attr('stroke-opacity', 0.6)
      .attr('fill', 'none')

    // Création des flèches au milieu des liens
    const arrows = container.append('g')
      .selectAll('path')
      .data(filteredData.links)
      .enter()
      .append('path')
      .attr('d', 'M 0,-3 L 6,0 L 0,3 Z')
      .attr('fill', (d: any) => d.color)
      .attr('opacity', 0.8)

    // Création des nœuds avec données filtrées
    const nodes = container.append('g')
      .selectAll('circle')
      .data(filteredData.nodes)
      .enter()
      .append('circle')
      .attr('r', (d: any) => d.size)
      .attr('fill', (d: any) => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .call(d3.drag<SVGCircleElement, any>()
        .on('start', (event, d: any) => {
          if (!event.active) sim.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d: any) => {
          if (!event.active) sim.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
      )
      .on('click', (event, d: any) => {
        event.stopPropagation()
        setSelectedNode(d)
      })

    // Ajout des labels avec données filtrées
    const labels = container.append('g')
      .selectAll('text')
      .data(filteredData.nodes)
      .enter()
      .append('text')
      .text((d: any) => d.label)
      .attr('font-size', 12)
      .attr('font-family', 'var(--font-jetbrains-mono), JetBrains Mono, monospace')
      .attr('text-anchor', 'middle')
      .attr('dy', (d: any) => d.size + 15)
      .attr('fill', '#333')
      .style('pointer-events', 'none')

    // Fonction pour créer un chemin courbe bézier
    const createCurvedPath = (source: any, target: any) => {
      const dx = target.x - source.x
      const dy = target.y - source.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // Calculer les points de contrôle pour une courbe bézier plus naturelle
      const midX = (source.x + target.x) / 2
      const midY = (source.y + target.y) / 2
      
      // Offset perpendiculaire pour créer la courbure
      const perpX = -dy / distance
      const perpY = dx / distance
      const curvature = Math.min(distance * 0.15, 50) // Courbure plus subtile, max 50px
      
      const controlX = midX + perpX * curvature
      const controlY = midY + perpY * curvature
      
      return `M${source.x},${source.y}Q${controlX},${controlY} ${target.x},${target.y}`
    }

    // Fonction pour calculer la position et l'angle de la flèche au milieu du lien
    const getArrowTransform = (source: any, target: any) => {
      const dx = target.x - source.x
      const dy = target.y - source.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // Point milieu de la courbe bézier
      const midX = (source.x + target.x) / 2
      const midY = (source.y + target.y) / 2
      
      // Offset perpendiculaire pour la courbure
      const perpX = -dy / distance
      const perpY = dx / distance
      const curvature = Math.min(distance * 0.15, 50)
      
      const controlX = midX + perpX * curvature
      const controlY = midY + perpY * curvature
      
      // Position au milieu de la courbe (t=0.5 sur la courbe bézier)
      const t = 0.5
      const arrowX = (1-t)*(1-t)*source.x + 2*(1-t)*t*controlX + t*t*target.x
      const arrowY = (1-t)*(1-t)*source.y + 2*(1-t)*t*controlY + t*t*target.y
      
      // Calcul de l'angle de la tangente au point milieu
      const tangentX = 2*(1-t)*(controlX - source.x) + 2*t*(target.x - controlX)
      const tangentY = 2*(1-t)*(controlY - source.y) + 2*t*(target.y - controlY)
      const angle = Math.atan2(tangentY, tangentX) * 180 / Math.PI
      
      return `translate(${arrowX},${arrowY}) rotate(${angle})`
    }

    // Mise à jour des positions à chaque tick
    sim.on('tick', () => {
      links
        .attr('d', (d: any) => createCurvedPath(d.source, d.target))

      arrows
        .attr('transform', (d: any) => getArrowTransform(d.source, d.target))

      nodes
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y)

      labels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y)
    })

    return () => {
      sim.stop()
    }
  }, [filteredData])


  const handleReset = () => {
    // Réinitialiser le zoom pour D3.js
    if (data.visualizationLib === 'd3js' && svgRef.current) {
      d3.select(svgRef.current).transition().call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        d3.zoomIdentity
      )
    }
    // Réinitialiser les valeurs de transformation
    setZoomLevel(1)
    setTranslateX(0)
    setTranslateY(0)
    if (simulation) {
      simulation.alpha(1).restart()
    }
  }


  const handleExport = () => {
    const exportData = {
      ...data,
      metadata: {
        exportDate: new Date().toISOString(),
        nodeCount: data.processedNodes?.length || 0,
        linkCount: data.processedLinks?.length || 0
      }
    }
    onExport(exportData)
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-visible">

      {/* Menu latéral gauche */}
      <div className="w-64 bg-white relative z-10 flex flex-col" style={{ boxShadow: '4px 0 15px rgba(0, 0, 0, 0.1)' }}>
        <div className="flex-1 overflow-y-auto p-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-2"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className={`inline-flex items-center justify-center w-${logoWidth} h-${logoHeight}`}>
            <img 
              src="/images/logo.png" 
              alt="Logo Toile" 
              className={`w-${logoWidth} h-${logoHeight} object-contain`}
            />
          </div>
        </div>

        {/* Informations du projet */}
        {data.projectSettings && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">{data.projectSettings.title}</h2>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <span className="font-medium">Date:</span>
                <span className="ml-2">
                  {new Date(data.projectSettings.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </p>
              {data.projectSettings.tags.length > 0 && (
                <div>
                  <span className="font-medium">Tags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.projectSettings.tags.map((tag: string, index: number) => (
                      <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filtres */}
        {data.filters && data.filters.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtres
            </h3>
            <div className="space-y-4">
              {data.filters.map((filter: any) => (
                <div key={filter.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {filter.title}
                    </label>
                    <div className="text-xs text-gray-500 mb-2">
                      {filter.target === 'nodes' ? 'Entités' : 'Liens'} • {filter.type === 'qualitative' ? 'Qualitatif' : 'Quantitatif'} • {filter.column}
                    </div>
                  </div>
                  
                  {filter.type === 'qualitative' ? (
                    <select
                      className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
                      value={activeFilters[filter.id] || ''}
                      onChange={(e) => {
                        handleFilterChange(filter.id, e.target.value)
                      }}
                    >
                      <option value="">Toutes les valeurs</option>
                      {getUniqueValuesForFilter(filter.column, filter.target).map((value, index) => (
                        <option key={String(value)} value={String(value)}>
                          {String(value)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`filter-${filter.id}`}
                        checked={filter.enabled !== false}
                        onChange={(e) => {
                          // Logique pour filtres quantitatifs
                        }}
                        className="text-blue-600"
                      />
                      <label htmlFor={`filter-${filter.id}`} className="text-sm text-gray-700">
                        Activer le filtre
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Settings2 className="w-5 h-5 mr-2" />
              Contrôles
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter JSON
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Statistiques
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Nœuds:</span>
                <span className="font-medium">{filteredData.nodes?.length || 0} / {data.processedNodes?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Liens:</span>
                <span className="font-medium">{filteredData.links?.length || 0} / {data.processedLinks?.length || 0}</span>
              </div>
              {data.visualizationLib === 'd3js' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Zoom:</span>
                  <span className="font-medium">{Math.round(zoomLevel * 100)}%</span>
                </div>
              )}
            </div>
          </div>

        </div>
        </div>
      </div>

      {/* Zone centrale - Visualisation */}
      <div className="flex-1 bg-gray-100 relative flex flex-col overflow-visible">

        {/* Barre de recherche */}
        <div className="bg-white border-b border-gray-200 p-2 z-20 relative flex justify-end">
          <div className="max-w-md mr-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher dans les nœuds..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Zone de visualisation */}
        <div className="flex-1 relative overflow-visible">
        <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle,rgba(17, 18, 17, 0.65) 1px, transparent 1px)`,
              backgroundSize: data.visualizationLib === 'd3js' ? `${20 * zoomLevel}px ${20 * zoomLevel}px` : '20px 20px',
              backgroundPosition: data.visualizationLib === 'd3js' ? `${translateX}px ${translateY}px` : '0px 0px',
              opacity: 0.3,
              pointerEvents: 'none', // ⬅️ important
              transition: data.visualizationLib === 'd3js' ? 'background-size 0.1s ease-out, background-position 0.1s ease-out' : 'none'
            }}
          />

<div className="absolute inset-0 z-10">
    {data.visualizationLib === 'echarts' ? (
      <EChartsVisualization data={{...data, processedNodes: filteredData.nodes, processedLinks: filteredData.links}} />
    ) : data.visualizationLib === 'gojs' ? (
      <GoJSVisualization data={{processedNodes: filteredData.nodes, processedLinks: filteredData.links}} />
    ) : data.visualizationLib === 'amcharts' ? (
      <AmChartsVisualization data={{processedNodes: filteredData.nodes, processedLinks: filteredData.links}} />
    ) : data.visualizationLib === 'amcharts-hierarchy' ? (
      <AmChartsHierarchyVisualization data={{processedNodes: filteredData.nodes, processedLinks: filteredData.links}} />
    ) : data.visualizationLib === 'jointjs' ? (
      <JointJSVisualization data={{processedNodes: filteredData.nodes, processedLinks: filteredData.links}} />
    ) : (
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="bg-transparent relative w-full h-full" // z-10 non nécessaire (déjà dans wrapper)
      />
    )}
  </div>

          
        </div>
        
        {/* Card du nœud sélectionné en superposition */}
        {selectedNode && (
          <div className="absolute top-20 right-4 z-30 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200 p-4 min-w-64 max-w-80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">
                Nœud Sélectionné
              </h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">ID:</span>
                <div className="text-gray-600 mt-1 break-all">{selectedNode.id}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Label:</span>
                <div className="text-gray-600 mt-1">{selectedNode.label}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Taille:</span>
                <div className="text-gray-600 mt-1">{selectedNode.size}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Couleur:</span>
                <div className="flex items-center mt-1">
                  <div 
                    className="w-4 h-4 rounded mr-2 border border-gray-300"
                    style={{ backgroundColor: selectedNode.color }}
                  ></div>
                  <span className="text-gray-600">{selectedNode.color}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Pastille "Propulsé par" */}
        <div className="absolute bottom-4 right-4 z-20">
          <a
            href="https://github.com/your-repo/easy-toile"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 text-sm text-gray-600 hover:text-gray-800 hover:bg-white transition-all duration-200 hover:shadow-xl"
          >
            <span className="mr-2">Propulsé par</span>
            <span className="font-medium text-blue-600">Easy Toile</span>
            <ExternalLink className="w-3 h-3 ml-1 opacity-60" />
          </a>
        </div>
      </div>
    </div>
  )
}
