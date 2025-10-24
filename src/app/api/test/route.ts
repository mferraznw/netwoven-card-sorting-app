import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Test database connection
    const siteCount = await prisma.site.count()
    const hubCount = await prisma.site.count({ where: { isHub: true } })
    const spokeCount = await prisma.site.count({ where: { isSpoke: true } })
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        totalSites: siteCount,
        hubs: hubCount,
        spokes: spokeCount
      }
    })
  } catch (error) {
    console.error('Database test failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}


