# Netwoven Card Sorting App - Deployment Guide

## Overview

This document provides step-by-step instructions for deploying the Netwoven Card Sorting App to Azure. The application is built with Next.js, PostgreSQL, and integrates with Microsoft Graph for SharePoint data management.

## Prerequisites

### Required Tools
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) (version 2.40.0 or later)
- [Node.js](https://nodejs.org/) (version 18 or later)
- [Git](https://git-scm.com/)
- [PostgreSQL Client](https://www.postgresql.org/download/) (for database management)

### Azure Requirements
- Azure subscription with appropriate permissions
- Azure AD tenant with admin access
- Ability to create resource groups and resources

## Step 1: Azure AD Application Registration

### 1.1 Create Azure AD App Registration

1. Navigate to [Azure Portal](https://portal.azure.com)
2. Go to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: `Netwoven Card Sorting App`
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: `Web` - `http://localhost:3000` (for development)
5. Click **Register**

### 1.2 Configure Authentication

1. In your app registration, go to **Authentication**
2. Add platform configurations:
   - **Web**: `https://your-app-url.azurewebsites.net` (production URL)
   - **Single-page application**: `https://your-app-url.azurewebsites.net`
3. Under **Implicit grant and hybrid flows**, check:
   - ✅ Access tokens
   - ✅ ID tokens
4. Click **Save**

### 1.3 Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions** and add:
   - `User.Read`
   - `Sites.Read.All`
   - `Sites.ReadWrite.All`
   - `Group.Read.All`
5. Click **Add permissions**
6. Click **Grant admin consent** (requires admin privileges)

### 1.4 Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add description: `Netwoven Card Sorting App Secret`
4. Set expiration: `24 months`
5. Click **Add**
6. **Copy the secret value immediately** (you won't be able to see it again)

### 1.5 Note Required Values

Record these values for the deployment:
- **Application (client) ID**
- **Directory (tenant) ID**
- **Client secret value**

## Step 2: Prepare Deployment Environment

### 2.1 Clone Repository

```bash
git clone https://github.com/your-org/netwoven-card-sorting-app.git
cd netwoven-card-sorting-app
```

### 2.2 Install Dependencies

```bash
npm install
```

### 2.3 Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/netwoven_card_sorting"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Azure AD / MSAL
AZURE_CLIENT_ID="your-azure-client-id"
AZURE_CLIENT_SECRET="your-azure-client-secret"
AZURE_TENANT_ID="your-azure-tenant-id"
AZURE_REDIRECT_URI="http://localhost:3000"

# Microsoft Graph
MICROSOFT_GRAPH_ENDPOINT="https://graph.microsoft.com/v1.0"
GRAPH_SCOPES="https://graph.microsoft.com/Sites.Read.All,https://graph.microsoft.com/Sites.ReadWrite.All,https://graph.microsoft.com/User.Read"

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_NAME="Netwoven Card Sorting App"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Admin Configuration
ADMIN_EMAILS="admin@netwoven.com,admin@cadmv.gov"
ENABLE_ADMIN_PORTAL="true"
```

## Step 3: Azure Resource Deployment

### 3.1 Login to Azure

```bash
az login
```

### 3.2 Set Subscription

```bash
az account set --subscription "Your Subscription Name"
```

### 3.3 Create Resource Group

```bash
az group create \
  --name "rg-netwoven-card-sorting" \
  --location "East US"
```

### 3.4 Deploy Infrastructure

Create a parameters file `infrastructure/parameters.json`:

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "tenantId": {
      "value": "your-azure-tenant-id"
    },
    "clientId": {
      "value": "your-azure-client-id"
    },
    "clientSecret": {
      "value": "your-azure-client-secret"
    },
    "postgresAdminPassword": {
      "value": "YourSecurePassword123!"
    }
  }
}
```

Deploy the infrastructure:

```bash
az deployment group create \
  --resource-group "rg-netwoven-card-sorting" \
  --template-file "infrastructure/main.bicep" \
  --parameters "@infrastructure/parameters.json"
```

### 3.5 Note Deployment Outputs

After deployment, note these values from the output:
- `webAppUrl`
- `postgresServerName`
- `postgresDatabaseName`
- `keyVaultName`

## Step 4: Database Setup

### 4.1 Connect to PostgreSQL

```bash
psql "host=your-postgres-server.postgres.database.azure.com port=5432 dbname=netwoven_card_sorting user=netwovenadmin@your-postgres-server password=YourSecurePassword123! sslmode=require"
```

### 4.2 Run Database Migrations

```bash
# Install Prisma CLI globally
npm install -g prisma

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### 4.3 Seed Database (Optional)

```bash
# If you have seed data
npx prisma db seed
```

## Step 5: Application Deployment

### 5.1 Build Application

```bash
npm run build
```

### 5.2 Deploy to Azure App Service

#### Option A: Using Azure CLI

```bash
# Create deployment package
npm run build
zip -r app.zip .next package.json package-lock.json node_modules

# Deploy to App Service
az webapp deployment source config-zip \
  --resource-group "rg-netwoven-card-sorting" \
  --name "app-netwoven-card-sorting-dev" \
  --src "app.zip"
```

#### Option B: Using GitHub Actions (Recommended)

1. Create a GitHub repository
2. Push your code to the repository
3. Configure GitHub Actions workflow (see `.github/workflows/deploy.yml`)

### 5.3 Configure App Settings

Update the App Service configuration with the correct URLs:

```bash
az webapp config appsettings set \
  --resource-group "rg-netwoven-card-sorting" \
  --name "app-netwoven-card-sorting-dev" \
  --settings \
    NEXTAUTH_URL="https://your-app-url.azurewebsites.net" \
    NEXT_PUBLIC_AZURE_REDIRECT_URI="https://your-app-url.azurewebsites.net"
```

## Step 6: Post-Deployment Configuration

### 6.1 Update Azure AD Redirect URIs

1. Go back to your Azure AD app registration
2. Update the redirect URIs to include your production URL:
   - `https://your-app-url.azurewebsites.net`
   - `https://your-app-url.azurewebsites.net/api/auth/callback/azure-ad`

### 6.2 Test Application

1. Navigate to your application URL
2. Test the sign-in process
3. Verify that you can access the admin portal (if you're an admin)
4. Test the CSV upload functionality
5. Test the MS Graph integration

### 6.3 Configure Custom Domain (Optional)

```bash
# Add custom domain
az webapp config hostname add \
  --resource-group "rg-netwoven-card-sorting" \
  --webapp-name "app-netwoven-card-sorting-dev" \
  --hostname "your-custom-domain.com"
```

## Step 7: Monitoring and Maintenance

### 7.1 Application Insights

The deployment includes Application Insights for monitoring:
- Navigate to the Application Insights resource in Azure Portal
- View performance metrics, errors, and usage analytics

### 7.2 Log Analytics

Monitor application logs:
- Go to the Log Analytics workspace
- Query application logs using KQL

### 7.3 Database Monitoring

Monitor PostgreSQL performance:
- Use Azure Database for PostgreSQL metrics
- Set up alerts for performance issues

## Step 8: Security Considerations

### 8.1 Key Vault Access

Ensure only authorized applications can access Key Vault secrets:
- Review Key Vault access policies
- Use managed identities where possible

### 8.2 Network Security

Configure network security:
- Use Azure Front Door for DDoS protection
- Configure Web Application Firewall (WAF)
- Set up SSL certificates

### 8.3 Database Security

Secure the PostgreSQL database:
- Enable SSL connections
- Configure firewall rules
- Regular security updates

## Troubleshooting

### Common Issues

#### 1. Authentication Errors
- Verify Azure AD app registration configuration
- Check redirect URIs match exactly
- Ensure admin consent is granted for permissions

#### 2. Database Connection Issues
- Verify PostgreSQL server is running
- Check firewall rules
- Verify connection string format

#### 3. MS Graph API Errors
- Check API permissions
- Verify tenant ID and client ID
- Ensure user has appropriate licenses

#### 4. Build/Deployment Errors
- Check Node.js version compatibility
- Verify all environment variables are set
- Review application logs in Azure Portal

### Getting Help

1. Check application logs in Azure Portal
2. Review Application Insights for errors
3. Check database connectivity
4. Verify Azure AD configuration
5. Contact support with specific error messages

## Maintenance Tasks

### Regular Maintenance

1. **Weekly**:
   - Review application performance metrics
   - Check for security updates
   - Monitor database performance

2. **Monthly**:
   - Review and rotate secrets
   - Update dependencies
   - Review access logs

3. **Quarterly**:
   - Security audit
   - Performance optimization
   - Backup verification

### Backup Strategy

1. **Database Backups**: Automated daily backups via Azure Database for PostgreSQL
2. **Application Code**: Version controlled in Git
3. **Configuration**: Stored in Key Vault and Infrastructure as Code

## Cost Optimization

### Resource Sizing

- **Development**: Basic App Service Plan (B1)
- **Production**: Standard App Service Plan (S1) or higher
- **Database**: General Purpose (GP_Gen5_2) for production

### Monitoring Costs

- Use Azure Cost Management
- Set up billing alerts
- Review resource utilization regularly

## Support

For technical support:
- Email: support@netwoven.com
- Documentation: [Internal Wiki]
- Issue Tracking: [GitHub Issues]

---

**Last Updated**: January 2025
**Version**: 1.0
**Next Review**: April 2025
