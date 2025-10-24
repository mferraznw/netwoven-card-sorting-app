import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get a few sample sites to test the structure
    const sites = await prisma.site.findMany({
      take: 5,
      where: {
        isHub: true
      },
      include: {
        spokes: true
      }
    })

    const spokes = await prisma.site.findMany({
      take: 10,
      where: {
        isSpoke: true,
        parentHubId: {
          not: null
        }
      },
      include: {
        parentHub: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        hubs: sites.map(site => ({
          id: site.id,
          name: site.name,
          siteType: site.siteType,
          isHub: site.isHub,
          isSpoke: site.isSpoke,
          spokeCount: site.spokes?.length || 0,
          spokes: site.spokes?.map(spoke => ({
            id: spoke.id,
            name: spoke.name,
            siteType: spoke.siteType
          }))
        })),
        spokes: spokes.map(spoke => ({
          id: spoke.id,
          name: spoke.name,
          siteType: spoke.siteType,
          parentHubId: spoke.parentHubId,
          parentHubName: spoke.parentHub?.name
        }))
      }
    })
  } catch (error) {
    console.error('Test sites API error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}


