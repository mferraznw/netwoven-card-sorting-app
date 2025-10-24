'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DebugPanelProps {
  selectedHub: any
  allNodesCount: number
  filteredNodesCount: number
  allLinksCount: number
  filteredLinksCount: number
}

export function DebugPanel({ 
  selectedHub, 
  allNodesCount, 
  filteredNodesCount, 
  allLinksCount, 
  filteredLinksCount 
}: DebugPanelProps) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm">Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>
          <strong>Selected Hub:</strong> {selectedHub ? selectedHub.name : 'None'}
        </div>
        <div>
          <strong>Hub ID:</strong> {selectedHub?.id || 'N/A'}
        </div>
        <div>
          <strong>All Nodes:</strong> {allNodesCount}
        </div>
        <div>
          <strong>Filtered Nodes:</strong> {filteredNodesCount}
        </div>
        <div>
          <strong>All Links:</strong> {allLinksCount}
        </div>
        <div>
          <strong>Filtered Links:</strong> {filteredLinksCount}
        </div>
        <div className="pt-2">
          <Badge variant={selectedHub ? 'default' : 'secondary'}>
            {selectedHub ? 'Hub Selected' : 'No Hub Selected'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}


