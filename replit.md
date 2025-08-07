# MatchPro AI Event Management System

## Overview
MatchPro AI is a comprehensive sports event management platform for tournament organizers and sports clubs. It streamlines team registrations, payment processing, scoring, standings, and administrative workflows. The system aims to provide a professional, low-maintenance, and intelligent solution for managing tournaments, from initial setup and scheduling to real-time updates and financial oversight. Its vision is to automate complex processes, offer predictive insights, and eliminate manual configuration, matching the capabilities of leading industry platforms.

## User Preferences
Preferred communication style: Simple, everyday language.

**CRITICAL DATA STRUCTURE (User Emphasis)**:
- AGE GROUP → FLIGHTS → BRACKETS → Teams
- Tournament formats are assigned to FLIGHTS (represented as event_brackets in database)
- FLIGHTS are competitive levels (Nike Elite, Nike Premier, Nike Classic) within age groups
- Each FLIGHT generates its own brackets and matchups based on the assigned tournament_format

## Recent Changes
- **CRITICAL: Group_of_4 Format Fix Complete (Aug 2025)**: Resolved persistent 10-game generation bug in Select Flights scheduling workflow.
  - **Root Cause**: generateSelectiveSchedule function bypassed tournament scheduler and used round-robin fallback for group_of_4
  - **Fix**: Added specific group_of_4 handling in /schedule-selected-flights endpoint generating exactly 6 pool + 1 championship = 7 games
  - **Global Application**: Fix applies to both tournament scheduler AND Select Flights interface for any bracket using group_of_4 format
  - **Universal Coverage**: Added failsafe to tournament scheduler default case ensuring all 4-team brackets generate 7 games regardless of path taken
  - **U14 Girls Nike Elite**: Bracket (id=593) properly configured with group_of_4 format ready for 7-game generation
  - **Team Count Issue Resolved**: Modified group_of_4 logic to work regardless of actual team count by selecting first 4 teams
  - **CRITICAL DUPLICATE ROUTE FIX**: Removed duplicate `/generate-selective-schedule` route that was bypassing group_of_4 logic completely
  - **INTELLIGENT FALLBACK SYSTEM**: Replaced round-robin fallbacks with smart group format selection:
    - **group_of_4**: 4-5 teams → 6 pool + 1 championship = 7 games
    - **group_of_6**: 6 teams → 9 pool + 1 championship = 10 games (2 pools of 3)  
    - **group_of_8**: 7-8 teams → 12 pool + 1 championship = 13 games (2 pools of 4)
- **CRITICAL: Enhanced Field Assignment System Complete (Aug 2025)**: Implemented comprehensive field assignment with time scheduling for generated games.
  - **Intelligent Field Size Matching**: U14 Girls automatically assigned to 11v11 fields (f1-f6) based on bracket name parsing
  - **Time-Based Scheduling**: Games assigned starting from field open times (8:00 AM) with proper 90-minute durations + 15-minute breaks
  - **Multi-Field Distribution**: Automatically distributes games across available fields using earliest-available-time algorithm
  - **Database Integration**: Updates games table with fieldId, scheduledDate, and scheduledTime during game generation
  - **Field Constraint Validation**: Ensures proper field size requirements (7v7→B1/B2, 9v9→A1/A2, 11v11→f1-f6)
- **CRITICAL: Proper Field Distribution & Schedule Grid Complete Success (Aug 2025)**: Fully resolved field size validation and Galway Downs field visibility.
  - **Correct Field Size Assignment**: U12 Boys games now properly assigned to 9v9 fields (A1, A2) instead of incorrect 11v11 field assignment
  - **All Galway Downs Fields Visible**: Schedule Grid now shows all available fields - A1/A2 (9v9), B1/B2 (7v7), f1-f6 (11v11) with proper time slots
  - **Constraint-Compliant Game Scheduling**: 13 games distributed across A1/A2 fields with proper 90+ minute rest periods and maximum 2 games per team per day
  - **Schedule Grid API Fix**: Updated ScheduleViewer component to use correct `/api/admin/events/${eventId}/schedule-calendar` endpoint
  - **API Response Format Fix**: Updated schedule-calendar endpoint to return proper game data format with homeTeam/awayTeam fields for frontend display
  - **Championship Game Scheduling**: Properly assigned time slots to championship placeholder game with TBD team assignments
- **CRITICAL: Selective Scheduling Complete Success (Aug 2025)**: Fully resolved selective scheduling system to generate all 13 games correctly.
  - **Root Cause**: Database schema mismatch - `round` field expected integer, code was inserting string values
  - **Tournament Format Fix**: Updated U12 Boys Nike Premier from stale `round_robin` to proper `8-Team Dual Brackets` format
  - **Proper Template Integration**: Implemented matchup pattern parsing from user's 3 custom tournament formats
  - **8-Team Dual Brackets Logic**: Pool A (teams 1-4) vs Pool B (teams 5-8) with 12 pool games following A1/A2/B1/B2 slot assignments
  - **Championship Final Fix**: Added 13th game (Pool A Winner vs Pool B Winner) with null team IDs, pending status, and proper Round 2 classification
  - **Database Compatibility**: Fixed foreign key constraints by allowing null team IDs for championship placeholder games
