# Selective Scheduling 500 Error - DEBUG PLAN ✅

## Current Issue
User tried to generate games for **U12 Boys Nike Premier** but got 500 Internal Server Error.

## Database State Verified ✅
```sql
-- U12 Boys Nike Premier bracket exists:
SELECT id, name, tournament_format, age_group, gender, team_count 
FROM brackets_with_teams 
WHERE age_group='U12' AND gender='Boys' AND name='Nike Premier';
-- Result: ID 617, format: round_robin, 8 teams
```

## Error Analysis
Frontend shows:
- **Flight configs loaded: 76 flights** (should be 72)
- **Configured flights: 1 of 76** (correct - only U12 Boys Nike Premier configured)
- **500 Internal Server Error** on `/api/admin/events/1844329078/generate-selective-schedule`

## Root Cause Investigation

### ✅ **Authentication**: Not the issue (frontend is logged in)
### ❓ **TournamentScheduler Import**: Potential issue with dynamic import
### ❓ **Bracket Format**: `round_robin` may not match expected format templates
### ❓ **Team Data Structure**: Teams may not have expected properties

## Debugging Steps Applied

### 1. **Fixed Import Issue**
```typescript
// OLD (potentially problematic):
const { TournamentScheduler } = await import('../../services/tournament-scheduler');

// NEW (using existing import):
// TournamentScheduler already imported at top of file
```

### 2. **Added Error Handling**
```typescript
try {
  const scheduleResult = await TournamentScheduler.generateSchedule(eventId, [bracketData]);
  bracketGames = scheduleResult.games || [];
} catch (schedulerError) {
  console.error(`TournamentScheduler error:`, schedulerError);
  throw schedulerError; // Re-throw to see in logs
}
```

### 3. **Next: Verify TournamentScheduler.generateSchedule Method**
- Check if method exists and is properly exported
- Verify expected input format vs actual bracket data
- Check if `round_robin` format is supported

## Expected Fix
The issue is likely in the TournamentScheduler service not handling the `round_robin` format correctly or the bracket data structure being incorrect.

## User's Real Configuration
- **Created 3 formats**: 4-Team Single, 6-Team Crossover, 8-Team Dual
- **But bracket has**: `round_robin` format (stale data?)
- **Should use**: One of the user's 3 actual formats

## Next Steps
1. ✅ Fix the TournamentScheduler error handling  
2. ❓ Check if U12 Boys Nike Premier should use `round_robin` or user's actual formats
3. ❓ Update bracket to use correct format from user's 3 created formats