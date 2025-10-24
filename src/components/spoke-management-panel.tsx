'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { 
  Users, 
  GitBranch, 
  Search, 
  Building, 
  Link, 
  Unlink,
  RefreshCw,
  AlertCircle
} from 'lucide-react'

interface Site {
  id: string
  name: string
  url: string
  siteType: 'HUB' | 'SPOKE' | 'SUBHUB'
  isHub: boolean
  isSpoke: boolean
  parentHubId?: string | null
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
}

interface SpokeManagementPanelProps {
  selectedHub: Site | null
  onAssociationChange: () => void
}

export function SpokeManagementPanel({ selectedHub, onAssociationChange }: SpokeManagementPanelProps) {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [draggedSite, setDraggedSite] = useState<Site | null>(null)
  const [activeTab, setActiveTab] = useState('spokes')

  // Fetch all sites
  useEffect(() => {
    const fetchSites = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/sites')
        if (response.ok) {
          const data = await response.json()
          setSites(data)
        } else {
          console.error('Failed to fetch sites:', response.statusText)
          setSites([])
        }
      } catch (error) {
        console.error('Error fetching sites:', error)
        setSites([])
      } finally {
        setLoading(false)
      }
    }
    fetchSites()
  }, [])

  // Get spokes of the selected hub
  const hubSpokes = selectedHub 
    ? sites.filter(site => site.parentHubId === selectedHub.id)
    : []

  // Get unassigned sites (not associated with any hub)
  const unassignedSites = sites.filter(site => 
    !site.parentHubId && 
    !site.isHub && 
    site.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get filtered spokes
  const filteredSpokes = hubSpokes.filter(spoke =>
    spoke.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDragStart = (e: React.DragEvent, site: Site) => {
    setDraggedSite(site)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', site.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetHub: Site) => {
    e.preventDefault()
    
    if (!draggedSite || !targetHub) return

    try {
      // Determine the new siteType
      let newSiteType: 'HUB' | 'SPOKE' | 'SUBHUB' = 'SPOKE'
      if (draggedSite.isHub) {
        newSiteType = 'SUBHUB' // Hub becomes subhub when associated with another hub
      } else {
        newSiteType = 'SPOKE' // Regular site becomes spoke
      }

      const response = await fetch(`/api/sites/${draggedSite.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          parentHubId: targetHub.id,
          siteType: newSiteType
        }),
      })

      if (response.ok) {
        toast.success(`'${draggedSite.name}' associated with '${targetHub.name}'`)
        onAssociationChange()
        setDraggedSite(null)
      } else {
        const errorData = await response.json()
        toast.error(`Failed to associate site: ${errorData.error || response.statusText}`)
      }
    } catch (error) {
      console.error('Error associating site:', error)
      toast.error('An unexpected error occurred during association.')
    }
  }

  const handleDisassociate = async (site: Site) => {
    if (!site.parentHubId) return

    try {
      // When disassociating, if the site was a SUBHUB, it should revert to a HUB
      const newSiteType = site.siteType === 'SUBHUB' ? 'HUB' : 'SPOKE'

      const response = await fetch(`/api/sites/${site.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          parentHubId: null,
          siteType: newSiteType
        }),
      })

      if (response.ok) {
        toast.success(`'${site.name}' disassociated from hub`)
        onAssociationChange()
      } else {
        const errorData = await response.json()
        toast.error(`Failed to disassociate site: ${errorData.error || response.statusText}`)
      }
    } catch (error) {
      console.error('Error disassociating site:', error)
      toast.error('An unexpected error occurred during disassociation.')
    }
  }

  if (!selectedHub) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Spoke Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a hub from the left panel to manage its spokes.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Spoke Management</span>
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Building className="h-4 w-4 text-dmv-blue-600" />
          <span className="text-sm font-medium">{selectedHub.name}</span>
          <Badge className="bg-dmv-blue-100 text-dmv-blue-800">
            {hubSpokes.length} spokes
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search sites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Simple toggle for Spokes vs Unassigned */}
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Button
              variant={activeTab === 'spokes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('spokes')}
              className="flex items-center space-x-1"
            >
              <GitBranch className="h-4 w-4" />
              <span>Spokes ({filteredSpokes.length})</span>
            </Button>
            <Button
              variant={activeTab === 'unassigned' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('unassigned')}
              className="flex items-center space-x-1"
            >
              <Users className="h-4 w-4" />
              <span>Unassigned ({unassignedSites.length})</span>
            </Button>
          </div>

          {/* Spokes Content */}
          {activeTab === 'spokes' && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600 mb-3">
                Sites currently associated with this hub. Drag to another hub to reassociate.
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredSpokes.map((spoke) => (
                  <div
                    key={spoke.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, spoke)}
                    className="p-3 bg-dmv-yellow-50 border border-dmv-yellow-200 rounded-lg cursor-move hover:bg-dmv-yellow-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="h-4 w-4 text-gray-400">↕️</span>
                        <div>
                          <div className="font-medium text-sm">{spoke.name}</div>
                          <div className="text-xs text-gray-500">
                            {spoke.division && `${spoke.division} • `}
                            {spoke.lastActivity && `Last activity: ${new Date(spoke.lastActivity).toLocaleDateString()}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-dmv-yellow-100 text-dmv-yellow-800">
                          {spoke.siteType}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisassociate(spoke)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Unlink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredSpokes.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No spokes found</p>
                    <p className="text-xs">Try the "Unassigned" tab to add sites to this hub</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Unassigned Content */}
          {activeTab === 'unassigned' && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600 mb-3">
                Sites not associated with any hub. Drag to a hub to associate.
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {unassignedSites.map((site) => (
                  <div
                    key={site.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, site)}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="h-4 w-4 text-gray-400">↕️</span>
                        <div>
                          <div className="font-medium text-sm">{site.name}</div>
                          <div className="text-xs text-gray-500">
                            {site.division && `${site.division} • `}
                            {site.lastActivity && `Last activity: ${new Date(site.lastActivity).toLocaleDateString()}`}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-gray-100 text-gray-800">
                        {site.siteType}
                      </Badge>
                    </div>
                  </div>
                ))}
                {unassignedSites.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No unassigned sites found</p>
                    <p className="text-xs">All sites are already associated with hubs</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700">
              <div className="font-medium mb-1">How to manage associations:</div>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Drag spokes</strong> to other hubs to reassociate them</li>
                <li>• <strong>Drag unassigned sites</strong> to hubs to associate them</li>
                <li>• <strong>Click the unlink button</strong> to disassociate spokes</li>
                <li>• <strong>Changes are saved automatically</strong> to the database</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
