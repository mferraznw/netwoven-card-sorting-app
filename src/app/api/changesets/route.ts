import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const search = searchParams.get('search')

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    if (userId) {
      where.userId = userId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const changesets = await prisma.changeset.findMany({
      where,
      include: {
        user: true,
        siteChanges: {
          include: {
            site: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(changesets)
  } catch (error) {
    console.error('Error fetching changesets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch changesets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, description, changes } = body

    const changeset = await prisma.changeset.create({
      data: {
        userId,
        title,
        description,
        status: 'PENDING',
        siteChanges: {
          create: changes.map((change: any) => ({
            siteId: change.siteId,
            action: change.action,
            oldData: change.oldData,
            newData: change.newData
          }))
        }
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

    return NextResponse.json(changeset, { status: 201 })
  } catch (error) {
    console.error('Error creating changeset:', error)
    return NextResponse.json(
      { error: 'Failed to create changeset' },
      { status: 500 }
    )
  }
}
