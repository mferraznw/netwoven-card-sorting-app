const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Setting up Netwoven Card Sorting App Database...')

async function setupDatabase() {
  try {
    // Step 1: Generate Prisma client
    console.log('\n📦 Step 1: Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('✅ Prisma client generated')

    // Step 2: Run database migrations
    console.log('\n🗄️  Step 2: Running database migrations...')
    try {
      execSync('npx prisma migrate dev --name init', { stdio: 'inherit' })
      console.log('✅ Database migrations completed')
    } catch (error) {
      console.log('⚠️  Migration may have already been run, continuing...')
    }

    // Step 3: Check if CSV file exists
    const csvPath = path.join(process.cwd(), 'docs', 'IA_CARD_SORT_20251010T071750.csv')
    if (!fs.existsSync(csvPath)) {
      console.log('❌ CSV file not found at:', csvPath)
      console.log('Please ensure the CSV file is in the docs/ directory')
      process.exit(1)
    }

    console.log('✅ CSV file found')

    // Step 4: Import CSV data
    console.log('\n📊 Step 3: Importing CSV data...')
    execSync('npm run db:import', { stdio: 'inherit' })
    console.log('✅ CSV data imported successfully')

    // Step 5: Verify import
    console.log('\n🔍 Step 4: Verifying import...')
    const { PrismaClient } = require('@prisma/client')
    
    const prisma = new PrismaClient()
    
    const totalSites = await prisma.site.count()
    const totalHubs = await prisma.site.count({ where: { isHub: true } })
    const totalSpokes = await prisma.site.count({ where: { isSpoke: true } })

    console.log('\n📊 Final Database Statistics:')
    console.log(`   Total Sites: ${totalSites}`)
    console.log(`   Hubs: ${totalHubs}`)
    console.log(`   Spokes: ${totalSpokes}`)

    await prisma.$disconnect()

    console.log('\n🎉 Database setup completed successfully!')
    console.log('\n🚀 You can now run: npm run dev')

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

// Run the setup
setupDatabase()
