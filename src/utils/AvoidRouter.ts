// Simplified AvoidRouter using JointJS native routing
// Inspired by libavoid but using JointJS built-in capabilities

interface AvoidRouterOptions {
  shapeBufferDistance?: number
  idealNudgingDistance?: number
  commitTransactions?: boolean
}

export class AvoidRouter {
  private graph: any
  private margin = 20
  private commitTransactions = true

  static async load() {
    // Always return true since we use JointJS native routing
    console.log('AvoidRouter - Utilisation du routing JointJS natif optimisé')
    return true
  }

  constructor(graph: any, options: AvoidRouterOptions = {}) {
    this.graph = graph
    this.margin = options.shapeBufferDistance || 30
    this.commitTransactions = options.commitTransactions ?? true
    
    console.log('AvoidRouter - Initialisé avec routing JointJS optimisé')
  }

  updateShape(element: any) {
    // Utilise le routing natif de JointJS - pas besoin d'action spécifique
    console.log('AvoidRouter - Shape updated:', element.id)
  }

  updateConnector(link: any) {
    // Configure le lien pour utiliser le routing orthogonal optimisé
    try {
      link.set({
        router: {
          name: 'orthogonal',
          args: {
            padding: this.margin,
            excludeEnds: ['source', 'target'],
            excludeTypes: ['basic.Text'],
            startDirections: ['top', 'right', 'bottom', 'left'],
            endDirections: ['top', 'right', 'bottom', 'left']
          }
        },
        connector: {
          name: 'rounded',
          args: {
            radius: 15
          }
        }
      })
      return link
    } catch (error) {
      console.warn('Failed to update connector:', error)
      return null
    }
  }

  deleteConnector(link: any) {
    // JointJS gère automatiquement la suppression
    console.log('AvoidRouter - Connector deleted:', link.id)
  }

  deleteShape(element: any) {
    // JointJS gère automatiquement la suppression
    console.log('AvoidRouter - Shape deleted:', element.id)
  }

  routeAll() {
    try {
      // Appliquer le routing optimisé à tous les liens
      this.graph.getLinks().forEach((link: any) => {
        this.updateConnector(link)
      })
      
      console.log('AvoidRouter - Routing appliqué à tous les liens')
    } catch (error) {
      console.warn('Failed to route all:', error)
    }
  }

  processTransaction() {
    // Pas besoin de transaction avec JointJS natif
    console.log('AvoidRouter - Transaction processed')
  }
}
