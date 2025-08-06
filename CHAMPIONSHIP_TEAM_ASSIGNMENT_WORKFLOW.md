# Championship Team Assignment Workflow

## Overview
After pool play is complete, tournament directors need to assign the top teams to championship games. The system provides multiple approaches to handle this progression.

## Current Status
✅ Championship games now display "TBD vs TBD" instead of "Team null vs Team null"  
✅ All pool play games (1-6) show actual team names  
✅ Championship final (Game 7) ready for team assignment after pool play

## Team Assignment Options

### 1. Manual Assignment (Primary Method)
**When to Use:** Most tournaments use this for final control over matchups

**Process:**
1. Pool play completes (Games 1-6 finished with scores)
2. Tournament director reviews pool standings
3. Navigate to bracket management interface
4. Select championship game (Game 7)
5. Manually assign top 2 teams from pool standings
6. Teams are immediately updated in championship game

**Interface:**
- Championship game shows edit controls
- Dropdown menus with pool teams ranked by performance
- One-click assignment: "Winner Pool A vs Winner Pool B"

### 2. Automated Progression (Future Enhancement)
**When to Use:** For standardized tournament formats

**Logic:**
```
Pool Play Results → Automatic Ranking → Championship Assignment
```

**Ranking Criteria:**
1. Points (3 for win, 1 for tie, 0 for loss)
2. Goal differential 
3. Goals scored
4. Head-to-head record (if applicable)

### 3. Bracket-Aware Progression
**Advanced Feature:** The system tracks bracket structure and can auto-populate based on game results

## Technical Implementation

### Database Structure
```sql
-- Championship game exists with NULL team assignments
games.id = 7347
games.home_team_id = NULL  -- Will be updated after pool play
games.away_team_id = NULL  -- Will be updated after pool play
games.round = 2            -- Championship round
games.match_number = 7     -- Final game
```

### API Endpoints
- `PUT /api/admin/games/7347/teams` - Update championship teams
- `GET /api/admin/brackets/standings` - Get pool play standings
- `POST /api/admin/brackets/auto-advance` - Automatic team advancement

### Frontend Interface
- Bracket preview shows "TBD vs TBD" for championship
- Pool standings table with "Advance to Finals" buttons
- Drag-and-drop team assignment interface
- Real-time updates when teams are assigned

## Pool Play to Championship Flow

### Step 1: Pool Play Complete
```
Game 1: Team A vs Team B → Team A wins 2-1
Game 2: Team C vs Team D → Team C wins 3-0  
Game 3: Team A vs Team C → Team A wins 1-0
Game 4: Team B vs Team D → Team D wins 2-1
Game 5: Team A vs Team D → Team A wins 4-0
Game 6: Team B vs Team C → Team C wins 2-0
```

### Step 2: Standings Calculation
```
1. Team A: 9 points, +6 GD (3 wins)
2. Team C: 6 points, +1 GD (2 wins, 1 loss)  
3. Team D: 3 points, -2 GD (1 win, 2 losses)
4. Team B: 0 points, -5 GD (3 losses)
```

### Step 3: Championship Assignment
```
Game 7: Team A vs Team C (Top 2 teams advance)
```

## User Experience

### Tournament Director View
1. **Pool Play Phase**
   - Games 1-6 show team names and scheduling
   - Game 7 shows "TBD vs TBD" (not editable yet)

2. **After Pool Results**
   - Pool standings automatically calculated
   - Game 7 becomes editable
   - "Assign Championship Teams" button appears

3. **Team Selection**
   - Modal opens with pool standings
   - Click team names to assign to championship
   - Confirmation before finalizing assignments

### Real-Time Updates
- Championship game immediately shows assigned team names
- Schedule updates reflect new matchup
- Email notifications sent to assigned teams
- Bracket display updates across all views

## Example Championship Assignment API Call

```javascript
// After pool play is complete, assign top 2 teams to championship
const response = await fetch('/api/admin/games/7347/teams', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    homeTeamId: 12345, // Team A (1st place in pool)
    awayTeamId: 12348, // Team C (2nd place in pool)
    assignmentMethod: 'manual',
    assignedBy: 'tournament_director'
  })
});
```

## Next Steps
1. Complete pool play games with actual scores
2. Use bracket management interface to assign championship teams  
3. Championship game will automatically update from "TBD vs TBD" to actual team names
4. Teams and coaches receive championship game notifications

The system is ready for this workflow - championship games show proper TBD placeholders and will seamlessly update once teams are assigned after pool play completion.