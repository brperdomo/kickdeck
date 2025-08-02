# MatchPro AI Event Management System

## Overview
MatchPro AI is a comprehensive sports event management platform designed for tournament organizers and sports clubs. It streamlines team registrations, payment processing, scoring, standings, and administrative workflows. The system aims to provide a professional, low-maintenance, and intelligent solution for managing tournaments, from initial setup and scheduling to real-time updates and financial oversight. Its vision is to automate complex processes, offer predictive insights, and eliminate manual configuration, matching the capabilities of leading industry platforms.

## User Preferences
Preferred communication style: Simple, everyday language.

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
    - **Payment Processing**: Full Stripe integration supporting Connect accounts, two-step payments (Setup Intents), refunds, and intelligent payment recovery for "burned" methods. Handles complex fee structures and fund routing.
    - **Email Communication**: Dynamic template system via SendGrid for automated notifications.
    - **Administrative Features**: Role-based access, team approval/rejection, payment tracking, audit trails, and comprehensive user/team management (contact editing, member merge, email updates).
    - **Scheduling Engine**: Advanced multi-tier system with constraint-aware optimization. Features include:
        - **Three Scheduling Approaches**: TournamentScheduler (deterministic), SimpleScheduler (constraint-aware), OpenAI-Service (AI-powered)
        - **Tournament Progression Engine**: Dynamic advancement logic with complete tiebreaker systems (head-to-head, goal difference, etc.)
        - **Intelligent Scheduler Framework**: Multi-objective optimization with field utilization, team fairness, and travel minimization
        - **Comprehensive Game Generation**: Round-robin, pool play, single elimination, and hybrid formats
        - **Tournament Director Workflow**: Game Format Configuration → Flight Selection → Bracket Creation → Auto Scheduling
        - Format-driven flight creation ensuring operational alignment with game requirements
        - Automated parameter configuration from existing tournament data
        - Drag-and-drop calendar for fine-tuning with visual conflict detection
        - Comprehensive game card PDF generation with QR code reporting
        - Pre-scheduling validation and predictive feasibility analysis
    - **Field Intelligence System (Phases 1A-1C COMPLETE)**:
        - **Phase 1A ENHANCED**: Real field data integration (12 fields across 3 complexes), flexible time slots (5-15 min increments), intelligent buffer management, and field blackout system
        - **Phase 1B COMPLETE**: Enhanced conflict detection with multi-severity analysis and scheduling intelligence
        - **Phase 1C COMPLETE**: Advanced constraint validation with enterprise-level field intelligence
    - **Constraint Validation System (100% COMPLETE)**:
        - **Coach Conflict Detection**: Multi-factor identification with comprehensive conflict prevention
        - **Team Rest Period Validation**: Configurable periods with intelligent violation detection
        - **Field Size Matching**: Strict age group enforcement with alternative suggestions
        - **Travel Time Constraints**: Real complex distance matrix with buffer enforcement (15-22 minute travel times between venues)

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