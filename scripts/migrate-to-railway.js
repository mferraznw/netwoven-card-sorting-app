const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

// Railway PostgreSQL connection
const railwayDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:fzzEQtiknOmZMvowWchtCLBsLuvlScKh@switchback.proxy.rlwy.net:22756/railway'
    }
  }
})

// Local database connection (if you have one)
const localDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/netwoven_card_sorting'
    }
  }
})

async function migrateToRailway() {
  console.log('🚀 Starting migration to Railway PostgreSQL...')

  try {
    // Test Railway connection
    console.log('🔌 Testing Railway database connection...')
    await railwayDb.$connect()
    console.log('✅ Railway database connected successfully')

    // Check if we have local data to migrate
    console.log('📊 Checking for local data to migrate...')
    
    try {
      await localDb.$connect()
      const localSites = await localDb.site.findMany()
      console.log(`📋 Found ${localSites.length} sites in local database`)
      
      if (localSites.length > 0) {
        console.log('🔄 Migrating sites from local to Railway...')
        
        // Clear existing Railway data
        await railwayDb.siteChangeset.deleteMany()
        await railwayDb.site.deleteMany()
        await railwayDb.user.deleteMany()
        
        // Create admin user
        const adminUser = await railwayDb.user.upsert({
          where: { email: 'admin@netwoven.com' },
          update: {},
          create: {
            email: 'admin@netwoven.com',
            name: 'System Administrator',
            role: 'ADMIN'
          }
        })
        console.log('✅ Created admin user in Railway')

        // Migrate sites
        for (const site of localSites) {
          await railwayDb.site.create({
            data: {
              id: site.id,
              name: site.name,
              url: site.url,
              siteType: site.siteType,
              isHub: site.isHub,
              isSpoke: site.isSpoke,
              parentHubId: site.parentHubId,
              division: site.division,
              lastActivity: site.lastActivity,
              fileCount: site.fileCount,
              storageUsed: site.storageUsed,
              storagePercentage: site.storagePercentage,
              isAssociatedWithTeam: site.isAssociatedWithTeam,
              teamName: site.teamName,
              createdBy: site.createdBy
            }
          })
        }
        console.log(`✅ Migrated ${localSites.length} sites to Railway`)
        
        await localDb.$disconnect()
      } else {
        console.log('ℹ️ No local data found, will seed Railway with CSV data')
      }
    } catch (error) {
      console.log('ℹ️ No local database found, will seed Railway with CSV data')
    }

    // Seed Railway database with CSV data
    console.log('📄 Seeding Railway database with CSV data...')
    
    const csvPath = path.join(process.cwd(), 'docs', 'IA_CARD_SORT_20251010T071750.csv')
    
    if (fs.existsSync(csvPath)) {
      const csvContent = fs.readFileSync(csvPath, 'utf-8')
      const Papa = require('papaparse')
      
      const results = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true
      })

      if (results.errors.length > 0) {
        console.error('❌ CSV parsing errors:', results.errors)
        throw new Error('CSV parsing failed')
      }

      const csvData = results.data
      console.log(`📊 Parsed ${csvData.length} records from CSV`)

      // Clear existing data
      await railwayDb.siteChangeset.deleteMany()
      await railwayDb.site.deleteMany()
      await railwayDb.user.deleteMany()

      // Create admin user
      const adminUser = await railwayDb.user.upsert({
        where: { email: 'admin@netwoven.com' },
        update: {},
        create: {
          email: 'admin@netwoven.com',
          name: 'System Administrator',
          role: 'ADMIN'
        }
      })
      console.log('✅ Created admin user')

      // Create sites from CSV
      const hubMap = new Map()
      let createdSites = 0

      // First pass: Create hubs
      const hubNames = [...new Set(csvData.map(row => row['Hub Site Name']).filter(Boolean))]
      console.log(`📦 Creating ${hubNames.length} unique hubs...`)

      for (const hubName of hubNames) {
        try {
          const hub = await railwayDb.site.create({
            data: {
              name: hubName,
              url: `https://example.com/hub/${hubName.toLowerCase().replace(/\s+/g, '-')}`,
              siteType: 'HUB',
              isHub: true,
              isSpoke: false,
              division: 'Unclassified',
              lastActivity: new Date(),
              fileCount: 0,
              storageUsed: 0,
              storagePercentage: 0,
              createdBy: 'CSV Import'
            }
          })
          hubMap.set(hubName, hub.id)
        } catch (error) {
          console.error(`❌ Error creating hub ${hubName}:`, error.message)
        }
      }

      // Second pass: Create spokes
      const processedUrls = new Set()
      let duplicateCount = 0

      for (const row of csvData) {
        try {
          const spokeName = row['Spoke Site Name']
          const spokeUrl = row['Spoke URL']
          const hubName = row['Hub Site Name']
          
          if (!spokeName || !spokeUrl) continue

          // Check for duplicate URLs
          if (processedUrls.has(spokeUrl)) {
            duplicateCount++
            continue
          }
          processedUrls.add(spokeUrl)

          const parentHubId = hubName ? hubMap.get(hubName) : undefined

          // Parse date
          let lastActivity = null
          if (row['Last activity (UTC)']) {
            const dateStr = row['Last activity (UTC)']
            const parsedDate = new Date(dateStr)
            if (!isNaN(parsedDate.getTime())) {
              lastActivity = parsedDate
            }
          }

          const site = await railwayDb.site.create({
            data: {
              name: spokeName,
              url: spokeUrl,
              siteType: 'SPOKE',
              isHub: false,
              isSpoke: true,
              parentHubId: parentHubId,
              division: row['Division'] || 'Unclassified',
              lastActivity: lastActivity,
              fileCount: parseInt(row['Files']) || 0,
              storageUsed: parseFloat(row['Storage used (%)']) || 0,
              storagePercentage: parseFloat(row['Storage used (%)']) || 0,
              isAssociatedWithTeam: false,
              createdBy: row['Created by'] || 'CSV Import'
            }
          })
          createdSites++
        } catch (error) {
          if (error.code === 'P2002') {
            duplicateCount++
          } else {
            console.error(`❌ Error creating spoke ${row['Spoke Site Name']}:`, error.message)
          }
        }
      }

      console.log(`✅ Created ${createdSites} total sites`)
      if (duplicateCount > 0) {
        console.log(`⚠️ Skipped ${duplicateCount} duplicate sites`)
      }

      // Create import changeset
      const changeset = await railwayDb.changeset.create({
        data: {
          userId: adminUser.id,
          title: 'CSV Data Import to Railway',
          description: `Imported ${csvData.length} records from IA_CARD_SORT_20251010T071750.csv`,
          status: 'COMMITTED',
          siteChanges: {
            create: {
              siteId: (await railwayDb.site.findFirst())?.id || '',
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
      console.log('🎉 Migration completed successfully!')
      
    } else {
      console.log('❌ CSV file not found, skipping data import')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await railwayDb.$disconnect()
  }
}

// Run migration
migrateToRailway()
  .then(() => {
    console.log('✅ Migration completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })
