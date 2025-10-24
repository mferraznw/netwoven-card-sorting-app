import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const changesetId = params.id

    // Get the changeset with its changes
    const changeset = await prisma.changeset.findUnique({
      where: { id: changesetId },
      include: {
        siteChanges: true
      }
    })

    if (!changeset) {
      return NextResponse.json(
        { error: 'Changeset not found' },
        { status: 404 }
      )
    }

    if (changeset.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Changeset is not pending' },
        { status: 400 }
      )
    }

    // Apply changes to sites
    for (const change of changeset.siteChanges) {
      switch (change.action) {
        case 'CREATE':
          await prisma.site.create({
            data: change.newData
          })
          break
        case 'UPDATE':
          await prisma.site.update({
            where: { id: change.siteId },
            data: change.newData
          })
          break
        case 'DELETE':
          await prisma.site.delete({
            where: { id: change.siteId }
          })
          break
        case 'ASSOCIATE':
          await prisma.site.update({
            where: { id: change.siteId },
            data: { parentHubId: change.newData.parentHubId }
          })
          break
        case 'DISASSOCIATE':
          await prisma.site.update({
            where: { id: change.siteId },
            data: { parentHubId: null }
          })
          break
      }
    }

    // Update changeset status
    const updatedChangeset = await prisma.changeset.update({
      where: { id: changesetId },
      data: { 
        status: 'COMMITTED',
        updatedAt: new Date()
      },
      include: {
        user: true,
        siteChanges: {
          include: {
            site: true
          }
        }
      }
    })

    return NextResponse.json(updatedChangeset)
  } catch (error) {
    console.error('Error committing changeset:', error)
    return NextResponse.json(
      { error: 'Failed to commit changeset' },
      { status: 500 }
    )
  }
}
