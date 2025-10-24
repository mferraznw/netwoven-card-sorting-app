import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const sites = await prisma.site.findMany({
      include: {
        parentHub: true,
        spokes: true
      },
      orderBy: [
        { division: 'asc' },
        { name: 'asc' }
      ]
    })

    // Transform sites to CSV format
    const csvData = transformSitesToCSV(sites)
    
    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="IA_CARD_SORT_${new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)}.csv"`
      }
    })

  } catch (error) {
    console.error('Error exporting CSV:', error)
    return NextResponse.json(
      { error: 'Failed to export CSV' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

function transformSitesToCSV(sites: any[]) {
  const rows = [['Division', 'Hub Site Name', 'Hub URL', 'Spoke Site Name', 'Spoke URL', 'Last activity (UTC)', 'Files', 'Storage used (%)', 'Created by']]
  
  // Group sites by division and hub
  const groupedData: { [key: string]: { [hubName: string]: { hub: any, spokes: any[] } } } = {}
  
  sites.forEach(site => {
    const division = site.division || 'Unspecified Division'
    
    if (!groupedData[division]) {
      groupedData[division] = {}
    }
    
    if (site.isHub) {
      if (!groupedData[division][site.name]) {
        groupedData[division][site.name] = { hub: site, spokes: [] }
      }
    } else if (site.isSpoke && site.parentHub) {
      const hubName = site.parentHub.name
      if (!groupedData[division][hubName]) {
        groupedData[division][hubName] = { hub: site.parentHub, spokes: [] }
      }
      groupedData[division][hubName].spokes.push(site)
    }
  })
  
  // Generate CSV rows
  Object.keys(groupedData).forEach(division => {
    Object.keys(groupedData[division]).forEach(hubName => {
      const hubData = groupedData[division][hubName]
      const hub = hubData.hub
      
      if (hubData.spokes.length === 0) {
        // Hub with no spokes
        rows.push([
          division,
          hubName,
          hub.url,
          '',
          '',
          hub.lastActivity ? hub.lastActivity.toISOString() : '',
          hub.fileCount.toString(),
          hub.storagePercentage.toString(),
          hub.createdBy || ''
        ])
      } else {
        // Hub with spokes
        hubData.spokes.forEach(spoke => {
          rows.push([
            division,
            hubName,
            hub.url,
            spoke.name,
            spoke.url,
            spoke.lastActivity ? spoke.lastActivity.toISOString() : '',
            spoke.fileCount.toString(),
            spoke.storagePercentage.toString(),
            spoke.createdBy || ''
          ])
        })
      }
    })
  })
  
  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
}
