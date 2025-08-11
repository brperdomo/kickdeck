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
- **UI/UX Decisions**: Modern, professional design with gradient themes, interactive cards, and consistent MatchPro branding. Emphasis on intuitive workflows, clear visual feedback, and comprehensive dashboards, including an enhanced Schedule Grid with detailed game cards, hover tooltips, and a right-click context menu for moving games.

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST APIs
- **Database ORM**: Drizzle ORM
- **Authentication**: Session-based with role-based access control (super_admin, tournament_admin, finance_admin, score_admin).
- **Core Features**:
    - **Event Management**: Configuration of tournaments, age groups, brackets, and scoring systems.
    - **Team Registration**: Multi-step workflow, roster management, and two-step payment processing, including team gender editing with smart age group filtering.
    - **Payment Processing**: Full Stripe integration supporting Connect accounts, two-step payments, refunds, and intelligent payment recovery for complex fee structures and fund routing.
    - **Email Communication**: Dynamic template system for automated notifications.
    - **Administrative Features**: Role-based access, team approval/rejection, payment tracking, and comprehensive user/team management. Includes silent status changes for teams without triggering emails.
    - **Enhanced Calendar Interface**: Consolidated drag-and-drop scheduler with operation logging, optimistic updates, conflict detection, and persistent backend synchronization, supporting real-time schedule updates and inline editing.
    - **Intelligent Gap-Filling System**: Advanced field consolidation that identifies time gaps on priority fields and moves games from outer fields to fill those gaps, with automatic time slot adjustment and comprehensive rest period validation.
    - **Tournament-Wide Flight Management**: Unified flight category system allowing tournament-level configuration of flight templates (e.g., Nike Classic, Premier, Elite) that propagate to all age groups.
    - **Flight-Based Schedule Filtering**: Schedule Viewer includes flight filtering dropdown that appears after age group selection, displaying Nike flight categories (Elite, Premier, Classic) with proper sorting and filtering logic.
    - **Team Replacement System**: Individual team replacement functionality using refresh icons next to team names, allowing replacement with teams from the same flight category while preserving all scheduling details (field, time, date).
    - **Unified Bracket Management Interface**: Consolidated bracket creation and team assignment system. Users select flights, choose bracket configurations (Group of 4/6/8), and assign teams within brackets. Supports Group of 4 (round-robin), Group of 6 (Pool A vs Pool B crossplay), and Group of 8 (Pool A vs Pool B crossplay) with persistent team assignments for fair pairing. Integrates directly with tournament scheduling engine's matchup rules.
    - **Tournament-Specific Field Management System**: Comprehensive field configuration system allowing tournament directors to set field sizes per-tournament. Features drag-and-drop field ordering, bulk configuration updates, and field deletion without constraints.
    - **Field Availability and Bulk Time Assignment System**: Tournament directors can enable/disable fields and bulk assign first game times by field size.
    - **Intelligent Scheduling Engine**: Advanced multi-tier system with constraint-aware optimization and dynamic rest period enforcement. Supports various scheduling approaches with comprehensive game generation for formats like round-robin, pool play, single/double elimination, Swiss system, and hybrid. Enforces strict Pool A vs Pool B matchups for 6-team crossplay formats. Features automated field assignment with direct fallback system when time slots aren't configured.
        - **Administrative Team Editing**: Schedule Viewer includes comprehensive team editing functionality with flight-restricted dropdown selections.
        - **Constraint Validation**: Strict field size filtering, prevention of simultaneous scheduling, and comprehensive pre-scheduling validation (e.g., team rest periods, games per day limits, coach conflict detection, lighting constraints).
        - **Dynamic Rest Period Enforcement**: Configurable rest periods between games for all teams.
        - **Granular Time Slots**: 15-minute interval scheduling.
        - **Intelligent Optimization**: Multi-objective optimization for field utilization, team fairness, travel minimization, and prime time optimization.
        - **Dynamic Configuration**: Database-driven tournament format configuration.
        - **Field Assignment**: Intelligent field size matching and assignment.
    - **Field Intelligence System**: Integration of real field data, flexible time slots, buffer management, and field blackout system with enhanced conflict detection.
    - **Constraint Validation System**: Coach conflict detection, team rest period validation, field size matching, and travel time constraints.
    - **Facility Intelligence System**: Lighting constraint validation, parking capacity management, and concession coordination.
    - **Swiss Tournament System**: Intelligent pairing algorithm, comprehensive tiebreaker system, and color balance management.
    - **Referee Management System**: Intelligent assignment engine, certification compliance, workload balancing, and payment tracking.
- **Critical Data Structure**: AGE GROUP → FLIGHTS → BRACKETS → Teams. Tournament formats are assigned to FLIGHTS (represented as event_brackets in database). FLIGHTS are competitive levels within age groups. Each FLIGHT generates its own brackets and matchups based on the assigned tournament_format. Teams have both `bracketId` (flight assignment) and `groupId` (specific bracket within flight) for granular tournament organization.
- **Group of 8 Format Fix (Aug 2025)**: COMPLETED - Corrected dual bracket system implementation with mandatory admin control for fairplay. Group of 8 now properly generates two separate 4-team round-robin brackets (Bracket A vs Bracket B) with no cross-bracket play except championship final. Fixed TypeScript compilation errors, corrected game generation logic to prevent crossplay matchups, and enforced strict admin control over team placement. System requires tournament admins to manually assign all 8 teams to brackets for fairplay control - no automatic assignments to ensure competitive balance.

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