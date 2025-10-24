'use client'

import { useState, useEffect } from 'react'
import { useMsal } from '@azure/msal-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Database, 
  Upload, 
  Download, 
  RefreshCw,
  Trash2,
  Settings,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AdminLog {
  id: string
  userId: string
  userName: string
  action: string
  details?: any
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

interface SystemStats {
  totalSites: number
  totalHubs: number
  totalSpokes: number
  totalUsers: number
  pendingChangesets: number
  lastDataSync?: string
}

export default function AdminPage() {
  const { instance, accounts } = useMsal()
  const [activeTab, setActiveTab] = useState('overview')
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isResetting, setIsResetting] = useState(false)
  const [demoUser, setDemoUser] = useState<any>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)

  const user = accounts[0]

  // Check for demo user in sessionStorage
  useEffect(() => {
    const storedUser = sessionStorage.getItem('demoUser')
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setDemoUser(parsedUser)
      setIsDemoMode(true)
    }
  }, [])

  const currentUser = user || demoUser

  // Check if user is admin (support both Microsoft auth and demo users)
  const isAdmin = currentUser?.idTokenClaims?.roles?.includes('Admin') || 
                  process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').includes(currentUser?.username) ||
                  currentUser?.role === 'ADMIN'

  useEffect(() => {
    if (currentUser && isAdmin) {
      loadAdminData()
    }
  }, [currentUser, isAdmin])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API calls
      const mockStats: SystemStats = {
        totalSites: 1250,
        totalHubs: 45,
        totalSpokes: 1200,
        totalUsers: 25,
        pendingChangesets: 3,
        lastDataSync: '2025-01-15T10:30:00Z'
      }

      const mockLogs: AdminLog[] = [
        {
          id: '1',
          userId: 'user1',
          userName: 'John Doe',
          action: 'Database Reset',
          details: { reason: 'Fresh start for new data structure' },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          createdAt: '2025-01-15T10:30:00Z'
        },
        {
          id: '2',
          userId: 'user2',
          userName: 'Jane Smith',
          action: 'CSV Upload',
          details: { fileName: 'IA_CARD_SORT_20251010T071750.csv', recordCount: 3712 },
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          createdAt: '2025-01-15T09:15:00Z'
        },
        {
          id: '3',
          userId: 'user1',
          userName: 'John Doe',
          action: 'MS Graph Data Collection',
          details: { sitesCollected: 1250, errors: 0 },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          createdAt: '2025-01-15T08:45:00Z'
        }
      ]

      setSystemStats(mockStats)
      setAdminLogs(mockLogs)
    } catch (error) {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleDatabaseReset = async () => {
    if (!confirm('Are you sure you want to reset the database? This action cannot be undone.')) {
      return
    }

    setIsResetting(true)
    try {
      // TODO: Implement database reset API call
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      toast.success('Database reset successfully')
      loadAdminData()
    } catch (error) {
      toast.error('Failed to reset database')
    } finally {
      setIsResetting(false)
    }
  }

  const handleCSVUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/csv/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload CSV')
      }

      const result = await response.json()
      toast.success(`CSV uploaded successfully: ${result.sitesCreated} sites imported`)
      loadAdminData()
    } catch (error) {
      console.error('CSV upload error:', error)
      toast.error('Failed to upload CSV')
    }
  }

  const handleMSGraphSync = async () => {
    try {
      // TODO: Implement MS Graph sync API call
      await new Promise(resolve => setTimeout(resolve, 3000)) // Simulate API call
      toast.success('MS Graph data synchronized successfully')
      loadAdminData()
    } catch (error) {
      toast.error('Failed to sync with MS Graph')
    }
  }

  const handleExportData = async () => {
    try {
      // TODO: Implement data export API call
      toast.success('Data export started. You will receive an email when ready.')
    } catch (error) {
      toast.error('Failed to export data')
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600 flex items-center justify-center space-x-2">
              <Shield className="h-8 w-8" />
              <span>Admin Access Required</span>
            </CardTitle>
            <p className="text-gray-600">Please sign in to access the admin portal</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => instance.loginRedirect({
                scopes: ['User.Read', 'Sites.Read.All', 'Sites.ReadWrite.All']
              })}
              className="w-full"
            >
              Sign in with Microsoft
            </Button>
            <div className="text-center text-xs text-gray-500">
              <p>Or</p>
            </div>
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
            >
              Use Demo Authentication
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600 flex items-center justify-center space-x-2">
              <AlertTriangle className="h-8 w-8" />
              <span>Access Denied</span>
            </CardTitle>
            <p className="text-gray-600">You don't have admin privileges</p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Return to Main App
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-red-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  Admin Portal
                </h1>
              </div>
              <Badge variant="destructive" className="bg-red-100 text-red-800">
                RESTRICTED ACCESS
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{currentUser.name || currentUser.username}</span>
            </div>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                Return to App
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
            <TabsTrigger value="sync">Sync & Import</TabsTrigger>
            <TabsTrigger value="logs">Admin Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStats?.totalSites || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {systemStats?.totalHubs || 0} hubs, {systemStats?.totalSpokes || 0} spokes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStats?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Active users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Changes</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStats?.pendingChangesets || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting commit
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {systemStats?.lastDataSync ? 
                      new Date(systemStats.lastDataSync).toLocaleDateString() : 
                      'Never'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Data synchronization
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Database Connection: Healthy</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>MS Graph API: Connected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Authentication: Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trash2 className="h-5 w-5 text-red-600" />
                    <span>Database Reset</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    This will completely reset the database and remove all data. 
                    This action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDatabaseReset}
                    disabled={isResetting}
                    className="w-full"
                  >
                    {isResetting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Reset Database
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Download className="h-5 w-5 text-blue-600" />
                    <span>Export Data</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Export all system data including sites, changesets, and user data.
                  </p>
                  <Button
                    onClick={handleExportData}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export All Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sync" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-5 w-5 text-green-600" />
                    <span>CSV Upload</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Upload a CSV file to import site data. The file should follow the standard format.
                  </p>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleCSVUpload(file)
                    }}
                    className="w-full"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <RefreshCw className="h-5 w-5 text-blue-600" />
                    <span>MS Graph Sync</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Synchronize data with Microsoft Graph to get the latest site information.
                  </p>
                  <Button
                    onClick={handleMSGraphSync}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync with MS Graph
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Admin Activity Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adminLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium">{log.action}</h3>
                            <Badge variant="outline" className="text-xs">
                              {log.userName}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                          {log.details && (
                            <div className="text-xs text-gray-500">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
