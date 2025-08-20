# MatchPro AI Event Management System

## Overview
MatchPro AI is a comprehensive sports event management platform for tournament organizers and sports clubs. Its main purpose is to automate and streamline workflows such as team registrations, payment processing, scoring, standings, and administrative tasks. The system aims to provide a professional, low-maintenance, and intelligent solution for managing tournaments from initial setup and scheduling to real-time updates and financial oversight, with ambitions to offer predictive insights and eliminate manual configuration.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (August 20, 2025)
**CRITICAL GAME GENERATION WORKFLOW IMPLEMENTED:**
- **Missing Workflow Gap Fixed**: Identified and resolved the critical gap where bracket creation was complete but games were never actually generated
- **Generate Games Function**: Added `generateGamesForEvent()` function to process all event brackets and create appropriate games based on tournament format
- **TournamentScheduler Integration**: Made `generateBracketGames()` function publicly accessible for proper game creation workflow
- **Frontend Integration**: Added "Generate Games" button to UnifiedBracketManager component with proper API integration
- **Multiple Implementation Paths**: Created both embedded route handler and standalone bypass system to ensure production deployment success
- **Production Deployment Issue**: Identified 300+ TypeScript compilation errors in routes.ts preventing proper production deployment
- **Bypass Solution**: Created standalone game generation system (`server/api/generate-games.ts`, `server/standalone-game-generation.ts`) that bypasses problematic routes file
- **Server Integration**: Added standalone router to main server index to ensure availability in production

**FLIGHT-SPECIFIC GAME GENERATION TARGETING FIX:**
- **Issue Resolved**: Generate Games button was creating games for ALL brackets in the event instead of just the selected flight
- **Flight-Specific Function**: Created `generateGamesForFlight()` function to target individual flight/bracket IDs
- **Frontend Parameter Passing**: Modified UnifiedBracketManager to send selected flight ID in API request body
- **Backend Flight Filtering**: Enhanced both bracket-creation route and standalone API to accept and process flight ID parameter
- **Targeted Generation Validation**: Successfully tested with flight 561 generating exactly 10 games (9 crossplay + 1 championship) without affecting other flights
- **API Response Update**: Modified success message to indicate flight-specific generation vs. full event generation

**DEPLOYMENT STATUS**: ✅ **IMPLEMENTATION COMPLETE AND FULLY FUNCTIONAL**. Game generation workflow successfully resolved with raw SQL database integration to bypass Drizzle ORM schema type mismatches. Frontend integration verified working with successful API responses. Flight-specific targeting ensures precise game generation without unwanted mass creation.

## Previous Changes (August 19, 2025)
**CROSSPLAY BRACKET SCHEDULING BUG COMPLETELY FIXED:**
- **Same-Pool Games Eliminated**: Fixed "Group of 6 Crossplay" format creating games within pools instead of proper Pool A vs Pool B crossover
- **Proper Crossover Logic**: Enhanced `generateCrossplayGames()` to group teams by `group_id` and ONLY create Pool A vs Pool B matchups (3×3 = 9 games)
- **Championship TBD Games Added**: Fixed missing championship finals - now generates "1st in Points" vs "2nd in Points" TBD game after pool play
- **Pool Separation Enforcement**: Teams properly separated into Pool A (lower group_id) and Pool B (higher group_id) for true crossover competition
- **Database Cleanup**: Removed 9 incorrectly scheduled games from U17 Boys bracket for clean re-scheduling