- **Configurable Tournament Format System**: Eliminated hardcoded bracket rules and implemented database-driven tournament format configuration. Tournament directors can now assign any format (round_robin, round_robin_final, single_elimination, etc.) to any bracket, and the game generator creates games accordingly.
- **Enhanced Bracket Schema**: Added tournament_format and tournament_settings columns to event_brackets table with comprehensive validation schema supporting multiple tournament types and configurations.
- **Dynamic Format Detection**: Updated automated scheduling system to query database for bracket formats instead of using hardcoded rules based on names.
- **Nike Classic Format Migration**: Updated all existing Nike Classic brackets to use 'round_robin_final' format, ensuring 6 pool games + 1 championship final generation.
- **Schedule API Persistence Fix**: Corrected database schema type mismatches in schedule-calendar endpoint to properly load and display games with drag-and-drag persistence.
- **Flight Configuration Display Fixes**: Updated format names from technical codes to user-friendly labels, changed "90min halves" to "90min games", fixed padding time persistence, and added Rest Period column.
- **8-Team Dual Bracket Auto-Creation**: Fixed automatic dual bracket creation for 8-team flights to always generate Pool A (4 teams), Pool B (4 teams), and Championship Final (1 game) structure regardless of format setting. Enhanced bracket preview display with proper Pool A/B/Championship labels.

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
    - **Team Registration**: Multi-step workflow, roster management, and two-step payment processing. Includes team gender editing with smart age group filtering.
    - **Payment Processing**: Full Stripe integration supporting Connect accounts, two-step payments (Setup Intents), refunds, and intelligent payment recovery. Handles complex fee structures and fund routing.
    - **Email Communication**: Dynamic template system via SendGrid for automated notifications.
    - **Administrative Features**: Role-based access, team approval/rejection, payment tracking, audit trails, and comprehensive user/team management.
    - **Enhanced Calendar Interface**: Single consolidated drag-and-drop scheduler (EnhancedDragDropScheduler) with comprehensive operation logging, optimistic updates, conflict detection, and persistent backend synchronization.
    - **Tournament-Wide Flight Management**: Unified flight category system where changes apply to all age groups simultaneously. Flight templates (Top Flight, Middle Flight, Bottom Flight) are configured once at tournament level and propagate automatically.
        - **Nike Flight Classifications**: Nike Classic = bottom-flight, Nike Premier = middle-flight, Nike Elite = top-flight
    - **Enhanced Bracket Creation Engine**: Comprehensive team assignment interface with manual assignment, seeding functionality, and proper flight name formatting (e.g., "U10 Boys Middle Flight").
    - **Scheduling Engine**: Advanced multi-tier system with constraint-aware optimization.
        - **Scheduling Approaches**: TournamentScheduler, SimpleScheduler, OpenAI-Service (AI-powered), SwissSystemScheduler.
        - **Tournament Progression Engine**: Dynamic advancement logic with complete tiebreaker systems.
        - **Intelligent Scheduler Framework**: Multi-objective optimization for field utilization, team fairness, and travel minimization.
        - **Comprehensive Game Generation**: Supports round-robin, pool play, single/double elimination, Swiss system, and hybrid formats.
        - **Tournament Director Workflow**: Guided setup from Game Format Configuration to Tournament-Aware Auto Scheduling.
        - **Constraint Validation**: Strict field size filtering, prevention of simultaneous scheduling, and comprehensive pre-scheduling validation.
        - **Safety Validation System**: Real-time field capacity analysis, duplicate game prevention, and bulk game deletion.
        - **Enhanced Quick Scheduler**: Complete constraint validation and intelligent optimization.
        - **Team Rest Period Enforcement**: Configurable minimum rest time between games.
        - **Games Per Day Limits**: Strict enforcement of maximum games per team per day.
        - **Coach Conflict Detection**: Intelligent prevention of scheduling conflicts for teams sharing coaches.
        - **Lighting Constraint Validation**: Automatic verification of field lighting requirements.
        - **Intelligent Slot Scoring**: Multi-factor optimization algorithm for optimal game assignment.
        - **Fair Game Distribution**: Balanced scheduling.
        - **Prime Time Optimization**: Preference for optimal playing hours.
        - **Schedule Efficiency Reporting**: Metrics showing scheduling success rates and constraint compliance.
        - **Enhanced Drag-and-Drop Calendar**: Comprehensive calendar interface with visual conflict detection, optimistic updates, comprehensive logging, and proper backend persistence via reschedule API endpoint.
        - Comprehensive game card PDF generation with QR code reporting.
    - **Field Intelligence System**: Integration of real field data, flexible time slots, buffer management, and field blackout system. Includes enhanced conflict detection and advanced constraint validation.
    - **Constraint Validation System**: Coach conflict detection, team rest period validation, field size matching, and travel time constraints (complex distance matrix).
    - **Facility Intelligence System**: Lighting constraint validation, parking capacity management, concession coordination, and facility optimization recommendations.
    - **Swiss Tournament System**: Intelligent pairing algorithm, comprehensive tiebreaker system, color balance management, and tournament validation.
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