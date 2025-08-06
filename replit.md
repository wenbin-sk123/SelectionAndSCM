# E-Commerce Training Platform

## Overview

This is a comprehensive e-commerce procurement and supply chain management training platform built as a web-based educational simulation system. The platform is designed to transform theoretical knowledge from e-commerce procurement practices into hands-on, data-driven learning experiences through simulated business operations.

The system provides a complete workflow simulation covering market research, supplier management, procurement negotiations, inventory management, and financial analysis. Students can practice real-world e-commerce scenarios in a safe, controlled environment while teachers can create and manage training tasks with comprehensive evaluation systems.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component patterns
- **UI Library**: Radix UI components with Tailwind CSS for consistent, accessible design
- **State Management**: Zustand for lightweight state management and TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Charts**: Chart.js for data visualization and analytics dashboards
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with session-based authentication using connect-pg-simple
- **API Design**: RESTful API endpoints with consistent error handling and middleware
- **Real-time Communication**: WebSocket support for live market updates and notifications
- **File Structure**: Modular organization with separate routes, storage, and authentication layers

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect for type-safe database operations
- **Schema**: Comprehensive business entities including:
  - Users with role-based access (student, teacher, admin)
  - Training tasks and student progress tracking
  - Supplier and product management
  - Inventory records and order management
  - Financial records and evaluation systems
  - Market data for simulation scenarios
- **Session Storage**: Persistent sessions using PostgreSQL for authentication state
- **Migrations**: Automated schema management through Drizzle Kit

### Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect protocol
- **Session Management**: Server-side sessions stored in PostgreSQL with configurable TTL
- **Role-based Access**: Three-tier permission system (student, teacher, admin)
- **Middleware**: Authentication guards for protected API endpoints
- **Security**: HTTP-only cookies with secure flag and CSRF protection

### Data Architecture
- **Type Safety**: Shared TypeScript schemas between frontend and backend
- **Validation**: Zod schemas for runtime data validation and type inference
- **Caching**: Redis integration capabilities for performance optimization
- **Real-time Updates**: WebSocket connections for live data synchronization

## External Dependencies

### Database & Storage
- **PostgreSQL**: Primary database via Neon Database serverless platform
- **Drizzle ORM**: Type-safe database operations with automatic migration support
- **connect-pg-simple**: PostgreSQL session store for authentication persistence

### Authentication Services
- **Replit Auth**: OpenID Connect authentication provider
- **Passport.js**: Authentication middleware with OpenID strategy
- **Session Management**: Express-session with PostgreSQL backing store

### Development & Build Tools
- **Vite**: Frontend build tool with React plugin and runtime error overlay
- **TypeScript**: Static typing for both frontend and backend code
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **ESBuild**: Backend bundling for production deployment

### UI & Visualization Libraries
- **Radix UI**: Accessible component primitives for complex UI patterns
- **Lucide React**: Consistent icon system throughout the application
- **Chart.js**: Interactive charts for financial and performance analytics
- **Class Variance Authority**: Type-safe component styling patterns

### Development Quality Tools
- **TanStack Query**: Server state management with caching and synchronization
- **Zod**: Runtime type validation and schema inference
- **React Hook Form**: Form handling with validation integration
- **Wouter**: Lightweight routing solution for single-page applications