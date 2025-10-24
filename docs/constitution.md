# Netwoven Card Sorting App - Development Constitution

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Code Quality Principles](#code-quality-principles)
4. [Testing Standards](#testing-standards)
5. [User Experience Consistency](#user-experience-consistency)
6. [Performance Requirements](#performance-requirements)
7. [Development Workflow](#development-workflow)
8. [Deployment Standards](#deployment-standards)
9. [Code Review Guidelines](#code-review-guidelines)
10. [Documentation Standards](#documentation-standards)

## Project Overview

The Netwoven Card Sorting App is a modern web application designed to facilitate efficient card sorting and categorization workflows. This constitution establishes the foundational principles, standards, and practices that govern the development, testing, and deployment of the application.

## Technology Stack

### Core Technologies
- **Frontend Framework**: Next.js 14+ (App Router)
- **Database**: PostgreSQL
- **UI Library**: shadcn/ui components
- **Icons**: Lucide React
- **Deployment**: Azure CLI with GitHub Actions
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript

### Supporting Technologies
- **State Management**: Zustand or React Context
- **Form Handling**: React Hook Form with Zod validation
- **API Layer**: Next.js API Routes or tRPC
- **Authentication**: NextAuth.js or Auth0
- **Testing**: Jest, React Testing Library, Playwright

## Code Quality Principles

### 1. TypeScript Excellence
- **Strict Mode**: All TypeScript configurations must use strict mode
- **Type Definitions**: Every function, component, and API endpoint must have explicit type definitions
- **No `any` Types**: Explicitly avoid `any` types; use proper type definitions or `unknown`
- **Interface Consistency**: Use consistent naming conventions for interfaces (e.g., `IUser`, `UserProps`)

### 2. Component Architecture
- **Single Responsibility**: Each component should have one clear purpose
- **Composition over Inheritance**: Prefer component composition and hooks over class inheritance
- **Props Interface**: Every component must have a well-defined props interface
- **Default Props**: Use default parameters instead of defaultProps for better TypeScript support

### 3. Code Organization
```
src/
├── app/                    # Next.js App Router
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   └── features/         # Feature-specific components
├── lib/                  # Utility functions and configurations
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── constants/            # Application constants
└── styles/               # Global styles and Tailwind config
```

### 4. Naming Conventions
- **Files**: kebab-case for files (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions/Variables**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase with descriptive prefixes (`IUser`, `UserProps`)

### 5. Code Documentation
- **JSDoc Comments**: All public functions and complex logic must have JSDoc comments
- **Inline Comments**: Explain complex business logic and non-obvious code
- **README Files**: Each major feature directory must have a README explaining its purpose

## Testing Standards

### 1. Testing Pyramid
- **Unit Tests (70%)**: Test individual functions, components, and utilities
- **Integration Tests (20%)**: Test component interactions and API integrations
- **E2E Tests (10%)**: Test complete user workflows

### 2. Unit Testing Requirements
- **Coverage Threshold**: Minimum 80% code coverage for all new code
- **Test Files**: Co-locate test files with source files (`component.test.tsx`)
- **Test Naming**: Use descriptive test names that explain the scenario
- **Mocking**: Mock external dependencies and API calls appropriately

### 3. Component Testing Standards
```typescript
// Example component test structure
describe('UserProfile Component', () => {
  it('should render user information correctly', () => {
    // Arrange
    const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
    
    // Act
    render(<UserProfile user={mockUser} />);
    
    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

### 4. Integration Testing
- **API Integration**: Test API endpoints with real database connections in test environment
- **Component Integration**: Test how components work together
- **Database Testing**: Use test database for integration tests

### 5. E2E Testing with Playwright
- **Critical User Flows**: Test complete user journeys
- **Cross-browser Testing**: Test on Chrome, Firefox, and Safari
- **Mobile Responsiveness**: Test on various screen sizes
- **Performance Testing**: Include performance benchmarks in E2E tests

## User Experience Consistency

### 1. Design System Standards
- **shadcn/ui Components**: Use shadcn/ui as the foundation for all UI components
- **Consistent Spacing**: Use Tailwind's spacing scale consistently (4, 8, 12, 16, 24, 32px)
- **Color Palette**: Define and maintain a consistent color palette using CSS custom properties
- **Typography**: Establish typography scale using Tailwind's font utilities

### 2. Accessibility Standards (WCAG 2.1 AA)
- **Semantic HTML**: Use proper HTML semantic elements
- **ARIA Labels**: Provide appropriate ARIA labels for interactive elements
- **Keyboard Navigation**: Ensure all functionality is accessible via keyboard
- **Color Contrast**: Maintain minimum 4.5:1 contrast ratio for normal text
- **Screen Reader Support**: Test with screen readers and provide appropriate announcements

### 3. Responsive Design Principles
- **Mobile-First**: Design for mobile devices first, then enhance for larger screens
- **Breakpoints**: Use consistent breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- **Touch Targets**: Minimum 44px touch targets for mobile devices
- **Content Priority**: Ensure important content is visible on all screen sizes

### 4. User Interface Guidelines
- **Loading States**: Provide clear loading indicators for all async operations
- **Error Handling**: Display user-friendly error messages with actionable solutions
- **Success Feedback**: Provide clear confirmation for successful actions
- **Navigation**: Consistent navigation patterns throughout the application

### 5. Internationalization (i18n)
- **Text Externalization**: All user-facing text must be externalized for translation
- **RTL Support**: Consider right-to-left language support in design
- **Date/Time Formatting**: Use locale-appropriate date and time formatting
- **Number Formatting**: Support different number formats for different locales

## Performance Requirements

### 1. Core Web Vitals
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **First Input Delay (FID)**: < 100 milliseconds
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Contentful Paint (FCP)**: < 1.8 seconds

### 2. Performance Budgets
- **Initial Bundle Size**: < 250KB gzipped for JavaScript
- **Total Page Weight**: < 1MB for initial page load
- **Image Optimization**: All images must be optimized (WebP format preferred)
- **Font Loading**: Use font-display: swap for web fonts

### 3. Optimization Strategies
- **Code Splitting**: Implement route-based and component-based code splitting
- **Lazy Loading**: Lazy load images, components, and non-critical resources
- **Caching**: Implement appropriate caching strategies for static assets and API responses
- **Database Optimization**: Use proper indexing and query optimization

### 4. Monitoring and Metrics
- **Performance Monitoring**: Implement performance monitoring with tools like Vercel Analytics or Google Analytics
- **Error Tracking**: Use error tracking services (Sentry) for production monitoring
- **User Experience Metrics**: Track user interaction metrics and conversion rates

### 5. Database Performance
- **Query Optimization**: All database queries must be optimized and use proper indexing
- **Connection Pooling**: Implement database connection pooling
- **Caching Strategy**: Use Redis or similar for caching frequently accessed data
- **Database Migrations**: All schema changes must be versioned and reversible

## Development Workflow

### 1. Git Workflow
- **Branch Naming**: Use descriptive branch names (`feature/user-authentication`, `bugfix/login-error`)
- **Commit Messages**: Use conventional commit format (`feat: add user authentication`)
- **Pull Requests**: All changes must go through pull request review
- **Main Branch Protection**: Main branch requires pull request approval and passing tests

### 2. Code Review Process
- **Review Requirements**: Minimum 2 approvals for all pull requests
- **Automated Checks**: All CI/CD checks must pass before merge
- **Review Guidelines**: Focus on code quality, performance, security, and maintainability
- **Documentation**: Ensure all changes are properly documented

### 3. Feature Development
- **Feature Branches**: Create feature branches from main branch
- **Incremental Development**: Break large features into smaller, reviewable chunks
- **Testing**: Write tests before or alongside feature development
- **Documentation**: Update documentation as part of feature development

## Deployment Standards

### 1. Azure CLI Integration
- **Infrastructure as Code**: Use Azure CLI scripts for consistent deployments
- **Environment Management**: Separate development, staging, and production environments
- **Secrets Management**: Use Azure Key Vault for sensitive configuration
- **Resource Naming**: Use consistent naming conventions for Azure resources

### 2. GitHub Actions CI/CD
```yaml
# Example GitHub Actions workflow structure
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Run linting
        run: npm run lint
      - name: Run type checking
        run: npm run type-check
```

### 3. Environment Configuration
- **Environment Variables**: Use environment variables for all configuration
- **Secrets Management**: Never commit secrets to version control
- **Configuration Validation**: Validate all configuration on application startup
- **Feature Flags**: Use feature flags for gradual feature rollouts

### 4. Database Management
- **Migrations**: All database changes must be versioned migrations
- **Backup Strategy**: Implement automated database backups
- **Schema Versioning**: Track database schema versions
- **Rollback Plan**: Have rollback procedures for database changes

## Code Review Guidelines

### 1. Review Checklist
- [ ] Code follows established patterns and conventions
- [ ] All tests pass and new tests are included
- [ ] TypeScript types are properly defined
- [ ] Performance implications are considered
- [ ] Security best practices are followed
- [ ] Documentation is updated
- [ ] Accessibility requirements are met

### 2. Review Focus Areas
- **Functionality**: Does the code work as intended?
- **Performance**: Are there any performance implications?
- **Security**: Are there any security vulnerabilities?
- **Maintainability**: Is the code easy to understand and maintain?
- **Testing**: Are there adequate tests for the changes?

### 3. Communication Standards
- **Constructive Feedback**: Provide specific, actionable feedback
- **Respectful Tone**: Maintain professional and respectful communication
- **Learning Opportunity**: Use reviews as learning opportunities
- **Documentation**: Document complex decisions and trade-offs

## Documentation Standards

### 1. Code Documentation
- **README Files**: Each major directory should have a README
- **API Documentation**: Document all API endpoints with examples
- **Component Documentation**: Document complex components with usage examples
- **Architecture Decisions**: Document significant architectural decisions

### 2. User Documentation
- **User Guides**: Provide clear user guides for application features
- **FAQ Section**: Maintain a frequently asked questions section
- **Video Tutorials**: Consider video tutorials for complex workflows
- **Accessibility Guide**: Document accessibility features and usage

### 3. Developer Documentation
- **Setup Instructions**: Clear instructions for setting up the development environment
- **Contributing Guidelines**: Guidelines for contributing to the project
- **Deployment Guide**: Step-by-step deployment instructions
- **Troubleshooting**: Common issues and their solutions

## Conclusion

This constitution serves as the foundation for developing a high-quality, maintainable, and performant Netwoven Card Sorting App. All team members are expected to follow these principles and standards to ensure consistency, quality, and success of the project.

**Remember**: This is a living document that should evolve with the project. Regular reviews and updates ensure it remains relevant and effective.

---

*Last Updated: [Current Date]*
*Version: 1.0*
*Next Review: [Quarterly]*
