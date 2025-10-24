import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const text = await file.text()
    const sites = parseCSV(text)
    
    // Create changeset for this import
    const changeset = await prisma.changeset.create({
      data: {
        userId: 'system', // TODO: Get from auth
        title: `CSV Import: ${file.name}`,
        description: `Imported ${sites.length} sites from CSV file`,
        status: 'COMMITTED'
      }
    })

    // Process and save sites to database
    const createdSites = []
    const hubMap = new Map<string, string>() // Map hub names to IDs

    // First pass: Create hubs
    for (const site of sites) {
      if (site.siteType === 'HUB') {
        const hub = await prisma.site.create({
          data: {
            name: site.name,
            url: site.url,
            siteType: 'HUB',
            isHub: true,
            isSpoke: false,
            division: site.division,
            lastActivity: site.lastActivity ? new Date(site.lastActivity) : null,
            fileCount: site.fileCount,
            storageUsed: site.storageUsed,
            storagePercentage: site.storagePercentage,
            createdBy: site.createdBy,
            isAssociatedWithTeam: site.isAssociatedWithTeam,
            teamName: site.teamName
          }
        })
        
        hubMap.set(site.name, hub.id)
        createdSites.push(hub)

        // Create changeset entry for hub creation
        await prisma.siteChangeset.create({
          data: {
            changesetId: changeset.id,
            siteId: hub.id,
            action: 'CREATE',
            newData: {
              name: hub.name,
              url: hub.url,
              siteType: 'HUB',
              division: hub.division
            }
          }
        })
      }
    }

    // Second pass: Create spokes and associate with hubs
    for (const site of sites) {
      if (site.siteType === 'SPOKE') {
        const parentHubId = hubMap.get(site.parentHubName || '')
        
        const spoke = await prisma.site.create({
          data: {
            name: site.name,
            url: site.url,
            siteType: 'SPOKE',
            isHub: false,
            isSpoke: true,
            parentHubId: parentHubId || null,
            division: site.division,
            lastActivity: site.lastActivity ? new Date(site.lastActivity) : null,
            fileCount: site.fileCount,
            storageUsed: site.storageUsed,
            storagePercentage: site.storagePercentage,
            createdBy: site.createdBy,
            isAssociatedWithTeam: site.isAssociatedWithTeam,
            teamName: site.teamName
          }
        })
        
        createdSites.push(spoke)

        // Create changeset entry for spoke creation
        await prisma.siteChangeset.create({
          data: {
            changesetId: changeset.id,
            siteId: spoke.id,
            action: 'CREATE',
            newData: {
              name: spoke.name,
              url: spoke.url,
              siteType: 'SPOKE',
              division: spoke.division,
              parentHubId: parentHubId
            }
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${createdSites.length} sites`,
      changesetId: changeset.id,
      sitesCreated: createdSites.length
    })

  } catch (error) {
    console.error('Error processing CSV upload:', error)
    return NextResponse.json(
      { error: 'Failed to process CSV file' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

function parseCSV(text: string) {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  const header = lines[0].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase())
  const idx = (k: string) => header.indexOf(k)
  const get = (row: string[], k: string) => idx(k) !== -1 ? (row[idx(k)] || '').replace(/^"|"$/g, '').trim() : ''

  const sites = []
  
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    const division = get(row, 'division')
    if (!division) continue
    
    const hubName = get(row, 'hub site name') || 'Unspecified Hub'
    const hubUrl = get(row, 'hub url') || '#'
    const spokeName = get(row, 'spoke site name') || 'Unnamed Spoke'
    const spokeUrl = get(row, 'spoke url') || '#'
    const lastActivity = get(row, 'last activity (utc)')
    const files = get(row, 'files')
    const storage = get(row, 'storage used (%)')
    const createdBy = get(row, 'created by')

    // Create hub entry
    sites.push({
      name: hubName,
      url: hubUrl,
      siteType: 'HUB',
      division,
      lastActivity,
      fileCount: parseInt(files) || 0,
      storageUsed: parseFloat(storage) || 0,
      storagePercentage: parseFloat(storage) || 0,
      createdBy,
      isAssociatedWithTeam: false,
      teamName: null
    })

    // Create spoke entry
    sites.push({
      name: spokeName,
      url: spokeUrl,
      siteType: 'SPOKE',
      division,
      parentHubName: hubName,
      lastActivity,
      fileCount: parseInt(files) || 0,
      storageUsed: parseFloat(storage) || 0,
      storagePercentage: parseFloat(storage) || 0,
      createdBy,
      isAssociatedWithTeam: false,
      teamName: null
    })
  }
  
  return sites
}
