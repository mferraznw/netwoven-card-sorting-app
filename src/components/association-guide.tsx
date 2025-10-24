'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building, GitBranch, Users, ArrowRight } from 'lucide-react'

export function AssociationGuide() {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm">How to Create Associations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* Create Subhub */}
        <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded">
          <div className="flex items-center space-x-2">
            <Building className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Hub A</span>
            <ArrowRight className="h-3 w-3" />
            <Building className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Hub B</span>
          </div>
          <Badge className="bg-blue-100 text-blue-800">Creates Subhub</Badge>
        </div>
        <p className="text-gray-600 text-xs">
          Select a hub, then associate it with another hub to create a subhub relationship
        </p>

        {/* Associate Spoke */}
        <div className="flex items-center space-x-3 p-2 bg-yellow-50 rounded">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-yellow-600" />
            <span className="font-medium">Site</span>
            <ArrowRight className="h-3 w-3" />
            <Building className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Hub</span>
          </div>
          <Badge className="bg-yellow-100 text-yellow-800">Creates Spoke</Badge>
        </div>
        <p className="text-gray-600 text-xs">
          Select a site, then associate it with a hub or subhub to create a spoke relationship
        </p>

        {/* Hierarchy Example */}
        <div className="mt-3 p-2 bg-gray-50 rounded">
          <div className="font-medium text-gray-700 mb-2">Example Hierarchy:</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <Building className="h-3 w-3 text-blue-600" />
              <span>Main Hub</span>
            </div>
            <div className="ml-4 space-y-1">
              <div className="flex items-center space-x-2">
                <GitBranch className="h-3 w-3 text-blue-400" />
                <span>Subhub A</span>
              </div>
              <div className="ml-4 space-y-1">
                <div className="flex items-center space-x-2">
                  <Users className="h-3 w-3 text-yellow-600" />
                  <span>Spoke 1</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-3 w-3 text-yellow-600" />
                  <span>Spoke 2</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <GitBranch className="h-3 w-3 text-blue-400" />
                <span>Subhub B</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


