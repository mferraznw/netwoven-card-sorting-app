import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const division = searchParams.get('division')
    const search = searchParams.get('search')

    const where: any = {}

    if (type && type !== 'all') {
      where.siteType = type.toUpperCase()
    }

    if (division) {
      where.division = division
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { url: { contains: search, mode: 'insensitive' } },
        { division: { contains: search, mode: 'insensitive' } }
      ]
    }

    const sites = await prisma.site.findMany({
      where,
      include: {
        owners: {
          include: {
            user: true
          }
        },
        members: {
          include: {
            user: true
          }
        },
        parentHub: true,
        spokes: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Process sites to identify subhubs and update site types
    const processedSites = sites.map(site => {
      // A site is a subhub if it's a hub but also has a parent hub
      const isSubhub = site.isHub && site.parentHubId !== null
      
      return {
        ...site,
        siteType: isSubhub ? 'SUBHUB' : site.siteType,
        isSubhub: isSubhub,
        spokeCount: site.spokes?.length || 0
      }
    })

    const response = NextResponse.json(processedSites)
    
    // Add caching headers
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
    response.headers.set('ETag', `"sites-${Date.now()}"`)
    
    return response
  } catch (error) {
    console.error('Error fetching sites:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sites' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, url, siteType, division, parentHubId, isAssociatedWithTeam, teamName, createdBy } = body

    const site = await prisma.site.create({
      data: {
        name,
        url,
        siteType: siteType.toUpperCase(),
        division,
        parentHubId,
        isAssociatedWithTeam,
        teamName,
        createdBy,
        isHub: siteType.toUpperCase() === 'HUB',
        isSpoke: siteType.toUpperCase() === 'SPOKE'
      },
      include: {
        owners: {
          include: {
            user: true
          }
        },
        members: {
          include: {
            user: true
          }
        },
        parentHub: true,
        spokes: true
      }
    })

    return NextResponse.json(site, { status: 201 })
  } catch (error) {
    console.error('Error creating site:', error)
    return NextResponse.json(
      { error: 'Failed to create site' },
      { status: 500 }
    )
  }
}
