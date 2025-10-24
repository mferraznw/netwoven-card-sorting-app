const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')

const prisma = new PrismaClient()

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
    
    // Parse CSV
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

    // Clear existing data
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

    // Process data
    const hubMap = new Map()
    let createdSites = 0

    console.log('🏗️  Creating sites...')

    // First pass: Create hubs
    const hubNames = [...new Set(csvData.map(row => row['Hub Site Name']).filter(Boolean))]
    console.log(`📦 Creating ${hubNames.length} unique hubs...`)

    for (const hubName of hubNames) {
      try {
        const hubData = csvData.find(row => row['Hub Site Name'] === hubName)
        if (!hubData) continue

        const site = await prisma.site.create({
          data: {
            name: hubName,
            url: hubData['Hub URL'] || '#',
            siteType: 'HUB',
            isHub: true,
            isSpoke: false,
            division: hubData['Division'] || 'Unclassified',
            fileCount: 0,
            storageUsed: 0,
            storagePercentage: 0,
            isAssociatedWithTeam: false,
            createdBy: 'CSV Import'
          }
        })
        hubMap.set(hubName, site.id)
        createdSites++
      } catch (error) {
        console.error(`❌ Error creating hub ${hubName}:`, error)
      }
    }

    console.log(`✅ Created ${createdSites} hubs`)

    // Second pass: Create spokes
    console.log(`🔗 Creating ${csvData.length} spokes...`)

    // Track processed URLs to avoid duplicates
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
          console.log(`⚠️  Skipping duplicate URL: ${spokeUrl} (${spokeName})`)
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

        const site = await prisma.site.create({
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
          console.log(`⚠️  Skipping duplicate URL: ${row['Spoke URL']} (${row['Spoke Site Name']})`)
        } else {
          console.error(`❌ Error creating spoke ${row['Spoke Site Name']}:`, error.message)
        }
      }
    }

    if (duplicateCount > 0) {
      console.log(`⚠️  Skipped ${duplicateCount} duplicate URLs`)
    }

    console.log(`✅ Created ${createdSites} total sites`)

    // Create import changeset
    const changeset = await prisma.changeset.create({
      data: {
        userId: adminUser.id,
        title: 'CSV Data Import',
        description: `Imported ${csvData.length} records from IA_CARD_SORT_20251010T071750.csv`,
        status: 'COMMITTED'
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
          sitesCreated: createdSites
        },
        ipAddress: '127.0.0.1',
        userAgent: 'CSV Import Script'
      }
    })

    console.log('✅ Created admin log entry')

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
    if (duplicateCount > 0) {
      console.log(`   Duplicates Skipped: ${duplicateCount}`)
    }

    console.log('\n🎉 CSV data import completed successfully!')

  } catch (error) {
    console.error('❌ Import failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the import
importCSVData()
  .then(() => {
    console.log('✅ Import script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Import script failed:', error)
    process.exit(1)
  })
