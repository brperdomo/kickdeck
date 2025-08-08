# MatchPro AI Event Management System

## Overview
MatchPro AI is a comprehensive sports event management platform designed for tournament organizers and sports clubs. Its primary purpose is to streamline and automate complex workflows such as team registrations, payment processing, scoring, standings, and administrative tasks. The system aims to provide a professional, low-maintenance, and intelligent solution for managing tournaments from initial setup and scheduling to real-time updates and financial oversight, aspiring to match leading industry platforms by offering predictive insights and eliminating manual configuration.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Critical Fixes (August 2025)
- **FIXED: 90-Minute Rest Period Enforcement**: Successfully resolved critical scheduling bug where all games were scheduled at 8:00 AM. Enhanced field assignment system now properly enforces "teams cannot play another match until at least 90 minutes AFTER their previous match ends" with intelligent constraint detection, team rest period tracking, and maximum 2 games per team per day enforcement. Games are now distributed across proper time slots with comprehensive conflict detection.

**CRITICAL DATA STRUCTURE (User Emphasis)**:
- AGE GROUP → FLIGHTS → BRACKETS → Teams
- Tournament formats are assigned to FLIGHTS (represented as event_brackets in database)
- FLIGHTS are competitive levels (Nike Elite, Nike Premier, Nike Classic) within age groups
- Each FLIGHT generates its own brackets and matchups based on the assigned tournament_format

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
    - **Tournament-Wide Flight Management**: Unified flight category system allowing tournament-level configuration of flight templates (e.g., Nike Classic, Premier, Elite) that propagate to all age groups.
    - **Enhanced Bracket Creation Engine**: Comprehensive team assignment interface with manual assignment, seeding, and proper flight name formatting.
    - **Intelligent Scheduling Engine**: Advanced multi-tier system with constraint-aware optimization and **CRITICAL 90-minute rest period enforcement**. Supports various scheduling approaches with comprehensive game generation for formats like round-robin, pool play, single/double elimination, Swiss system, and hybrid. **COMPLETELY FIXED (Aug 2025)**: Enhanced field assignment system now properly distributes games across time slots with 90-minute rest period enforcement, max 2 games per team per day constraint, and intelligent conflict detection. No longer schedules all games at 8:00 AM. Key features include:
        - **Constraint Validation**: Strict field size filtering, prevention of simultaneous scheduling, and comprehensive pre-scheduling validation (e.g., team rest periods, games per day limits, coach conflict detection, lighting constraints).
        - **Rest Period Enforcement**: Teams cannot play another match until at least 90 minutes AFTER their previous match ends (not starts).
        - **Granular Time Slots**: 15-minute interval scheduling for optimal game distribution throughout tournament days.
        - **Intelligent Optimization**: Multi-objective optimization for field utilization, team fairness, travel minimization, and prime time optimization.
        - **Dynamic Configuration**: Database-driven tournament format configuration, allowing directors to assign any format to any bracket dynamically.
        - **Field Assignment**: Intelligent field size matching and assignment, integrating real event dates and times.
        - **Group Format Handling**: Specific logic for various group formats (e.g., group_of_4, group_of_6, group_of_8) ensuring correct game generation.
    - **Field Intelligence System**: Integration of real field data, flexible time slots, buffer management, and field blackout system with enhanced conflict detection.
    - **Constraint Validation System**: Coach conflict detection, team rest period validation, field size matching, and travel time constraints.
    - **Facility Intelligence System**: Lighting constraint validation, parking capacity management, and concession coordination.
    - **Swiss Tournament System**: Intelligent pairing algorithm, comprehensive tiebreaker system, and color balance management.
    - **Referee Management System**: Intelligent assignment engine, certification compliance, workload balancing, and payment tracking.

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