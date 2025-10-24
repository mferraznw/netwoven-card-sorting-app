'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Plus, 
  Download, 
  Edit, 
  Trash2, 
  Building, 
  GitBranch,
  ExternalLink,
  Clock,
  HardDrive,
  User,
  FileText
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
  spokeCount?: number
}

interface DivisionData {
  [hubName: string]: {
    url: string
    spokes: Site[]
  }
}

interface ManagerData {
  [division: string]: DivisionData
}

export function SharePointHubSpokeManager() {
  const [data, setData] = useState<ManagerData>({})
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null)
  const [selectedHub, setSelectedHub] = useState<string | null>(null)
  const [draggedSpoke, setDraggedSpoke] = useState<{division: string, hub: string, idx: number} | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddHubModal, setShowAddHubModal] = useState(false)
  const [showEditHubModal, setShowEditHubModal] = useState(false)
  const [showDeleteSpokeModal, setShowDeleteSpokeModal] = useState(false)
  const [editingHub, setEditingHub] = useState<{division: string, name: string} | null>(null)
  const [deletingSpokeIdx, setDeletingSpokeIdx] = useState<number | null>(null)
  const [newHubName, setNewHubName] = useState('')
  const [newDivisionName, setNewDivisionName] = useState('')
  const [newHubUrl, setNewHubUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load data from database
  useEffect(() => {
    loadDataFromDatabase()
  }, [])

  const loadDataFromDatabase = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/sites')
      if (response.ok) {
        const sites: Site[] = await response.json()
        transformSitesToManagerData(sites)
      } else {
        console.error('Failed to fetch sites:', response.statusText)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const transformSitesToManagerData = (sites: Site[]) => {
    const managerData: ManagerData = {}
    
    sites.forEach(site => {
      const division = site.division || 'Unspecified Division'
      
      if (!managerData[division]) {
        managerData[division] = {}
      }

      if (site.isHub) {
        // This is a hub
        managerData[division][site.name] = {
          url: site.url,
          spokes: (site as any).spokes || []
        }
      } else if (site.isSpoke && site.parentHubId) {
        // This is a spoke - find its parent hub
        const parentHub = sites.find(s => s.id === site.parentHubId)
        if (parentHub) {
          const hubName = parentHub.name
          const hubDivision = parentHub.division || 'Unspecified Division'
          
          if (!managerData[hubDivision]) {
            managerData[hubDivision] = {}
          }
          if (!managerData[hubDivision][hubName]) {
            managerData[hubDivision][hubName] = {
              url: parentHub.url,
              spokes: []
            }
          }
          
          managerData[hubDivision][hubName].spokes.push(site)
        }
      }
    })
    
    setData(managerData)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/csv/upload', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('CSV uploaded successfully:', result)
        // Reload data from database
        await loadDataFromDatabase()
      } else {
        console.error('Failed to upload CSV:', response.statusText)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) return

    const header = lines[0].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase())
    const idx = (k: string) => header.indexOf(k)
    const get = (row: string[], k: string) => idx(k) !== -1 ? (row[idx(k)] || '').replace(/^"|"$/g, '').trim() : ''

    const newData: ManagerData = {}
    
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
      const div = get(row, 'division')
      if (!div) continue
      
      const hub = get(row, 'hub site name') || 'Unspecified Hub'
      const hubUrl = get(row, 'hub url') || '#'
      const spoke = get(row, 'spoke site name') || 'Unnamed Spoke'
      const spokeUrl = get(row, 'spoke url') || '#'
      const last = get(row, 'last activity (utc)')
      const files = get(row, 'files')
      const storage = get(row, 'storage used (%)')
      const created = get(row, 'created by')

      if (!newData[div]) newData[div] = {}
      if (!newData[div][hub]) newData[div][hub] = { url: hubUrl, spokes: [] }
      
      newData[div][hub].spokes.push({
        id: `spoke-${i}`,
        name: spoke,
        url: spokeUrl,
        siteType: 'SPOKE',
        isHub: false,
        isSpoke: true,
        division: div,
        lastActivity: last,
        fileCount: parseInt(files) || 0,
        storageUsed: parseFloat(storage) || 0,
        storagePercentage: parseFloat(storage) || 0,
        isAssociatedWithTeam: false,
        createdBy: created,
        spokeCount: 0
      })
    }
    
    setData(newData)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'text/csv') {
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch('/api/csv/upload', {
          method: 'POST',
          body: formData
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('CSV uploaded successfully:', result)
          // Reload data from database
          await loadDataFromDatabase()
        } else {
          console.error('Failed to upload CSV:', response.statusText)
        }
      } catch (error) {
        console.error('Error uploading dropped file:', error)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleHubSelect = (division: string, hub: string) => {
    setSelectedDivision(division)
    setSelectedHub(hub)
  }

  const handleSpokeDragStart = (division: string, hub: string, idx: number) => {
    setDraggedSpoke({ division, hub, idx })
  }

  const handleSpokeDragEnd = () => {
    setDraggedSpoke(null)
  }

  const handleSpokeDrop = async (targetDivision: string, targetHub: string) => {
    if (!draggedSpoke) return

    const { division: oldDiv, hub: oldHub, idx } = draggedSpoke
    const movedSpoke = data[oldDiv][oldHub].spokes[idx]
    
    // Update local state
    const newData = { ...data }
    newData[oldDiv][oldHub].spokes.splice(idx, 1)
    newData[targetDivision][targetHub].spokes.push(movedSpoke)
    setData(newData)
    
    // TODO: Update database
    // await updateSpokeAssociation(movedSpoke.id, targetHub)
    
    setDraggedSpoke(null)
  }

  const handleAddHub = async () => {
    if (!newDivisionName || !newHubName) return

    try {
      const response = await fetch('/api/hubs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newHubName,
          url: newHubUrl || '#',
          division: newDivisionName,
          createdBy: 'System'
        })
      })

      if (response.ok) {
        // Reload data from database
        await loadDataFromDatabase()
        setShowAddHubModal(false)
        setNewDivisionName('')
        setNewHubName('')
        setNewHubUrl('')
      } else {
        console.error('Failed to create hub:', response.statusText)
      }
    } catch (error) {
      console.error('Error creating hub:', error)
    }
  }

  const handleEditHub = async () => {
    if (!editingHub || !newHubName) return

    try {
      // Find the hub ID from the current data
      const hubData = data[editingHub.division][editingHub.name]
      const allSites = await fetch('/api/sites').then(res => res.json())
      const hub = allSites.find((s: Site) => s.name === editingHub.name && s.division === editingHub.division && s.isHub)
      
      if (!hub) {
        console.error('Hub not found in database')
        return
      }

      const response = await fetch('/api/hubs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: hub.id,
          name: newHubName,
          url: hubData.url,
          division: editingHub.division
        })
      })

      if (response.ok) {
        // Reload data from database
        await loadDataFromDatabase()
        
        if (selectedHub === editingHub.name) {
          setSelectedHub(newHubName)
        }
        
        setShowEditHubModal(false)
        setEditingHub(null)
        setNewHubName('')
      } else {
        console.error('Failed to update hub:', response.statusText)
      }
    } catch (error) {
      console.error('Error updating hub:', error)
    }
  }

  const handleDeleteSpoke = async () => {
    if (!selectedDivision || !selectedHub || deletingSpokeIdx === null) return

    try {
      const spokeToDelete = data[selectedDivision][selectedHub].spokes[deletingSpokeIdx]
      
      const response = await fetch(`/api/spokes?id=${spokeToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Reload data from database
        await loadDataFromDatabase()
        setShowDeleteSpokeModal(false)
        setDeletingSpokeIdx(null)
      } else {
        console.error('Failed to delete spoke:', response.statusText)
      }
    } catch (error) {
      console.error('Error deleting spoke:', error)
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/csv/export')
      if (response.ok) {
        const blob = await response.blob()
        const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)
        const filename = `IA_CARD_SORT_${timestamp}.csv`
        
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = filename
        a.click()
      } else {
        console.error('Failed to export CSV:', response.statusText)
      }
    } catch (error) {
      console.error('Error exporting CSV:', error)
    }
  }

  const isInactive = (lastActivity?: string, fileCount?: number) => {
    if (!lastActivity) return true
    const date = new Date(lastActivity)
    if (isNaN(date.getTime())) return true
    const days = (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    return days > 180 || !fileCount || fileCount === 0
  }

  const renderLeftPanel = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {Object.keys(data).map(division => (
          <div key={division} className="space-y-2">
            <h3 className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
              {division} ({Object.keys(data[division]).length} hubs)
            </h3>
            
            {Object.keys(data[division]).map(hub => {
              const hubData = data[division][hub]
              const inactiveCount = hubData.spokes.filter(spoke => isInactive(spoke.lastActivity, spoke.fileCount)).length
              const isSelected = selectedDivision === division && selectedHub === hub
              
              return (
                <div
                  key={hub}
                  className={cn(
                    "border rounded-lg p-3 cursor-pointer transition-colors",
                    isSelected ? "bg-blue-100 border-blue-300" : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  )}
                  onClick={() => handleHubSelect(division, hub)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.add('ring-2', 'ring-green-400')
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('ring-2', 'ring-green-400')
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove('ring-2', 'ring-green-400')
                    handleSpokeDrop(division, hub)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <strong className="text-sm">{hub}</strong>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingHub({ division, name: hub })
                          setNewHubName(hub)
                          setShowEditHubModal(true)
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {hubData.spokes.length} Spokes ({inactiveCount} inactive)
                  </div>
                  <div className="text-xs mt-1">
                    <a 
                      href={hubData.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      🔗 {hubData.url}
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  const renderRightPanel = () => {
    if (!selectedDivision || !selectedHub) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Select a Hub to view its Spokes</div>
        </div>
      )
    }

    const hubData = data[selectedDivision][selectedHub]

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{selectedHub}</h2>
          <div className="text-sm text-gray-600">
            <strong>{selectedDivision}</strong>
          </div>
        </div>
        
        <div className="space-y-2">
          {hubData.spokes.map((spoke, idx) => {
            const inactive = isInactive(spoke.lastActivity, spoke.fileCount)
            
            return (
              <div
                key={spoke.id}
                className={cn(
                  "border rounded-lg p-3 transition-colors",
                  inactive ? "bg-red-50 border-red-200" : "bg-white border-gray-200 hover:bg-gray-50"
                )}
                draggable
                onDragStart={() => handleSpokeDragStart(selectedDivision, selectedHub, idx)}
                onDragEnd={handleSpokeDragEnd}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <a 
                        href={spoke.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {spoke.name}
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingSpokeIdx(idx)
                          setShowDeleteSpokeModal(true)
                        }}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="text-xs text-gray-600 mt-1 space-y-1">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{spoke.lastActivity || 'N/A'}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <FileText className="h-3 w-3" />
                          <span>{spoke.fileCount || '0'}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <HardDrive className="h-3 w-3" />
                          <span>{spoke.storagePercentage || 'N/A'}%</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{spoke.createdBy || 'N/A'}</span>
                        </span>
                      </div>
                      <div>
                        <a 
                          href={spoke.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          🔗 {spoke.url}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-6 w-6" />
              <span>📊 SharePoint Hub & Spoke Manager</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload Area */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">Click or drag a CSV file here</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowAddHubModal(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Hub</span>
              </Button>
              <Button
                onClick={handleExportCSV}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Save CSV</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-300px)]">
          {/* Left Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hubs by Division</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              {renderLeftPanel()}
            </CardContent>
          </Card>

          {/* Right Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hub Details</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              {renderRightPanel()}
            </CardContent>
          </Card>
        </div>

        {/* Add Hub Modal */}
        {showAddHubModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Add New Hub</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Division name"
                  value={newDivisionName}
                  onChange={(e) => setNewDivisionName(e.target.value)}
                />
                <Input
                  placeholder="Hub name"
                  value={newHubName}
                  onChange={(e) => setNewHubName(e.target.value)}
                />
                <Input
                  placeholder="Hub URL"
                  value={newHubUrl}
                  onChange={(e) => setNewHubUrl(e.target.value)}
                />
                <div className="flex space-x-2">
                  <Button onClick={handleAddHub} className="flex-1">Save</Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddHubModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Hub Modal */}
        {showEditHubModal && editingHub && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Edit Hub Name</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="New hub name"
                  value={newHubName}
                  onChange={(e) => setNewHubName(e.target.value)}
                />
                <div className="flex space-x-2">
                  <Button onClick={handleEditHub} className="flex-1">Save</Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowEditHubModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Spoke Modal */}
        {showDeleteSpokeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Confirm Delete</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Are you sure you want to delete this spoke?</p>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleDeleteSpoke}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Yes
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteSpokeModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
