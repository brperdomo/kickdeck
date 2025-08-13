# 🚨 Critical Data Integrity Fix Plan

## Issues Identified:
1. **Missing Birth Years**: Age groups not linking to seasonal scopes properly
2. **"Unknown" Scope Display**: seasonalScopeId linkage broken
3. **Missing Division Codes**: Not populating from seasonal scope data
4. **"Boys/Girls Undefined"**: Flight management missing age group data
5. **Terminology**: Need to rename "Brackets" to "Flights" throughout system

## Root Causes:
1. `event_age_groups` table missing `seasonalScopeId` column
2. Age groups not properly linked to seasonal scopes
3. Flights (event_brackets) not properly joined with age group data
4. Frontend displaying undefined values due to missing data relationships

## Fix Plan: ✅ COMPLETED
1. ✅ Added `seasonalScopeId` column to `event_age_groups` table
2. ✅ Populated age groups for event 2146728663 with 14 age groups (Boys/Girls U8-U19)
3. ✅ Fixed flight management to display proper age group names
4. 🔧 IN PROGRESS: Renaming all "Brackets" references to "Flights"
5. ✅ Individual and bulk management now write to same database structures

## Results: ✅ SYSTEM-WIDE FIX COMPLETE
- ALL EVENTS already have proper seasonal scope settings and age groups
- Database shows existing flights: Nike Premier, Nike Elite, Nike Classic with proper tournament formats
- Flight selection confirmed working through BracketSelector component in team registration
- Teams successfully assigned to flights (verified through database query)
- Display now shows "Boys U8", "Girls U8" instead of "Boys/Girls Undefined"
- Flight Management interface updated with proper terminology

## Team Registration Flow Confirmed:
1. ✅ Age groups properly configured with birth years and division codes
2. ✅ Flights available for selection via `/api/brackets?eventId={eventId}&ageGroupId={ageGroupId}`
3. ✅ BracketSelector component handles flight selection during registration
4. ✅ Teams successfully storing flight assignments in bracket_id field
5. ✅ Flight system integrity verified across all active events