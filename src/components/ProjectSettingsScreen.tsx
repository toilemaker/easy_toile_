'use client'

import { useState } from 'react'
import { ArrowRight, Settings, Tag, FileText, Calendar, User } from 'lucide-react'

interface ProjectSettings {
  title: string
  description: string
  tags: string[]
  author: string
  createdAt: string
}

interface ProjectSettingsScreenProps {
  onComplete: (settings: ProjectSettings) => void
}

export default function ProjectSettingsScreen({ onComplete }: ProjectSettingsScreenProps) {
  const [settings, setSettings] = useState<ProjectSettings>({
    title: '',
    description: '',
    tags: [],
    author: '',
    createdAt: new Date().toISOString()
  })
  
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Paramètres du logo
  const logoWidth = 28  // en unités Tailwind (w-24 = 96px)
  const logoHeight = 24 // en unités Tailwind (h-24 = 96px)

  const handleInputChange = (field: keyof ProjectSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    // Supprimer l'erreur si le champ devient valide
    if (errors[field] && value.trim()) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !settings.tags.includes(tag)) {
      setSettings(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setSettings(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!settings.title.trim()) {
      newErrors.title = 'Le titre du projet est requis'
    }
    
    if (!settings.description.trim()) {
      newErrors.description = 'La description du projet est requise'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (validateForm()) {
      onComplete(settings)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-${logoWidth} h-${logoHeight} mb-4`}>
            <img 
              src="/images/logo.png" 
              alt="Logo Toile" 
              className={`w-${logoWidth} h-${logoHeight} object-contain`}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            1/3 - Nouveau Projet Toile
          </h1>
          <p className="text-gray-600">
            Configurez votre projet avant d'importer vos données
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Colonne gauche */}
          <div className="space-y-6">
            {/* Titre du projet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline w-4 h-4 mr-1" />
                Titre du projet *
              </label>
              <input
                type="text"
                value={settings.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ex: Analyse du réseau social de l'entreprise"
                className={`w-full px-4 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Auteur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Auteur
              </label>
              <input
                type="text"
                value={settings.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
                placeholder="Votre nom ou nom de l'équipe"
                className="w-full px-4 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
              />
            </div>

            {/* Date de création (affichage simple) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Date de création
              </label>
              <div className="px-4 py-1 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-700 text-sm">
                  {new Date(settings.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
               
              </div>
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-3">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description du projet *
              </label>
              <textarea
                value={settings.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Décrivez l'objectif et le contexte de votre projet de visualisation..."
                rows={5}
                className={`w-full px-4 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-gray-900 bg-white ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="inline w-4 h-4 mr-1" />
                Tags
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ajouter un tag..."
                  className="flex-1 min-w-0 px-4 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                />
                <button
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                  className="flex-shrink-0 px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Ajouter
                </button>
              </div>
              
              {settings.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {settings.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Résumé du projet */}
        {settings.title && settings.description && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Aperçu du projet :</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Titre :</strong> {settings.title}</p>
              <p><strong>Description :</strong> {settings.description.substring(0, 100)}{settings.description.length > 100 ? '...' : ''}</p>
              {settings.author && <p><strong>Auteur :</strong> {settings.author}</p>}
              {settings.tags.length > 0 && (
                <p><strong>Tags :</strong> {settings.tags.join(', ')}</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!settings.title.trim() || !settings.description.trim()}
            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Continuer vers l'import
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            * Champs obligatoires
          </p>
        </div>
      </div>
    </div>
  )
}
