'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Upload, Download, Settings, Eye, Palette, Layers, Filter, Plus, X, Hash, Type } from 'lucide-react'

interface MappingScreenProps {
  data: any
  onComplete: (data: any) => void
  onBack: () => void
}

export default function MappingScreen({ data, onComplete, onBack }: MappingScreenProps) {
  // Paramètres du logo
  const logoWidth = 28  // en unités Tailwind
  const logoHeight = 18 // en unités Tailwind

  const [nodeMapping, setNodeMapping] = useState<Record<string, string>>({
    id: data.nodeMapping?.id || data.nodeColumns?.[0] || '',
    label: data.nodeMapping?.label || data.nodeColumns?.[1] || '',
    color: data.nodeMapping?.color || '',
    size: data.nodeMapping?.size || ''
  })
  
  const [selectedVisualizationLib, setSelectedVisualizationLib] = useState(data.visualizationLib || 'd3js')
  
  const [linkMapping, setLinkMapping] = useState<Record<string, string>>({
    source: data.linkMapping?.source || data.linkColumns?.[0] || '',
    target: data.linkMapping?.target || data.linkColumns?.[1] || '',
    weight: data.linkMapping?.weight || '',
    color: data.linkMapping?.color || ''
  })

  const [previewData, setPreviewData] = useState({
    nodes: data.nodes || [],
    links: data.links || []
  })

  // États pour les filtres
  const [filters, setFilters] = useState<Array<{
    id: string
    target: 'nodes' | 'links'
    type: 'qualitative' | 'quantitative'
    column: string
    title: string
    enabled?: boolean
  }>>(data.filters || []);

  // ✨ Effet pour synchroniser les états avec les données reçues
  useEffect(() => {
    if (data.nodeMapping) {
      setNodeMapping({
        id: data.nodeMapping.id || data.nodeColumns?.[0] || '',
        label: data.nodeMapping.label || data.nodeColumns?.[1] || '',
        color: data.nodeMapping.color || '',
        size: data.nodeMapping.size || ''
      })
    }
    
    if (data.linkMapping) {
      setLinkMapping({
        source: data.linkMapping.source || data.linkColumns?.[0] || '',
        target: data.linkMapping.target || data.linkColumns?.[1] || '',
        weight: data.linkMapping.weight || '',
        color: data.linkMapping.color || ''
      })
    }
    
    if (data.visualizationLib) {
      setSelectedVisualizationLib(data.visualizationLib)
    }
    
    if (data.filters) {
      setFilters(data.filters)
    }
  }, [data])

  // ✨ Debug: Afficher les données reçues
  useEffect(() => {
    console.log('=== MAPPING SCREEN - DONNÉES REÇUES ===')
    console.log('nodeMapping:', data.nodeMapping)
    console.log('linkMapping:', data.linkMapping)
    console.log('visualizationLib:', data.visualizationLib)
    console.log('filters:', data.filters)
  }, [data])

  // Cibles de filtres disponibles
  const filterTargets = [
    { value: 'nodes', label: 'Entités (Nœuds)' },
    { value: 'links', label: 'Liens' }
  ]

  // Types de filtres disponibles
  const filterTypes = [
    { value: 'qualitative', label: 'Qualitatif' },
    { value: 'quantitative', label: 'Quantitatif' }
  ]

  const handleNodeMappingChange = (property: string, column: string) => {
    setNodeMapping(prev => ({ ...prev, [property]: column }))
  }

  const handleLinkMappingChange = (property: string, column: string) => {
    setLinkMapping(prev => ({ ...prev, [property]: column }))
  }

  // Fonctions pour gérer les filtres
  const addFilter = () => {
    const newFilter = {
      id: Date.now().toString(),
      target: 'nodes' as const,
      type: 'qualitative' as const,
      column: data.nodeColumns?.[0] || '',
      title: 'Nouveau filtre',
      enabled: true
    }
    setFilters(prev => [...prev, newFilter])
  }

  const removeFilter = (filterId: string) => {
    setFilters(prev => prev.filter(f => f.id !== filterId))
  }

  const updateFilter = (filterId: string, updates: Partial<{
    target: 'nodes' | 'links'
    type: 'qualitative' | 'quantitative'
    column: string
    title: string
    enabled: boolean
  }>) => {
    setFilters(prev => prev.map(filter => 
      filter.id === filterId ? { ...filter, ...updates } : filter
    ))
  }

  // Obtenir les colonnes disponibles pour les filtres selon la cible
  const getAvailableColumns = (target: 'nodes' | 'links') => {
    if (target === 'nodes') {
      return data.nodeColumns || []
    } else {
      return data.linkColumns || []
    }
  }

  // Obtenir les valeurs uniques d'une colonne pour les filtres qualitatifs
  const getUniqueValues = (column: string) => {
    const allData = [...(data.nodes || []), ...(data.links || [])]
    const values = allData.map(item => item[column]).filter(Boolean)
    return Array.from(new Set(values)).sort()
  }

  const handleContinue = () => {
    const processedData = {
      ...data,
      nodeMapping,
      linkMapping,
      visualizationLib: selectedVisualizationLib,
      processedNodes: data.nodes?.map((node: any) => ({
        id: node[nodeMapping.id],
        label: node[nodeMapping.label] || node[nodeMapping.id],
        color: node[nodeMapping.color] || '#3b82f6',
        size: node[nodeMapping.size] ? parseFloat(node[nodeMapping.size]) : 10,
        originalData: node
      })),
      processedLinks: data.links?.map((link: any) => ({
        source: link[linkMapping.source],
        target: link[linkMapping.target],
        weight: link[linkMapping.weight] ? parseFloat(link[linkMapping.weight]) : 1,
        color: link[linkMapping.color] || '#6b7280',
        originalData: link
      })),
      filters
    }
    onComplete(processedData)
  }

  const canContinue = nodeMapping.id && nodeMapping.label && linkMapping.source && linkMapping.target

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Menu latéral gauche */}
      <div className="w-64 bg-white shadow-lg p-6">
        

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

        <div className="space-y-6">
        </div>
      </div>

      {/* Zone centrale - Aperçu des données */}
      <div className="flex-1 p-8">
        <div className="bg-white rounded-lg shadow-lg h-full p-6">
        <h1 className="text-3xl font-bold flex items-center mb-8 text-gray-800">
          3/3 - Mapping des Données & configuration de la visualisation
        </h1>
        
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Eye className="w-6 h-6 mr-2" />
            Aperçu des Données
          </h2>

          <div className="space-y-8">
            {/* Section Nœuds */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  Nœuds ({data.nodes?.length || 0} total)
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Liste des nœuds à gauche */}
                <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Liste des nœuds</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {previewData.nodes.map((node: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border text-sm">
                        <div className="font-medium text-blue-600">
                          ID: {nodeMapping.id ? node[nodeMapping.id] : 'Non défini'}
                        </div>
                        <div className="text-gray-600">
                          Label: {nodeMapping.label ? node[nodeMapping.label] : 'Non défini'}
                        </div>
                        {nodeMapping.color && (
                          <div className="text-gray-500">
                            Couleur: {node[nodeMapping.color]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Configuration des nœuds à droite */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Config. Nœuds
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Hash className="inline w-4 h-4 mr-1" />
                        ID (requis)
                      </label>
                      <select
                        value={nodeMapping.id}
                        onChange={(e) => handleNodeMappingChange('id', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                      >
                        <option value="">Sélectionner...</option>
                        {data.nodeColumns?.map((col: string) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Type className="inline w-4 h-4 mr-1" />
                        Libellé (requis)
                      </label>
                      <select
                        value={nodeMapping.label}
                        onChange={(e) => handleNodeMappingChange('label', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                      >
                        <option value="">Sélectionner...</option>
                        {data.nodeColumns?.map((col: string) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Palette className="inline w-4 h-4 mr-1" />
                        Couleur
                      </label>
                      <select
                        value={nodeMapping.color}
                        onChange={(e) => handleNodeMappingChange('color', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                      >
                        <option value="">Par défaut</option>
                        {data.nodeColumns?.map((col: string) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Taille
                      </label>
                      <select
                        value={nodeMapping.size}
                        onChange={(e) => handleNodeMappingChange('size', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                      >
                        <option value="">Par défaut</option>
                        {data.nodeColumns?.map((col: string) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Liens */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  Liens ({data.links?.length || 0} total)
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Liste des liens à gauche */}
                <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Liste des liens</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {previewData.links.map((link: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border text-sm">
                        <div className="font-medium text-green-600">
                          {linkMapping.source ? link[linkMapping.source] : 'Non défini'} → {linkMapping.target ? link[linkMapping.target] : 'Non défini'}
                        </div>
                        {linkMapping.weight && (
                          <div className="text-gray-500">
                            Poids: {link[linkMapping.weight]}
                          </div>
                        )}
                        {linkMapping.color && (
                          <div className="text-gray-500">
                            Couleur: {link[linkMapping.color]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Configuration des liens à droite */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Config. Liens
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Source (requis)
                      </label>
                      <select
                        value={linkMapping.source}
                        onChange={(e) => handleLinkMappingChange('source', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                      >
                        <option value="">Sélectionner...</option>
                        {data.linkColumns?.map((col: string) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cible (requis)
                      </label>
                      <select
                        value={linkMapping.target}
                        onChange={(e) => handleLinkMappingChange('target', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                      >
                        <option value="">Sélectionner...</option>
                        {data.linkColumns?.map((col: string) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Poids
                      </label>
                      <select
                        value={linkMapping.weight}
                        onChange={(e) => handleLinkMappingChange('weight', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                      >
                        <option value="">Par défaut</option>
                        {data.linkColumns?.map((col: string) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Palette className="inline w-4 h-4 mr-1" />
                        Couleur
                      </label>
                      <select
                        value={linkMapping.color}
                        onChange={(e) => handleLinkMappingChange('color', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                      >
                        <option value="">Par défaut</option>
                        {data.linkColumns?.map((col: string) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Section Filtres */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filtres
              </h3>
              <button
                onClick={addFilter}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter un filtre
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              {filters.length === 0 ? (
                <p className="text-sm text-gray-500 italic text-center py-4">
                  Aucun filtre configuré. Cliquez sur "Ajouter un filtre" pour commencer.
                </p>
              ) : (
                <div className="space-y-4">
                  {filters.map((filter) => (
                    <div key={filter.id} className="bg-white rounded-lg p-4 border">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-sm font-medium text-gray-700">Filtre #{filter.id.slice(-4)}</h4>
                        <button
                          onClick={() => removeFilter(filter.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {/* Cible du filtre */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Appliquer sur
                          </label>
                          <select
                            value={filter.target}
                            onChange={(e) => updateFilter(filter.id, { target: e.target.value as 'nodes' | 'links' })}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                          >
                            {filterTargets.map(target => (
                              <option key={target.value} value={target.value}>
                                {target.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Type de filtre */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Type de filtre
                          </label>
                          <select
                            value={filter.type}
                            onChange={(e) => updateFilter(filter.id, { type: e.target.value as 'qualitative' | 'quantitative' })}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                          >
                            {filterTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Colonne */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Colonne
                          </label>
                          <select
                            value={filter.column}
                            onChange={(e) => updateFilter(filter.id, { column: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Sélectionner une colonne</option>
                            {getAvailableColumns(filter.target).map((col: string) => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>

                        {/* Titre du filtre */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Titre du filtre
                          </label>
                          <input
                            type="text"
                            value={filter.title}
                            onChange={(e) => updateFilter(filter.id, { title: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            placeholder="Nom du filtre pour l'interface"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Section Librairie de Visualisation */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <Layers className="w-5 h-5 mr-2" />
              Librairie de Visualisation
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="d3js"
                    name="visualizationLib"
                    value="d3js"
                    checked={selectedVisualizationLib === 'd3js'}
                    onChange={(e) => setSelectedVisualizationLib(e.target.value)}
                    className="mr-3 text-blue-600"
                  />
                  <label htmlFor="d3js" className="text-sm font-medium text-gray-700">
                    D3.js
                  </label>
                  <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    Actuel
                  </span>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="echarts"
                    name="visualizationLib"
                    value="echarts"
                    checked={selectedVisualizationLib === 'echarts'}
                    onChange={(e) => setSelectedVisualizationLib(e.target.value)}
                    className="mr-3 text-blue-600"
                  />
                  <label htmlFor="echarts" className="text-sm font-medium text-gray-700">
                    Apache ECharts
                  </label>
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    En cours
                  </span>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="gojs"
                    name="visualizationLib"
                    value="gojs"
                    checked={selectedVisualizationLib === 'gojs'}
                    onChange={(e) => setSelectedVisualizationLib(e.target.value)}
                    className="mr-3 text-blue-600"
                  />
                  <label htmlFor="gojs" className="text-sm font-medium text-gray-700">
                    GoJS v1 - Production Process
                  </label>
                  <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    En cours
                  </span>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="amcharts"
                    name="visualizationLib"
                    value="amcharts"
                    checked={selectedVisualizationLib === 'amcharts'}
                    onChange={(e) => setSelectedVisualizationLib(e.target.value)}
                    className="mr-3 text-blue-600"
                  />
                  <label htmlFor="amcharts" className="text-sm font-medium text-gray-700">
                    amCharts - Force Directed Tree
                  </label>
                  <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                    En cours
                  </span>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="amcharts-hierarchy"
                    name="visualizationLib"
                    value="amcharts-hierarchy"
                    checked={selectedVisualizationLib === 'amcharts-hierarchy'}
                    onChange={(e) => setSelectedVisualizationLib(e.target.value)}
                    className="mr-3 text-blue-600"
                  />
                  <label htmlFor="amcharts-hierarchy" className="text-sm font-medium text-gray-700">
                    amCharts - Hierarchy Layout
                  </label>
                  <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded">
                    En cours
                  </span>
                </div>
                <div className="flex items-center opacity-50">
                  <input
                    type="radio"
                    id="threejs"
                    name="visualizationLib"
                    value="threejs"
                    disabled
                    className="mr-3 text-blue-600"
                  />
                  <label htmlFor="threejs" className="text-sm font-medium text-gray-500">
                    Three.js
                  </label>
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                    Bientôt
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section Indicateurs */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Créer un Indicateur
              </h3>
              <button
                disabled
                className="flex items-center px-3 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Ajouter un indicateur
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 italic text-center py-4">
                Fonctionnalité en développement - Permettra de créer des indicateurs statistiques (moyenne, médiane, écart-type, sommes) sur les données.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4 opacity-50">
                <div className="bg-white rounded-lg p-3 border">
                  <div className="text-xs font-medium text-gray-600 mb-2">Types d'indicateurs</div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div>• Moyenne</div>
                    <div>• Médiane</div>
                    <div>• Écart-type</div>
                    <div>• Sommes</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border">
                  <div className="text-xs font-medium text-gray-600 mb-2">Configuration</div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div>• Colonne source</div>
                    <div>• Type de calcul</div>
                    <div>• Affichage</div>
                    <div>• Formatage</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Affichage Entités */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Affichage Entités
              </h3>
              <button
                disabled
                className="flex items-center px-3 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Personnaliser
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 italic text-center py-4">
                Fonctionnalité en développement - Permettra de personnaliser l'affichage des informations sur les nœuds/entités.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4 opacity-50">
                <div className="bg-white rounded-lg p-3 border">
                  <div className="text-xs font-medium text-gray-600 mb-2">Informations affichées</div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div>• Champs à afficher</div>
                    <div>• Ordre d'affichage</div>
                    <div>• Format des données</div>
                    <div>• Couleurs et styles</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border">
                  <div className="text-xs font-medium text-gray-600 mb-2">Positionnement</div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div>• Position de la tooltip</div>
                    <div>• Taille de la card</div>
                    <div>• Animation d'apparition</div>
                    <div>• Déclencheurs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Affichage Liens */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Affichage Liens
              </h3>
              <button
                disabled
                className="flex items-center px-3 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Personnaliser
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 italic text-center py-4">
                Fonctionnalité en développement - Permettra de personnaliser l'affichage des informations sur les liens/relations.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4 opacity-50">
                <div className="bg-white rounded-lg p-3 border">
                  <div className="text-xs font-medium text-gray-600 mb-2">Style des liens</div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div>• Épaisseur du trait</div>
                    <div>• Style de ligne</div>
                    <div>• Couleur dynamique</div>
                    <div>• Animations</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border">
                  <div className="text-xs font-medium text-gray-600 mb-2">Informations sur hover</div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div>• Données à afficher</div>
                    <div>• Position de la tooltip</div>
                    <div>• Mise en surbrillance</div>
                    <div>• Interactions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bouton Visualiser le Graphe */}
          <div className="mt-8">
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Visualiser le Graphe
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
