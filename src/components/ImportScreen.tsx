'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Database, X } from 'lucide-react'
import Papa from 'papaparse'

interface ImportScreenProps {
  onComplete: (data: any) => void
  onBack?: () => void
  projectSettings?: {
    title: string
    description: string
    tags: string[]
    author: string
    createdAt: string
  }
}

export default function ImportScreen({ onComplete, onBack, projectSettings }: ImportScreenProps) {
  const [entitiesFile, setEntitiesFile] = useState<File | null>(null)
  const [linksFile, setLinksFile] = useState<File | null>(null)
  const [jsonFile, setJsonFile] = useState<File | null>(null)
  const [importMode, setImportMode] = useState<'csv' | 'json'>('csv')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  // Paramètres du logo
  const logoWidth = 28  // en unités Tailwind (w-24 = 96px)
  const logoHeight = 24 // en unités Tailwind (h-24 = 96px)

  const entitiesInputRef = useRef<HTMLInputElement>(null)
  const linksInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (file: File, type: 'entities' | 'links' | 'json') => {
    if (type === 'entities') setEntitiesFile(file)
    if (type === 'links') setLinksFile(file)
    if (type === 'json') setJsonFile(file)
    setError(null)
  }

  const handleDragOver = (e: React.DragEvent, type: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(type)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(null)
  }

  const handleDrop = (e: React.DragEvent, type: 'entities' | 'links' | 'json') => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(null)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    const file = files[0]
    
    // Vérifier le type de fichier
    const expectedExtension = type === 'json' ? '.json' : '.csv'
    if (!file.name.toLowerCase().endsWith(expectedExtension)) {
      setError(`Veuillez déposer un fichier ${expectedExtension.toUpperCase()}`)
      return
    }

    handleFileUpload(file, type)
  }

  const removeFile = (type: 'entities' | 'links' | 'json') => {
    if (type === 'entities') setEntitiesFile(null)
    if (type === 'links') setLinksFile(null)
    if (type === 'json') setJsonFile(null)
  }

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      // Essayer plusieurs encodages pour détecter le bon
      const tryEncodings = ['UTF-8', 'ISO-8859-1', 'Windows-1252']
      let currentEncodingIndex = 0
      
      const tryNextEncoding = () => {
        if (currentEncodingIndex >= tryEncodings.length) {
          reject(new Error('Impossible de décoder le fichier avec les encodages supportés'))
          return
        }
        
        const reader = new FileReader()
        const encoding = tryEncodings[currentEncodingIndex]
        
        reader.onload = (e) => {
          const text = e.target?.result as string
          
          // Vérifier si le texte contient des caractères de remplacement (�)
          if (text.includes('�') && currentEncodingIndex < tryEncodings.length - 1) {
            currentEncodingIndex++
            tryNextEncoding()
            return
          }
          
          Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.errors.length > 0) {
                reject(new Error(results.errors[0].message))
              } else {
                // Nettoyer les données pour enlever les caractères de contrôle
                const cleanedData = results.data.map((row: any) => {
                  const cleanedRow: any = {}
                  Object.keys(row).forEach(key => {
                    const cleanedKey = key.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim()
                    const cleanedValue = typeof row[key] === 'string' 
                      ? row[key].replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim()
                      : row[key]
                    if (cleanedKey) {
                      cleanedRow[cleanedKey] = cleanedValue
                    }
                  })
                  return cleanedRow
                })
                resolve(cleanedData)
              }
            },
            error: (error: any) => reject(error)
          })
        }
        
        reader.onerror = () => {
          currentEncodingIndex++
          tryNextEncoding()
        }
        
        // Essayer l'encodage actuel
        reader.readAsText(file, encoding)
      }
      
      tryNextEncoding()
    })
  }

  const handleProcessFiles = async () => {
    setLoading(true)
    setError(null)

    try {
      if (importMode === 'json' && jsonFile) {
        const text = await jsonFile.text()
        const data = JSON.parse(text)
        onComplete(data)
      } else if (importMode === 'csv' && entitiesFile && linksFile) {
        const [nodesData, linksData] = await Promise.all([
          parseCSV(entitiesFile),
          parseCSV(linksFile)
        ])

        const nodeColumns = nodesData.length > 0 ? Object.keys(nodesData[0]) : []
        const linkColumns = linksData.length > 0 ? Object.keys(linksData[0]) : []

        onComplete({
          nodes: nodesData,
          links: linksData,
          nodeColumns,
          linkColumns
        })
      } else {
        setError('Veuillez sélectionner tous les fichiers requis')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du traitement des fichiers')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = importMode === 'json' ? jsonFile : (entitiesFile && linksFile)

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* Logo en en-tête */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-${logoWidth} h-${logoHeight} mb-4`}>
            <img 
              src="/images/logo.png" 
              alt="Logo Toile" 
              className={`w-${logoWidth} h-${logoHeight} object-contain`}
            />
          </div>
          {onBack && (
            <div className="mb-4">
              <button
                onClick={onBack}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                ← Modifier les paramètres du projet
              </button>
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          2/3 - Import des Données
        </h1>
        
        <div className="mb-8">
          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={() => setImportMode('csv')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                importMode === 'csv'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FileText className="inline-block w-5 h-5 mr-2" />
              Import CSV
            </button>
            <button
              onClick={() => setImportMode('json')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                importMode === 'json'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Database className="inline-block w-5 h-5 mr-2" />
              Import JSON
            </button>
          </div>
        </div>

        {importMode === 'csv' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichier Entités (Nœuds)
              </label>
              <div
                onClick={() => entitiesInputRef.current?.click()}
                onDragOver={(e) => handleDragOver(e, 'entities')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'entities')}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
                  dragOver === 'entities' 
                    ? 'border-blue-500 bg-blue-50 scale-105' 
                    : entitiesFile 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                <Upload className={`mx-auto h-12 w-12 mb-4 ${
                  dragOver === 'entities' ? 'text-blue-500' : 'text-gray-400'
                }`} />
                {entitiesFile ? (
                  <div className="space-y-2">
                    <p className="text-sm text-green-600 font-medium">{entitiesFile.name}</p>
                    <p className="text-xs text-gray-500">{(entitiesFile.size / 1024).toFixed(1)} KB</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile('entities')
                      }}
                      className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Supprimer
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      {dragOver === 'entities' ? 'Déposez votre fichier CSV ici' : 'Cliquez ou glissez-déposez votre fichier CSV'}
                    </p>
                    <p className="text-xs text-gray-400">Fichier des entités/nœuds</p>
                  </div>
                )}
              </div>
              <input
                ref={entitiesInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'entities')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichier Liens (Relations)
              </label>
              <div
                onClick={() => linksInputRef.current?.click()}
                onDragOver={(e) => handleDragOver(e, 'links')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'links')}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
                  dragOver === 'links' 
                    ? 'border-blue-500 bg-blue-50 scale-105' 
                    : linksFile 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                <Upload className={`mx-auto h-12 w-12 mb-4 ${
                  dragOver === 'links' ? 'text-blue-500' : 'text-gray-400'
                }`} />
                {linksFile ? (
                  <div className="space-y-2">
                    <p className="text-sm text-green-600 font-medium">{linksFile.name}</p>
                    <p className="text-xs text-gray-500">{(linksFile.size / 1024).toFixed(1)} KB</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile('links')
                      }}
                      className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Supprimer
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      {dragOver === 'links' ? 'Déposez votre fichier CSV ici' : 'Cliquez ou glissez-déposez votre fichier CSV'}
                    </p>
                    <p className="text-xs text-gray-400">Fichier des liens/relations</p>
                  </div>
                )}
              </div>
              <input
                ref={linksInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'links')}
              />
            </div>
          </div>
        )}

        {importMode === 'json' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fichier Projet JSON
            </label>
            <div
              onClick={() => jsonInputRef.current?.click()}
              onDragOver={(e) => handleDragOver(e, 'json')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'json')}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
                dragOver === 'json' 
                  ? 'border-blue-500 bg-blue-50 scale-105' 
                  : jsonFile 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <Upload className={`mx-auto h-12 w-12 mb-4 ${
                dragOver === 'json' ? 'text-blue-500' : 'text-gray-400'
              }`} />
              {jsonFile ? (
                <div className="space-y-2">
                  <p className="text-sm text-green-600 font-medium">{jsonFile.name}</p>
                  <p className="text-xs text-gray-500">{(jsonFile.size / 1024).toFixed(1)} KB</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile('json')
                    }}
                    className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Supprimer
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    {dragOver === 'json' ? 'Déposez votre fichier JSON ici' : 'Cliquez ou glissez-déposez votre fichier JSON'}
                  </p>
                  <p className="text-xs text-gray-400">Projet existant sauvegardé</p>
                </div>
              )}
            </div>
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'json')}
            />
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleProcessFiles}
            disabled={!canProceed || loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Traitement...' : 'Continuer'}
          </button>
        </div>
      </div>
    </div>
  )
}
