'use client'

import { useState, useEffect } from 'react'
import { useMsal } from '@azure/msal-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  GitBranch, 
  Network, 
  Settings, 
  Download,
  History,
  LogOut,
  Building
} from 'lucide-react'
import { SiteListPanel } from '@/components/site-list-panel'
import { SimpleGraphVisualization } from '@/components/simple-graph-visualization'
import { ChangesetHistory } from '@/components/changeset-history'
import { SiteAssociation } from '@/components/site-association'
import { AssociationGuide } from '@/components/association-guide'
import { SpokeManagementPanel } from '@/components/spoke-management-panel'
import { AuthDemo } from '@/components/auth-demo'
import { SharePointHubSpokeManager } from '@/components/sharepoint-hub-spoke-manager'
import { ResizableGraphView } from '@/components/resizable-graph-view'
import { toast } from 'react-hot-toast'

export default function HomePage() {
  const { instance, accounts } = useMsal()
  const [activeTab, setActiveTab] = useState('manager')
  const [showChangesetHistory, setShowChangesetHistory] = useState(false)
  const [demoUser, setDemoUser] = useState<any>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [selectedHub, setSelectedHub] = useState<any>(null)
  const [selectedSite, setSelectedSite] = useState<any>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const user = accounts[0]

  // Check for demo user in sessionStorage
  useEffect(() => {
    const storedUser = sessionStorage.getItem('demoUser')
    if (storedUser) {
      setDemoUser(JSON.parse(storedUser))
      setIsDemoMode(true)
    }
  }, [])

  const currentUser = user || demoUser

  const handleSignOut = () => {
    if (isDemoMode) {
      sessionStorage.removeItem('demoUser')
      setDemoUser(null)
      setIsDemoMode(false)
    } else {
      instance.logoutRedirect({
        postLogoutRedirectUri: process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI || 'http://localhost:3000',
      })
    }
  }

  const handleCommitChanges = () => {
    // TODO: Implement changeset commit logic
    toast.success('Changes committed successfully!')
  }

  const handleDownloadPowerShell = async () => {
    try {
      // Check if there are any changesets available
      const response = await fetch('/api/changesets')
      const changesets = await response.json()
      
      if (!changesets || changesets.length === 0) {
        toast.error('No changesets available to generate PowerShell script')
        return
      }
      
      // Use the most recent changeset
      const latestChangeset = changesets[0]
      
      // Generate PowerShell script
      const scriptResponse = await fetch('/api/powershell/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ changesetId: latestChangeset.id }),
      })
      
      if (!scriptResponse.ok) {
        throw new Error('Failed to generate PowerShell script')
      }
      
      const { script } = await scriptResponse.json()
      
      // Create and download the script file
      const blob = new Blob([script], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `HubSiteAssociation_${new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)}.ps1`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('PowerShell script generated and downloaded!')
    } catch (error) {
      console.error('Error generating PowerShell script:', error)
      toast.error('Failed to generate PowerShell script')
    }
  }

  const handleHubSelect = (hub: any) => {
    console.log('🎯 Hub selected in main page:', hub.name, 'ID:', hub.id)
    console.log('🎯 Hub object:', hub)
    setSelectedHub(hub)
    setActiveTab('graph') // Switch to graph view when hub is selected
    console.log('🎯 Active tab set to graph, selectedHub state:', hub)
  }

  const handleClearSelection = () => {
    setSelectedHub(null)
  }

  const handleSiteSelect = (site: any) => {
    setSelectedSite(site)
  }

  const handleAssociationChange = () => {
    setRefreshTrigger(prev => prev + 1)
    toast.success('Site association updated!')
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dmv-blue-50 to-dmv-yellow-50 flex items-center justify-center">
        <div className="space-y-6">
          <Card className="w-96">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-dmv-blue-600">
                Netwoven Card Sorting App
              </CardTitle>
              <p className="text-gray-600">CA DMV SharePoint Management</p>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => instance.loginRedirect({
                  scopes: ['User.Read', 'Sites.Read.All', 'Sites.ReadWrite.All']
                })}
                className="w-full dmv-button-primary"
              >
                Sign in with Microsoft
              </Button>
            </CardContent>
          </Card>
          
          <AuthDemo />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dmv-blue-50 to-dmv-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Network className="h-8 w-8 text-dmv-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  Netwoven Card Sorting App
                </h1>
              </div>
              <Badge variant="secondary" className="bg-dmv-yellow-100 text-dmv-yellow-800">
                CA DMV
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChangesetHistory(true)}
                className="flex items-center space-x-2"
              >
                <History className="h-4 w-4" />
                <span>View Changesets</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPowerShell}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download PowerShell</span>
              </Button>
              
              <Button
                onClick={handleCommitChanges}
                className="dmv-button-primary flex items-center space-x-2"
              >
                <GitBranch className="h-4 w-4" />
                <span>Commit Changes</span>
              </Button>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{currentUser.name}</span>
                {isDemoMode && (
                  <Badge variant="outline" className="text-xs">
                    Demo
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manager" className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Hub & Spoke Manager</span>
            </TabsTrigger>
            <TabsTrigger value="graph" className="flex items-center space-x-2">
              <Network className="h-4 w-4" />
              <span>Graph View</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>List View</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manager" className="space-y-6">
            <SharePointHubSpokeManager />
          </TabsContent>

          <TabsContent value="graph" className="space-y-6">
            <ResizableGraphView
              selectedHub={selectedHub}
              onHubSelect={handleHubSelect}
              onAssociationChange={handleAssociationChange}
              onClearSelection={handleClearSelection}
            />
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
              {/* Left Panel - Hierarchical List */}
              <div className="lg:col-span-1">
                <SiteListPanel 
                  showHierarchy={true} 
                  onHubSelect={handleHubSelect}
                  onSiteSelect={handleSiteSelect}
                />
              </div>
              
              {/* Right Panel - Site Association */}
              <div className="lg:col-span-2 space-y-4">
                <AssociationGuide />
                <SiteAssociation 
                  selectedSite={selectedSite}
                  onAssociationChange={handleAssociationChange}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Changeset History Modal */}
      {showChangesetHistory && (
        <ChangesetHistory 
          isOpen={showChangesetHistory}
          onClose={() => setShowChangesetHistory(false)}
        />
      )}
    </div>
  )
}
