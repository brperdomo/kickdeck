# MatchPro AI Event Management System

## Overview
MatchPro AI is a comprehensive sports event management platform designed for tournament organizers and sports clubs. It streamlines team registrations, payment processing, scoring, standings, and administrative workflows. The system aims to provide a professional, low-maintenance, and intelligent solution for managing tournaments, from initial setup and scheduling to real-time updates and financial oversight. Its vision is to automate complex processes, offer predictive insights, and eliminate manual configuration, matching the capabilities of leading industry platforms.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Updates (August 6, 2025)
- **Field Size Auto-Population Fix**: Age group field sizes (7v7, 9v9, 11v11) now properly auto-populate as defaults in Game Format Engine globally across the platform
- **Flight Level Classification Fix**: Nike Elite correctly shows as "Top Flight", Premier as "Middle Flight", Classic as "Bottom Flight" instead of showing raw flight names
- **Global Field Size Application**: Field sizes set in Event Age Groups tab now apply consistently throughout the entire MatchPro platform
- **Enhanced Display Names**: Flight levels display proper hierarchical names (Top/Middle/Bottom Flight) rather than raw Nike naming
- **Enhanced Drag-Drop Scheduler**: Created Google Calendar-style scheduler with 5/10/15 minute time intervals, smooth drag operations, conflict detection, and optimistic updates to prevent games from disappearing
- **Sequential Scheduling Fix**: Replaced scoring-based algorithm with true sequential allocation - games now schedule chronologically instead of clustering at 8am
- **Authentication Testing Solution**: Created QuickLogin component and test admin account (testadmin@test.com/password) for drag-and-drop persistence testing
- **Database Schema Alignment**: Fixed LSP errors by correcting field name mismatches and adding missing birthYear field in age group configuration
- **Deployment Health Check Fix**: Resolved routing conflicts and health check issues to ensure proper deployment functionality
- **Quick Schedule API**: Registered quick-schedule router with proper authentication and route structure for testing drag-and-drop functionality

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React hooks and context
- **Routing**: Wouter (lightweight routing)
- **UI/UX Decisions**: Modern, professional design with gradient themes, interactive cards, and consistent MatchPro branding. Emphasis on intuitive workflows, clear visual feedback, and comprehensive dashboards.

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST APIs
- **Database ORM**: Drizzle ORM
- **Authentication**: Session-based with role-based access control (super_admin, tournament_admin, finance_admin, score_admin).
- **Core Features**:
    - **Event Management**: Configuration of tournaments, age groups, brackets, eligibility, and scoring systems.
    - **Team Registration**: Multi-step workflow, roster management, and two-step payment processing.
    - **Enhanced Team Management**: Complete team gender editing functionality with smart age group filtering and server-side updates
    - **Payment Processing**: Full Stripe integration supporting Connect accounts, two-step payments (Setup Intents), refunds, and intelligent payment recovery for "burned" methods. Handles complex fee structures and fund routing.
    - **Email Communication**: Dynamic template system via SendGrid for automated notifications.
    - **Administrative Features**: Role-based access, team approval/rejection, payment tracking, audit trails, and comprehensive user/team management (contact editing, member merge, email updates).
    - **Tournament-Wide Flight Management**: Unified flight category system where changes apply to all age groups simultaneously. Flight templates (Top Flight, Middle Flight, Bottom Flight) are configured once at tournament level and automatically propagate to all flights across age groups. Flights represent competitive groupings (e.g., "U10 Boys Nike Elite"), while brackets are tournament structures created during scheduling.
    - **Enhanced Bracket Creation Engine**: Comprehensive team assignment interface with manual assignment capabilities, seeding functionality, and proper flight name formatting showing age group context ("U10 Boys Middle Flight"). Includes manual team assignment dropdowns, seed adjustment controls, auto-seeding, and team removal functionality.
    - **Scheduling Engine**: Advanced multi-tier system with constraint-aware optimization. Features include:
        - **Four Scheduling Approaches**: TournamentScheduler (deterministic), SimpleScheduler (constraint-aware), OpenAI-Service (AI-powered), SwissSystemScheduler (performance-based pairings)
        - **Tournament Progression Engine**: Dynamic advancement logic with complete tiebreaker systems (head-to-head, goal difference, etc.)
        - **Intelligent Scheduler Framework**: Multi-objective optimization with field utilization, team fairness, and travel minimization
        - **Comprehensive Game Generation**: Round-robin, pool play, single elimination, double elimination, Swiss system, and hybrid formats
        - **Tournament Director Workflow**: Game Format Configuration → Flight Selection → Bracket Creation → Tournament-Aware Auto Scheduling
        - **Tournament-Aware Auto Scheduling (ENHANCED - CRITICAL FIXES APPLIED)**: Respects flight configurations, game formats, and bracket structures instead of bypassing them
        - **FIXED**: Database schema references and field mappings (games table structure aligned)
        - **FIXED**: Time slot management integration with gameTimeSlots table
        - **FIXED**: Tournament structure validation before scheduling execution
        - **ENHANCED**: Comprehensive pre-scheduling validation (event dates, teams, fields)
        - **CRITICAL FIX**: Quick Scheduler field size constraint validation - now respects field compatibility (7v7/9v9/11v11)
        - **CRITICAL FIX**: Game format persistence in Configured tab - saved formats now properly display
        - **CRITICAL FIX**: Simultaneous scheduling prevention - teams cannot play multiple games at same time on different fields
        - **SAFETY VALIDATION SYSTEM (COMPLETE)**: Comprehensive pre-scheduling safety checks preventing duplicate game generation and field capacity overloads
            - **Field Capacity Analysis**: Real-time validation of available fields vs tournament requirements with utilization percentages
            - **Duplicate Game Prevention**: Mandatory checks blocking new game generation when existing games are detected
            - **Safety Validation API**: `/api/admin/events/:eventId/scheduling/validate` endpoint for real-time safety checks
            - **Game Deletion Management**: Bulk game deletion functionality (`/api/admin/events/:eventId/games/all`) to resolve duplicate conflicts
            - **Frontend Safety Component**: SchedulingSafetyCheck.tsx providing user-friendly safety warnings and resolution guidance
        - **ENHANCED QUICK SCHEDULER (COMPREHENSIVE UPGRADE)**: Complete constraint validation and intelligent optimization system
        - **Team Rest Period Enforcement**: Configurable minimum rest time between games with millisecond precision
        - **Games Per Day Limits**: Strict enforcement of maximum games per team per day constraints
        - **Coach Conflict Detection**: Intelligent prevention of scheduling conflicts for teams sharing coaches
        - **Lighting Constraint Validation**: Automatic verification of field lighting requirements for evening games
        - **Intelligent Slot Scoring**: Multi-factor optimization algorithm for optimal game assignment
        - **Fair Game Distribution**: Balanced scheduling ensuring equitable game spacing and field utilization
        - **Prime Time Optimization**: Preference for optimal playing hours (10 AM - 4 PM) with fallback scheduling
        - **Schedule Efficiency Reporting**: Comprehensive metrics showing scheduling success rates and constraint compliance
        - Format-driven flight creation ensuring operational alignment with game requirements
        - Automated parameter configuration from existing tournament data
        - Flight-specific game generation using configured formats and timing
        - Intelligent field assignment with conflict detection
        - Drag-and-drop calendar for fine-tuning with visual conflict detection
        - Comprehensive game card PDF generation with QR code reporting
    - **Field Intelligence System (Phases 1A-1C COMPLETE)**:
        - **Phase 1A ENHANCED**: Real field data integration (12 fields across 3 complexes), flexible time slots (5-15 min increments), intelligent buffer management, and field blackout system
        - **Phase 1B COMPLETE**: Enhanced conflict detection with multi-severity analysis and scheduling intelligence
        - **Phase 1C COMPLETE**: Advanced constraint validation with enterprise-level field intelligence
    - **Constraint Validation System (100% COMPLETE)**:
        - **Coach Conflict Detection**: Multi-factor identification with comprehensive conflict prevention
        - **Team Rest Period Validation**: Configurable periods with intelligent violation detection
        - **Field Size Matching**: Strict age group enforcement with alternative suggestions
        - **Travel Time Constraints**: Real complex distance matrix with buffer enforcement (15-22 minute travel times between venues)
    - **Facility Intelligence System (COMPLETE)**:
        - **Lighting Constraint Validation**: Automatic scheduling adjustments for games requiring artificial lighting
        - **Parking Capacity Management**: Real-time parking demand calculation and overflow prevention
        - **Concession Coordination**: Integration of concession stand capacity and operating hours
        - **Facility Optimization Recommendations**: System-wide analysis for infrastructure improvements
    - **Swiss Tournament System (COMPLETE)**:
        - **Intelligent Pairing Algorithm**: Swiss system pairings with performance-based matchmaking
        - **Comprehensive Tiebreaker System**: Buchholz score, strength of schedule, head-to-head records
        - **Color Balance Management**: Home/away assignment optimization across tournament rounds
        - **Tournament Validation**: Automated constraint checking for Swiss format requirements
    - **Referee Management System (COMPLETE)**:
        - **Intelligent Assignment Engine**: Multi-objective optimization for referee assignments
        - **Certification Compliance**: Automatic validation of referee qualifications for games
        - **Workload Balancing**: Fair distribution of assignments across referee pool
        - **Payment Tracking**: Comprehensive payment management and reporting system

### Data Storage
- **Primary Database**: PostgreSQL for all event, team, player, payment, and scheduling data.
- **Session Storage**: Database-backed.
- **File Storage**: Local file system for uploaded rosters.

## External Dependencies

-   **Stripe**: Payment processing, Connect accounts, Setup Intents, and refund management.
-   **SendGrid**: Email delivery and dynamic templating.
-   **Mapbox**: Geographic services for address verification and location management.
-   **jsPDF & QRCode libraries**: For PDF generation and QR code integration in game cards.
-   **react-beautiful-dnd**: For drag-and-drop scheduling interface.
```