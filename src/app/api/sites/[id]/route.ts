import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { parentHubId, siteType } = body

    // Update the site
    const updatedSite = await prisma.site.update({
      where: { id },
      data: {
        parentHubId: parentHubId || null,
        siteType: siteType || 'SPOKE',
        isSpoke: parentHubId ? true : false,
        isHub: siteType === 'HUB' || siteType === 'SUBHUB'
      },
      include: {
        parentHub: true,
        spokes: true
      }
    })

    // Create a changeset for this association
    await prisma.changeset.create({
      data: {
        userId: 'system', // TODO: Get from auth
        title: `Site Association: ${updatedSite.name}`,
        description: parentHubId 
          ? `Associated site with hub: ${updatedSite.parentHub?.name}`
          : 'Disassociated site from hub',
        status: 'COMMITTED',
        siteChanges: {
          create: {
            siteId: id,
            action: parentHubId ? 'ASSOCIATE' : 'DISASSOCIATE',
            newData: parentHubId ? { parentHubId } : { parentHubId: null }
          }
        }
      }
    })

    return NextResponse.json(updatedSite)
  } catch (error) {
    console.error('Error updating site:', error)
    return NextResponse.json(
      { error: 'Failed to update site' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}


