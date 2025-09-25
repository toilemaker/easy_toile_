'use client'

import { useState } from 'react'
import ProjectSettingsScreen from '@/components/ProjectSettingsScreen'
import ImportScreen from '@/components/ImportScreen'
import MappingScreen from '@/components/MappingScreen'
import VisualizationScreen from '@/components/VisualizationScreen'

export type ProjectSettings = {
  title: string
  description: string
  tags: string[]
  author: string
  createdAt: string
}

export type GraphData = {
  nodes: any[]
  links: any[]
  nodeMapping?: Record<string, string>
  linkMapping?: Record<string, string>
  nodeColumns?: string[]
  linkColumns?: string[]
  projectSettings?: ProjectSettings
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0)
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: []
  })

  const handleProjectSettingsComplete = (settings: ProjectSettings) => {
    setGraphData(prev => ({ ...prev, projectSettings: settings }))
    setCurrentStep(1)
  }

  const handleImportComplete = (data: GraphData) => {
    setGraphData(prev => ({ ...prev, ...data }))
    setCurrentStep(2)
  }

  const handleMappingComplete = (data: GraphData) => {
    setGraphData(prev => ({ ...prev, ...data }))
    setCurrentStep(3)
  }

  const handleBackToSettings = () => {
    setCurrentStep(0)
  }

  const handleBackToImport = () => {
    setCurrentStep(1)
  }

  const handleBackToMapping = () => {
    setCurrentStep(2)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {currentStep === 0 && (
        <ProjectSettingsScreen onComplete={handleProjectSettingsComplete} />
      )}
      {currentStep === 1 && (
        <ImportScreen 
          onComplete={handleImportComplete}
          onBack={handleBackToSettings}
          projectSettings={graphData.projectSettings}
        />
      )}
      {currentStep === 2 && (
        <MappingScreen 
          data={graphData} 
          onComplete={handleMappingComplete}
          onBack={handleBackToImport}
        />
      )}
      {currentStep === 3 && (
        <VisualizationScreen 
          data={graphData}
          onBack={handleBackToMapping}
          onExport={(data) => {
            const exportData = {
              ...data,
              metadata: {
                ...data.metadata,
                projectSettings: graphData.projectSettings,
                exportDate: new Date().toISOString()
              }
            }
            const filename = graphData.projectSettings?.title 
              ? `${graphData.projectSettings.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-graph-project.json`
              : 'graph-project.json'
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
          }}
        />
      )}
    </main>
  )
}
