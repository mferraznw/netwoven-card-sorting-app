import { PrismaClient } from '@prisma/client'
import { CSVParser } from '../src/lib/csv-parser'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface CSVSiteData {
  division: string
  hubSiteName: string
  hubUrl: string
  spokeSiteName: string
  spokeUrl: string
  lastActivity: string
  files: string
  storageUsed: string
  createdBy: string
}

async function importCSVData() {
  console.log('🚀 Starting CSV data import...')

  try {
    // Read CSV file
    const csvPath = path.join(process.cwd(), 'docs', 'IA_CARD_SORT_20251010T071750.csv')
    
    if (!fs.existsSync(csvPath)) {
      throw new Error('CSV file not found at: ' + csvPath)
    }

    console.log('📄 Reading CSV file...')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const csvData = CSVParser.parseCSVText(csvContent)
    
    console.log(`📊 Parsed ${csvData.length} records from CSV`)

    // Validate CSV data
    const validation = CSVParser.validateCSVData(csvData)
    if (!validation.isValid) {
      console.error('❌ CSV validation failed:', validation.errors)
      throw new Error('CSV validation failed')
    }

    console.log('✅ CSV data validation passed')

    // Transform CSV data to site data
    const sites = CSVParser.transformToSiteData(csvData)
    console.log(`🔄 Transformed to ${sites.length} sites`)

    // Create admin user if not exists
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@netwoven.com' },
      update: {},
      create: {
        email: 'admin@netwoven.com',
        name: 'System Administrator',
        role: 'ADMIN'
      }
    })

    console.log('✅ Admin user ready')

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...')
    await prisma.siteChangeset.deleteMany()
    await prisma.site.deleteMany()
    await prisma.user.deleteMany({
      where: {
        email: {
          not: 'admin@netwoven.com'
        }
      }
    })

    // Create sites in batches
    const batchSize = 100
    let createdSites = 0
    const hubMap = new Map<string, string>()

    console.log('🏗️  Creating sites...')

    // First pass: Create all hubs
    const hubs = sites.filter(site => site.isHub)
    console.log(`📦 Creating ${hubs.length} hubs...`)

    for (const siteData of hubs) {
      try {
        const site = await prisma.site.create({
          data: {
            id: siteData.id,
            name: siteData.name,
            url: siteData.url,
            siteType: siteData.siteType,
            isHub: siteData.isHub,
            isSpoke: siteData.isSpoke,
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
        hubMap.set(siteData.name, site.id)
        createdSites++
      } catch (error) {
        console.error(`❌ Error creating hub ${siteData.name}:`, error)
      }
    }

    console.log(`✅ Created ${createdSites} hubs`)

    // Second pass: Create all spokes
    const spokes = sites.filter(site => site.isSpoke)
    console.log(`🔗 Creating ${spokes.length} spokes...`)

    for (const siteData of spokes) {
      try {
        // Find parent hub by name
        const parentHubName = csvData.find(row => 
          row.spokeSiteName === siteData.name
        )?.hubSiteName

        const parentHubId = parentHubName ? hubMap.get(parentHubName) : undefined

        const site = await prisma.site.create({
          data: {
            id: siteData.id,
            name: siteData.name,
            url: siteData.url,
            siteType: siteData.siteType,
            isHub: siteData.isHub,
            isSpoke: siteData.isSpoke,
            parentHubId: parentHubId,
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
        createdSites++
      } catch (error) {
        console.error(`❌ Error creating spoke ${siteData.name}:`, error)
      }
    }

    console.log(`✅ Created ${createdSites} total sites`)

    // Create import changeset
    const changeset = await prisma.changeset.create({
      data: {
        userId: adminUser.id,
        title: 'CSV Data Import',
        description: `Imported ${csvData.length} records from IA_CARD_SORT_20251010T071750.csv`,
        status: 'COMMITTED',
        siteChanges: {
          create: {
            siteId: (await prisma.site.findFirst())?.id || '',
            action: 'CREATE',
            newData: { 
              importType: 'CSV',
              recordCount: csvData.length,
              fileName: 'IA_CARD_SORT_20251010T071750.csv'
            }
          }
        }
      }
    })

    console.log('✅ Created import changeset')

    // Create admin log entry
    await prisma.adminLog.create({
      data: {
        userId: adminUser.id,
        action: 'CSV Data Import',
        details: {
          fileName: 'IA_CARD_SORT_20251010T071750.csv',
          recordsProcessed: csvData.length,
          sitesCreated: createdSites,
          hubsCreated: hubs.length,
          spokesCreated: spokes.length
        },
        ipAddress: '127.0.0.1',
        userAgent: 'CSV Import Script'
      }
    })

    console.log('✅ Created admin log entry')

    // Update system configuration
    await prisma.systemConfig.upsert({
      where: { key: 'last_data_sync' },
      update: { value: new Date().toISOString() },
      create: {
        key: 'last_data_sync',
        value: new Date().toISOString()
      }
    })

    await prisma.systemConfig.upsert({
      where: { key: 'csv_import_date' },
      update: { value: new Date().toISOString() },
      create: {
        key: 'csv_import_date',
        value: new Date().toISOString()
      }
    })

    console.log('✅ Updated system configuration')

    // Generate summary statistics
    const totalSites = await prisma.site.count()
    const totalHubs = await prisma.site.count({ where: { isHub: true } })
    const totalSpokes = await prisma.site.count({ where: { isSpoke: true } })
    const divisions = await prisma.site.groupBy({
      by: ['division'],
      _count: { division: true }
    })

    console.log('\n📊 Import Summary:')
    console.log(`   Total Sites: ${totalSites}`)
    console.log(`   Hubs: ${totalHubs}`)
    console.log(`   Spokes: ${totalSpokes}`)
    console.log(`   Divisions: ${divisions.length}`)
    console.log(`   Records Processed: ${csvData.length}`)

    console.log('\n🎉 CSV data import completed successfully!')

  } catch (error) {
    console.error('❌ Import failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the import
if (require.main === module) {
  importCSVData()
    .then(() => {
      console.log('✅ Import script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Import script failed:', error)
      process.exit(1)
    })
}

export { importCSVData }


