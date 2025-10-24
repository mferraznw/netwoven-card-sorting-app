'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Building, 
  Users, 
  Calendar,
  HardDrive,
  GitBranch,
  ExternalLink
} from 'lucide-react'


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
}

interface SiteListPanelProps {
  showHierarchy?: boolean
  onHubSelect?: (hub: Site) => void
  onSiteSelect?: (site: Site) => void
  onDrop?: () => void
}

export function SiteListPanel({ showHierarchy = false, onHubSelect, onSiteSelect, onDrop }: SiteListPanelProps) {
  const [sites, setSites] = useState<Site[]>([])
  const [filteredSites, setFilteredSites] = useState<Site[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'hub' | 'spoke' | 'subhub'>('all')
  const [draggedSite, setDraggedSite] = useState<Site | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch real data from API with caching
  useEffect(() => {
    const fetchSites = async () => {
      try {
        // Check cache first (disabled due to quota issues)
        // const cacheKey = 'sites-data'
        // const cachedData = sessionStorage.getItem(cacheKey)
        // const cacheTimestamp = sessionStorage.getItem(cacheKey + '-timestamp')
        // const now = Date.now()
        // const cacheExpiry = 5 * 60 * 1000 // 5 minutes

        // if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < cacheExpiry) {
        //   console.log('📦 Loading sites from cache')
        //   const data = JSON.parse(cachedData)
        //   setSites(data)
        //   setFilteredSites(data)
        //   setLoading(false)
        //   return
        // }

        console.log('🌐 Fetching sites from API')
        const response = await fetch('/api/sites')
        if (response.ok) {
          const data = await response.json()
          
          // Cache disabled due to quota issues
          // sessionStorage.setItem(cacheKey, JSON.stringify(data))
          // sessionStorage.setItem(cacheKey + '-timestamp', now.toString())
          
          setSites(data)
          setFilteredSites(data)
        } else {
          console.error('Failed to fetch sites:', response.statusText)
          // Fallback to empty array if API fails
          setSites([])
          setFilteredSites([])
        }
      } catch (error) {
        console.error('Error fetching sites:', error)
        // Fallback to empty array if API fails
        setSites([])
        setFilteredSites([])
      } finally {
        setLoading(false)
      }
    }

    fetchSites()
  }, [])

  // Filter sites based on search term and type
  useEffect(() => {
    let filtered = sites

    if (searchTerm) {
      filtered = filtered.filter(site =>
        site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.division?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(site => site.siteType === filterType.toUpperCase())
    }

    setFilteredSites(filtered)
  }, [sites, searchTerm, filterType])

  const getSiteIcon = (site: Site) => {
    switch (site.siteType) {
      case 'HUB':
        return <span className="h-4 w-4 text-dmv-blue-600">🏢</span>
      case 'SUBHUB':
        return <span className="h-4 w-4 text-dmv-blue-400">🌿</span>
      case 'SPOKE':
        return <span className="h-4 w-4 text-dmv-yellow-600">👥</span>
      default:
        return <span className="h-4 w-4 text-gray-500">🏢</span>
    }
  }

  const getSiteTypeColor = (site: Site) => {
    switch (site.siteType) {
      case 'HUB':
        return 'bg-dmv-blue-100 text-dmv-blue-800'
      case 'SUBHUB':
        return 'bg-dmv-blue-50 text-dmv-blue-600'
      case 'SPOKE':
        return 'bg-dmv-yellow-100 text-dmv-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  const formatStorage = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const handleDragStart = (e: React.DragEvent, site: Site) => {
    setDraggedSite(site)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', site.id)
  }

  const handleDragOver = (e: React.DragEvent, targetHub: Site) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetHub: Site) => {
    e.preventDefault()
    
    if (!draggedSite || !targetHub || draggedSite.id === targetHub.id) return

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
        console.log(`✅ Successfully associated ${draggedSite.name} with ${targetHub.name}`)
        onDrop?.() // Trigger refresh
      } else {
        const errorData = await response.json()
        console.error(`❌ Failed to associate site: ${errorData.error || response.statusText}`)
      }
    } catch (error) {
      console.error('❌ Error associating site:', error)
    } finally {
      setDraggedSite(null)
    }
  }

  if (loading) {
    return (
      <div className="h-full rounded-lg border bg-white shadow-sm">
        <div className="p-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">Loading Sites...</h3>
        </div>
        <div className="p-6 pt-0">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="loading-skeleton h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col rounded-lg border bg-white shadow-sm">
      <div className="p-6 pb-4">
        <h3 className="flex items-center space-x-2 text-2xl font-semibold leading-none tracking-tight">
          <span className="h-5 w-5">🏢</span>
          <span>{showHierarchy ? 'Hierarchical View' : 'Site List'}</span>
        </h3>
        
        <div className="space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search sites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-dmv-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterType('all')}
              className={`text-xs px-3 py-1 rounded ${
                filterType === 'all' 
                  ? 'bg-dmv-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('hub')}
              className={`text-xs px-3 py-1 rounded ${
                filterType === 'hub' 
                  ? 'bg-dmv-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Hubs
            </button>
            <button
              onClick={() => setFilterType('spoke')}
              className={`text-xs px-3 py-1 rounded ${
                filterType === 'spoke' 
                  ? 'bg-dmv-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Spokes
            </button>
            <button
              onClick={() => setFilterType('subhub')}
              className={`text-xs px-3 py-1 rounded ${
                filterType === 'subhub' 
                  ? 'bg-dmv-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Subhubs
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-0">
        <div className="space-y-2">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedSite?.id === site.id
                  ? "border-dmv-blue-300 bg-dmv-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              } ${draggedSite?.id === site.id ? "opacity-50" : ""}`}
              draggable={!site.isHub} // Only allow dragging non-hubs (spokes and unassigned sites)
              onDragStart={(e) => handleDragStart(e, site)}
              onDragOver={(e) => site.isHub && handleDragOver(e, site)}
              onDrop={(e) => site.isHub && handleDrop(e, site)}
              onClick={() => {
                console.log('🖱️ Site clicked:', site.name, 'Type:', site.siteType, 'IsHub:', site.isHub)
                setSelectedSite(site)
                onSiteSelect?.(site)
                // If it's a hub, trigger graph filtering
                if ((site.isHub || site.siteType === 'HUB') && onHubSelect) {
                  console.log('🎯 Calling onHubSelect for hub:', site.name)
                  onHubSelect(site)
                } else {
                  console.log('❌ Not a hub or onHubSelect not provided')
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {getSiteIcon(site)}
                    {!site.isHub && (
                      <span className="h-3 w-3 text-gray-400">↕️</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-sm truncate">{site.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getSiteTypeColor(site)}`}>
                        {site.siteType}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center space-x-1">
                        <span className="h-3 w-3">📅</span>
                        <span>Last activity: {formatDate(site.lastActivity)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <span className="h-3 w-3">💾</span>
                          <span>{site.fileCount} files</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="h-3 w-3">👥</span>
                          <span>{site.memberCount || 0} members</span>
                        </div>
                        {site.isHub && (
                          <div className="flex items-center space-x-1">
                            <span className="h-3 w-3">🌿</span>
                            <span className="text-dmv-blue-600 font-medium">
                              {(site as any).spokeCount || 0} spokes
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {site.teamName && (
                        <div className="text-xs text-dmv-blue-600">
                          Team: {site.teamName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  className="h-6 w-6 p-0 hover:bg-gray-100 rounded"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(site.url, '_blank')
                  }}
                >
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {filteredSites.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No sites found</p>
            {searchTerm && (
              <p className="text-sm">Try adjusting your search terms</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