**COMPLETE PER-EVENT FIELD CONFIGURATION SYSTEM IMPLEMENTED:**
- **Field Size Update Bug RESOLVED**: Fixed 404 errors in Field Order tab by creating missing field configurations for SCHEDULING TEAMS event
- **Automatic Field Configuration Creation**: Built `EventFieldConfigService` to ensure every event gets its own field size customization
- **Migration Script Success**: Created field configurations for 30 existing events (71 fields each) using `ensureEventFieldConfigurations.ts`
- **Per-Event Field Management**: Each tournament can now customize field sizes independently for optimal game scheduling based on flight requirements
- **Flight-to-Field Integration**: Field sizes in Field Order tab now properly connect with Flight Configuration field size settings for intelligent game assignment
- **API Enhancement**: Added `/api/admin/events/{eventId}/field-configs/*` endpoints for complete field configuration management
- **Zero Configuration Gap**: All events (existing and future) guaranteed to have complete field configuration records

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
    - **Event Management**: Configuration of tournaments, age groups, flights, and scoring systems.
    - **Team Registration**: Multi-step workflow, roster management, and two-step payment processing, including team gender editing with smart age group filtering.
    - **Payment Processing**: Full Stripe integration supporting Connect accounts, two-step payments, refunds, and intelligent payment recovery.
    - **Email Communication**: Dynamic template system for automated notifications.
    - **Administrative Features**: Role-based access, team approval/rejection, payment tracking, and comprehensive user/team management, including silent status changes for teams.
    - **Scheduling Systems**: Automated, template-driven game generation supporting various formats (round-robin, pool play, single/double elimination, Swiss system, hybrid) with constraint-aware optimization, dynamic rest period enforcement, field size matching, coach conflict detection, and lighting constraints. Includes intelligent gap-filling for field utilization and an enhanced calendar interface with drag-and-drop, operation logging, optimistic updates, and conflict detection.
    - **Tournament-Wide Flight Management**: Unified flight category system allowing tournament-level configuration of flight templates that propagate to all age groups.
    - **Unified Bracket Management Interface**: Consolidated bracket creation and team assignment system supporting Group of 4, Group of 6, and Group of 8 configurations.
    - **Tournament-Specific Field Management**: Comprehensive field configuration system allowing tournament directors to set field sizes per-tournament, featuring drag-and-drop ordering, bulk updates, deletion, availability, and bulk time assignment, including specific time controls (OPEN, LAST GAME).
    - **Team Replacement System**: Individual team replacement functionality preserving scheduling details.
    - **AI Assistant**: Persistent, floating chatbot interface powered by GPT-4o for natural language game scheduling, constraint validation, and real-time database updates. Integrates with Flight Configuration parameters for constraint validation and offers alternative suggestions for conflicts. Conversation history is persistent via PostgreSQL.
    - **Professional Gamecard System**: Generates comprehensive gamecards with team rosters, player details, coach information, and game schedules, with PDF generation and printable format.
    - **Enhanced CSV Game Import System**: Comprehensive import system supporting both basic and tournament formats with advanced field/venue matching, coach information processing, conflict detection, game metadata preservation, and intelligent team matching. Handles complex tournament schedules with 17+ data columns including coach IDs, flight assignments, venue details, and game conflicts.
    - **CSV Import Compatibility Layer**: Intelligent fallback system that preserves native Drizzle ORM functionality while automatically handling CSV imported data type mismatches. Uses try-catch approach with direct SQL fallback for events with schema incompatibilities.
    - **CSV-Based Flight Assignment System**: Intelligent flight distribution system using Column 5 CSV data patterns (Nike Premier, Classic, Elite) with name-based team matching and cross-event contamination handling. Resolves team assignment conflicts by analyzing authentic team names for proper flight categorization.
    - **Flight-Aware Public Standings System**: Advanced standings calculation system that properly groups teams by age group + flight level for accurate championship determination in CSV-imported tournaments. Automatically detects flight-based tournaments and displays competitive groupings (NIKE CLASSIC, NIKE ELITE A/B, NIKE PREMIER) with fallback to regular age-group standings. Processes 80+ flight groups with 350+ teams for comprehensive championship tracking.
    - **QR Code Score Submission System**: Enables direct mobile score submission via QR codes linking to unauthenticated game score pages, with real-time updates and score locking capabilities.
    - **Enhanced PDF Form Editor for Game Cards**: Professional visual editor for creating custom game card templates with drag-and-drop functionality, resizable canvas, element deletion, line drawing tools, image upload capabilities, and resize handles. Features real-time interactive canvas preview, comprehensive typography controls, shapes, lines, images, QR codes, and complete database field integration with 13+ dynamic placeholders. Supports custom background images with automatic orientation detection (horizontal/vertical), template auto-adjustment (A4 landscape vs portrait), and three scaling modes (fit, fill, stretch). Placeholder elements display as semi-transparent overlays on background images. Integrated directly within Master Schedule Game Cards tab for seamless workflow.
- **Critical Data Structure**: AGE GROUP → FLIGHTS → BRACKETS → Teams. Tournament formats are assigned to FLIGHTS (event_brackets). FLIGHTS are competitive levels within age groups, each generating its own brackets and matchups. Teams have `bracketId` (flight assignment) and `groupId` (specific bracket within flight).

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
-   **OpenAI GPT-4o**: AI Assistant.