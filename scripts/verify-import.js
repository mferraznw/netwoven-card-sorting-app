const { PrismaClient } = require('@prisma/client')

async function verifyImport() {
  const prisma = new PrismaClient()
  
  try {
    const totalSites = await prisma.site.count()
    const totalHubs = await prisma.site.count({ where: { isHub: true } })
    const totalSpokes = await prisma.site.count({ where: { isSpoke: true } })
    const divisions = await prisma.site.groupBy({
      by: ['division'],
      _count: { division: true }
    })

    console.log('\n📊 Database Import Statistics:')
    console.log(`   Total Sites: ${totalSites}`)
    console.log(`   Hubs: ${totalHubs}`)
    console.log(`   Spokes: ${totalSpokes}`)
    console.log(`   Divisions: ${divisions.length}`)
    
    console.log('\n📋 Divisions:')
    divisions.forEach(div => {
      console.log(`   - ${div.division}: ${div._count.division} sites`)
    })

    console.log('\n✅ Database verification completed!')
    
  } catch (error) {
    console.error('❌ Verification failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyImport()


