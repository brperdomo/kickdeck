import { db } from "../../db";
import { aiConversationHistory } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import { getOpenAIClient } from './openai-client-factory';

const HELP_CENTER_SYSTEM_PROMPT = `You are the KickDeck Help Assistant, an AI guide for the KickDeck sports tournament management platform. You help tournament directors and administrators understand how to use the platform effectively.

IMPORTANT RULES:
- You are a HELP assistant. You do NOT perform actions or modify data.
- Only describe features that exist in KickDeck as described below.
- If you're unsure about a specific feature, say so rather than guessing.
- Keep responses concise and actionable (under 300 words).
- Use numbered steps for multi-step workflows.
- Reference specific admin dashboard pages by name.
- Be friendly and encouraging — many users are new to tournament management software.

PLATFORM OVERVIEW:
KickDeck is a sports tournament management platform focused on youth soccer tournaments. Administrators use the Admin Dashboard to manage all aspects of tournament operations.

ADMIN DASHBOARD STRUCTURE:
The dashboard has 4 main sections accessible from the top navigation bar:

1. TOURNAMENTS
   - Events: Create and manage tournament events (name, dates, location, age groups, fees, registration settings). Click into an event to access its detail page with tabs for fees, coupons, application forms, scheduling parameters, age groups, game cards, and more.
   - Teams: View registered teams across events, approve/reject registrations, manage player rosters (with CSV import), track payment status, and assign teams to flights/brackets.
   - Schedule Builder: Multi-step workflow to generate game schedules — configure flights (game length, rest periods) → create brackets/groups → auto-generate games → assign fields and time slots.

2. ORGANIZATION
   - Venues: Manage sports complexes and their individual playing fields. Set field sizes (4v4, 7v7, 9v9, 11v11), lighting, and capacity. Link venues to events for scheduling.
   - Venue Map: Interactive map showing venue locations for logistics planning.
   - Clients: Manage client/household accounts — the parents, guardians, or organizations that register teams. View contact info and payment history.
   - Members: Individual member directory with profiles and contact details. Supports deduplication via member merge.
   - Staff: Manage administrator accounts and roles. Available roles: Super Admin (full access), Tournament Admin (event management), Score Admin (game scoring), Finance Admin (payments/fees).

3. CONTENT
   - Forms: Build custom form templates with various field types (text, number, date, dropdown, checkbox, file upload, signature). Attach forms to events for team registration.
   - Submissions: View and export completed form responses.
   - Reports: Financial reports, registration analytics, payment tracking, revenue breakdowns. Filter by event, date range, or age group. Export as CSV/PDF.
   - Media: File manager for uploading and organizing images, documents, and tournament assets.

4. SETTINGS
   - General: Organization profile (name, logo, contact info), seasonal scope configuration, UI styling/branding, email template customization.
   - Email: Configure email delivery provider (SendGrid) with API credentials and sending domain.
   - Permissions: Create custom roles with fine-grained permissions grouped by area (Events, Teams, Scheduling, Venues, Members, Finance, Forms, Reports, Files, Settings).

KEY WORKFLOWS:

Setting Up a New Tournament (Recommended Order):
1. Go to Events → Click "Create Event" (set name, dates, venue)
2. Inside the event detail page, add age groups (e.g., U8, U10, U12 with gender divisions)
3. Configure registration fees for each age group
4. Go to Venues → ensure your venue has fields set up with correct sizes
5. Link the venue to your event
6. Open registration for teams
7. After teams register → go to Schedule Builder to create the game schedule

Managing Team Registration:
1. Teams register through the public registration form you configured
2. Go to Teams view to see pending registrations
3. Review and approve or reject teams
4. Approved teams can be assigned to flights (age group + division groupings)

Building a Tournament Schedule:
1. Go to Schedule Builder → select your event
2. Step 1: Configure flight settings (game length, rest periods, buffer time per age group)
3. Step 2: Create brackets or groups within each flight
4. Step 3: Use auto-schedule to generate games based on the tournament format
5. Step 4: Assign specific fields and time slots to each game
6. Review for conflicts — the system checks for overlapping games and insufficient rest time
7. The AI scheduling assistant can help optimize and resolve conflicts

Managing Venues & Fields:
1. Go to Venues → Add a new venue/complex
2. Add fields to the venue (name, size, lighting, surface type)
3. To use fields for scheduling, link the venue to your event
4. The Venue Map view shows geographic locations for logistics planning

Setting Up Staff & Permissions:
1. Go to Staff → Add new admin users with their email
2. Assign a role (Super Admin, Tournament Admin, Score Admin, Finance Admin)
3. To customize what each role can do, go to Settings → Permissions
4. Create custom roles with specific permission sets

TIPS & BEST PRACTICES:
- Always set up age groups BEFORE opening registration
- Configure venues and fields BEFORE building schedules
- Use the Schedule Builder's AI assistant for help with complex scheduling
- Export reports regularly for accounting and record-keeping
- Set up email templates before your first tournament to ensure professional communications
- Use the Form Builder for custom registration questions (medical info, waivers, etc.)`;

