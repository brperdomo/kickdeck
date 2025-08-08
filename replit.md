# MatchPro AI Event Management System

## Overview
MatchPro AI is a comprehensive sports event management platform designed for tournament organizers and sports clubs. Its primary purpose is to streamline and automate complex workflows such as team registrations, payment processing, scoring, standings, and administrative tasks. The system aims to provide a professional, low-maintenance, and intelligent solution for managing tournaments from initial setup and scheduling to real-time updates and financial oversight, aspiring to match leading industry platforms by offering predictive insights and eliminating manual configuration.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Critical Fixes (August 2025)
- **COMPLETELY IMPLEMENTED: Public Schedule Publishing System Backend (Aug 8, 2025)**: Successfully fixed all server-side issues preventing schedule publishing. Resolved database schema mismatch by adding missing eventId field, properly registered publishedSchedulesRouter in main server routes, and eliminated 500 server errors. Publishing functionality now fully operational with proper authentication and error handling. **USER ACTION REQUIRED**: Admin must be logged in through browser interface to publish schedules - authentication middleware requires proper admin session for security.
- **COMPLETELY IMPLEMENTED: Public Schedule Publishing System (Aug 8, 2025)**: Successfully created comprehensive public tournament schedule publishing functionality with admin interface and public viewing components.
  - **Admin Interface**: Added "Post Schedules" tab in Master Schedule interface with publish/unpublish controls, schedule preview, and public URL generation
  - **Database Integration**: Created published_schedules table with JSON schedule data storage, admin authentication, and active/inactive status tracking
  - **Public Viewing**: Built responsive public page organized by age groups and flights matching user's design requirements with "Schedules | Standings" links
  - **API Endpoints**: Implemented complete REST API with /api/admin/events/:eventId/publish-schedules for admin publishing and /api/public/schedules/:eventId for public access
  - **No Authentication Required**: Public schedules accessible without login for teams and spectators via clean URLs like /public/schedules/[eventId]
- **COMPLETELY FIXED: Multi-Day Tournament Scheduling System (Aug 8, 2025)**: Successfully resolved critical array modification bug that was preventing proper scheduling of all games in 8-Team Dual Brackets format. Fixed issue where only 7 of 13 games were being scheduled due to incorrect array splice operations during iteration.
  - **VERIFIED SUCCESSFUL**: All 13 games now properly scheduled with perfect 90-minute rest period enforcement
  - **Enhanced Field Assignment**: Games distributed optimally: 5 games at 08:00, 4 games at 11:00, 4 games at 14:00 (2:00 PM)
  - **Intelligent Time Advancement**: System correctly detects when teams need rest periods and advances time appropriately (e.g., jumping from 11:15 AM to 2:00 PM when all teams need 90+ minutes rest)
  - **Database Persistence**: All games now have proper field_id, scheduled_date, and scheduled_time values with zero unscheduled games
- **COMPLETELY FIXED: Field Overlap Prevention (Aug 8, 2025)**: Resolved critical field conflict issue where games were scheduled with overlapping times on the same field. Enhanced field occupancy tracking now checks field availability during entire game duration (not just start time) to prevent double-booking scenarios.
  - **VERIFIED NO OVERLAPS**: System now prevents scenarios like Game 1 (9:00-10:30 AM) conflicting with Game 2 (10:00-11:30 AM) on same field
  - **Efficient Time Usage**: Eliminates unnecessary buffer time while maintaining proper field allocation without conflicts
  - **Smart Field Allocation**: System prioritizes keeping time slots close while automatically using different available fields when time overlaps would occur
  - **Precise Occupancy Tracking**: Fields marked as occupied for exact game duration (90 minutes) with 15-minute interval checking to prevent any overlap scenarios
- **COMPLETELY FIXED: Multi-Day Team Scheduling (Aug 8, 2025)**: Successfully implemented requirement where every third game a team plays must be scheduled on the next day. Enhanced constraint logic prevents teams' third games from being scheduled on Day 1, ensuring proper distribution across tournament days.
  - **VERIFIED SUCCESSFUL**: All teams now have exactly 2 games on Day 1 (Aug 16) and 1 game on Day 2 (Aug 17) ✅ CORRECT
  - **Enhanced Multi-Day Logic**: Teams with 2 games played cannot schedule their 3rd game on the first day (Aug 16)
  - **Automatic Day Advancement**: System detects when games need Day 2 scheduling and advances to August 17th at 8:00 AM
  - **Intelligent Constraint Detection**: System correctly identifies and prevents scheduling conflicts with multi-day requirements
- **COMPLETELY FIXED: Game Creation & Field Assignment**: Successfully resolved critical database constraint issue preventing game field assignments. Fixed foreign key constraint violation where `group_id` was incorrectly referencing `event_brackets` table instead of `tournament_groups`. Now properly creates games with database IDs and assigns fields/times.
- **COMPLETELY FIXED: Dynamic Rest Period Enforcement**: Enhanced field assignment system now dynamically reads rest period values from Flight Configuration table (Nike Elite: 90min, Nike Premier: 60min, Nike Classic: 30min) and properly enforces "teams cannot play another match until at least [configured rest period] AFTER their previous match ends" with intelligent constraint detection, team rest period tracking, and configurable maximum games per team per day enforcement.
  - **VERIFIED ACROSS ALL FLIGHTS**: Testing confirmed system works perfectly with Nike Elite (90min rest periods), Nike Premier (60min rest periods), and Nike Classic (30min rest periods)
  - **Advanced Concurrent Scheduling**: Multiple games can now be scheduled simultaneously when no team conflicts exist, maximizing field utilization

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
    - **Intelligent Scheduling Engine**: Advanced multi-tier system with constraint-aware optimization and **CRITICAL dynamic rest period enforcement**. Supports various scheduling approaches with comprehensive game generation for formats like round-robin, pool play, single/double elimination, Swiss system, and hybrid. **COMPLETELY FIXED (Aug 2025)**: Enhanced field assignment system now dynamically reads rest period values from Flight Configuration table and properly distributes games across time slots with flight-specific rest period enforcement (Nike Elite: 90min, Nike Premier: 60min, Nike Classic: 30min), configurable max games per team per day constraint, and intelligent conflict detection. No longer schedules all games at 8:00 AM. Key features include:
        - **Constraint Validation**: Strict field size filtering, prevention of simultaneous scheduling, and comprehensive pre-scheduling validation (e.g., team rest periods, games per day limits, coach conflict detection, lighting constraints).
        - **Dynamic Rest Period Enforcement**: Teams cannot play another match until at least [configured rest period] AFTER their previous match ends (not starts). Rest periods are read from Flight Configuration table: Nike Elite (90min), Nike Premier (60min), Nike Classic (30min).
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