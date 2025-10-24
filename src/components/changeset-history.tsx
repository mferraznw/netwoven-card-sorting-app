'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  X, 
  Search, 
  User, 
  Calendar, 
  GitBranch,
  CheckCircle,
  Clock,
  RotateCcw,
  Filter,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Changeset {
  id: string
  userId: string
  userName: string
  title: string
  description?: string
  status: 'PENDING' | 'COMMITTED' | 'REVERTED'
  createdAt: string
  updatedAt: string
  changes: Change[]
}

interface Change {
  id: string
  siteId: string
  siteName: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSOCIATE' | 'DISASSOCIATE'
  oldData?: any
  newData?: any
  createdAt: string
}

interface ChangesetHistoryProps {
  isOpen: boolean
  onClose: () => void
}

export function ChangesetHistory({ isOpen, onClose }: ChangesetHistoryProps) {
  const [changesets, setChangesets] = useState<Changeset[]>([])
  const [filteredChangesets, setFilteredChangesets] = useState<Changeset[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'COMMITTED' | 'REVERTED'>('all')
  const [loading, setLoading] = useState(true)

  // Fetch real data from API with caching
  useEffect(() => {
    const fetchChangesets = async () => {
      try {
        // Check cache first (disabled due to quota issues)
        // const cacheKey = 'changesets-data'
        // const cachedData = sessionStorage.getItem(cacheKey)
        // const cacheTimestamp = sessionStorage.getItem(cacheKey + '-timestamp')
        // const now = Date.now()
        // const cacheExpiry = 2 * 60 * 1000 // 2 minutes (changesets change more frequently)

        // if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < cacheExpiry) {
        //   console.log('📦 Loading changesets from cache')
        //   const data = JSON.parse(cachedData)
        //   setChangesets(data)
        //   setFilteredChangesets(data)
        //   setLoading(false)
        //   return
        // }

        console.log('🌐 Fetching changesets from API')
        const response = await fetch('/api/changesets')
        if (response.ok) {
          const data = await response.json()
          
          // Cache disabled due to quota issues
          // sessionStorage.setItem(cacheKey, JSON.stringify(data))
          // sessionStorage.setItem(cacheKey + '-timestamp', now.toString())
          
          setChangesets(data)
          setFilteredChangesets(data)
        } else {
          console.error('Failed to fetch changesets:', response.statusText)
          setChangesets([])
          setFilteredChangesets([])
        }
      } catch (error) {
        console.error('Error fetching changesets:', error)
        setChangesets([])
        setFilteredChangesets([])
      } finally {
        setLoading(false)
      }
    }

    fetchChangesets()
  }, [])

  // Filter changesets based on search term and status
  useEffect(() => {
    let filtered = changesets

    if (searchTerm) {
      filtered = filtered.filter(changeset =>
        changeset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        changeset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        changeset.userName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(changeset => changeset.status === statusFilter)
    }

    setFilteredChangesets(filtered)
  }, [changesets, searchTerm, statusFilter])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMMITTED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'REVERTED':
        return <RotateCcw className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMMITTED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'REVERTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800'
      case 'DELETE':
        return 'bg-red-100 text-red-800'
      case 'ASSOCIATE':
        return 'bg-purple-100 text-purple-800'
      case 'DISASSOCIATE':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const handleExportChangesets = () => {
    // TODO: Implement changeset export functionality
    console.log('Exporting changesets...')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center space-x-2">
            <GitBranch className="h-5 w-5" />
            <span>Changeset History</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col">
          {/* Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search changesets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleExportChangesets}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
            </div>

            <div className="flex space-x-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('PENDING')}
                className="flex items-center space-x-1"
              >
                <Clock className="h-3 w-3" />
                <span>Pending</span>
              </Button>
              <Button
                variant={statusFilter === 'COMMITTED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('COMMITTED')}
                className="flex items-center space-x-1"
              >
                <CheckCircle className="h-3 w-3" />
                <span>Committed</span>
              </Button>
              <Button
                variant={statusFilter === 'REVERTED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('REVERTED')}
                className="flex items-center space-x-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reverted</span>
              </Button>
            </div>
          </div>

          {/* Changesets List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="loading-skeleton h-32 w-full" />
                ))}
              </div>
            ) : filteredChangesets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No changesets found</p>
                {searchTerm && (
                  <p className="text-sm">Try adjusting your search terms</p>
                )}
              </div>
            ) : (
              filteredChangesets.map((changeset) => (
                <Card key={changeset.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-lg">{changeset.title}</h3>
                          <Badge className={cn("text-xs", getStatusColor(changeset.status))}>
                            {getStatusIcon(changeset.status)}
                            <span className="ml-1">{changeset.status}</span>
                          </Badge>
                        </div>
                        
                        {changeset.description && (
                          <p className="text-gray-600 text-sm mb-3">{changeset.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{changeset.userName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(changeset.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <GitBranch className="h-4 w-4" />
                            <span>{changeset.changes?.length || 0} changes</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Changes Details */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">Changes:</h4>
                      <div className="space-y-1">
                        {(changeset.changes || []).map((change) => (
                          <div key={change.id} className="flex items-center space-x-2 text-sm">
                            <Badge className={cn("text-xs", getActionColor(change.action))}>
                              {change.action}
                            </Badge>
                            <span className="text-gray-600">{change.siteName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