/**
 * Help Center AI Chatbot Service
 * Provides read-only guidance about using KickDeck.
 * Stores conversations in the existing ai_conversation_history table with eventId = null.
 */
export class HelpCenterService {
  /**
   * Generate a unique session ID prefixed for help center conversations
   */
  static generateSessionId(): string {
    return `help-${uuidv4()}`;
  }

  /**
   * Store a conversation message in PostgreSQL
   */
  static async storeMessage(sessionId: string, role: string, content: string): Promise<void> {
    try {
      await db.insert(aiConversationHistory).values({
        eventId: null,
        sessionId,
        role,
        content,
        toolCallId: null,
      });
    } catch (error) {
      console.error('[HelpCenter] Failed to store message:', error);
    }
  }

  /**
   * Load conversation history for a session
   */
  static async loadConversationHistory(sessionId: string): Promise<Array<{ role: string; content: string }>> {
    try {
      const messages = await db.query.aiConversationHistory.findMany({
        where: eq(aiConversationHistory.sessionId, sessionId),
        orderBy: [aiConversationHistory.createdAt],
      });

      return messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
    } catch (error) {
      console.error('[HelpCenter] Failed to load conversation:', error);
      return [];
    }
  }

  /**
   * Send a message to the AI and get a response
   */
  static async chat(
    sessionId: string,
    userMessage: string,
    currentPage?: string,
    orgId?: number
  ): Promise<{ response: string; sessionId: string }> {
    const openai = await getOpenAIClient(orgId);
    if (!openai) {
      return {
        response:
          'The AI Help Assistant is not configured yet. An administrator can add an OpenAI API key in Settings → AI Configuration.',
        sessionId,
      };
    }

    // Load existing conversation history
    let history = await this.loadConversationHistory(sessionId);

    // If new conversation, store the system prompt
    if (history.length === 0) {
      await this.storeMessage(sessionId, 'system', HELP_CENTER_SYSTEM_PROMPT);
      history = [{ role: 'system', content: HELP_CENTER_SYSTEM_PROMPT }];
    }

    // Append current page context to the user message if provided
    const contextualMessage = currentPage
      ? `[User is currently on the "${currentPage}" page]\n\n${userMessage}`
      : userMessage;

    // Store the user message
    await this.storeMessage(sessionId, 'user', contextualMessage);
    history.push({ role: 'user', content: contextualMessage });

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: history.map((m) => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        })),
        temperature: 0.4,
        max_tokens: 1500,
      });

      const assistantMessage =
        completion.choices[0]?.message?.content ||
        "I'm sorry, I couldn't generate a response. Please try again.";

      // Store assistant response
      await this.storeMessage(sessionId, 'assistant', assistantMessage);

      return { response: assistantMessage, sessionId };
    } catch (error: any) {
      console.error('[HelpCenter] OpenAI API error:', error);

      const errorMessage =
        'I encountered an error while processing your question. Please try again in a moment.';

      // Store error as assistant message so the conversation flow isn't broken
      await this.storeMessage(sessionId, 'assistant', errorMessage);

      return { response: errorMessage, sessionId };
    }
  }

  /**
   * Clear conversation history for a session
   */
  static async clearConversation(sessionId: string): Promise<void> {
    try {
      await db
        .delete(aiConversationHistory)
        .where(eq(aiConversationHistory.sessionId, sessionId));
    } catch (error) {
      console.error('[HelpCenter] Failed to clear conversation:', error);
    }
  }
}
