# MatchPro AI Event Management System

## Overview
MatchPro AI is a comprehensive sports event management platform for tournament organizers and sports clubs. Its primary purpose is to streamline and automate workflows such as team registrations, payment processing, scoring, standings, and administrative tasks. The system aims to provide a professional, low-maintenance, and intelligent solution for managing tournaments from initial setup and scheduling to real-time updates and financial oversight, aspiring to offer predictive insights and eliminate manual configuration.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React hooks and context
- **Routing**: Wouter
- **UI/UX Decisions**: Modern, professional design with gradient themes, interactive cards, and consistent MatchPro branding. Emphasis on intuitive workflows, clear visual feedback, and comprehensive dashboards.

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST APIs
- **Database ORM**: Drizzle ORM
- **Authentication**: Session-based with role-based access control (super_admin, tournament_admin, finance_admin, score_admin).
- **Core Features**:
    - **Event Management**: Configuration of tournaments, age groups, brackets, eligibility, and scoring systems.
    - **Team Registration**: Multi-step workflow, roster management, and two-step payment processing, including team gender editing with smart age group filtering.
    - **Payment Processing**: Full Stripe integration supporting Connect accounts, two-step payments, refunds, and intelligent payment recovery for complex fee structures and fund routing.
    - **Email Communication**: Dynamic template system for automated notifications.
    - **Administrative Features**: Role-based access, team approval/rejection, payment tracking, audit trails, and comprehensive user/team management.
    - **Enhanced Calendar Interface**: Consolidated drag-and-drop scheduler with operation logging, optimistic updates, conflict detection, and persistent backend synchronization, supporting real-time schedule updates.
    - **Intelligent Gap-Filling System**: Advanced field consolidation that identifies time gaps on priority fields and moves games from outer fields to fill those gaps, with automatic time slot adjustment, cascading game placement, and **comprehensive rest period validation** ensuring 90-minute minimum rest between games for all teams.
    - **Tournament-Wide Flight Management**: Unified flight category system allowing tournament-level configuration of flight templates (e.g., Nike Classic, Premier, Elite) that propagate to all age groups.
    - **Enhanced Bracket Creation Engine**: Comprehensive team assignment interface with manual assignment, seeding, and proper flight name formatting.
    - **Bracket Assignment Interface**: Manual team-to-bracket assignment system allowing tournament directors to control which specific teams are placed in Bracket A vs Bracket B within flights, with auto-balance functionality for even distribution and clear all assignments capability for resetting team assignments.
    - **Tournament-Specific Field Management System**: Comprehensive field configuration system allowing tournament directors to set field sizes (3v3 through 11v11) per-tournament rather than per-complex. Features drag-and-drop field ordering interface with tournament-specific field size dropdowns in the Master Scheduler's Field Order tab. Includes field deletion with constraint validation, bulk configuration updates, and persistent field ordering integration.
    - **Field Availability and Bulk Time Assignment System**: Tournament directors can enable/disable fields for rain-outs or maintenance, and bulk assign first game times by field size (7v7, 9v9, 11v11). Features individual field controls with visual status indicators, batch time updates, and tournament-specific field availability settings stored in eventFieldConfigurations table.
    - **Intelligent Scheduling Engine**: Advanced multi-tier system with constraint-aware optimization and dynamic rest period enforcement. Supports various scheduling approaches with comprehensive game generation for formats like round-robin, pool play, single/double elimination, Swiss system, and hybrid. The system dynamically reads rest period values from Flight Configuration (e.g., Nike Elite: 90min, Nike Premier: 60min, Nike Classic: 30min) and distributes games across time slots with flight-specific rest period enforcement, configurable max games per team per day constraint, and intelligent conflict detection.
        - **Constraint Validation**: Strict field size filtering, prevention of simultaneous scheduling, and comprehensive pre-scheduling validation (e.g., team rest periods, games per day limits, coach conflict detection, lighting constraints).
        - **Dynamic Rest Period Enforcement**: Teams cannot play another match until at least the configured rest period AFTER their previous match ends.
        - **Granular Time Slots**: 15-minute interval scheduling for optimal game distribution.
        - **Intelligent Optimization**: Multi-objective optimization for field utilization, team fairness, travel minimization, and prime time optimization.
        - **Dynamic Configuration**: Database-driven tournament format configuration.
        - **Field Assignment**: Intelligent field size matching and assignment.
    - **Field Intelligence System**: Integration of real field data, flexible time slots, buffer management, and field blackout system with enhanced conflict detection.
    - **Constraint Validation System**: Coach conflict detection, team rest period validation, field size matching, and travel time constraints.
    - **Facility Intelligence System**: Lighting constraint validation, parking capacity management, and concession coordination.
    - **Swiss Tournament System**: Intelligent pairing algorithm, comprehensive tiebreaker system, and color balance management.
    - **Referee Management System**: Intelligent assignment engine, certification compliance, workload balancing, and payment tracking.
- **Critical Data Structure**: AGE GROUP → FLIGHTS → BRACKETS → Teams. Tournament formats are assigned to FLIGHTS (represented as event_brackets in database). FLIGHTS are competitive levels (Nike Elite, Nike Premier, Nike Classic) within age groups. Each FLIGHT generates its own brackets and matchups based on the assigned tournament_format. Teams have both `bracketId` (flight assignment) and `groupId` (specific bracket within flight) for granular tournament organization.

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