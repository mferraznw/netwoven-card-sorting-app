const { PrismaClient } = require('@prisma/client')

async function testDatabase() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Test site count
    const siteCount = await prisma.site.count()
    console.log(`📊 Total sites in database: ${siteCount}`)
    
    if (siteCount === 0) {
      console.log('⚠️  No sites found in database. Run "npm run db:import" to import data.')
    } else {
      const hubCount = await prisma.site.count({ where: { isHub: true } })
      const spokeCount = await prisma.site.count({ where: { isSpoke: true } })
      
      console.log(`📊 Database Statistics:`)
      console.log(`   Total Sites: ${siteCount}`)
      console.log(`   Hubs: ${hubCount}`)
      console.log(`   Spokes: ${spokeCount}`)
      
      // Show sample sites
      const sampleSites = await prisma.site.findMany({
        take: 5,
        select: {
          name: true,
          siteType: true,
          division: true,
          url: true
        }
      })
      
      console.log('\n📋 Sample Sites:')
      sampleSites.forEach(site => {
        console.log(`   - ${site.name} (${site.siteType}) - ${site.division}`)
      })
    }
    
    console.log('\n✅ Database test completed successfully!')
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()


