'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Settings } from 'lucide-react'

interface DemoUser {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN'
}

const demoUsers: DemoUser[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@cadmv.gov',
    role: 'USER'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@cadmv.gov',
    role: 'ADMIN'
  }
]

export function AuthDemo() {
  const [selectedUser, setSelectedUser] = useState<DemoUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleSignIn = (user: DemoUser) => {
    setSelectedUser(user)
    setIsAuthenticated(true)
    // Store in sessionStorage for demo purposes
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('demoUser', JSON.stringify(user))
      // Trigger a page refresh to update the main app state
      window.location.reload()
    }
  }

  const handleSignOut = () => {
    setSelectedUser(null)
    setIsAuthenticated(false)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('demoUser')
    }
  }

  // Check if user is already signed in from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = sessionStorage.getItem('demoUser')
      if (storedUser) {
        const user = JSON.parse(storedUser)
        setSelectedUser(user)
        setIsAuthenticated(true)
      }
    }
  }, [])

  if (isAuthenticated && selectedUser) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>{selectedUser.name}</span>
          <Badge variant={selectedUser.role === 'ADMIN' ? 'default' : 'secondary'}>
            {selectedUser.role}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <Card className="w-96">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-dmv-blue-600 flex items-center justify-center space-x-2">
          <Settings className="h-8 w-8" />
          <span>Demo Authentication</span>
        </CardTitle>
        <p className="text-gray-600">Select a demo user to continue</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {demoUsers.map((user) => (
          <Button
            key={user.id}
            onClick={() => handleSignIn(user)}
            className="w-full justify-start space-x-3"
            variant="outline"
          >
            <Users className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">{user.name}</div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </div>
            <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="ml-auto">
              {user.role}
            </Badge>
          </Button>
        ))}
        <div className="text-center text-xs text-gray-500 pt-2">
          <p>This is a demo mode. In production, you would sign in with Microsoft.</p>
        </div>
      </CardContent>
    </Card>
  )
}
