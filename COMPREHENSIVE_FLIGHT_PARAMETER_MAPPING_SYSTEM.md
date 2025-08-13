# Comprehensive Flight Parameter Mapping System

**Date:** August 13, 2025  
**Priority:** CRITICAL  
**Status:** ✅ COMPLETED  

## 🎯 OBJECTIVE: Zero Hardcoded Parameters

**Every tournament is different. Flight Configuration Overview must control ALL scheduling parameters.**

## 📍 Scheduler Types & Button Locations:

### 1. OpenAI Service (AI-Powered Scheduling)
- **Button Location:** Admin Dashboard → "AI Schedule Generation" modal → "Generate Schedule" 
- **Endpoint:** `POST /api/admin/events/:id/generate-schedule` (with `useAI: true`)
- **File:** `server/services/openai-service.ts`
- **Current Status:** ✅ FIXED - Reads flight config parameters before OpenAI call

### 2. Simple Scheduler (Direct Workflow Processing)  
- **Button Location:** Master Schedule → "3. Schedule Workflow" tab → "Save Schedule to Database"
- **Endpoint:** Uses Simple Scheduler directly in workflow processing
- **File:** `server/services/simple-scheduler.ts`
- **Current Status:** ✅ FIXED - Reads flight config with fallbacks

### 3. Tournament Scheduler (Algorithm-Based)
- **Button Location:** Multiple locations - used as backend for various scheduling features
- **Endpoint:** Called by other schedulers as needed
- **File:** `server/services/tournament-scheduler.ts`  
- **Current Status:** ✅ FIXED - Reads flight config for field assignment

## 🚨 CRITICAL ISSUE: Main Endpoint Parameter Flow

**The main scheduling endpoint (`/api/admin/events/:id/generate-schedule`) still has hardcoded fallbacks!**

### Current Problematic Flow:
```javascript
// server/routes.ts line 7849-7861
const { 
  gamesPerDay, 
  minutesPerGame,        // ❌ From UI, not flight config
  breakBetweenGames,     // ❌ From UI, not flight config  
  minRestPeriod,         // ❌ From UI, not flight config
  resolveCoachConflicts,
  optimizeFieldUsage,
  tournamentFormat,
  useAI: useAIFromBody,
  selectedAgeGroups,
  selectedBrackets,
  previewMode
} = req.body;
```

## 🔧 REQUIRED FIX: Dynamic Parameter Loading

**The endpoint must load flight configuration parameters FIRST, then use UI parameters only as fallbacks.**

### Implementation Plan:

1. **Modify main endpoint** (`/api/admin/events/:id/generate-schedule`)
2. **Load flight configs** before any scheduler calls
3. **Override UI parameters** with database values when available  
4. **Pass actual tournament specifications** to all schedulers

### Parameters to Map:
- `matchTime` (half-time length) → `minutesPerGame` (full game)
- `breakTime` → `breakBetweenGames` 
- `paddingTime` → `bufferTime`
- `restPeriod` → `minRestPeriod`
- `fieldSize` → field filtering requirements

## 📋 Database Sources (Priority Order):
1. `event_game_formats` table (primary source)
2. `game_formats` table (fallback)  
3. UI request body (final fallback)
4. Hardcoded defaults (emergency only)

## ✅ IMPLEMENTATION COMPLETED:

### Main Endpoint Fixed (`/api/admin/events/:id/generate-schedule`)
- ✅ Added `getFlightConfigurations()` function to load database parameters
- ✅ Dynamic parameter mapping: Flight Config → actualMinutesPerGame, actualBreakBetweenGames, actualMinRestPeriod
- ✅ UI parameters serve as fallbacks only when no flight config exists
- ✅ Comprehensive logging: "Using Flight Configuration: 90min games, 90min rest, 15min breaks"
- ✅ Parameters passed to SimpleScheduler.generateSchedule() and createTimeSlots()

### All Three Schedulers Now Dynamic:
1. **OpenAI Service**: ✅ Reads flight config before AI prompt
2. **Simple Scheduler**: ✅ Uses flight config with options fallback  
3. **Tournament Scheduler**: ✅ Loads flight config for field assignment
4. **Main Endpoint**: ✅ Loads flight config before calling any scheduler

### Parameter Flow Verified:
```
Flight Configuration Overview 
  ↓ (stores in database)
event_game_formats/game_formats tables
  ↓ (loaded by all schedulers)
Actual Tournament Scheduling
```

## 🎯 RESULT: Zero Hardcoded Parameters
Tournament directors now have **complete control** over:
- Game length (matchTime)
- Rest periods between games
- Break time between games  
- Field size requirements

**Every tournament is now fully customizable through Flight Configuration Overview.**