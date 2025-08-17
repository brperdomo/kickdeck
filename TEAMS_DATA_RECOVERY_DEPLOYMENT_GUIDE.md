# Teams Data Recovery - Deployment Guide

## Issue Summary
Teams data was appearing as "missing" in the admin dashboard due to schema type mismatches between Drizzle ORM and PostgreSQL database, not actual data loss.

## Data Status ✅
- **1,039 total teams** confirmed in database
- **Event 1844329078 (Empire Super Cup)**: 614 teams, 46 age groups, 129 flight brackets
- **Event 1825427780 (Rise Cup)**: 215 teams, 30 age groups, 3 flight brackets
- All age group, gender, and flight data intact

## Fixed Issues
1. **Schema Type Mismatch**: Changed `teams.eventId` from `text` to `integer` in db/schema.ts
2. **API Query Compatibility**: Added raw SQL fallback in teams-simple.ts to handle type mismatches
3. **Error Handling**: Enhanced TeamsManager component with proper authentication error messages
4. **API Authentication**: Added proper credentials to API requests

## Key Files Modified
- `db/schema.ts` - Fixed eventId type from text to integer
- `server/routes/admin/teams-simple.ts` - Added raw SQL queries and logging
- `client/src/components/admin/scheduling/TeamsManager.tsx` - Enhanced error handling

## Deployment Requirements
**YES, you need to redeploy to production** to see the teams data in the admin dashboard.

## Pre-Deployment Checklist
- [x] Database schema corrected
- [x] API endpoints updated with fallback queries  
- [x] Frontend error handling improved
- [x] Raw SQL queries tested
- [x] Authentication flow verified

## Expected Results After Deployment
- Teams tab will show actual team counts instead of empty state
- Proper authentication error messages for non-admin users
- Access to all 1,039 teams across tournaments when logged in as admin
- Full age group, gender, and flight data visibility

## Database Schema Note
The schema changes are backward compatible and use raw SQL queries as fallback, so deployment should be safe without data migration risks.