import { Client } from '@microsoft/microsoft-graph-client'
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client'

export class GraphAuthProvider implements AuthenticationProvider {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async getAccessToken(): Promise<string> {
    return this.accessToken
  }
}

export class MSGraphService {
  private client: Client

  constructor(accessToken: string) {
    const authProvider = new GraphAuthProvider(accessToken)
    this.client = Client.initWithMiddleware({ authProvider })
  }

  async getSites(): Promise<any[]> {
    try {
      const sites = await this.client.api('/sites').get()
      return sites.value || []
    } catch (error) {
      console.error('Error fetching sites from MS Graph:', error)
      throw error
    }
  }

  async getSiteDetails(siteId: string): Promise<any> {
    try {
      const site = await this.client.api(`/sites/${siteId}`).get()
      return site
    } catch (error) {
      console.error('Error fetching site details:', error)
      throw error
    }
  }

  async getSiteDrives(siteId: string): Promise<any[]> {
    try {
      const drives = await this.client.api(`/sites/${siteId}/drives`).get()
      return drives.value || []
    } catch (error) {
      console.error('Error fetching site drives:', error)
      throw error
    }
  }

  async getSiteMembers(siteId: string): Promise<any[]> {
    try {
      const members = await this.client.api(`/sites/${siteId}/members`).get()
      return members.value || []
    } catch (error) {
      console.error('Error fetching site members:', error)
      throw error
    }
  }

  async getSiteOwners(siteId: string): Promise<any[]> {
    try {
      const owners = await this.client.api(`/sites/${siteId}/owners`).get()
      return owners.value || []
    } catch (error) {
      console.error('Error fetching site owners:', error)
      throw error
    }
  }

  async getSiteActivity(siteId: string): Promise<any> {
    try {
      // Get recent activity from the site
      const activities = await this.client.api(`/sites/${siteId}/analytics/lastSevenDays`).get()
      return activities
    } catch (error) {
      console.error('Error fetching site activity:', error)
      throw error
    }
  }

  async getHubSites(): Promise<any[]> {
    try {
      const hubSites = await this.client.api('/sites?search=hub').get()
      return hubSites.value || []
    } catch (error) {
      console.error('Error fetching hub sites:', error)
      throw error
    }
  }

  async getSiteByUrl(siteUrl: string): Promise<any> {
    try {
      const encodedUrl = encodeURIComponent(siteUrl)
      const site = await this.client.api(`/sites/getByUrl(url='${encodedUrl}')`).get()
      return site
    } catch (error) {
      console.error('Error fetching site by URL:', error)
      throw error
    }
  }

  async updateSite(siteId: string, updates: any): Promise<any> {
    try {
      const updatedSite = await this.client.api(`/sites/${siteId}`).patch(updates)
      return updatedSite
    } catch (error) {
      console.error('Error updating site:', error)
      throw error
    }
  }

  async createSite(siteData: any): Promise<any> {
    try {
      const newSite = await this.client.api('/sites').post(siteData)
      return newSite
    } catch (error) {
      console.error('Error creating site:', error)
      throw error
    }
  }

  async deleteSite(siteId: string): Promise<void> {
    try {
      await this.client.api(`/sites/${siteId}`).delete()
    } catch (error) {
      console.error('Error deleting site:', error)
      throw error
    }
  }

  async getSitePermissions(siteId: string): Promise<any[]> {
    try {
      const permissions = await this.client.api(`/sites/${siteId}/permissions`).get()
      return permissions.value || []
    } catch (error) {
      console.error('Error fetching site permissions:', error)
      throw error
    }
  }

  async getSiteLists(siteId: string): Promise<any[]> {
    try {
      const lists = await this.client.api(`/sites/${siteId}/lists`).get()
      return lists.value || []
    } catch (error) {
      console.error('Error fetching site lists:', error)
      throw error
    }
  }

  async getSiteContentTypes(siteId: string): Promise<any[]> {
    try {
      const contentTypes = await this.client.api(`/sites/${siteId}/contentTypes`).get()
      return contentTypes.value || []
    } catch (error) {
      console.error('Error fetching site content types:', error)
      throw error
    }
  }

  async searchSites(query: string): Promise<any[]> {
    try {
      const searchResults = await this.client.api(`/sites?search=${encodeURIComponent(query)}`).get()
      return searchResults.value || []
    } catch (error) {
      console.error('Error searching sites:', error)
      throw error
    }
  }

  async getTenantSites(): Promise<any[]> {
    try {
      const sites = await this.client.api('/sites').get()
      return sites.value || []
    } catch (error) {
      console.error('Error fetching tenant sites:', error)
      throw error
    }
  }

  async getSiteUsage(siteId: string): Promise<any> {
    try {
      const usage = await this.client.api(`/sites/${siteId}/analytics`).get()
      return usage
    } catch (error) {
      console.error('Error fetching site usage:', error)
      throw error
    }
  }

  async getSiteStorage(siteId: string): Promise<any> {
    try {
      const storage = await this.client.api(`/sites/${siteId}/storage`).get()
      return storage
    } catch (error) {
      console.error('Error fetching site storage:', error)
      throw error
    }
  }
}
