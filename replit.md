# MatchPro AI Event Management System

## Overview
MatchPro AI is a comprehensive sports event management platform designed for tournament organizers and sports clubs. Its main purpose is to automate and streamline workflows such as team registrations, payment processing, scoring, standings, and administrative tasks. The system aims to provide a professional, low-maintenance, and intelligent solution for managing tournaments from initial setup and scheduling to real-time updates and financial oversight, with ambitions to offer predictive insights and eliminate manual configuration.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (August 15, 2025)
- **Backend Reconstruction Phase 2 Complete**: Successfully created and registered tournament format configuration and event field configuration APIs
- **LSP Diagnostics Resolved**: Fixed all remaining TypeScript errors across reconstructed backend components
- **New API Endpoints**: 
  - `/api/admin/events/:eventId/format-templates` - Tournament format template management
  - `/api/admin/events/:eventId/fields` - Event-specific field configuration management
  - `/api/admin/events/:eventId/fields/reorder` - Drag-and-drop field ordering
- **System Integration**: All new backend routers properly registered in main routes system
- **Frontend Integration**: Updated FormatSettings component to use new tournament-specific API endpoints

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React hooks and context
- **Routing**: Wouter
- **UI/UX Decisions**: Modern, professional design featuring gradient themes, interactive cards, and consistent MatchPro branding. Emphasis is placed on intuitive workflows, clear visual feedback, and comprehensive dashboards, including an enhanced Schedule Grid with detailed game cards, hover tooltips, and a right-click context menu for game manipulation.

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST APIs
- **Database ORM**: Drizzle ORM
- **Authentication**: Session-based with role-based access control (super_admin, tournament_admin, finance_admin, score_admin).
- **Core Features**:
    - **Event Management**: Configuration of tournaments, age groups, flights (previously brackets), and scoring systems.
    - **Team Registration**: Multi-step workflow, roster management, and two-step payment processing, including team gender editing with smart age group filtering.
    - **Payment Processing**: Full Stripe integration supporting Connect accounts, two-step payments, refunds, and intelligent payment recovery for complex fee structures and fund routing.
    - **Email Communication**: Dynamic template system for automated notifications.
    - **Administrative Features**: Role-based access, team approval/rejection, payment tracking, and comprehensive user/team management, including silent status changes for teams without triggering emails.
    - **Scheduling Systems**:
        - **Automated Scheduling Engine**: Dynamic template-driven game generation eliminating hardcoded logic. Supports various formats (round-robin, pool play, single/double elimination, Swiss system, hybrid) with constraint-aware optimization and dynamic rest period enforcement. Includes field size matching, coach conflict detection, and lighting constraints.
        - **Intelligent Gap-Filling**: Advanced field consolidation to optimize field utilization by moving games from outer fields to fill gaps on priority fields.
        - **Enhanced Calendar Interface**: Consolidated drag-and-drop scheduler with operation logging, optimistic updates, conflict detection, and persistent backend synchronization for real-time schedule updates and inline editing.
    - **Tournament-Wide Flight Management**: Unified flight category system allowing tournament-level configuration of flight templates (e.g., Nike Classic, Premier, Elite) that propagate to all age groups.
    - **Unified Bracket Management Interface**: Consolidated bracket creation and team assignment system. Users select flights, choose bracket configurations (Group of 4/6/8), and assign teams within brackets. Supports Group of 4 (round-robin), Group of 6 (Pool A vs Pool B crossplay), and Group of 8 (two separate 4-team round-robin brackets with no cross-bracket play except championship final).
    - **Tournament-Specific Field Management**: Comprehensive field configuration system allowing tournament directors to set field sizes per-tournament, featuring drag-and-drop ordering, bulk updates, and deletion. Includes field availability and bulk time assignment.
    - **Team Replacement System**: Individual team replacement functionality allowing substitution with teams from the same flight category while preserving scheduling details.
    - **AI Assistant**: Persistent, floating chatbot interface powered by GPT-4o for natural language game scheduling, constraint validation, and real-time database updates. Integrates with Flight Configuration parameters for constraint validation and offers alternative suggestions for conflicts. Conversation history is persistent via a PostgreSQL database.
- **Critical Data Structure**: AGE GROUP → FLIGHTS → BRACKETS → Teams. Tournament formats are assigned to FLIGHTS (represented as event_brackets). FLIGHTS are competitive levels within age groups, each generating its own brackets and matchups based on the assigned tournament_format. Teams have `bracketId` (flight assignment) and `groupId` (specific bracket within flight).

### Data Storage
- **Primary Database**: PostgreSQL for all event, team, player, payment, and scheduling data.
- **Session Storage**: Database-backed.
- **File Storage**: Local file system for uploaded rosters.

## External Dependencies

-   **Stripe**: Payment processing.
-   **SendGrid**: Email delivery.
-   **Mapbox**: Geographic services.
-   **jsPDF & QRCode libraries**: PDF generation and QR code integration.
-   **react-beautiful-dnd**: Drag-and-drop scheduling interface.