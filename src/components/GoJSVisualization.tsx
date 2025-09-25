'use client'

import { useEffect, useRef } from 'react'
import * as go from 'gojs'

interface GoJSVisualizationProps {
  data: {
    processedNodes: any[]
    processedLinks: any[]
  }
}

export default function GoJSVisualization({ data }: GoJSVisualizationProps) {
  const diagramRef = useRef<HTMLDivElement>(null)
  const diagramInstance = useRef<go.Diagram | null>(null)

  useEffect(() => {
    if (!diagramRef.current || !data.processedNodes || !data.processedLinks) return

    // Initialiser GoJS
    const $ = go.GraphObject.make

    // Créer le diagramme
    const diagram = $(go.Diagram, diagramRef.current, {
      "undoManager.isEnabled": true,
      layout: $(go.LayeredDigraphLayout, {
        direction: 90,
        layerSpacing: 35,
        columnSpacing: 15,
        setsPortSpots: false
      }),
      "animationManager.isEnabled": false,
      allowCopy: false,
      allowDelete: false,
      allowMove: false,
      hasHorizontalScrollbar: false,
      hasVerticalScrollbar: false,
      contentAlignment: go.Spot.Center
    })

    // Template pour les nœuds
    diagram.nodeTemplate = $(go.Node, "Auto",
      {
        locationSpot: go.Spot.Center,
        locationObjectName: "SHAPE",
        desiredSize: new go.Size(120, 60),
        minSize: new go.Size(120, 60)
      },
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      
      // Shape du nœud
      $(go.Shape, "RoundedRectangle",
        {
          name: "SHAPE",
          fill: "lightblue",
          stroke: "darkblue",
          strokeWidth: 2,
          portId: "",
          cursor: "pointer",
          fromLinkable: true,
          toLinkable: true,
          fromSpot: go.Spot.AllSides,
          toSpot: go.Spot.AllSides
        },
        new go.Binding("fill", "color").makeTwoWay()
      ),
      
      // Texte du nœud
      $(go.TextBlock,
        {
          font: "bold 11pt sans-serif",
          stroke: "white",
          maxSize: new go.Size(110, NaN),
          wrap: go.TextBlock.WrapFit,
          textAlign: "center",
          editable: false
        },
        new go.Binding("text", "id").makeTwoWay()
      ),

      // Tooltip
      {
        toolTip: $(go.Adornment, "Auto",
          $(go.Shape, { fill: "#FFFFCC" }),
          $(go.TextBlock, { margin: 4 },
            new go.Binding("text", "", (data: any) => {
              return `ID: ${data.id}\nLabel: ${data.label}\nColor: ${data.color || 'default'}`
            })
          )
        )
      }
    )

    // Template pour les liens
    diagram.linkTemplate = $(go.Link,
      {
        routing: go.Link.AvoidsNodes,
        curve: go.Link.JumpGap,
        corner: 3,
        relinkableFrom: false,
        relinkableTo: false,
        selectable: false,
        shadowOffset: new go.Point(0, 0),
        shadowBlur: 5,
        shadowColor: "blue"
      },
      
      $(go.Shape,
        { strokeWidth: 3, stroke: "#555" }
      ),
      
      $(go.Shape,
        { toArrow: "standard", stroke: "#555", fill: "#555" }
      ),

      // Tooltip pour les liens
      {
        toolTip: $(go.Adornment, "Auto",
          $(go.Shape, { fill: "#FFFFCC" }),
          $(go.TextBlock, { margin: 4 },
            new go.Binding("text", "", (data: any) => {
              return `From: ${data.from}\nTo: ${data.to}`
            })
          )
        )
      }
    )

    // Préparer les données pour GoJS - Dédupliquer les nœuds
    const uniqueNodesMap = new Map()
    
    // Ajouter tous les nœuds existants (utiliser l'ID comme texte affiché)
    data.processedNodes.forEach(node => {
      if (!uniqueNodesMap.has(node.id)) {
        uniqueNodesMap.set(node.id, {
          key: node.id,
          id: node.id,
          label: node.label || node.id, // Garder le label pour le tooltip
          color: node.color || "#87CEEB"
        })
      }
    })
    
    // Ajouter les nœuds référencés dans les liens mais pas dans les nœuds
    data.processedLinks.forEach(link => {
      if (!uniqueNodesMap.has(link.source)) {
        uniqueNodesMap.set(link.source, {
          key: link.source,
          id: link.source,
          label: link.source, // Pour les nœuds auto-générés, ID = label
          color: "#FFB6C1" // Couleur différente pour les nœuds auto-générés
        })
      }
      if (!uniqueNodesMap.has(link.target)) {
        uniqueNodesMap.set(link.target, {
          key: link.target,
          id: link.target,
          label: link.target, // Pour les nœuds auto-générés, ID = label
          color: "#FFB6C1" // Couleur différente pour les nœuds auto-générés
        })
      }
    })
    
    // Convertir en array et ajouter les positions
    const nodeDataArray = Array.from(uniqueNodesMap.values()).map((node, index) => ({
      ...node,
      loc: `${(index % 5) * 150} ${Math.floor(index / 5) * 100}`
    }))

    // Filtrer les liens pour s'assurer qu'ils pointent vers des nœuds existants
    const linkDataArray = data.processedLinks
      .filter(link => uniqueNodesMap.has(link.source) && uniqueNodesMap.has(link.target))
      .map((link, index) => ({
        from: link.source,
        to: link.target,
        key: `link-${index}-${link.source}-${link.target}` // Clé unique pour éviter les doublons
      }))

    // Debug: Afficher les données préparées
    console.log('GoJS - Données reçues:')
    console.log('  - processedNodes:', data.processedNodes?.length || 0)
    console.log('  - processedLinks:', data.processedLinks?.length || 0)
    console.log('GoJS - Données préparées:')
    console.log('  - Nœuds uniques:', nodeDataArray.length)
    console.log('  - Liens valides:', linkDataArray.length)
    console.log('GoJS - Exemple de nœud:', nodeDataArray[0])
    console.log('GoJS - Exemple de lien:', linkDataArray[0])

    // Assigner les données au modèle
    diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray)

    // Sauvegarder l'instance
    diagramInstance.current = diagram

    // Cleanup function
    return () => {
      if (diagramInstance.current) {
        diagramInstance.current.div = null
        diagramInstance.current = null
      }
    }
  }, [data])

  return (
    <div className="w-full h-full relative">
      <div 
        ref={diagramRef}
        className="w-full h-full bg-white"
        style={{ minHeight: '600px' }}
      />
      
      {/* Informations sur GoJS */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3 text-xs text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>GoJS Production Process Layout</span>
        </div>
        <div className="mt-1">
          {data.processedNodes?.length || 0} nœuds • {data.processedLinks?.length || 0} liens
        </div>
      </div>
    </div>
  )
}
