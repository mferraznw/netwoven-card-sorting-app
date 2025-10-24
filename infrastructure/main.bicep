@description('The name of the resource group')
param resourceGroupName string = 'rg-netwoven-card-sorting'

@description('The location for all resources')
param location string = resourceGroup().location

@description('The name of the application')
param appName string = 'netwoven-card-sorting'

@description('The environment (dev, staging, prod)')
param environment string = 'dev'

@description('The Azure AD tenant ID')
param tenantId string

@description('The Azure AD client ID')
param clientId string

@description('The Azure AD client secret')
@secure()
param clientSecret string

@description('The PostgreSQL administrator login')
@secure()
param postgresAdminLogin string = 'netwovenadmin'

@description('The PostgreSQL administrator password')
@secure()
param postgresAdminPassword string

@description('The PostgreSQL database name')
param postgresDatabaseName string = 'netwoven_card_sorting'

@description('The PostgreSQL SKU name')
param postgresSkuName string = 'GP_Gen5_2'

@description('The PostgreSQL version')
param postgresVersion string = '13'

@description('The storage account name for static files')
param storageAccountName string = 'st${appName}${environment}${uniqueString(resourceGroup().id)}'

@description('The key vault name')
param keyVaultName string = 'kv-${appName}-${environment}'

@description('The application insights name')
param appInsightsName string = 'ai-${appName}-${environment}'

@description('The log analytics workspace name')
param logAnalyticsName string = 'law-${appName}-${environment}'

// Variables
var appServicePlanName = 'asp-${appName}-${environment}'
var webAppName = 'app-${appName}-${environment}'
var postgresServerName = 'psql-${appName}-${environment}'
var postgresConnectionString = 'Server=${postgresServerName}.postgres.database.azure.com;Database=${postgresDatabaseName};Port=5432;User Id=${postgresAdminLogin}@${postgresServerName};Password=${postgresAdminPassword};Ssl Mode=Require;'

// Log Analytics Workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2021-06-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Application Insights
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: tenantId
    accessPolicies: []
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: false
  }
}

// Key Vault Secrets
resource databaseUrlSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  parent: keyVault
  name: 'DatabaseUrl'
  properties: {
    value: postgresConnectionString
  }
}

resource azureClientIdSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  parent: keyVault
  name: 'AzureClientId'
  properties: {
    value: clientId
  }
}

resource azureClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  parent: keyVault
  name: 'AzureClientSecret'
  properties: {
    value: clientSecret
  }
}

resource azureTenantIdSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  parent: keyVault
  name: 'AzureTenantId'
  properties: {
    value: tenantId
  }
}

// Storage Account
resource storageAccount 'Microsoft.Storage/storageAccounts@2022-05-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

// PostgreSQL Server
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' = {
  name: postgresServerName
  location: location
  sku: {
    name: postgresSkuName
    tier: 'GeneralPurpose'
  }
  properties: {
    administratorLogin: postgresAdminLogin
    administratorLoginPassword: postgresAdminPassword
    version: postgresVersion
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    maintenanceWindow: {
      customWindow: 'Disabled'
    }
  }
}

// PostgreSQL Database
resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2022-12-01' = {
  parent: postgresServer
  name: postgresDatabaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.UTF8'
  }
}

// PostgreSQL Firewall Rule - Allow Azure Services
resource postgresFirewallRule 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2022-12-01' = {
  parent: postgresServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// Web App
resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: webAppName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      appSettings: [
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '18-lts'
        }
        {
          name: 'NODE_ENV'
          value: environment == 'prod' ? 'production' : 'development'
        }
        {
          name: 'DATABASE_URL'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/DatabaseUrl/)'
        }
        {
          name: 'AZURE_CLIENT_ID'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/AzureClientId/)'
        }
        {
          name: 'AZURE_CLIENT_SECRET'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/AzureClientSecret/)'
        }
        {
          name: 'AZURE_TENANT_ID'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/AzureTenantId/)'
        }
        {
          name: 'NEXTAUTH_SECRET'
          value: '${uniqueString(resourceGroup().id)}-${uniqueString(appName)}'
        }
        {
          name: 'NEXTAUTH_URL'
          value: 'https://${webApp.properties.defaultHostName}'
        }
        {
          name: 'MICROSOFT_GRAPH_ENDPOINT'
          value: 'https://graph.microsoft.com/v1.0'
        }
        {
          name: 'GRAPH_SCOPES'
          value: 'https://graph.microsoft.com/Sites.Read.All,https://graph.microsoft.com/Sites.ReadWrite.All,https://graph.microsoft.com/User.Read'
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: applicationInsights.properties.InstrumentationKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsights.properties.ConnectionString
        }
        {
          name: 'NEXT_PUBLIC_APP_NAME'
          value: 'Netwoven Card Sorting App'
        }
        {
          name: 'NEXT_PUBLIC_APP_VERSION'
          value: '1.0.0'
        }
        {
          name: 'NEXT_PUBLIC_AZURE_CLIENT_ID'
          value: clientId
        }
        {
          name: 'NEXT_PUBLIC_AZURE_TENANT_ID'
          value: tenantId
        }
        {
          name: 'NEXT_PUBLIC_AZURE_REDIRECT_URI'
          value: 'https://${webApp.properties.defaultHostName}'
        }
        {
          name: 'ADMIN_EMAILS'
          value: 'admin@netwoven.com,admin@cadmv.gov'
        }
        {
          name: 'ENABLE_ADMIN_PORTAL'
          value: 'true'
        }
      ]
      connectionStrings: [
        {
          name: 'DefaultConnection'
          connectionString: postgresConnectionString
          type: 'PostgreSQL'
        }
      ]
    }
    httpsOnly: true
  }
}

