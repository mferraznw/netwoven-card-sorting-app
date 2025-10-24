'use client'

import { useEffect, useState } from 'react'
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

interface SimpleGraphVisualizationProps {
  width?: number
  height?: number
  selectedHub?: GraphNode | null
  onNodeSelect?: (node: GraphNode | null) => void
}

export function SimpleGraphVisualization({ 
  width = 600, 
  height = 400, 
  selectedHub, 
  onNodeSelect 
}: SimpleGraphVisualizationProps) {
  const [allNodes, setAllNodes] = useState<GraphNode[]>([])
  const [allLinks, setAllLinks] = useState<GraphLink[]>([])
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [zoom, setZoom] = useState(1)

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
    
    // Position the hub at the top center
    const hubNode = {
      ...hub,
      x: width / 2,
      y: 80
    }
    
    // Find all spokes and subhubs connected to this hub
    const connectedLinks = allLinks.filter(link => link.source === hub.id)
    const connectedNodeIds = connectedLinks.map(link => link.target)
    const connectedNodes = allNodes.filter(node => connectedNodeIds.includes(node.id))
    
    console.log('🔗 Found connected nodes:', connectedNodes.length)
    console.log('🔗 Connected links:', connectedLinks.length)
    
    // Position connected nodes in a hierarchical layout below the hub
    const positionedNodes = connectedNodes.map((node, index) => {
      const nodesPerRow = Math.ceil(Math.sqrt(connectedNodes.length))
      const row = Math.floor(index / nodesPerRow)
      const col = index % nodesPerRow
      const totalCols = Math.min(nodesPerRow, connectedNodes.length - row * nodesPerRow)
      
      const startX = width / 2 - (totalCols - 1) * 120 / 2
      return {
        ...node,
        x: startX + col * 120,
        y: 200 + row * 120
      }
    })
    
    console.log('✅ Real data nodes:', [hubNode, ...positionedNodes].map(n => `${n.name} (${n.type})`))
    console.log('✅ Real data links:', connectedLinks.length)
    
    setNodes([hubNode, ...positionedNodes])
    setLinks(connectedLinks)
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

  const getNodeStyle = (node: GraphNode) => {
    const baseStyle = {
      position: 'absolute' as const,
      transform: `translate(-50%, -50%) scale(${zoom})`,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      zIndex: node.type === 'HUB' ? 10 : 5
    }

    const width = node.type === 'HUB' ? 120 : node.type === 'SUBHUB' ? 100 : 80
    const height = node.type === 'HUB' ? 60 : node.type === 'SUBHUB' ? 50 : 40
    const color = node.type === 'HUB' ? '#3b82f6' : node.type === 'SUBHUB' ? '#60a5fa' : '#fbbf24'
    const borderColor = node.type === 'HUB' ? '#1d4ed8' : node.type === 'SUBHUB' ? '#3b82f6' : '#d97706'

    return {
      ...baseStyle,
      left: `${node.x || 0}px`,
      top: `${node.y || 0}px`,
      width: `${width}px`,
      height: `${height}px`,
      backgroundColor: color,
      border: `2px solid ${borderColor}`,
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: node.type === 'HUB' ? '12px' : '10px',
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center' as const,
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      borderStyle: node.type === 'SUBHUB' ? 'dashed' : 'solid'
    }
  }

  const getLinkStyle = (link: GraphLink) => {
    const sourceNode = nodes.find(n => n.id === link.source)
    const targetNode = nodes.find(n => n.id === link.target)
    
    if (!sourceNode || !targetNode) return { display: 'none' }

    const x1 = sourceNode.x || 0
    const y1 = (sourceNode.y || 0) + 30 // Start from bottom of source node
    const x2 = targetNode.x || 0
    const y2 = (targetNode.y || 0) - 20 // End at top of target node

    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI

    return {
      position: 'absolute' as const,
      left: `${x1}px`,
      top: `${y1}px`,
      width: `${length}px`,
      height: '3px',
      backgroundColor: link.type === 'subhub' ? '#60a5fa' : '#fbbf24',
      transformOrigin: '0 0',
      transform: `rotate(${angle}deg) scale(${zoom})`,
      zIndex: 1,
      opacity: 0.8,
      borderStyle: link.type === 'subhub' ? 'dashed' : 'solid'
    }
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

      {/* Graph Container */}
      <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden relative" style={{ width: '100%', height: '100%', maxWidth: width, maxHeight: height }}>
        {/* Links */}
        {links.map((link, index) => (
          <div
            key={`link-${index}`}
            style={getLinkStyle(link)}
          />
        ))}
        
        {/* Nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            style={getNodeStyle(node)}
            onClick={() => {
              setSelectedNode(node)
              onNodeSelect?.(node)
            }}
            className="hover:scale-110 transition-transform"
          >
            <div className="text-xs font-bold truncate px-1">
              {node.name.length > 8 ? node.name.substring(0, 8) + '...' : node.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

