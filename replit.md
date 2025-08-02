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
- **Routing**: React Router
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
    - **Scheduling Engine**: Constraint-aware system preventing conflicts (field, team rest, daily limits). Features include:
        - **Tournament Director Workflow**: Game Format Configuration → Flight Selection → Bracket Creation → Auto Scheduling
        - Intelligent game generation based on team counts and game formats (round-robin, pool play).
        - Format-driven flight creation ensuring operational alignment with game requirements.
        - Automated parameter configuration from existing tournament data.
        - Drag-and-drop calendar for fine-tuning with visual conflict detection (e.g., coach color-coding).
        - Comprehensive game card PDF generation with QR code reporting.
        - Flexible age group scheduling allowing independent configuration and scheduling.
        - Pre-scheduling validation ensuring foundational components are in place.
        - Predictive feasibility analysis, bottleneck detection, and scenario testing.
        - Automated referee management.
    - **Field Intelligence System (Phases 1A-1C)**:
        - **Phase 1A COMPLETE**: Real field data integration with authentic venue relationships (12 fields, 3 complexes).
        - **Phase 1B COMPLETE**: Enhanced conflict detection with multi-severity analysis and scheduling intelligence.
        - **Phase 1C PLANNED**: Comprehensive field intelligence including priority tiers, blackout management, and usage analytics.

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