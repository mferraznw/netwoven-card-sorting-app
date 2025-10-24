import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { spokeId, newParentHubId } = body

    if (!spokeId) {
      return NextResponse.json(
        { error: 'Spoke ID is required' },
        { status: 400 }
      )
    }

    const existingSpoke = await prisma.site.findUnique({
      where: { id: spokeId },
      include: { parentHub: true }
    })

    if (!existingSpoke) {
      return NextResponse.json(
        { error: 'Spoke not found' },
        { status: 404 }
      )
    }

    // Verify new parent hub exists if provided
    let newParentHub = null
    if (newParentHubId) {
      newParentHub = await prisma.site.findUnique({
        where: { id: newParentHubId }
      })
      
      if (!newParentHub || !newParentHub.isHub) {
        return NextResponse.json(
          { error: 'Invalid parent hub' },
          { status: 400 }
        )
      }
    }

    const updatedSpoke = await prisma.site.update({
      where: { id: spokeId },
      data: {
        parentHubId: newParentHubId || null
      },
      include: {
        parentHub: true
      }
    })

    // Create changeset for spoke association change
    await prisma.changeset.create({
      data: {
        userId: 'system', // TODO: Get from auth
        title: `Spoke Association Updated: ${existingSpoke.name}`,
        description: newParentHubId 
          ? `Moved spoke "${existingSpoke.name}" to hub "${newParentHub?.name}"`
          : `Disassociated spoke "${existingSpoke.name}" from hub`,
        status: 'COMMITTED',
        siteChanges: {
          create: {
            siteId: spokeId,
            action: newParentHubId ? 'ASSOCIATE' : 'DISASSOCIATE',
            oldData: {
              parentHubId: existingSpoke.parentHubId,
              parentHubName: existingSpoke.parentHub?.name
            },
            newData: {
              parentHubId: newParentHubId,
              parentHubName: newParentHub?.name
            }
          }
        }
      }
    })

    return NextResponse.json(updatedSpoke)

  } catch (error) {
    console.error('Error updating spoke association:', error)
    return NextResponse.json(
      { error: 'Failed to update spoke association' },
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
        { error: 'Spoke ID is required' },
        { status: 400 }
      )
    }

    const existingSpoke = await prisma.site.findUnique({
      where: { id },
      include: { parentHub: true }
    })

    if (!existingSpoke) {
      return NextResponse.json(
        { error: 'Spoke not found' },
        { status: 404 }
      )
    }

    // Delete the spoke
    await prisma.site.delete({
      where: { id }
    })

    // Create changeset for spoke deletion
    await prisma.changeset.create({
      data: {
        userId: 'system', // TODO: Get from auth
        title: `Spoke Deleted: ${existingSpoke.name}`,
        description: `Deleted spoke "${existingSpoke.name}" from hub "${existingSpoke.parentHub?.name || 'Unknown'}"`,
        status: 'COMMITTED',
        siteChanges: {
          create: {
            siteId: id,
            action: 'DELETE',
            oldData: {
              name: existingSpoke.name,
              url: existingSpoke.url,
              parentHubId: existingSpoke.parentHubId,
              parentHubName: existingSpoke.parentHub?.name
            }
          }
        }
      }
    })

    return NextResponse.json({ success: true, message: 'Spoke deleted successfully' })

  } catch (error) {
    console.error('Error deleting spoke:', error)
    return NextResponse.json(
      { error: 'Failed to delete spoke' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
