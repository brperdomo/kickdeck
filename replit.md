# MatchPro AI Event Management System

## Overview
MatchPro AI is a comprehensive sports event management platform designed for tournament organizers and sports clubs. Its main purpose is to automate and streamline workflows such as team registrations, payment processing, scoring, standings, and administrative tasks. The system aims to provide a professional, low-maintenance, and intelligent solution for managing tournaments from initial setup and scheduling to real-time updates and financial oversight, with ambitions to offer predictive insights and eliminate manual configuration.

## User Preferences
Preferred communication style: Simple, everyday language.

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
    - **QR Code Score Submission System**: Enables direct mobile score submission via QR codes linking to unauthenticated game score pages, with real-time updates and score locking capabilities.
    - **Enhanced PDF Form Editor for Game Cards**: Professional visual editor for creating custom game card templates with drag-and-drop functionality, resizable canvas, element deletion, line drawing tools, image upload capabilities, and resize handles. Features real-time interactive canvas preview, comprehensive typography controls, shapes, lines, images, QR codes, and complete database field integration with 13+ dynamic placeholders. Integrated directly within Master Schedule Game Cards tab for seamless workflow.
- **Critical Data Structure**: AGE GROUP → FLIGHTS → BRACKETS → Teams. Tournament formats are assigned to FLIGHTS (event_brackets). FLIGHTS are competitive levels within age groups, each generating its own brackets and matchups. Teams have `bracketId` (flight assignment) and `groupId` (specific bracket within flight).

### Data Storage
- **Primary Database**: PostgreSQL for all event, team, player, payment, and scheduling data.
- **Session Storage**: Database-backed.
- **File Storage**: Local file system for uploaded rosters.

## External Dependencies

-   **Stripe**: Payment processing.
-   **SendGrid**: Email delivery.
-   **Mapbox**: Geographic services.
-   **jsPDF & QRCode libraries (e.g., qrcode.react)**: PDF generation and QR code integration.
-   **react-beautiful-dnd**: Drag-and-drop scheduling interface.
-   **OpenAI GPT-4o**: AI Assistant.