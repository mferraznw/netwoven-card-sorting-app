import { PrismaClient } from '@prisma/client'
import { CSVParser } from '../src/lib/csv-parser'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@netwoven.com' },
    update: {},
    create: {
      email: 'admin@netwoven.com',
      name: 'System Administrator',
      role: 'ADMIN'
    }
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Load CSV data if available
  const csvPath = path.join(process.cwd(), 'docs', 'IA_CARD_SORT_20251010T071750.csv')
  
  if (fs.existsSync(csvPath)) {
    console.log('📄 Loading CSV data...')
    
    try {
      const csvContent = fs.readFileSync(csvPath, 'utf-8')
      const csvData = CSVParser.parseCSVText(csvContent)
      const csvSites = CSVParser.transformToSiteData(csvData)

      console.log(`📊 Parsed ${csvSites.length} sites from CSV`)

      // Create sites in database
      for (const siteData of csvSites) {
        await prisma.site.upsert({
          where: { url: siteData.url },
          update: {
            name: siteData.name,
            siteType: siteData.siteType,
            isHub: siteData.isHub,
            isSpoke: siteData.isSpoke,
            parentHubId: siteData.parentHubId,
            division: siteData.division,
            lastActivity: siteData.lastActivity,
            fileCount: siteData.fileCount,
            storageUsed: siteData.storageUsed,
            storagePercentage: siteData.storagePercentage,
            isAssociatedWithTeam: siteData.isAssociatedWithTeam,
            teamName: siteData.teamName,
            createdBy: siteData.createdBy
          },
          create: {
            id: siteData.id,
            name: siteData.name,
            url: siteData.url,
            siteType: siteData.siteType,
            isHub: siteData.isHub,
            isSpoke: siteData.isSpoke,
            parentHubId: siteData.parentHubId,
            division: siteData.division,
            lastActivity: siteData.lastActivity,
            fileCount: siteData.fileCount,
            storageUsed: siteData.storageUsed,
            storagePercentage: siteData.storagePercentage,
            isAssociatedWithTeam: siteData.isAssociatedWithTeam,
            teamName: siteData.teamName,
            createdBy: siteData.createdBy
          }
        })
      }

      console.log('✅ Imported sites from CSV')

      // Update parent hub relationships
      const sites = await prisma.site.findMany()
      const hubMap = new Map<string, string>()
      
      // Create hub mapping
      sites.forEach(site => {
        if (site.isHub) {
          hubMap.set(site.name, site.id)
        }
      })

      // Update spoke parent relationships
      for (const site of sites) {
        if (site.isSpoke && site.parentHubId) {
          const parentHub = await prisma.site.findFirst({
            where: { name: site.parentHubId, isHub: true }
          })
          
          if (parentHub) {
            await prisma.site.update({
              where: { id: site.id },
              data: { parentHubId: parentHub.id }
            })
          }
        }
      }

      console.log('✅ Updated parent hub relationships')

    } catch (error) {
      console.error('❌ Error loading CSV data:', error)
    }
  } else {
    console.log('⚠️  CSV file not found, creating sample data...')
    
    // Create sample data
    const sampleHubs = [
      {
        name: 'DMV_CPD',
        url: 'https://cadmv.sharepoint.com/sites/DMV_CPD',
        division: 'Unclassified',
        isHub: true,
        isSpoke: false
      },
      {
        name: 'DMV_HR',
        url: 'https://cadmv.sharepoint.com/sites/DMV_HR',
        division: 'Human Resources',
        isHub: true,
        isSpoke: false
      }
    ]

    const sampleSpokes = [
      {
        name: 'DMV_CHP_CDESB',
        url: 'https://cadmv.sharepoint.com/sites/DMV_CHP_CDESB',
        division: 'Unclassified',
        isHub: false,
        isSpoke: true,
        fileCount: 462,
        storageUsed: 0.8,
        storagePercentage: 5
      },
      {
        name: 'DMV_CPD_SCCLIVECHAT95',
        url: 'https://cadmv.sharepoint.com/sites/DMV_CPD_SCCLIVECHAT95',
        division: 'Unclassified',
        isHub: false,
        isSpoke: true,
        fileCount: 17,
        storageUsed: 0.1,
        storagePercentage: 1
      }
    ]

    // Create sample hubs
    const createdHubs = []
    for (const hubData of sampleHubs) {
      const hub = await prisma.site.create({
        data: {
          name: hubData.name,
          url: hubData.url,
          siteType: 'HUB',
          isHub: hubData.isHub,
          isSpoke: hubData.isSpoke,
          division: hubData.division,
          fileCount: 0,
          storageUsed: 0,
          storagePercentage: 0,
          createdBy: 'System'
        }
      })
      createdHubs.push(hub)
    }

    // Create sample spokes
    for (const spokeData of sampleSpokes) {
      await prisma.site.create({
        data: {
          name: spokeData.name,
          url: spokeData.url,
          siteType: 'SPOKE',
          isHub: spokeData.isHub,
          isSpoke: spokeData.isSpoke,
          parentHubId: createdHubs[0].id, // Associate with first hub
          division: spokeData.division,
          fileCount: spokeData.fileCount,
          storageUsed: spokeData.storageUsed,
          storagePercentage: spokeData.storagePercentage,
          createdBy: 'System'
        }
      })
    }

    console.log('✅ Created sample data')
  }

  // Create sample changeset
  const changeset = await prisma.changeset.create({
    data: {
      userId: adminUser.id,
      title: 'Initial Data Import',
      description: 'Imported initial site data from CSV',
      status: 'COMMITTED',
      siteChanges: {
        create: [
          {
            siteId: (await prisma.site.findFirst({ where: { isHub: true } }))?.id || '',
            action: 'CREATE',
            newData: { name: 'Sample Hub', type: 'HUB' }
          }
        ]
      }
    }
  })

  console.log('✅ Created sample changeset:', changeset.title)

  // Create system configuration
  await prisma.systemConfig.upsert({
    where: { key: 'app_version' },
    update: { value: '1.0.0' },
    create: {
      key: 'app_version',
      value: '1.0.0'
    }
  })

  await prisma.systemConfig.upsert({
    where: { key: 'last_data_sync' },
    update: { value: new Date().toISOString() },
    create: {
      key: 'last_data_sync',
      value: new Date().toISOString()
    }
  })

  console.log('✅ Created system configuration')

  // Create admin log entry
  await prisma.adminLog.create({
    data: {
      userId: adminUser.id,
      action: 'Database Seed',
      details: {
        sitesCreated: await prisma.site.count(),
        changesetsCreated: await prisma.changeset.count()
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Prisma Seed Script'
    }
  })

  console.log('✅ Created admin log entry')

  console.log('🎉 Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
