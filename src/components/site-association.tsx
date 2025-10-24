'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Plus, 
  Building, 
  GitBranch, 
  Users,
  Link,
  Unlink,
  Save,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Site {
  id: string
  name: string
  url: string
  siteType: 'HUB' | 'SPOKE' | 'SUBHUB'
  isHub: boolean
  isSpoke: boolean
  parentHubId?: string
  division?: string
  lastActivity?: string
  fileCount: number
  storageUsed: number
  storagePercentage: number
  isAssociatedWithTeam: boolean
  teamName?: string
  createdBy?: string
  memberCount?: number
  ownerCount?: number
  spokeCount?: number
}

interface SiteAssociationProps {
  selectedSite: Site | null
  onAssociationChange: () => void
}

export function SiteAssociation({ selectedSite, onAssociationChange }: SiteAssociationProps) {
  const [sites, setSites] = useState<Site[]>([])
  const [hubs, setHubs] = useState<Site[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedHub, setSelectedHub] = useState<Site | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch all sites and hubs
  useEffect(() => {
    const fetchSites = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/sites')
        if (response.ok) {
          const data = await response.json()
          setSites(data)
          setHubs(data.filter((site: Site) => site.isHub))
        }
      } catch (error) {
        console.error('Error fetching sites:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSites()
  }, [])

  // Filter hubs based on search term
  const filteredHubs = hubs.filter(hub => 
    hub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hub.division?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAssociate = async () => {
    if (!selectedSite || !selectedHub) return

    try {
      setSaving(true)
      const response = await fetch(`/api/sites/${selectedSite.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentHubId: selectedHub.id,
          siteType: selectedSite.isHub ? 'SUBHUB' : 'SPOKE'
        }),
      })

      if (response.ok) {
        console.log('✅ Site associated successfully')
        onAssociationChange()
        setSelectedHub(null)
        setSearchTerm('')
      } else {
        console.error('Failed to associate site')
      }
    } catch (error) {
      console.error('Error associating site:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDisassociate = async () => {
    if (!selectedSite) return

    try {
      setSaving(true)
      const response = await fetch(`/api/sites/${selectedSite.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentHubId: null,
          siteType: selectedSite.isHub ? 'HUB' : 'SPOKE'
        }),
      })

      if (response.ok) {
        console.log('✅ Site disassociated successfully')
        onAssociationChange()
      } else {
        console.error('Failed to disassociate site')
      }
    } catch (error) {
      console.error('Error disassociating site:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!selectedSite) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link className="h-5 w-5" />
            <span>Site Association</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Select a site to associate it with a hub
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Link className="h-5 w-5" />
          <span>Associate Site</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Site Info */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            {selectedSite.isHub ? (
              <Building className="h-4 w-4 text-dmv-blue-600" />
            ) : (
              <Users className="h-4 w-4 text-dmv-yellow-600" />
            )}
            <span className="font-medium">{selectedSite.name}</span>
            <Badge className={
              selectedSite.siteType === 'HUB' ? 'bg-dmv-blue-100 text-dmv-blue-800' :
              selectedSite.siteType === 'SUBHUB' ? 'bg-dmv-blue-50 text-dmv-blue-600' :
              'bg-dmv-yellow-100 text-dmv-yellow-800'
            }>
              {selectedSite.siteType}
            </Badge>
          </div>
          {selectedSite.parentHubId && (
            <div className="text-sm text-gray-600">
              Currently associated with: {sites.find(s => s.id === selectedSite.parentHubId)?.name || 'Unknown Hub'}
            </div>
          )}
          
          {/* Association Instructions */}
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
            <div className="font-medium text-blue-800 mb-1">Association Options:</div>
            <ul className="text-blue-700 space-y-1">
              {selectedSite.isHub ? (
                <>
                  <li>• <strong>Create Subhub:</strong> Associate this hub with another hub</li>
                  <li>• <strong>Add Spokes:</strong> Associate individual sites with this hub</li>
                </>
              ) : (
                <li>• <strong>Associate with Hub:</strong> Connect this site to a hub or subhub</li>
              )}
            </ul>
          </div>
        </div>

        {/* Current Association */}
        {selectedSite.parentHubId && (
          <div className="flex items-center justify-between p-3 bg-dmv-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <GitBranch className="h-4 w-4 text-dmv-blue-600" />
              <span className="text-sm">
                Associated with: {sites.find(s => s.id === selectedSite.parentHubId)?.name}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisassociate}
              disabled={saving}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Unlink className="h-4 w-4 mr-1" />
              Disassociate
            </Button>
          </div>
        )}

        {/* Hub Selection */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {selectedSite.isHub ? 'Select Parent Hub (to create subhub)' : 'Select Hub to Associate With'}
            </label>
            <div className="text-xs text-gray-500 mb-2">
              {selectedSite.isHub 
                ? 'Choose a hub to make this hub a subhub of that hub'
                : 'Choose a hub or subhub to associate this site with'
              }
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search hubs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Hub List */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredHubs.map((hub) => (
              <div
                key={hub.id}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all duration-200",
                  selectedHub?.id === hub.id
                    ? "border-dmv-blue-300 bg-dmv-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
                onClick={() => setSelectedHub(hub)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-dmv-blue-600" />
                    <span className="font-medium text-sm">{hub.name}</span>
                    <Badge className={
                      hub.siteType === 'HUB' ? 'bg-dmv-blue-100 text-dmv-blue-800' :
                      hub.siteType === 'SUBHUB' ? 'bg-dmv-blue-50 text-dmv-blue-600' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {hub.siteType}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    {hub.spokeCount || 0} spokes
                  </div>
                </div>
                {hub.division && (
                  <div className="text-xs text-gray-500 mt-1">
                    {hub.division}
                  </div>
                )}
                {selectedSite.isHub && (
                  <div className="text-xs text-blue-600 mt-1">
                    {selectedSite.id === hub.id ? 'Cannot associate with itself' : 'Will create subhub relationship'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-4">
          <Button
            onClick={handleAssociate}
            disabled={!selectedHub || saving || selectedSite.id === selectedHub?.id}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Associating...' : 
             selectedSite.isHub ? 'Create Subhub' : 'Associate Site'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedHub(null)
              setSearchTerm('')
            }}
            disabled={saving}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
