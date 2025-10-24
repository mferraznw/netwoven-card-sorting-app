'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Network } from 'lucide-react'
import { SiteListPanel } from './site-list-panel'
import { SimpleGraphVisualization } from './simple-graph-visualization'
import { SpokeManagementPanel } from './spoke-management-panel'

interface ResizableGraphViewProps {
  selectedHub: any
  onHubSelect: (hub: any) => void
  onAssociationChange: (changes: any[]) => void
  onClearSelection: () => void
}

export function ResizableGraphView({
  selectedHub,
  onHubSelect,
  onAssociationChange,
  onClearSelection
}: ResizableGraphViewProps) {
  const [leftWidth, setLeftWidth] = useState(30) // percentage
  const [rightWidth, setRightWidth] = useState(25) // percentage
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent, position: 'left' | 'right') => {
    e.preventDefault()
    setIsResizing(true)
    
    const startX = e.clientX
    const startLeftWidth = leftWidth
    const startRightWidth = rightWidth

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      
      const containerWidth = containerRef.current.offsetWidth
      const deltaX = e.clientX - startX
      const deltaPercent = (deltaX / containerWidth) * 100

      if (position === 'left') {
        const newLeftWidth = Math.max(15, Math.min(60, startLeftWidth + deltaPercent))
        const newRightWidth = Math.max(15, Math.min(60, startRightWidth - deltaPercent))
        setLeftWidth(newLeftWidth)
        setRightWidth(newRightWidth)
      } else {
        const newRightWidth = Math.max(15, Math.min(60, startRightWidth + deltaPercent))
        const newLeftWidth = Math.max(15, Math.min(60, startLeftWidth - deltaPercent))
        setRightWidth(newRightWidth)
        setLeftWidth(newLeftWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [leftWidth, rightWidth])

  const centerWidth = 100 - leftWidth - rightWidth

  return (
    <div 
      ref={containerRef}
      className="flex h-[calc(100vh-200px)] relative"
      style={{ userSelect: isResizing ? 'none' : 'auto' }}
    >
      {/* Left Panel - Site List */}
      <div 
        className="min-w-0 flex-shrink-0"
        style={{ width: `${leftWidth}%` }}
      >
        <SiteListPanel 
          onHubSelect={onHubSelect}
          onDrop={onAssociationChange}
        />
      </div>

      {/* Left Resize Handle */}
      <div
        className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors duration-200 flex-shrink-0 relative group"
        onMouseDown={(e) => handleMouseDown(e, 'left')}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-0.5 h-8 bg-gray-400 group-hover:bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      </div>

      {/* Center Panel - Graph Visualization */}
      <div 
        className="min-w-0 flex-shrink-0"
        style={{ width: `${centerWidth}%` }}
      >
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center space-x-2">
              <Network className="h-5 w-5" />
              <span>Hub & Spoke Hierarchy</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-4">
            <div className="h-full w-full">
              <SimpleGraphVisualization 
                width={400}
                height={500}
                selectedHub={selectedHub}
                onNodeSelect={onClearSelection}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Resize Handle */}
      <div
        className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors duration-200 flex-shrink-0 relative group"
        onMouseDown={(e) => handleMouseDown(e, 'right')}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-0.5 h-8 bg-gray-400 group-hover:bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      </div>

      {/* Right Panel - Spoke Management */}
      <div 
        className="min-w-0 flex-shrink-0"
        style={{ width: `${rightWidth}%` }}
      >
        <SpokeManagementPanel 
          selectedHub={selectedHub}
          onAssociationChange={onAssociationChange}
        />
      </div>
    </div>
  )
}
