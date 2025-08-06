# MatchPro AI Event Management System

## Overview
MatchPro AI is a comprehensive sports event management platform for tournament organizers and sports clubs. It streamlines team registrations, payment processing, scoring, standings, and administrative workflows. The system aims to provide a professional, low-maintenance, and intelligent solution for managing tournaments, from initial setup and scheduling to real-time updates and financial oversight. Its vision is to automate complex processes, offer predictive insights, and eliminate manual configuration, matching the capabilities of leading industry platforms.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
- **Field Size Validation Implementation Complete**: Fixed all game generation workflows to properly assign fields based on Age Groups tab configuration. Games now automatically appear on size-appropriate fields (7v7→B1/B2, 9v9→A1/A2, 11v11→f1-f6).
- **Cloud Run Deployment Optimization**: Enhanced server startup for faster deployment with non-blocking database operations and proper health check endpoints.

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
        - Drag-and-drop calendar for fine-tuning with visual conflict detection.
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