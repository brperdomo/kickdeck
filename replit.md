# MatchPro AI Event Management System

## Overview
MatchPro AI is a comprehensive sports event management platform for tournament organizers and sports clubs. It streamlines team registrations, payment processing, scoring, standings, and administrative workflows. The system aims to provide a professional, low-maintenance, and intelligent solution for managing tournaments, from initial setup and scheduling to real-time updates and financial oversight. Its vision is to automate complex processes, offer predictive insights, and eliminate manual configuration, matching the capabilities of leading industry platforms.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
- **CRITICAL: Selective Scheduling 500 Error Fix (Aug 2025)**: Fixed major selective scheduling bug that prevented game generation for configured brackets.
  - **Root Cause**: Database schema mismatch - `round` field expected integer, code was inserting string values
  - **Tournament Format Fix**: Updated U12 Boys Nike Premier from stale `round_robin` to proper `8-Team Dual Brackets` format
  - **Proper Template Integration**: Implemented matchup pattern parsing from user's 3 custom tournament formats
  - **8-Team Dual Brackets Logic**: Pool A (teams 1-4) vs Pool B (teams 5-8) with 12 pool games following A1/A2/B1/B2 slot assignments
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