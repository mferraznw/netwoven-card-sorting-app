'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Network, Building, Users, GitBranch, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface GraphNode {
  id: string
  name: string
  type: 'HUB' | 'SPOKE' | 'SUBHUB'
  url?: string
  division?: string
  lastActivity?: string
  fileCount?: number
  storageUsed?: number
  storagePercentage?: number
  isAssociatedWithTeam?: boolean
  teamName?: string
  createdBy?: string
  memberCount?: number
  ownerCount?: number
  x?: number
  y?: number
}

interface GraphLink {
  source: string
  target: string
  type: 'hub' | 'spoke' | 'subhub'
}

interface GraphVisualizationProps {
  width?: number
  height?: number
  selectedHub?: GraphNode | null
  onNodeSelect?: (node: GraphNode | null) => void
}

export function GraphVisualization({ width = 800, height = 600, selectedHub, onNodeSelect }: GraphVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [allNodes, setAllNodes] = useState<GraphNode[]>([])
  const [allLinks, setAllLinks] = useState<GraphLink[]>([])
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [zoom, setZoom] = useState(1)
  const [isSimulating, setIsSimulating] = useState(false)

  // Debug: Log props when they change
  useEffect(() => {
    console.log('🎯 GraphVisualization props changed:', { selectedHub, onNodeSelect })
  }, [selectedHub, onNodeSelect])

  // Fetch real data from API
  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        console.log('🌐 Fetching graph data from API')
        const response = await fetch('/api/sites')
        if (response.ok) {
          const sites = await response.json()
          
          // Transform sites to graph nodes
          const graphNodes: GraphNode[] = sites.map((site: any) => ({
            id: site.id,
            name: site.name,
            type: site.siteType || 'SPOKE',
            url: site.url,
            division: site.division,
            lastActivity: site.lastActivity,
            fileCount: site.fileCount,
            storageUsed: site.storageUsed,
            storagePercentage: site.storagePercentage,
            isAssociatedWithTeam: site.isAssociatedWithTeam,
            teamName: site.teamName,
            createdBy: site.createdBy,
            memberCount: site.memberCount,
            ownerCount: site.ownerCount
          }))

          // Create links between hubs, subhubs, and spokes
          const graphLinks: GraphLink[] = []
          sites.forEach((site: any) => {
            if (site.parentHubId) {
              console.log(`🔗 Creating link: ${site.parentHubId} -> ${site.id} (${site.name})`)
              graphLinks.push({
                source: site.parentHubId,
                target: site.id,
                type: site.isSubhub ? 'subhub' : 'spoke'
              })
            }
          })
          
          console.log('📊 Graph links created:', graphLinks.length)
          console.log('🔗 Link details:', graphLinks.map(l => ({ source: l.source, target: l.target, type: l.type })))

          setAllNodes(graphNodes)
          setAllLinks(graphLinks)
          
          // Apply filtering if hub is selected
          if (selectedHub) {
            filterGraphForHub(graphNodes, graphLinks, selectedHub)
          } else {
            setNodes(graphNodes)
            setLinks(graphLinks)
          }
        } else {
          console.error('Failed to fetch sites for graph:', response.statusText)
          setNodes([])
          setLinks([])
        }
      } catch (error) {
        console.error('Error fetching graph data:', error)
        setNodes([])
        setLinks([])
      }
    }

    fetchGraphData()
  }, [])

  // Function to filter graph for a specific hub
  const filterGraphForHub = (allNodes: GraphNode[], allLinks: GraphLink[], hub: GraphNode) => {
    console.log('🔍 Filtering for hub:', hub.name, 'ID:', hub.id)
    
    // For now, let's create a simple test with the hub in the center and some test spokes
    // This will help us verify the layout works before debugging the data issues
    
    const hubNode = {
      ...hub,
      x: width / 2,
      y: height / 2
    }
    
    // Create some test spokes around the hub
    const testSpokes: GraphNode[] = [
      {
        id: 'test-spoke-1',
        name: 'Test Spoke 1',
        type: 'SPOKE',
        x: hubNode.x + 150,
        y: hubNode.y - 100
      },
      {
        id: 'test-spoke-2', 
        name: 'Test Spoke 2',
        type: 'SPOKE',
        x: hubNode.x - 150,
        y: hubNode.y - 100
      },
      {
        id: 'test-spoke-3',
        name: 'Test Spoke 3', 
        type: 'SPOKE',
        x: hubNode.x + 100,
        y: hubNode.y + 150
      },
      {
        id: 'test-spoke-4',
        name: 'Test Spoke 4',
        type: 'SPOKE', 
        x: hubNode.x - 100,
        y: hubNode.y + 150
      }
    ]
    
    const testLinks: GraphLink[] = testSpokes.map(spoke => ({
      source: hubNode.id,
      target: spoke.id,
      type: 'spoke' as const
    }))
    
    console.log('🧪 Using test data with hub in center and spokes around it')
    console.log('✅ Test nodes:', [hubNode, ...testSpokes].map(n => `${n.name} (${n.type})`))
    console.log('✅ Test links:', testLinks.length)
    
    setNodes([hubNode, ...testSpokes])
    setLinks(testLinks)
  }

  // Effect to handle hub selection changes
  useEffect(() => {
    console.log('🔍 Hub selection effect triggered:', { selectedHub, allNodesLength: allNodes.length })
    
    if (selectedHub && allNodes.length > 0) {
      console.log('🎯 Filtering graph for hub:', selectedHub.name)
      filterGraphForHub(allNodes, allLinks, selectedHub)
    } else if (!selectedHub && allNodes.length > 0) {
      console.log('🌐 Showing all nodes')
      setNodes(allNodes)
      setLinks(allLinks)
    }
  }, [selectedHub, allNodes, allLinks])

  // D3 rendering logic
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const container = svg.append('g')

    // Set initial positions to spread nodes out
    nodes.forEach((node, i) => {
      if (!node.x || !node.y) {
        const angle = (i / nodes.length) * 2 * Math.PI
        const radius = Math.min(width, height) * 0.3
        node.x = width / 2 + Math.cos(angle) * radius
        node.y = height / 2 + Math.sin(angle) * radius
      }
    })

    // For test mode, don't use force simulation - just position nodes exactly where we want them
    let simulation: any = null
    
    // Only use force simulation if we have more than 5 nodes (not in test mode)
    if (nodes.length > 5) {
      simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id((d: any) => d.id).distance(150))
        .force('charge', d3.forceManyBody().strength(-500))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(60))
        .force('x', d3.forceX(width / 2).strength(0.1))
        .force('y', d3.forceY(height / 2).strength(0.1))
        .alphaDecay(0.02)
        .velocityDecay(0.3)
    }

    // Create links
    const link = container.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.8)
      .attr('stroke-width', d => d.type === 'subhub' ? 3 : 2)
      .attr('stroke-dasharray', d => d.type === 'subhub' ? '5,5' : 'none')
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y)

    // Create nodes
    const node = container.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', (d) => {
        switch (d.type) {
          case 'HUB': return 30
          case 'SUBHUB': return 20
          case 'SPOKE': return 15
          default: return 10
        }
      })
      .attr('fill', (d) => {
        switch (d.type) {
          case 'HUB': return '#3b82f6'
          case 'SUBHUB': return '#60a5fa'
          case 'SPOKE': return '#fbbf24'
          default: return '#6b7280'
        }
      })
      .attr('stroke', (d) => {
        switch (d.type) {
          case 'HUB': return '#1d4ed8'
          case 'SUBHUB': return '#3b82f6'
          case 'SPOKE': return '#d97706'
          default: return '#4b5563'
        }
      })
      .attr('stroke-width', (d) => d.type === 'HUB' ? 3 : 2)
      .attr('stroke-dasharray', (d) => d.type === 'SUBHUB' ? '5,5' : 'none')
      .on('click', (event, d) => {
        setSelectedNode(d)
        onNodeSelect?.(d)
      })

    // Add labels
    const label = container.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text(d => d.name)
      .attr('font-size', '12px')
      .attr('font-family', 'Arial, sans-serif')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#374151')

    // Update positions on simulation tick (or immediately if no simulation)
    if (simulation) {
      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y)

        node
          .attr('cx', (d: any) => d.x)
          .attr('cy', (d: any) => d.y)

        label
          .attr('x', (d: any) => d.x)
          .attr('y', (d: any) => d.y)
      })
    } else {
      // No simulation - position nodes immediately at their fixed positions
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y)

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y)
    }

    // Track simulation state (only if simulation exists)
    if (simulation) {
      let simulationActive = false
      simulation.on('tick', () => {
        if (!simulationActive) {
          simulationActive = true
          setIsSimulating(true)
        }
      })
      
      // Use a timeout to detect when simulation has settled
      const checkSimulation = () => {
        if (simulation.alpha() < 0.1) {
          setIsSimulating(false)
        } else {
          setTimeout(checkSimulation, 100)
        }
      }
      setTimeout(checkSimulation, 100)
    } else {
      // No simulation - not simulating
      setIsSimulating(false)
    }

    return () => {
      if (simulation) {
        simulation.stop()
      }
    }
  }, [nodes, links, width, height, onNodeSelect])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1))
  }

  const handleReset = () => {
    setZoom(1)
    setSelectedNode(null)
    onNodeSelect?.(null)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Hub Selection Header */}
      {selectedHub && (
        <div className="mb-4 p-3 bg-dmv-blue-50 border border-dmv-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-dmv-blue-600" />
              <div>
                <h3 className="font-semibold text-dmv-blue-800">
                  Viewing: {selectedHub.name}
                </h3>
                <p className="text-sm text-dmv-blue-600">
                  Showing hub and its subhubs/spokes hierarchy
                  {isSimulating && <span className="ml-2 text-xs text-orange-600">(settling...)</span>}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNodeSelect?.(null)}
              className="text-dmv-blue-600 border-dmv-blue-300 hover:bg-dmv-blue-100"
            >
              Show All
            </Button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="flex items-center space-x-1"
          >
            <ZoomIn className="h-4 w-4" />
            <span>Zoom In</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="flex items-center space-x-1"
          >
            <ZoomOut className="h-4 w-4" />
            <span>Zoom Out</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex items-center space-x-1"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-dmv-blue-600"></div>
            <span className="text-sm">Hub</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-dmv-blue-400 border-2 border-dashed border-dmv-blue-600"></div>
            <span className="text-sm">Subhub</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-dmv-yellow-500"></div>
            <span className="text-sm">Spoke</span>
          </div>
        </div>
      </div>

      {/* Graph Stats */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="font-medium">Nodes: {nodes.length}</span>
            <span className="font-medium">Links: {links.length}</span>
            <span className="font-medium">Zoom: {Math.round(zoom * 100)}%</span>
          </div>
          {selectedNode && (
            <Badge variant="outline" className="text-dmv-blue-600 border-dmv-blue-300">
              Selected: {selectedNode.name}
            </Badge>
          )}
        </div>
      </div>

      {/* SVG Container */}
      <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="w-full h-full"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
        />
      </div>
    </div>
  )
}