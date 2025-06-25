# MatchPro AI Event Management System

## Overview

MatchPro AI is a comprehensive sports event management platform designed for tournament organizers and sports clubs. The system handles team registrations, payment processing, scoring, standings, and administrative workflows. Built with a modern full-stack architecture using React/TypeScript frontend and Node.js/PostgreSQL backend.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: React hooks and context for component state
- **Routing**: React Router for client-side navigation
- **Form Handling**: Custom form components with validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API endpoints
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with role-based access control
- **File Processing**: Multer for file uploads and roster management

### Data Storage Solutions
- **Primary Database**: PostgreSQL with comprehensive schema for events, teams, players, and payments
- **Session Storage**: Database-backed session management
- **File Storage**: Local file system for uploaded rosters and documents

## Key Components

### Event Management
- Tournament creation and configuration
- Age group and bracket management
- Eligibility settings and field configurations
- Scoring systems (Three-Point and Ten-Point)

### Team Registration System
- Multi-step registration workflow
- Club association and player roster management
- Two-step payment flow with Stripe integration
- Setup Intent collection for deferred payment processing

### Payment Processing
- **Stripe Integration**: Complete payment workflow with Connect accounts
- **Banking Setup**: Tournament-specific bank account configuration
- **Two-Step Payment Flow**: Card collection during registration, charging upon approval
- **Refund Management**: Full and partial refund capabilities

### Email Communication
- **SendGrid Integration**: Dynamic template system for all notifications
- **Template Management**: Admin interface for configuring email templates
- **Automated Workflows**: Registration confirmations, approval notifications, payment receipts

### Administrative Features
- Role-based access control (super_admin, tournament_admin, finance_admin, score_admin)
- Team approval/rejection workflow
- Payment status tracking and management
- Comprehensive audit trails

## Data Flow

### Registration Process
1. Team submits registration with player roster
2. Payment method collected via Stripe Setup Intent
3. Team status set to 'registered' (pending approval)
4. Admin reviews and approves/rejects team
5. Upon approval, payment is processed automatically
6. Confirmation emails sent to all parties

### Payment Workflow
1. Setup Intent created during registration
2. Payment method stored securely with Stripe
3. Customer charged only upon team approval
4. Payment confirmation and receipt generation
5. Automatic refund processing for rejected teams

## External Dependencies

### Payment Processing
- **Stripe**: Payment processing, Connect accounts, and refund management
- **API Version**: 2023-10-16 with webhooks for payment status updates

### Email Services
- **SendGrid**: Email delivery with dynamic templates
- **Configuration**: API key-based authentication with verified sender addresses
- **Templates**: Branded email templates for all user communications

### Geographic Services
- **Mapbox Integration**: Address verification and complex location management
- **Multi-tenant Support**: Prevents scheduling conflicts across client instances

### Development Tools
- **Database Migration**: Custom migration scripts for schema updates
- **Phone Standardization**: Unified phone number formatting across all forms
- **Audit Logging**: Comprehensive tracking of administrative actions

## Deployment Strategy

### Production Environment
- **Platform**: Replit with Google Cloud Run deployment target
- **Build Process**: Vite production build with asset optimization
- **Runtime**: Node.js with TSX for TypeScript execution
- **Database**: PostgreSQL with connection pooling

### Environment Configuration
- **Development**: Local development with hot module replacement
- **Production**: Environment-specific configuration with secrets management
- **Database Migrations**: Automated schema updates and data transformations

### Monitoring and Maintenance
- **Error Tracking**: Comprehensive error handling and logging
- **Performance**: Optimized queries and connection management
- **Security**: Role-based access control and secure payment processing

## Changelog
- June 25, 2025: Implemented and verified "Collect Now, Charge Later" payment workflow
  - Server-side Setup Intent validation blocks incomplete registrations
  - Team approval workflow automatically charges stored payment methods
  - Complete end-to-end payment processing guaranteed and functional
- June 23, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.