// Web App Configuration
resource webAppConfig 'Microsoft.Web/sites/config@2022-03-01' = {
  parent: webApp
  name: 'web'
  properties: {
    httpLoggingEnabled: true
    logsDirectorySizeLimit: 35
    detailedErrorLoggingEnabled: true
    publishingUsername: '${webAppName}'
    scmType: 'VSTSRM'
    use32BitWorkerProcess: false
    webSocketsEnabled: false
    alwaysOn: environment == 'prod'
    autoSwapSlotName: ''
    localMySqlEnabled: false
    managedPipelineMode: 'Integrated'
    virtualApplications: [
      {
        virtualPath: '/'
        physicalPath: 'site\\wwwroot'
        preloadEnabled: true
      }
    ]
    vnetName: ''
    cors: {
      allowedOrigins: [
        'https://${webApp.properties.defaultHostName}'
      ]
    }
    defaultDocuments: [
      'Default.htm'
      'Default.html'
      'Default.asp'
      'index.htm'
      'index.html'
      'iisstart.htm'
      'default.aspx'
      'index.php'
    ]
    netFrameworkVersion: 'v4.0'
    phpVersion: 'OFF'
    pythonVersion: 'OFF'
    nodeVersion: '18-lts'
    powerShellVersion: 'OFF'
    linuxFxVersion: 'NODE|18-lts'
    requestTracingEnabled: true
    remoteDebuggingEnabled: false
    remoteDebuggingVersion: 'VS2019'
    httpLoggingEnabled: true
    azureStorageAccounts: {}
    scmType: 'VSTSRM'
    use32BitWorkerProcess: false
    webSocketsEnabled: false
    alwaysOn: environment == 'prod'
    autoSwapSlotName: ''
    localMySqlEnabled: false
    managedPipelineMode: 'Integrated'
    virtualApplications: [
      {
        virtualPath: '/'
        physicalPath: 'site\\wwwroot'
        preloadEnabled: true
      }
    ]
    vnetName: ''
    cors: {
      allowedOrigins: [
        'https://${webApp.properties.defaultHostName}'
      ]
    }
    defaultDocuments: [
      'Default.htm'
      'Default.html'
      'Default.asp'
      'index.htm'
      'index.html'
      'iisstart.htm'
      'default.aspx'
      'index.php'
    ]
    netFrameworkVersion: 'v4.0'
    phpVersion: 'OFF'
    pythonVersion: 'OFF'
    nodeVersion: '18-lts'
    powerShellVersion: 'OFF'
    linuxFxVersion: 'NODE|18-lts'
    requestTracingEnabled: true
    remoteDebuggingEnabled: false
    remoteDebuggingVersion: 'VS2019'
    httpLoggingEnabled: true
    azureStorageAccounts: {}
  }
}

// Key Vault Access Policy for Web App
resource keyVaultAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2022-07-01' = {
  parent: keyVault
  name: 'webapp-access'
  properties: {
    accessPolicies: [
      {
        tenantId: tenantId
        objectId: webApp.identity.principalId
        permissions: {
          secrets: [
            'get'
            'list'
          ]
        }
      }
    ]
  }
}

// Outputs
output webAppName string = webApp.name
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output postgresServerName string = postgresServer.name
output postgresDatabaseName string = postgresDatabase.name
output keyVaultName string = keyVault.name
output storageAccountName string = storageAccount.name
output applicationInsightsName string = applicationInsights.name
output logAnalyticsName string = logAnalyticsWorkspace.name
