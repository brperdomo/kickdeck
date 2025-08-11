# Flight Scheduling Status Indicators Implementation

## Overview
Added visual indicators to show which flights already have scheduled games in the Tournament Control Center's "Select Flights to Schedule" interface.

## Features Implemented

### 1. Visual Status Indicators
- **Grayed out appearance**: Scheduled flights show with reduced opacity and muted colors
- **"Scheduled" badge**: Green status badge clearly indicates flights that already have games
- **Game count display**: Shows number of scheduled games for each flight
- **Disabled interaction**: Prevents re-scheduling of flights that already have games

### 2. Smart Flight Selection
- **Select All behavior**: Only selects unscheduled flights, skipping those with existing games
- **Status counter**: Shows count of already scheduled flights in the selection summary
- **Click prevention**: Scheduled flights cannot be clicked or selected
- **Organized display**: Flights sorted from oldest to youngest age groups
- **Gender indicators**: Blue "B" badges for boys, pink "G" badges for girls

### 3. Backend API Integration
- **New endpoint**: `/api/admin/events/{eventId}/flight-game-counts` provides real-time game counts
- **Efficient querying**: Uses database joins to count games per flight
- **Real-time updates**: Refreshes every 5 seconds to show current status

## Visual Design

### Scheduled Flight Styling
```css
/* Scheduled flights appear grayed out */
border-slate-500 bg-slate-700/50 opacity-60

/* Text colors are muted */
text-slate-400 (flight name)
text-slate-500 (details)

/* Status badge is prominent */
bg-green-900/30 text-green-300 border-green-600
```

### Interactive Behavior
- **Disabled cursor**: `cursor: not-allowed` for scheduled flights
- **Checkbox disabled**: Cannot select flights that already have games
- **Hover effects**: Only work on unscheduled flights
- **Logical ordering**: Flights displayed oldest to youngest (U19, U18, U17, etc.)
- **Gender grouping**: Boys flights listed before girls within each age group

## Technical Implementation

### Backend Changes
- **New API route** in `flight-configurations.ts`:
  - Counts games per flight using database joins
  - Returns object with flightId as key, game count as value
  - Handles authentication and error cases

### Frontend Changes  
- **Enhanced data fetching**: New query for flight game counts
- **Conditional rendering**: Different styling based on scheduling status
- **Smart selection logic**: Prevents selection of scheduled flights
- **Status indicators**: Badges and counters for scheduled flights

### Data Flow
1. **Frontend requests** flight configurations and game counts
2. **Backend queries** database for both flight details and game counts
3. **Frontend receives** combined data with scheduling status
4. **UI renders** with appropriate visual indicators
5. **User interactions** are filtered based on scheduling status

## User Experience Benefits

### Tournament Directors
- **Clear visibility**: Instantly see which flights are already scheduled
- **Prevent conflicts**: Cannot accidentally re-schedule existing games
- **Status awareness**: Always know current scheduling progress
- **Selective scheduling**: Focus only on unscheduled flights

### System Safety
- **Prevents overwrites**: Existing schedules are protected from accidental changes
- **Data integrity**: No duplicate scheduling of the same flights
- **User confidence**: Clear indication of what actions are available

## Error Handling
- **API failures**: Gracefully handles missing game count data
- **Missing data**: Defaults to 0 games if counts unavailable  
- **Authentication**: Shows appropriate errors for auth failures
- **Network issues**: Retries and fallback behavior

## Future Enhancements

### Potential Improvements
1. **Partial scheduling**: Allow re-scheduling specific games within a flight
2. **Schedule modification**: Edit existing schedules without full deletion
3. **Schedule comparison**: Show before/after when making changes
4. **Bulk operations**: Reschedule multiple flights simultaneously
5. **Schedule validation**: Check for conflicts across flights

## Status: ✅ COMPLETE
Flight status indicators are now fully functional, providing clear visual feedback about which flights have scheduled games while preventing accidental re-scheduling of existing games.