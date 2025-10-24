import Papa from 'papaparse'

export interface CSVSiteData {
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

export interface ParsedSiteData {
  id: string
  name: string
  url: string
  siteType: 'HUB' | 'SPOKE' | 'SUBHUB'
  isHub: boolean
  isSpoke: boolean
  parentHubId?: string
  division?: string
  lastActivity?: Date
  fileCount: number
  storageUsed: number
  storagePercentage: number
  isAssociatedWithTeam: boolean
  teamName?: string
  createdBy?: string
}

export class CSVParser {
  static parseCSVFile(file: File): Promise<CSVSiteData[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`))
            return
          }
          resolve(results.data as CSVSiteData[])
        },
        error: (error) => {
          reject(error)
        }
      })
    })
  }

  static parseCSVText(csvText: string): CSVSiteData[] {
    const results = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    })

    if (results.errors.length > 0) {
      throw new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`)
    }

    return results.data as CSVSiteData[]
  }

  static transformToSiteData(csvData: CSVSiteData[]): ParsedSiteData[] {
    const sites: ParsedSiteData[] = []
    const hubMap = new Map<string, string>() // hub name -> hub id

    // First pass: create hubs
    csvData.forEach((row, index) => {
      const hubName = row.hubSiteName.trim()
      const hubUrl = row.hubUrl.trim()
      
      if (hubName && hubUrl && !hubMap.has(hubName)) {
        const hubId = `hub_${index}_${Date.now()}`
        hubMap.set(hubName, hubId)
        
        sites.push({
          id: hubId,
          name: hubName,
          url: hubUrl,
          siteType: 'HUB',
          isHub: true,
          isSpoke: false,
          division: row.division?.trim(),
          lastActivity: this.parseDate(row.lastActivity),
          fileCount: 0, // Will be calculated from spokes
          storageUsed: 0,
          storagePercentage: 0,
          isAssociatedWithTeam: false,
          createdBy: 'CSV Import'
        })
      }
    })

    // Second pass: create spokes
    csvData.forEach((row, index) => {
      const spokeName = row.spokeSiteName.trim()
      const spokeUrl = row.spokeUrl.trim()
      const hubName = row.hubSiteName.trim()
      
      if (spokeName && spokeUrl) {
        const spokeId = `spoke_${index}_${Date.now()}`
        const parentHubId = hubName ? hubMap.get(hubName) : undefined
        
        sites.push({
          id: spokeId,
          name: spokeName,
          url: spokeUrl,
          siteType: 'SPOKE',
          isHub: false,
          isSpoke: true,
          parentHubId,
          division: row.division?.trim(),
          lastActivity: this.parseDate(row.lastActivity),
          fileCount: parseInt(row.files) || 0,
          storageUsed: parseFloat(row.storageUsed) || 0,
          storagePercentage: parseFloat(row.storageUsed) || 0,
          isAssociatedWithTeam: false,
          createdBy: row.createdBy?.trim()
        })
      }
    })

    return sites
  }

  static parseDate(dateString: string): Date | undefined {
    if (!dateString || dateString.trim() === '') {
      return undefined
    }

    // Try different date formats
    const formats = [
      'MM/DD/YYYY HH:mm:ss A',
      'MM-DD-YYYY HH:mm:ss',
      'YYYY-MM-DD HH:mm:ss',
      'MM/DD/YYYY',
      'MM-DD-YYYY',
      'YYYY-MM-DD'
    ]

    for (const format of formats) {
      try {
        const date = new Date(dateString)
        if (!isNaN(date.getTime())) {
          return date
        }
      } catch (error) {
        // Continue to next format
      }
    }

    return undefined
  }

  static validateCSVData(csvData: CSVSiteData[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (csvData.length === 0) {
      errors.push('CSV file is empty or has no valid data')
      return { isValid: false, errors }
    }

    // Check for required columns
    const requiredColumns = ['division', 'hub site name', 'spoke site name', 'spoke url']
    const firstRow = csvData[0]
    const hasRequiredColumns = requiredColumns.every(col => 
      Object.keys(firstRow).some(key => key.toLowerCase().includes(col.toLowerCase()))
    )

    if (!hasRequiredColumns) {
      errors.push(`Missing required columns. Expected: ${requiredColumns.join(', ')}`)
    }

    // Check for empty required fields
    csvData.forEach((row, index) => {
      if (!row.spokeSiteName?.trim()) {
        errors.push(`Row ${index + 1}: Spoke site name is required`)
      }
      if (!row.spokeUrl?.trim()) {
        errors.push(`Row ${index + 1}: Spoke URL is required`)
      }
    })

    // Check for duplicate spoke sites
    const spokeUrls = csvData.map(row => row.spokeUrl?.trim()).filter(Boolean)
    const duplicateUrls = spokeUrls.filter((url, index) => spokeUrls.indexOf(url) !== index)
    if (duplicateUrls.length > 0) {
      errors.push(`Duplicate spoke URLs found: ${duplicateUrls.join(', ')}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static generateCSVFromSites(sites: ParsedSiteData[]): string {
    const csvData = sites.map(site => ({
      'Division': site.division || '',
      'Hub Site Name': site.isHub ? site.name : '',
      'Hub URL': site.isHub ? site.url : '',
      'Spoke Site Name': site.isSpoke ? site.name : '',
      'Spoke URL': site.isSpoke ? site.url : '',
      'Last activity (UTC)': site.lastActivity ? site.lastActivity.toISOString() : '',
      'Files': site.fileCount.toString(),
      'Storage used (%)': site.storagePercentage.toString(),
      'Created by': site.createdBy || ''
    }))

    return Papa.unparse(csvData)
  }

  static downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
