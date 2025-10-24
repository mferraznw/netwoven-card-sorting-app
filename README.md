# Netwoven Card Sorting App

A comprehensive SharePoint Hub & Spoke management application designed for CA DMV, built with Next.js, PostgreSQL, and Microsoft Graph integration.

## 🚀 Features

### Core Functionality
- **Graph Visualization**: Interactive D3.js-based visualization of hub and spoke relationships
- **Dual-Panel Interface**: List view and graph view for different user preferences
- **Drag & Drop**: Intuitive drag-and-drop interface for reorganizing site relationships
- **Search & Filter**: Advanced search and filtering capabilities for sites
- **Changeset Management**: Complete audit trail of all changes with commit/revert functionality

### Microsoft Graph Integration
- **MSAL2 Authentication**: Secure authentication with Microsoft Azure AD
- **Site Data Collection**: Automatic collection of SharePoint site information
- **Real-time Sync**: Synchronization with Microsoft Graph for up-to-date data
- **Team Association**: Detection and management of Microsoft Teams associations

### Admin Portal
- **Database Management**: Reset and manage database content
- **CSV Import/Export**: Bulk data import and export capabilities
- **MS Graph Sync**: Manual and automated synchronization with Microsoft Graph
- **Audit Logging**: Complete audit trail of all admin actions

### PowerShell Integration
- **Script Generation**: Automatic generation of PowerShell scripts for hub site associations
- **Download & Execute**: Easy download and execution by SharePoint administrators
- **Change Tracking**: Full tracking of all PowerShell script generations

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Lucide React** for icons
- **D3.js** for graph visualization

### Backend
- **Next.js API Routes** for backend logic
- **Prisma ORM** for database management
- **PostgreSQL** for data storage
- **Microsoft Graph SDK** for SharePoint integration

### Authentication & Security
- **MSAL2** for Microsoft authentication
- **Azure Key Vault** for secret management
- **RBAC** (Role-Based Access Control)
- **Audit logging** for security compliance

### Deployment
- **Azure App Service** for hosting
- **Azure Database for PostgreSQL** for database
- **Azure Key Vault** for secrets
- **GitHub Actions** for CI/CD
- **Bicep** for Infrastructure as Code

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- Azure subscription
- Azure AD tenant with admin access

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-org/netwoven-card-sorting-app.git
cd netwoven-card-sorting-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment template:

```bash
cp env.example .env.local
```

Update `.env.local` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/netwoven_card_sorting"

# Azure AD Configuration
AZURE_CLIENT_ID="your-azure-client-id"
AZURE_CLIENT_SECRET="your-azure-client-secret"
AZURE_TENANT_ID="your-azure-tenant-id"

# Application
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database with sample data
npm run db:seed
```

### 5. Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Main application page
│   │   ├── admin/             # Admin portal
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── site-list-panel.tsx
│   │   ├── graph-visualization.tsx
│   │   └── changeset-history.tsx
│   ├── lib/                   # Utility libraries
│   │   ├── utils.ts
│   │   ├── ms-graph.ts
│   │   └── csv-parser.ts
│   └── types/                 # TypeScript type definitions
├── prisma/                    # Database schema and migrations
├── infrastructure/            # Azure Bicep templates
├── docs/                     # Documentation
└── .github/                  # GitHub Actions workflows
```

## 🔧 Configuration

### Azure AD Setup

1. **Create App Registration**:
   - Navigate to Azure Portal > Azure Active Directory > App registrations
   - Create new registration with redirect URI: `http://localhost:3000`

2. **Configure Permissions**:
   - Add Microsoft Graph permissions:
     - `User.Read`
     - `Sites.Read.All`
     - `Sites.ReadWrite.All`

3. **Create Client Secret**:
   - Go to Certificates & secrets
   - Create new client secret
   - Copy the value for your environment variables

### Database Configuration

The application uses PostgreSQL with the following key tables:

- **Sites**: SharePoint sites and their metadata
- **Users**: Application users and their roles
- **Changesets**: Audit trail of all changes
- **SiteChanges**: Individual changes within changesets
- **AdminLogs**: Admin portal activity logs

## 🚀 Deployment

### Azure Deployment

1. **Prerequisites**:
   - Azure CLI installed and configured
   - Azure subscription with appropriate permissions

2. **Deploy Infrastructure**:
   ```bash
   az deployment group create \
     --resource-group "rg-netwoven-card-sorting" \
     --template-file "infrastructure/main.bicep" \
     --parameters "@infrastructure/parameters.json"
   ```

3. **Deploy Application**:
   ```bash
   npm run build
   az webapp deployment source config-zip \
     --resource-group "rg-netwoven-card-sorting" \
     --name "app-netwoven-card-sorting" \
     --src "app.zip"
   ```

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
npm run test:e2e
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## 📊 Usage

### Main Application

1. **Sign In**: Use your Microsoft account to sign in
2. **View Sites**: Browse sites in the left panel or graph view
3. **Reorganize**: Drag and drop sites to change relationships
4. **Commit Changes**: Use the commit button to save changes
5. **Generate Scripts**: Download PowerShell scripts for SharePoint admins

### Admin Portal

Access the admin portal at `/admin` (requires admin privileges):

1. **Data Management**: Reset database or export data
2. **CSV Import**: Upload CSV files to import site data
3. **MS Graph Sync**: Synchronize with Microsoft Graph
4. **View Logs**: Monitor admin activities and system logs

## 🔒 Security

### Authentication
- Microsoft Azure AD integration
- Role-based access control (Admin/User)
- Secure token handling with MSAL2

### Data Protection
- All secrets stored in Azure Key Vault
- Database connections encrypted
- Audit logging for compliance

### Network Security
- HTTPS enforcement
- CORS configuration
- Input validation and sanitization

## 📈 Monitoring

### Application Insights
- Performance monitoring
- Error tracking
- Usage analytics

### Log Analytics
- Centralized logging
- Custom queries
- Alert configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow the established code style

## 📝 License

This project is proprietary software developed for CA DMV by Netwoven.

## 🆘 Support

For technical support:
- Email: support@netwoven.com
- Documentation: [Internal Wiki]
- Issue Tracking: [GitHub Issues]

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core application functionality
- ✅ Microsoft Graph integration
- ✅ Admin portal
- ✅ Azure deployment

### Phase 2 (Q2 2025)
- 🔄 Advanced analytics dashboard
- 🔄 Automated PowerShell execution
- 🔄 Bulk operations
- 🔄 Advanced reporting

### Phase 3 (Q3 2025)
- 📋 Mobile application
- 📋 API for third-party integrations
- 📋 Advanced workflow automation
- 📋 Machine learning insights

---

**Built with ❤️ by Netwoven for CA DMV**

*Last Updated: January 2025*
