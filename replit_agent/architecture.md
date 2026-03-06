# Architecture Documentation

## Overview

KickDeck is a comprehensive event management system designed for sports organizations. The platform enables sports organizations to manage events, team registrations, payments, and more. It features a user-friendly interface for administrators to organize tournaments and events, and for team managers to register and manage their teams.

The application follows a modern web architecture with a React-based frontend and a Node.js backend, using PostgreSQL for data storage. It implements a RESTful API pattern for communication between client and server, with comprehensive authentication and payment processing capabilities.

## System Architecture

### High-Level Architecture

KickDeck follows a classic three-tier architecture:

1. **Presentation Layer**: React-based frontend using Vite for build tooling
2. **Application Layer**: Node.js backend with Express 
3. **Data Layer**: PostgreSQL database with Drizzle ORM

The system is designed to be deployed to Replit's cloud infrastructure, with separate configurations for development and production environments.

### Key Technology Choices

- **Frontend**: React with TailwindCSS and Radix UI components
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based authentication
- **Payment Processing**: Stripe integration
- **Email Service**: SendGrid
- **Maps Integration**: Google Maps API
- **Rich Text Editing**: TinyMCE
- **API Pattern**: RESTful API

## Key Components

### Frontend Components

1. **Client Application**
   - Built with React and Vite
   - Uses TailwindCSS for styling with a customized theme
   - Implements Radix UI components for accessible UI elements
   - Integrates with TinyMCE for rich text editing capabilities
   - Uses React Query for data fetching and state management
   - Includes Google Maps integration for location-based features

2. **Admin Dashboard**
   - Comprehensive tournament and event management interface
   - Team registration management
   - Payment processing and tracking
   - User management with role-based permissions
   - Email template management

### Backend Components

1. **API Server**
   - Express-based RESTful API
   - Handles authentication, data access, and business logic
   - Implements role-based access control
   - Processes team registrations and payments

2. **Authentication System**
   - Session-based authentication
   - Role-based permissions
   - Support for admin and non-admin users

3. **Email Service**
   - SendGrid integration for transactional emails
   - Support for email templates (welcome emails, password reset, etc.)
   - Fallback to SMTP for development environments

4. **Payment Processing**
   - Stripe integration for handling payments
   - Support for team registration fees
   - Payment tracking and reporting

5. **OpenAI Integration**
   - Used for schedule generation in tournaments

### Database Schema

The database schema includes the following key entities:

1. **Users**: Stores user account information
2. **Roles**: Defines user roles and permissions
3. **Events**: Tournament and event information
4. **Teams**: Team registrations for events
5. **Event Age Groups**: Age categories for events
6. **Event Brackets**: Competition brackets within events
7. **Clubs**: Organizations that teams belong to
8. **Payment Transactions**: Records of payments processed through the system
9. **Email Templates**: Customizable email templates for various notifications

## Data Flow

### Registration Flow

1. Team managers access the registration page for an event
2. They complete registration forms with team details
3. The backend validates the registration data
4. Upon successful validation, the team is created with "registered" status
5. Payment is processed through Stripe
6. Upon successful payment, the team status is updated to "paid"
7. Notification emails are sent to both the team manager and event administrators

### Admin Approval Flow

1. Administrators log in to the admin dashboard
2. They can view and filter team registrations
3. Admins can approve, reject, or request changes to team registrations
4. Status change notifications are sent to team managers
5. Approved teams are assigned to appropriate brackets

### Payment Flow

1. Team managers initiate payment during or after registration
2. The system creates a Stripe payment intent
3. Payment is securely processed through Stripe
4. The backend receives webhook notifications of payment status
5. Payment records are stored in the database
6. Receipt emails are sent to payers

## External Dependencies

### Third-Party Services

1. **Stripe**
   - Handles all payment processing
   - Payment intent creation and confirmation
   - Refund processing
   - Webhook integration for payment status updates

2. **SendGrid**
   - Handles transactional email delivery
   - Email template management
   - Tracks email delivery and engagement

3. **Google Maps API**
   - Provides location services and mapping functionality
   - Used for displaying event locations

4. **TinyMCE**
   - Rich text editing capabilities
   - Used in content management sections

5. **OpenAI**
   - Used for generating tournament schedules
   - AI-powered optimization of game scheduling

### External APIs

1. **Stripe API**: Payment processing
2. **SendGrid API**: Email delivery
3. **Google Maps API**: Location services
4. **OpenAI API**: Schedule generation

## Deployment Strategy

### Development Environment

- Local development using Vite dev server for the frontend
- Node.js server for the backend with tsx for TypeScript support
- Environment variables stored in `.env` file
- PostgreSQL database (provided by Replit)

### Production Environment

- Deployed to Replit's cloud infrastructure
- Build process: `npm run build` compiles the frontend with Vite and the backend with esbuild
- Environment variables stored in Replit Secrets
- Production-specific configuration in `.env.production`
- Database connection provided by Replit Deployments

### CI/CD

- Deployments handled through Replit's deployment system
- Environment configuration managed via Replit Secrets

### Database Migrations

- Database schema changes managed through migration scripts
- Scripts for adding new tables and columns as needed

## Security Considerations

1. **Authentication**
   - Session-based authentication
   - Secure password handling with proper hashing
   - Password reset functionality with secure tokens

2. **Authorization**
   - Role-based access control
   - Admin role with granular permissions
   - Event-specific admin assignments

3. **Payment Security**
   - PCI compliance through Stripe
   - Sensitive payment information never stored on servers
   - Secure API keys stored in environment variables

4. **Data Protection**
   - SMTP credentials stored securely
   - API keys for third-party services managed as environment secrets

## Scalability Considerations

1. **Database Design**
   - Proper indexing for performance
   - Relational structure for data integrity

2. **API Design**
   - RESTful patterns for predictable scaling
   - Stateless design to facilitate horizontal scaling

3. **Third-Party Service Integration**
   - SendGrid for reliable email delivery at scale
   - Stripe for scalable payment processing