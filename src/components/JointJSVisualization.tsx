'use client'

import { useEffect, useRef } from 'react'
import { AvoidRouter } from '../utils/AvoidRouter'

interface JointJSVisualizationProps {
  data: {
    processedNodes: any[]
    processedLinks: any[]
  }
}

export default function JointJSVisualization({ data }: JointJSVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<any>(null)
  const graphRef = useRef<any>(null)
  const avoidRouterRef = useRef<AvoidRouter | null>(null)

  useEffect(() => {
    if (!containerRef.current || !data.processedNodes || !data.processedLinks) return

    // Import dynamique de JointJS pour éviter les erreurs SSR
    const loadJointJS = async () => {
      try {
        const joint = await import('@joint/core') as any
        
        console.log('=== JOINTJS - DONNÉES REÇUES ===')
        console.log('Entités reçues:', data.processedNodes.length)
        console.log('Liens reçus:', data.processedLinks.length)

        // Nettoyer le container précédent
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
        }

        // Créer le graphe JointJS
        const graph = new joint.dia.Graph()
        graphRef.current = graph

        // ✨ Initialiser l'AvoidRouter pour le routing optimisé
        try {
          const avoidRouterAvailable = await AvoidRouter.load()
          if (avoidRouterAvailable) {
            avoidRouterRef.current = new AvoidRouter(graph, {
              shapeBufferDistance: 30,
              idealNudgingDistance: 20,
              commitTransactions: true
            })
            console.log('JointJS - AvoidRouter initialisé avec succès')
          } else {
            console.log('JointJS - Utilisation du routing JointJS standard')
          }
        } catch (error) {
          console.warn('JointJS - Erreur AvoidRouter:', error)
        }

        // Créer le paper (canvas) avec dimensions adaptatives
        const paper = new joint.dia.Paper({
          el: containerRef.current,
          model: graph,
          width: '100%',  // ✨ Largeur adaptative
          height: 600,    // ✨ Hauteur fixe visible
          gridSize: 20,   // ✨ Grille plus large pour plus de clarté
          drawGrid: true,
          background: {
            color: '#f8f9fa'
          },
          // Configuration pour le routing automatique (libavoid style) - Plus agressif
          defaultRouter: {
            name: 'orthogonal',
            args: {
              padding: 30,              // ✨ Plus d'espace autour des obstacles
              excludeEnds: ['source', 'target'],
              excludeTypes: ['myNamespace.MyCommentElement'],
              startDirections: ['top', 'right', 'bottom', 'left'],
              endDirections: ['top', 'right', 'bottom', 'left'],
              step: 20                  // ✨ Pas de grille pour le routing
            }
          },
          defaultConnector: {
            name: 'rounded',
            args: {
              radius: 15               // ✨ Coins plus arrondis pour un aspect plus fluide
            }
          },
          // ✨ Interactions avec zoom/pan
          restrictTranslate: false,  // Permet la translation libre
          interactive: {
            linkMove: false,
            elementMove: true,       // ✨ Permet de déplacer les nœuds
            arrowheadMove: false,
            vertexMove: false,
            vertexAdd: false,
            vertexRemove: false,
            useLinkTools: false
          }
        })
        paperRef.current = paper

        // ✨ Ajouter les fonctionnalités de zoom et pan
        let scale = 1
        let translateX = 0
        let translateY = 0

        // Zoom avec la molette
        paper.el.addEventListener('wheel', (evt: WheelEvent) => {
          evt.preventDefault()
          const delta = evt.deltaY > 0 ? 0.9 : 1.1
          scale *= delta
          scale = Math.max(0.2, Math.min(3, scale)) // Limiter le zoom entre 20% et 300%
          
          paper.scale(scale, scale)
          console.log('JointJS - Zoom:', Math.round(scale * 100) + '%')
        })

        // Pan avec clic-glisser sur le fond
        let isPanning = false
        let startX = 0
        let startY = 0

        paper.el.addEventListener('mousedown', (evt: MouseEvent) => {
          if (evt.target === paper.el || (evt.target as Element).classList.contains('joint-paper-background')) {
            isPanning = true
            startX = evt.clientX - translateX
            startY = evt.clientY - translateY
            paper.el.style.cursor = 'grabbing'
          }
        })

        paper.el.addEventListener('mousemove', (evt: MouseEvent) => {
          if (isPanning) {
            translateX = evt.clientX - startX
            translateY = evt.clientY - startY
            paper.translate(translateX, translateY)
          }
        })

        paper.el.addEventListener('mouseup', () => {
          isPanning = false
          paper.el.style.cursor = 'default'
        })

        // Double-clic pour reset du zoom
        paper.el.addEventListener('dblclick', (evt: MouseEvent) => {
          if (evt.target === paper.el || (evt.target as Element).classList.contains('joint-paper-background')) {
            scale = 1
            translateX = 0
            translateY = 0
            paper.scale(scale, scale)
            paper.translate(0, 0)
            console.log('JointJS - Reset zoom/pan')
          }
        })

        // Définir les formes personnalisées pour les nœuds
        const NodeShape = joint.dia.Element.define('custom.Node', {
          attrs: {
            body: {
              refWidth: '100%',
              refHeight: '100%',
              strokeWidth: 2,
              stroke: '#2c3e50',
              fill: '#3498db',
              rx: 8,
              ry: 8
            },
            label: {
              textVerticalAnchor: 'middle',
              textAnchor: 'middle',
              refX: '50%',
              refY: '50%',
              fontSize: 12,
              fontWeight: 'bold',
              fill: 'white'
            }
          }
        }, {
          markup: [{
            tagName: 'rect',
            selector: 'body'
          }, {
            tagName: 'text',
            selector: 'label'
          }]
        })

        // Créer les nœuds avec dispersion aléatoire
        const nodeMap = new Map()
        const nodes: any[] = []

        // Dimensions de la zone de travail (adaptées au container visible)
        const canvasWidth = 800   // ✨ Réduit pour être visible sans scroll
        const canvasHeight = 600  // ✨ Correspond à la hauteur du paper
        const nodeWidth = 100
        const nodeHeight = 60
        const margin = 50

        // Fonction pour générer une position aléatoire sans chevauchement
        const getRandomPosition = (existingNodes: any[]): { x: number, y: number } => {
          let attempts = 0
          let position: { x: number, y: number }
          
          do {
            position = {
              x: margin + Math.random() * (canvasWidth - nodeWidth - 2 * margin),
              y: margin + Math.random() * (canvasHeight - nodeHeight - 2 * margin)
            }
            attempts++
          } while (attempts < 50 && existingNodes.some(node => {
            const nodePos = node.get('position')
            const distance = Math.sqrt(
              Math.pow(position.x - nodePos.x, 2) + 
              Math.pow(position.y - nodePos.y, 2)
            )
            return distance < 150 // Distance minimale entre nœuds
          }))
          
          return position
        }

        data.processedNodes.forEach((nodeData, index) => {
          const position = getRandomPosition(nodes)
          
          const node = new NodeShape({
            position: position,
            size: {
              width: nodeWidth,
              height: nodeHeight
            },
            attrs: {
              label: {
                text: nodeData.id.length > 10 ? nodeData.id.substring(0, 10) + '...' : nodeData.id
              },
              body: {
                fill: nodeData.color || '#3498db'
              }
            }
          })

          node.set('nodeData', nodeData)
          nodeMap.set(nodeData.id, node)
          nodes.push(node)
        })

        console.log('JointJS - Nœuds dispersés aléatoirement:', nodes.length)

        // Ajouter les nœuds au graphe
        graph.addCells(nodes)

        // Créer les liens avec routing automatique
        const links: any[] = []
        
        data.processedLinks.forEach(linkData => {
          const sourceNode = nodeMap.get(linkData.source)
          const targetNode = nodeMap.get(linkData.target)

          if (sourceNode && targetNode) {
            const link = new joint.shapes.standard.Link({
              source: { id: sourceNode.id },
              target: { id: targetNode.id },
              attrs: {
                line: {
                  stroke: linkData.color || '#95a5a6',
                  strokeWidth: 2,
                  targetMarker: {
                    type: 'path',
                    d: 'M 10 -5 0 0 10 5 z',
                    fill: linkData.color || '#95a5a6'
                  }
                }
              },
              // Configuration du routing pour éviter les obstacles
              router: {
                name: 'orthogonal',
                args: {
                  padding: 20,
                  excludeEnds: ['source', 'target'],
                  excludeTypes: ['myNamespace.MyCommentElement'],
                  startDirections: ['top', 'right', 'bottom', 'left'],
                  endDirections: ['top', 'right', 'bottom', 'left']
                }
              },
              connector: {
                name: 'rounded',
                args: {
                  radius: 10
                }
              }
            })

            link.set('linkData', linkData)
            links.push(link)
          }
        })

        // Ajouter les liens au graphe
        graph.addCells(links)

        // ✨ Utiliser l'AvoidRouter pour le routing optimisé
        if (avoidRouterRef.current) {
          console.log('JointJS - Application du routing libavoid')
          avoidRouterRef.current.routeAll()
        } else {
          console.log('JointJS - Routing standard JointJS')
        }

        // Configuration des événements
        paper.on('element:pointerdown', (elementView: any) => {
          const element = elementView.model
          const nodeData = element.get('nodeData')
          console.log('Nœud sélectionné:', nodeData?.id)
        })

        paper.on('link:pointerdown', (linkView: any) => {
          const link = linkView.model
          const linkData = link.get('linkData')
          console.log('Lien sélectionné:', linkData?.source, '->', linkData?.target)
        })

        // ✨ Événements pour le routing dynamique
        paper.on('element:pointermove', (elementView: any) => {
          if (avoidRouterRef.current) {
            // Mettre à jour le routing quand un nœud est déplacé
            const element = elementView.model
            avoidRouterRef.current.updateShape(element)
            avoidRouterRef.current.processTransaction()
          }
        })

        paper.on('element:pointerup', (elementView: any) => {
          if (avoidRouterRef.current) {
            // Finaliser le routing après le déplacement
            avoidRouterRef.current.routeAll()
          }
        })

        // Pas d'auto-layout - on garde la dispersion aléatoire
        // Les nœuds sont déjà positionnés aléatoirement pour optimiser le routing
        console.log('JointJS - Dispersion aléatoire terminée, routing libavoid activé')

        console.log('JointJS - Graphe créé avec', nodes.length, 'nœuds et', links.length, 'liens')

      } catch (error) {
        console.error('Erreur lors du chargement de JointJS:', error)
      }
    }

    loadJointJS()

    // Cleanup
    return () => {
      if (paperRef.current) {
        paperRef.current.remove()
        paperRef.current = null
      }
      if (graphRef.current) {
        graphRef.current.clear()
        graphRef.current = null
      }
    }
  }, [data])

  return (
    <div className="w-full h-full relative">
      <div 
        ref={containerRef}
        className="w-full h-full"
        style={{ 
          minHeight: '600px'
        }}
      />
      
      {/* Informations sur JointJS */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3 text-xs text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>JointJS Routing Demo</span>
        </div>
        <div className="mt-1">
          {data.processedNodes?.length || 0} entités • {data.processedLinks?.length || 0} liens
        </div>
        <div className="mt-1 text-xs text-gray-500">
          Routing orthogonal • Molette: zoom • Glisser: pan • Double-clic: reset
        </div>
      </div>
    </div>
  )
}
