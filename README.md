# MockTurboVets - Task Management System

A full-stack task management application built with Angular frontend and NestJS backend, featuring role-based access control and organization management.

## Table of Contents

- [Setup Instructions](#setup-instructions)
- [Architecture Overview](#architecture-overview)
- [Data Model](#data-model)
- [Access Control Implementation](#access-control-implementation)
- [API Documentation](#api-documentation)
- [Future Considerations](#future-considerations)

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mockTurboVets
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

### Backend Setup (NestJS API)

1. **Navigate to the API directory**
   ```bash
   cd apps/api
   ```

2. **Environment Configuration**
   
   Create a `.env` file in `apps/api/` with the following variables:
   ```bash
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   
   # Server Configuration
   PORT=3000
   
   # Database Configuration
   DATABASE_URL=./tasks.sqlite
   ```

   **Database Setup (SQLite):**
   - The application uses SQLite for local development - no additional database installation required
   - SQLite database file (`tasks.sqlite`) will be automatically created when you first start the API
   - Database schema is managed by TypeORM and will auto-migrate on startup
   - The database file is located in the `apps/api/` directory
   - SQLite provides a lightweight, file-based database perfect for development and testing

   **Security Notes:**
   - Never commit your actual JWT_SECRET to version control
   - Use a strong, random string for JWT_SECRET in production
   - The application includes default values for development

3. **Start the backend server**
   ```bash
   npm run start:dev
   ```
   
   The API will be available at `http://localhost:3000`

### Frontend Setup (Angular Dashboard)

1. **Navigate to the dashboard directory**
   ```bash
   cd apps/dashboard
   ```

2. **Start the development server**
   ```bash
   npm start
   ```
   
   The frontend will be available at `http://localhost:4200`

### Running Both Applications

From the root directory, you can run both applications simultaneously:

```bash
# Backend
cd apps/api && npm run start:dev &

# Frontend
cd apps/dashboard && npm start
```

## Architecture Overview

### NX Monorepo Structure

This project uses NX monorepo architecture to manage multiple applications and shared libraries efficiently:

```
mockTurboVets/
├── apps/
│   ├── api/           # NestJS backend application
│   └── dashboard/     # Angular frontend application
├── libs/
│   ├── auth/          # Shared authentication library
│   └── data/          # Shared data models and interfaces
├── dist/              # Build outputs
└── node_modules/      # Shared dependencies
```

**Benefits of NX Monorepo:**
- **Code Sharing**: Common interfaces and utilities shared between frontend and backend
- **Consistent Dependencies**: Single package.json manages all dependencies
- **Build Optimization**: NX provides intelligent build caching and dependency graphs
- **Developer Experience**: Unified tooling and consistent development workflow

### Technology Stack

**Backend (NestJS):**
- Framework: NestJS with TypeScript
- Database: SQLite with TypeORM (file-based, zero-config for local development)
- Authentication: JWT with Passport.js
- Security: bcryptjs for password hashing

**Frontend (Angular):**
- Framework: Angular 20+ with standalone components
- State Management: Angular Signals
- Styling: TailwindCSS
- Charts: Chart.js with ng2-charts
- Forms: Reactive Forms

**Shared Libraries:**
- `@my-workspace/data`: TypeScript interfaces and DTOs
- `@my-workspace/auth`: Authentication utilities

## Data Model

### Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Organization  │────┐│      User       │────┐│      Task       │
├─────────────────┤    ││├─────────────────┤    ││├─────────────────┤
│ id: number      │    ││││ id: number      │    │││ id: number      │
│ name: string    │    ││││ email: string   │    │││ title: string   │
│ description     │    ││││ password: string│    │││ description     │
│ createdAt       │    ││││ firstName       │    │││ completed: bool │
│ updatedAt       │    ││││ lastName        │    │││ status: string  │
└─────────────────┘    ││││ role: UserRole  │    │││ category: string│
                       ││││ organizationId  │    │││ createdBy: num  │
                       ││││ createdAt       │    │││ assignedTo: num │
                       ││││ updatedAt       │    │││ organizationId  │
                       │││└─────────────────┘    │││ createdAt       │
                       ││└────────────────────────┘│ updatedAt       │
                       │└──────────────────────────└─────────────────┘
                       └── One-to-Many relationships
```

### Core Entities

**User Entity** (`apps/api/src/auth/entities/user.entity.ts`)
- Primary key: `id`
- Unique email-based authentication
- Role-based access control (OWNER, ADMIN, VIEWER)
- Organization membership
- Timestamps for audit trails

**Task Entity** (`apps/api/src/tasks/entities/task.entity.ts`)
- Primary key: `id`
- Title and description fields
- Status tracking (new, in-progress, completed)
- Category classification
- Creator and assignee relationships
- Organization scoping

**Organization Entity** (`apps/api/src/organizations/entities/organization.entity.ts`)
- Primary key: `id`
- Unique organization names
- One-to-many relationship with users
- Hierarchical data isolation

### Shared Interfaces

Located in `libs/data/src/lib/`:
- `user.interface.ts`: User-related types and enums
- `tasks.interface.ts`: Task-related types
- `organization.interface.ts`: Organization types

## Access Control Implementation

### Role-Based Access Control (RBAC)

**User Roles** (`src/common/types/user.types.ts`):
```typescript
export enum UserRole {
  OWNER = 'owner',    // Full system access
  ADMIN = 'admin',    // Organization management
  VIEWER = 'viewer'   // Read-only access
}
```

### JWT Authentication Flow

1. **Registration** (`POST /auth/register`)
   - User provides email, password, and optional profile data
   - Password hashed with bcryptjs
   - Default role assigned as VIEWER

2. **Login** (`POST /auth/login`)
   - Credentials validated using Passport Local Strategy
   - JWT token generated with user payload
   - Token returned to client for subsequent requests

3. **Token Validation** (`GET /auth/status`)
   - JWT token validated using Passport JWT Strategy
   - User information extracted from token payload
   - Protected routes require valid JWT

### Authorization Guards

**JWT Guard** (`src/auth/guards/jwt.guard.ts`):
- Extends NestJS AuthGuard('jwt')
- Validates JWT tokens on protected routes
- Injects user data into request context

**Roles Guard** (`src/auth/guards/roles.guard.ts`):
- Implements role-based access control
- Uses reflection to read required roles from decorators
- Compares user role with required permissions

**Usage Example**:
```typescript
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
createOrganization(@Body() dto: CreateOrganizationDto) {
  return this.organizationsService.create(dto);
}
```

### Organization Hierarchy

- Users belong to organizations through `organizationId`
- Tasks are scoped to organizations
- Organization admins can manage organization resources
- Data isolation enforced at the service layer

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "viewer"
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "viewer"
  }
}
```

#### Get Auth Status
```http
GET /auth/status
Authorization: Bearer <jwt_token>
```

### Task Management Endpoints

#### Create Task
```http
POST /tasks
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "title": "Complete project documentation",
  "description": "Write comprehensive README and API docs",
  "category": "documentation",
  "assignedTo": 2
}
```

#### Get All Tasks
```http
GET /tasks
Authorization: Bearer <jwt_token>
```

#### Update Task
```http
PUT /tasks/:id
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "title": "Updated task title",
  "status": "completed",
  "completed": true
}
```

#### Delete Task
```http
DELETE /tasks/:id
Authorization: Bearer <jwt_token>
```

### Organization Endpoints

#### Create Organization (Admin Only)
```http
POST /organizations
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "name": "TechCorp Solutions",
  "description": "Software development company"
}
```

#### Get All Organizations
```http
GET /organizations
Authorization: Bearer <jwt_token>
```

#### Update Organization (Admin Only)
```http
PATCH /organizations/:id
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "name": "Updated Organization Name",
  "description": "Updated description"
}
```

## Future Considerations

### Advanced Role Delegation

**Planned Enhancements:**
- **Custom Role Creation**: Allow organizations to define custom roles
- **Permission Granularity**: Fine-grained permissions (read, write, delete) per resource
- **Role Inheritance**: Hierarchical role structures with permission inheritance
- **Dynamic Role Assignment**: Runtime role modifications with immediate effect

**Implementation Strategy:**
```typescript
// Future role system
interface Permission {
  resource: string;
  actions: ('read' | 'write' | 'delete')[];
}

interface CustomRole {
  id: string;
  name: string;
  permissions: Permission[];
  organizationId: number;
}
```

### Production-Ready Security

**JWT Refresh Tokens:**
- Implement refresh token rotation
- Short-lived access tokens (15 minutes)
- Secure HTTP-only refresh token cookies
- Automatic token renewal

**CSRF Protection:**
- CSRF tokens for state-changing operations
- SameSite cookie attributes
- Origin validation for sensitive endpoints

**RBAC Caching:**
- Redis-based permission caching
- Cache invalidation strategies
- Distributed permission checking

**Additional Security Measures:**
- Rate limiting with Redis
- Request validation middleware
- SQL injection prevention
- XSS protection headers
- Security audit logging

### Scaling Permission Checks

**Performance Optimizations:**
- **Permission Caching**: Cache user permissions in Redis
- **Batch Permission Checks**: Validate multiple permissions in single query
- **Database Indexing**: Optimize role and permission queries
- **Lazy Loading**: Load permissions only when needed

**Monitoring and Analytics:**
- Permission check performance metrics
- Access pattern analysis
- Security event monitoring
- Compliance reporting

### Deployment Considerations

**Environment Configuration:**
- Kubernetes deployment manifests
- Docker containerization
- Environment-specific secrets management
- Health check endpoints

**Database Migration:**
- Production database migration from SQLite to PostgreSQL/MySQL
- Database connection pooling
- Backup and recovery procedures
- Data encryption at rest

**Note**: SQLite is ideal for local development but production deployments should migrate to a more robust database system like PostgreSQL or MySQL for better performance, concurrent access, and scalability.

---

## Development Commands

### Backend (API)
```bash
cd apps/api
npm run start:dev     # Development server with hot reload
npm run build         # Production build
npm run test          # Run unit tests
npm run test:e2e      # Run end-to-end tests
npm run lint          # Code linting
```

### Frontend (Dashboard)
```bash
cd apps/dashboard
npm start             # Development server
npm run build         # Production build
npm test              # Run unit tests
npm run test:watch    # Run tests in watch mode
```

### NX Commands
```bash
nx build api          # Build API application
nx build dashboard    # Build dashboard application
nx test               # Run all tests
nx lint               # Lint all applications
```

## Contributing

1. Follow the Angular and NestJS style guides
2. Use TypeScript strict mode
3. Write tests for new features
4. Update documentation for API changes
5. Follow conventional commit messages

## License

This project is licensed under the MIT License.