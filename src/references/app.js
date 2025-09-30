import { linkTools, elementTools, dia, shapes, highlighters, V } from '@joint/core';
import { Node, Edge } from './shapes';
import ResizeTool from './resize-tool';
import { AvoidRouter } from './avoid-router';
import graphData from './graph-data.json';
import scenarios from './scenarios.json';

let currentScenario = null;
let graph = null;
let paper = null;

export const init = async () => {
    await AvoidRouter.load();

    const canvasEl = document.getElementById('canvas');

    const cellNamespace = {
        ...shapes,
        Node,
        Edge,
    };

    // Create scenario selector
    const scenarioContainer = document.createElement('div');
    scenarioContainer.style.position = 'absolute';
    scenarioContainer.style.top = '10px';
    scenarioContainer.style.left = '50%';
    scenarioContainer.style.transform = 'translateX(-50%)';
    scenarioContainer.style.display = 'flex';
    scenarioContainer.style.gap = '10px';
    scenarioContainer.style.alignItems = 'center';
    scenarioContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    scenarioContainer.style.padding = '10px';
    scenarioContainer.style.borderRadius = '8px';
    scenarioContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

    const scenarioLabel = document.createElement('label');
    scenarioLabel.textContent = 'Scénario:';
    scenarioLabel.style.fontWeight = 'bold';

    const scenarioSelect = document.createElement('select');
    scenarioSelect.style.padding = '5px';
    scenarioSelect.style.borderRadius = '4px';
    
    // Add empty option
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'Sélectionner un scénario';
    scenarioSelect.appendChild(emptyOption);

    // Add scenarios from json
    scenarios.scenarios.forEach(scenario => {
        const option = document.createElement('option');
        option.value = scenario.id;
        option.textContent = scenario.name;
        scenarioSelect.appendChild(option);
    });

    scenarioContainer.appendChild(scenarioLabel);
    scenarioContainer.appendChild(scenarioSelect);
    document.body.appendChild(scenarioContainer);

    // Initialize graph
    graph = new dia.Graph({}, { cellNamespace });

    // Initialize paper
    paper = new dia.Paper({
        model: graph,
        cellViewNamespace: cellNamespace,
        width: 1000,
        height: 600,
        gridSize: 10,
        interactive: { linkMove: false },
        linkPinning: false,
        async: true,
        frozen: true,
        background: { color: '#F3F7F6' },
        snapLinks: { radius: 30 },
        overflow: true,
        defaultConnector: {
            name: 'straight',
            args: {
                cornerType: 'cubic',
                cornerRadius: 4,
            },
        },
        highlighting: {
            default: {
                name: 'mask',
                options: {
                    padding: 2,
                    attrs: {
                        stroke: '#EA3C24',
                        strokeWidth: 2,
                    },
                },
            },
        },
        defaultLink: () => new Edge(),
        validateConnection: (
            sourceView,
            sourceMagnet,
            targetView,
            targetMagnet,
            end
        ) => {
            const source = sourceView.model;
            const target = targetView.model;
            if (source.isLink() || target.isLink()) return false;
            if (targetMagnet === sourceMagnet) return false;
            if (end === 'target' ? targetMagnet : sourceMagnet) {
                return true;
            }
            if (source === target) return false;
            return end === 'target' ? !target.hasPorts() : !source.hasPorts();
        },
    });

    canvasEl.appendChild(paper.el);

    paper.unfreeze();
    paper.fitToContent({
        useModelGeometry: true,
        padding: 100,
        allowNewOrigin: 'any',
    });

    // Configure all links with jumpover connector
    graph.getLinks().forEach(link => {
        link.connector('jumpover', {
            size: 15,
            jump: 'arc'
        });
    });

    // Add the same connector for new links
    graph.on('add', (cell) => {
        if (cell.isLink()) {
            cell.connector('jumpover', {
                size: 15,
                jump: 'arc'
            });
        }
    });

    // Add export button
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export PDF';
    exportButton.style.position = 'absolute';
    exportButton.style.top = '10px';
    exportButton.style.right = '10px';
    exportButton.style.padding = '8px 16px';
    exportButton.style.backgroundColor = '#4665E5';
    exportButton.style.color = 'white';
    exportButton.style.border = 'none';
    exportButton.style.borderRadius = '4px';
    exportButton.style.cursor = 'pointer';
    document.body.appendChild(exportButton);

    // Export function
    function exportToPdf() {
        // Get the SVG element
        const svgElement = paper.svg;
        
        // Get the SVG content
        const svgContent = new XMLSerializer().serializeToString(svgElement);
        
        // Create a Blob with the SVG content
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
        
        // Create an object URL for the Blob
        const url = URL.createObjectURL(svgBlob);
        
        // Create a link element
        const link = document.createElement('a');
        link.href = url;
        link.download = 'flow-diagram.svg';
        
        // Append the link to the body
        document.body.appendChild(link);
        
        // Trigger the download
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Add click handler to export button
    exportButton.addEventListener('click', exportToPdf);

    // Add tools to the elements.
    graph.getElements().forEach((el) => addElementTools(el, paper));
    graph.on('add', (cell) => {
        if (cell.isLink()) return;
        addElementTools(cell, paper);
    });

    function addElementTools(el, paper) {
        const tools = [
            new ResizeTool({
                selector: 'body',
            }),
            new elementTools.Remove({
                useModelGeometry: true,
                x: -10,
                y: -10,
            }),
        ];
        if (!el.hasPorts()) {
            tools.push(
                new elementTools.Connect({
                    useModelGeometry: true,
                    x: 'calc(w + 10)',
                    y: 'calc(h - 20)',
                })
            );
        }

        el.findView(paper).addTools(new dia.ToolsView({ tools }));
    }

    // Add tools to the links.
    paper.on('link:mouseenter', (linkView) => {
        const link = linkView.model;
        linkView.addTools(
            new dia.ToolsView({
                tools: [
                    new linkTools.Vertices(),
                    new linkTools.SourceArrowhead(),
                    new linkTools.TargetArrowhead(),
                    new linkTools.Remove({ distance: -30 })
                ]
            })
        );
    });

    paper.on('link:mouseleave', (linkView) => {
        linkView.removeTools();
    });

    paper.on('blank:pointerdblclick', (evt, x, y) => {
        const node = new Node({
            id: `node${Math.floor(Math.random() * 1000)}`,
            position: { x: x - 50, y: y - 50 },
            size: { width: 100, height: 100 },
            attrs: {
                label: {
                    text: `Node ${Math.floor(Math.random() * 1000)}`
                }
            }
        });
        graph.addCell(node);
    });

    // Add a class to the links when they are being interacted with.
    // See `styles.css` for the styles.

    paper.on('link:pointerdown', (linkView) => {
        highlighters.addClass.add(linkView, 'line', 'active-link', {
            className: 'active-link'
        });
    });

    paper.on('link:pointerup', (linkView) => {
        highlighters.addClass.remove(linkView);
    });

    // Start the Avoid Router.
    const router = new AvoidRouter(graph, {
        shapeBufferDistance: 20,
        idealNudgingDistance: 10,
        portOverflow: Node.PORT_RADIUS,
    });

    router.addGraphListeners();
    router.routeAll();

    // Add animation styles
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .joint-link.animated-link {
            stroke-dasharray: 5;
            stroke-dashoffset: 10;
            animation: dash 0.5s infinite linear;
        }
        @keyframes dash {
            to {
                stroke-dashoffset: 0;
            }
        }
    `;
    document.head.appendChild(styleElement);

    function getConnectedLinks(element) {
        // Obtenir tous les prédécesseurs du nœud
        const predecessors = graph.getPredecessors(element);
        // Obtenir le sous-graphe qui inclut le nœud et tous ses prédécesseurs
        const subgraph = graph.getSubgraph([element, ...predecessors]);
        // Filtrer pour ne garder que les liens
        return subgraph.filter(cell => cell.isLink());
    }

    function animateLinks(element) {
        // Désactiver l'animation sur tous les liens
        graph.getLinks().forEach(link => {
            const linkView = link.findView(paper);
            if (linkView) {
                linkView.el.classList.remove('animated-link');
            }
        });

        // Activer l'animation sur les liens connectés au nœud sélectionné
        if (element) {
            const connectedLinks = getConnectedLinks(element);
            connectedLinks.forEach(link => {
                const linkView = link.findView(paper);
                if (linkView) {
                    linkView.el.classList.add('animated-link');
                }
            });
        }
    }

    // Add toggle button for timeline
    const toggleTimelineButton = document.createElement('button');
    toggleTimelineButton.textContent = 'Masquer Timeline';
    toggleTimelineButton.style.position = 'absolute';
    toggleTimelineButton.style.top = '10px';
    toggleTimelineButton.style.left = '10px';
    toggleTimelineButton.style.padding = '8px 16px';
    toggleTimelineButton.style.backgroundColor = '#4665E5';
    toggleTimelineButton.style.color = 'white';
    toggleTimelineButton.style.border = 'none';
    toggleTimelineButton.style.borderRadius = '4px';
    toggleTimelineButton.style.cursor = 'pointer';
    document.body.appendChild(toggleTimelineButton);

    // Add selection handling
    paper.on('element:pointerclick', (elementView) => {
        const element = elementView.model;
        console.log('Selected Node:', element.attributes.attrs.label.text);
        
        // Remove highlight from all elements
        const allViews = paper.findViewsInArea(paper.getArea());
        allViews.forEach((view) => {
            highlighters.mask.remove(view);
        });
        
        // Highlight the selected element
        highlighters.mask.add(elementView, 'root', 'selection', {
            padding: 5,
            attrs: {
                stroke: '#33334F',
                'stroke-width': 2,
                'stroke-dasharray': '5,2'
            }
        });

        // Animer les liens connectés
        animateLinks(element);
    });

    paper.on('blank:pointerclick', () => {
        // Remove all highlights when clicking on blank paper
        const allViews = paper.findViewsInArea(paper.getArea());
        allViews.forEach((view) => {
            highlighters.mask.remove(view);
        });
        
        // Arrêter toutes les animations
        animateLinks(null);
    });

    // Function to save node positions in memory
    function saveNodePositions() {
        const nodes = graph.getElements();
        graphData.nodes = graphData.nodes.map(node => {
            const graphNode = nodes.find(n => n.id === node.id);
            if (graphNode) {
                const position = graphNode.position();
                return {
                    ...node,
                    position: { x: position.x, y: position.y }
                };
            }
            return node;
        });
    }

    // Function to toggle node interactivity
    function setNodesInteractivity(interactive) {
        graph.getElements().forEach(element => {
            // Mettre à jour le style du curseur
            element.attr('body/style', interactive ? null : { cursor: 'default' });
            
            if (!interactive) {
                // Désactiver le redimensionnement et le déplacement
                element.set('interactive', { resize: false });
                element.set('movable', false);
            } else {
                // Activer le redimensionnement et le déplacement
                element.set('interactive', { resize: true });
                element.set('movable', true);
            }
        });
    }

    // Function to load base graph
    function loadBaseGraph() {
        // Clear current graph
        graph.clear();

        // Create nodes from base graph data
        const nodes = graphData.nodes.map(nodeData => {
            const node = new Node(nodeData);
            return node;
        });

        // Create links from base graph data
        const links = graphData.links.map(linkData => {
            const link = new Edge(linkData);
            return link;
        });

        // Add all elements to the graph
        graph.addCells([...nodes, ...links]);

        // Configure all links with jumpover connector
        graph.getLinks().forEach(link => {
            link.connector('jumpover', {
                size: 15,
                jump: 'arc'
            });
        });

        // Enable node interactivity
        setNodesInteractivity(true);

        // Hide timeline controls
        if (sliderContainer) {
            sliderContainer.style.display = 'none';
        }
    }

    // Function to load scenario
    function loadScenario(scenarioId) {
        // Clear current graph
        graph.clear();
        
        if (!scenarioId) {
            loadBaseGraph();
            return;
        }

        // Find selected scenario
        currentScenario = scenarios.scenarios.find(s => s.id === scenarioId);
        if (!currentScenario) {
            loadBaseGraph();
            return;
        }

        // Create nodes with positions and sizes from graph-data.json
        const nodes = currentScenario.nodes.map(scenarioNode => {
            const baseNode = graphData.nodes.find(n => n.id === scenarioNode.id);
            if (!baseNode) return null;

            // Combine base node data with scenario timing
            const nodeData = {
                ...baseNode,
                time: scenarioNode.time
            };
            return new Node(nodeData);
        }).filter(node => node !== null);

        // Create links
        const links = currentScenario.links.map(scenarioLink => {
            const linkData = {
                source: scenarioLink.source,
                target: scenarioLink.target,
                time: scenarioLink.time
            };
            return new Edge(linkData);
        });

        // Add all elements to the graph
        graph.addCells([...nodes, ...links]);

        // Configure all links with jumpover connector
        graph.getLinks().forEach(link => {
            link.connector('jumpover', {
                size: 15,
                jump: 'arc'
            });
        });

        // Disable node interactivity in scenario mode
        setNodesInteractivity(false);

        // Show and reset timeline
        if (sliderContainer) {
            sliderContainer.style.display = 'flex';
            slider.min = currentScenario.timeRange.start;
            slider.max = currentScenario.timeRange.end;
            slider.value = currentScenario.timeRange.start;
            updateVisibility(currentScenario.timeRange.start);
        }

        // Stop any ongoing animation
        if (isPlaying) {
            clearInterval(animationInterval);
            playButton.textContent = '▶';
            isPlaying = false;
        }
    }

    // Add event listener for node position changes
    graph.on('change:position', (element) => {
        if (!currentScenario) {  // Only save positions in default mode
            saveNodePositions();
        }
    });

    // Add time slider
    const sliderContainer = document.createElement('div');
    sliderContainer.style.position = 'absolute';
    sliderContainer.style.bottom = '20px';
    sliderContainer.style.left = '50%';
    sliderContainer.style.transform = 'translateX(-50%)';
    sliderContainer.style.width = '80%';
    sliderContainer.style.display = 'flex';
    sliderContainer.style.alignItems = 'center';
    sliderContainer.style.gap = '10px';
    sliderContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    sliderContainer.style.padding = '10px';
    sliderContainer.style.borderRadius = '8px';
    sliderContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

    const timeLabel = document.createElement('div');
    timeLabel.textContent = '0';
    timeLabel.style.minWidth = '30px';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;  // Valeur par défaut
    slider.max = 100;  // Valeur par défaut
    slider.value = 0;
    slider.style.width = '100%';

    const playButton = document.createElement('button');
    playButton.textContent = '▶';
    playButton.style.padding = '5px 10px';
    playButton.style.cursor = 'pointer';

    sliderContainer.appendChild(timeLabel);
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(playButton);
    document.body.appendChild(sliderContainer);

    // Time-based visibility function
    function updateVisibility(currentTime) {
        if (!currentScenario || sliderContainer.style.display === 'none') {
            // Si pas de scénario ou timeline masquée, tout afficher
            graph.getElements().forEach(element => {
                element.attr('body/opacity', 1);
                element.attr('label/opacity', 1);
            });
            graph.getLinks().forEach(link => {
                link.attr('line/opacity', 1);
                // Réinitialiser le style des liens dynamiques
                if (link.get('dynamic')) {
                    link.attr('line/stroke', '#333');
                    link.attr('line/strokeDasharray', null);
                }
            });
            return;
        }

        timeLabel.textContent = currentTime;

        // Update nodes visibility
        graph.getElements().forEach(element => {
            const nodeData = currentScenario.nodes.find(n => n.id === element.id);
            if (nodeData) {
                const isVisible = currentTime >= nodeData.time.start && currentTime <= nodeData.time.end;
                element.attr('body/opacity', isVisible ? 1 : 0.2);
                element.attr('label/opacity', isVisible ? 1 : 0.2);
            }
        });

        // Update links visibility
        graph.getLinks().forEach((link, index) => {
            // Vérifier si c'est un lien dynamique
            if (link.get('dynamic')) {
                // Style spécial pour les liens dynamiques
                link.attr('line/stroke', '#ff4444');
                link.attr('line/strokeDasharray', '5,5');
                link.attr('line/opacity', 1);
                return;
            }

            // Pour les liens du scénario
            const source = link.getSourceCell();
            const target = link.getTargetCell();
            const linkData = currentScenario.links.find(l => 
                l.source.id === source.id && 
                l.target.id === target.id
            );

            if (linkData) {
                const isVisible = currentTime >= linkData.time.start && currentTime <= linkData.time.end;
                link.attr('line/opacity', isVisible ? 1 : 0.2);
                link.attr('line/stroke', '#333');
                link.attr('line/strokeDasharray', null);
            }
        });
    }

    // Handle slider change
    slider.addEventListener('input', (e) => {
        updateVisibility(parseInt(e.target.value));
    });

    // Handle play button
    let isPlaying = false;
    let animationInterval;

    playButton.addEventListener('click', () => {
        if (isPlaying) {
            clearInterval(animationInterval);
            playButton.textContent = '▶';
        } else {
            animationInterval = setInterval(() => {
                const nextValue = parseInt(slider.value) + 1;
                if (nextValue <= slider.max) {
                    slider.value = nextValue;
                    updateVisibility(nextValue);
                } else {
                    clearInterval(animationInterval);
                    playButton.textContent = '▶';
                    isPlaying = false;
                }
            }, 100); // Update every 100ms
            playButton.textContent = '⏸';
        }
        isPlaying = !isPlaying;
    });

    // Handle link creation
    graph.on('add', (cell) => {
        if (cell.isLink()) {
            // Marquer les nouveaux liens comme dynamiques
            cell.set('dynamic', true);
            // Appliquer le style initial
            cell.attr('line/stroke', '#ff4444');
            cell.attr('line/strokeDasharray', '5,5');
        }
    });

    // Handle timeline toggle
    toggleTimelineButton.addEventListener('click', () => {
        const isVisible = sliderContainer.style.display !== 'none';
        sliderContainer.style.display = isVisible ? 'none' : 'flex';
        toggleTimelineButton.textContent = isVisible ? 'Afficher Timeline' : 'Masquer Timeline';
        
        if (isVisible) {
            // Si on masque la timeline, arrêter l'animation
            if (isPlaying) {
                clearInterval(animationInterval);
                playButton.textContent = '▶';
                isPlaying = false;
            }
            // Réinitialiser la visibilité de tous les éléments
            updateVisibility(0);
        }
    });

    // Initial load of base graph
    loadBaseGraph();

    // Handle scenario selection
    scenarioSelect.addEventListener('change', (e) => {
        loadScenario(e.target.value);
    });

    // Initial visibility update
    updateVisibility(0);
};
