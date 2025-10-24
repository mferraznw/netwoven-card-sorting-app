import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { changesetId } = body

    // Get the changeset with its changes
    const changeset = await prisma.changeset.findUnique({
      where: { id: changesetId },
      include: {
        siteChanges: {
          include: {
            site: true
          }
        }
      }
    })

    if (!changeset) {
      return NextResponse.json(
        { error: 'Changeset not found' },
        { status: 404 }
      )
    }

    // Generate PowerShell script
    const script = await generatePowerShellScript(changeset)

    return NextResponse.json({ script })
  } catch (error) {
    console.error('Error generating PowerShell script:', error)
    return NextResponse.json(
      { error: 'Failed to generate PowerShell script' },
      { status: 500 }
    )
  }
}

async function generatePowerShellScript(changeset: any): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)
  const scriptName = `HubSiteAssociation_${timestamp}.ps1`

  let script = `# SharePoint Hub Site Association Script
# Generated: ${new Date().toISOString()}
# Changeset: ${changeset.title}
# Description: ${changeset.description || 'No description provided'}

# Import SharePoint Online Management Shell
Import-Module Microsoft.Online.SharePoint.PowerShell -ErrorAction SilentlyContinue

# Connect to SharePoint Online (uncomment and configure as needed)
# Connect-SPOService -Url "https://yourtenant-admin.sharepoint.com" -Credential $credential

Write-Host "Starting Hub Site Association Process..." -ForegroundColor Green

# Hub Site Associations
`

  // Group changes by action type
  const associations = changeset.siteChanges.filter((change: any) => 
    change.action === 'ASSOCIATE' && change.newData.parentHubId
  )

  const disassociations = changeset.siteChanges.filter((change: any) => 
    change.action === 'DISASSOCIATE'
  )

  // Generate association commands
  if (associations.length > 0) {
    script += `
# Associate Spoke Sites with Hub Sites
Write-Host "Associating spoke sites with hub sites..." -ForegroundColor Yellow

`
    
    for (const change of associations) {
      const spokeSite = change.site
      const hubSite = await prisma.site.findUnique({
        where: { id: change.newData.parentHubId }
      })

      if (hubSite) {
        script += `# Associate ${spokeSite.name} with ${hubSite.name}
try {
    Set-SPOHubSite -Identity "${spokeSite.url}" -HubSiteId "${hubSite.id}"
    Write-Host "✓ Successfully associated ${spokeSite.name} with ${hubSite.name}" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to associate ${spokeSite.name} with ${hubSite.name}: $($_.Exception.Message)" -ForegroundColor Red
}

`
      }
    }
  }

  // Generate disassociation commands
  if (disassociations.length > 0) {
    script += `
# Disassociate Spoke Sites from Hub Sites
Write-Host "Disassociating spoke sites from hub sites..." -ForegroundColor Yellow

`
    
    for (const change of disassociations) {
      const spokeSite = change.site
      script += `# Disassociate ${spokeSite.name} from hub site
try {
    Set-SPOHubSite -Identity "${spokeSite.url}" -HubSiteId $null
    Write-Host "✓ Successfully disassociated ${spokeSite.name} from hub site" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to disassociate ${spokeSite.name} from hub site: $($_.Exception.Message)" -ForegroundColor Red
}

`
    }
  }

  script += `
# Summary
Write-Host "Hub Site Association Process Completed" -ForegroundColor Green
Write-Host "Total Associations: ${associations.length}" -ForegroundColor Cyan
Write-Host "Total Disassociations: ${disassociations.length}" -ForegroundColor Cyan

# Disconnect from SharePoint Online
# Disconnect-SPOService

Write-Host "Script execution completed. Please review the results above." -ForegroundColor Green
`

  return script
}
