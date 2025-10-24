import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get a sample of sites to debug the structure
    const sites = await prisma.site.findMany({
      take: 10,
      include: {
        parentHub: true,
        spokes: true
      }
    })

    const hubs = sites.filter(site => site.isHub)
    const spokes = sites.filter(site => site.isSpoke)

    return NextResponse.json({
      success: true,
      data: {
        totalSites: sites.length,
        hubs: hubs.length,
        spokes: spokes.length,
        sampleSites: sites.map(site => ({
          id: site.id,
          name: site.name,
          siteType: site.siteType,
          isHub: site.isHub,
          isSpoke: site.isSpoke,
          parentHubId: site.parentHubId,
          parentHubName: site.parentHub?.name,
          spokeCount: site.spokes?.length || 0
        }))
      }
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}


