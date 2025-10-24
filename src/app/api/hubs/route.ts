import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, url, division, createdBy } = body

    if (!name || !division) {
      return NextResponse.json(
        { error: 'Hub name and division are required' },
        { status: 400 }
      )
    }

    // Check if hub already exists
    const existingHub = await prisma.site.findFirst({
      where: {
        name,
        division,
        isHub: true
      }
    })

    if (existingHub) {
      return NextResponse.json(
        { error: 'Hub with this name already exists in this division' },
        { status: 409 }
      )
    }

    const hub = await prisma.site.create({
      data: {
        name,
        url: url || '#',
        siteType: 'HUB',
        isHub: true,
        isSpoke: false,
        division,
        createdBy: createdBy || 'System',
        fileCount: 0,
        storageUsed: 0,
        storagePercentage: 0,
        isAssociatedWithTeam: false
      },
      include: {
        spokes: true
      }
    })

    // Create changeset for hub creation
    await prisma.changeset.create({
      data: {
        userId: 'system', // TODO: Get from auth
        title: `Hub Created: ${name}`,
        description: `Created new hub "${name}" in division "${division}"`,
        status: 'COMMITTED',
        siteChanges: {
          create: {
            siteId: hub.id,
            action: 'CREATE',
            newData: {
              name: hub.name,
              url: hub.url,
              division: hub.division,
              siteType: 'HUB'
            }
          }
        }
      }
    })

    return NextResponse.json(hub, { status: 201 })

  } catch (error) {
    console.error('Error creating hub:', error)
    return NextResponse.json(
      { error: 'Failed to create hub' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, url, division } = body

    if (!id || !name) {
      return NextResponse.json(
        { error: 'Hub ID and name are required' },
        { status: 400 }
      )
    }

    const existingHub = await prisma.site.findUnique({
      where: { id },
      include: { spokes: true }
    })

    if (!existingHub) {
      return NextResponse.json(
        { error: 'Hub not found' },
        { status: 404 }
      )
    }

    const updatedHub = await prisma.site.update({
      where: { id },
      data: {
        name,
        url: url || existingHub.url,
        division: division || existingHub.division
      },
      include: {
        spokes: true
      }
    })

    // Create changeset for hub update
    await prisma.changeset.create({
      data: {
        userId: 'system', // TODO: Get from auth
        title: `Hub Updated: ${name}`,
        description: `Updated hub "${existingHub.name}" to "${name}"`,
        status: 'COMMITTED',
        siteChanges: {
          create: {
            siteId: id,
            action: 'UPDATE',
            oldData: {
              name: existingHub.name,
              url: existingHub.url,
              division: existingHub.division
            },
            newData: {
              name: updatedHub.name,
              url: updatedHub.url,
              division: updatedHub.division
            }
          }
        }
      }
    })

    return NextResponse.json(updatedHub)

  } catch (error) {
    console.error('Error updating hub:', error)
    return NextResponse.json(
      { error: 'Failed to update hub' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Hub ID is required' },
        { status: 400 }
      )
    }

    const existingHub = await prisma.site.findUnique({
      where: { id },
      include: { spokes: true }
    })

    if (!existingHub) {
      return NextResponse.json(
        { error: 'Hub not found' },
        { status: 404 }
      )
    }

    // Delete all associated spokes first
    if (existingHub.spokes.length > 0) {
      await prisma.site.deleteMany({
        where: {
          parentHubId: id
        }
      })
    }

    // Delete the hub
    await prisma.site.delete({
      where: { id }
    })

    // Create changeset for hub deletion
    await prisma.changeset.create({
      data: {
        userId: 'system', // TODO: Get from auth
        title: `Hub Deleted: ${existingHub.name}`,
        description: `Deleted hub "${existingHub.name}" and ${existingHub.spokes.length} associated spokes`,
        status: 'COMMITTED',
        siteChanges: {
          create: {
            siteId: id,
            action: 'DELETE',
            oldData: {
              name: existingHub.name,
              url: existingHub.url,
              division: existingHub.division,
              spokeCount: existingHub.spokes.length
            }
          }
        }
      }
    })

    return NextResponse.json({ success: true, message: 'Hub deleted successfully' })

  } catch (error) {
    console.error('Error deleting hub:', error)
    return NextResponse.json(
      { error: 'Failed to delete hub' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
