// Cache refresh utilities

import { CacheManager, CACHE_KEYS } from './cache'

export async function refreshSitesCache(): Promise<void> {
  try {
    console.log('🔄 Refreshing sites cache...')
    const response = await fetch('/api/sites')
    if (response.ok) {
      const data = await response.json()
      CacheManager.set(CACHE_KEYS.SITES, data)
      console.log('✅ Sites cache refreshed')
    } else {
      console.error('Failed to refresh sites cache')
    }
  } catch (error) {
    console.error('Error refreshing sites cache:', error)
  }
}

export async function refreshGraphCache(): Promise<void> {
  try {
    console.log('🔄 Refreshing graph cache...')
    const response = await fetch('/api/sites')
    if (response.ok) {
      const sites = await response.json()
      
      // Transform sites to graph nodes
      const graphNodes = sites.map((site: any) => ({
        id: site.id,
        name: site.name,
        type: site.siteType,
        url: site.url,
        division: site.division,
        memberCount: site.members?.length || 0,
        fileCount: site.fileCount,
        lastActivity: site.lastActivity,
        isAssociatedWithTeam: site.isAssociatedWithTeam,
        teamName: site.teamName
      }))

      // Create links between hubs, subhubs, and spokes
      const graphLinks: any[] = []
      sites.forEach((site: any) => {
        if (site.parentHubId) {
          graphLinks.push({
            source: site.parentHubId,
            target: site.id,
            type: site.isSubhub ? 'subhub' : 'parent'
          })
        }
      })

      const graphData = { nodes: graphNodes, links: graphLinks }
      CacheManager.set(CACHE_KEYS.GRAPH, graphData)
      console.log('✅ Graph cache refreshed')
    } else {
      console.error('Failed to refresh graph cache')
    }
  } catch (error) {
    console.error('Error refreshing graph cache:', error)
  }
}

export async function refreshChangesetsCache(): Promise<void> {
  try {
    console.log('🔄 Refreshing changesets cache...')
    const response = await fetch('/api/changesets')
    if (response.ok) {
      const data = await response.json()
      CacheManager.set(CACHE_KEYS.CHANGESETS, data)
      console.log('✅ Changesets cache refreshed')
    } else {
      console.error('Failed to refresh changesets cache')
    }
  } catch (error) {
    console.error('Error refreshing changesets cache:', error)
  }
}

export async function refreshAllCaches(): Promise<void> {
  console.log('🔄 Refreshing all caches...')
  await Promise.all([
    refreshSitesCache(),
    refreshGraphCache(),
    refreshChangesetsCache()
  ])
  console.log('✅ All caches refreshed')
}

export function clearAllCaches(): void {
  console.log('🗑️ Clearing all caches...')
  CacheManager.clear()
  console.log('✅ All caches cleared')
}


