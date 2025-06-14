# Mapbox Migration Guide for Multi-Tenant Complex Management

## Overview

This guide covers migrating from Google Maps to Mapbox for sports complex address verification with multi-tenant support to prevent scheduling conflicts across client instances.

## Required Mapbox API Setup

### 1. Create Mapbox Account
- Go to [mapbox.com](https://mapbox.com) and create an account
- Navigate to your account dashboard

### 2. Required API Access Tokens
You need a **Public Access Token** with these scopes:

#### Required Scopes:
- `styles:read` - For map styling (optional)
- `fonts:read` - For map fonts (optional) 
- `geocoding:read` - **REQUIRED** for address autocomplete
- `search:read` - **REQUIRED** for enhanced search capabilities

#### API Endpoints Used:
- **Geocoding API**: `https://api.mapbox.com/geocoding/v5/mapbox.places/`
- **Search Box API**: Enhanced autocomplete with place details

### 3. Pricing Structure
- **Geocoding API**: ~$0.50 per 1,000 requests
- **Search Box API**: ~$0.75 per 1,000 requests
- **Free Tier**: 100,000 requests per month
- **Recommended**: Start with pay-as-you-go pricing

## Setup Instructions

### Step 1: Get Your Mapbox API Key

1. Log into your Mapbox account
2. Go to **Account → Access Tokens**
3. Copy your **Default Public Token** or create a new one
4. Ensure it has `geocoding:read` and `search:read` scopes

### Step 2: Configure Environment Variables

Add to your environment variables:
```bash
VITE_MAPBOX_API_KEY=pk.your_mapbox_token_here
```

### Step 3: Run Database Migration

Execute the migration script to add multi-tenant support:
```bash
node migrate-complexes-to-mapbox.js
```

This adds:
- Mapbox-specific columns to complexes table
- Global complex registry for conflict prevention
- Unique global IDs for each complex
- Conflict detection and resolution system

## Key Features

### 1. Multi-Tenant Complex Management
- **Global Complex IDs**: Unique identifiers prevent scheduling conflicts
- **Cross-Organization Detection**: Identifies when multiple organizations use the same facility
- **Conflict Resolution**: Automated system to handle scheduling overlaps

### 2. Enhanced Address Verification
- **Real-time Autocomplete**: Instant address suggestions as you type
- **Coordinate Extraction**: Automatic latitude/longitude population
- **Address Validation**: Ensures complex addresses are verified and standardized

### 3. Global Registry System
- **Canonical Names**: Standardized complex names across all instances
- **Usage Tracking**: Monitors how many organizations use each complex
- **Verification Status**: Tracks which complexes have been verified via Mapbox

## Implementation Details

### Frontend Components

#### MapboxAutocomplete Component
```typescript
<MapboxAutocomplete
  value={address}
  onChange={(value, placeDetails) => {
    // Handle address selection
    // Auto-populate coordinates and location data
  }}
  types={['address', 'poi']}
  country={['us', 'ca']}
  placeholder="Search for a sports complex..."
/>
```

#### Enhanced ComplexEditor
- Replaced Google Maps with Mapbox autocomplete
- Automatic coordinate extraction
- Address component parsing (city, state, country)

### Backend API Endpoints

#### New Routes Added:
- `POST /api/admin/complexes/check-conflicts` - Check for scheduling conflicts
- `POST /api/admin/complexes/register-global` - Register in global registry
- `GET /api/admin/complexes/global-registry/:id` - Get global registry info

### Database Schema Updates

#### Complexes Table Additions:
```sql
-- Mapbox-specific columns
mapbox_place_id TEXT,
mapbox_feature_type TEXT,
mapbox_relevance DECIMAL(3,2),
mapbox_accuracy TEXT,

-- Multi-tenant support
global_complex_id TEXT UNIQUE,
organization_id INTEGER,
timezone TEXT DEFAULT 'America/New_York',
mapbox_context JSONB,

-- Verification tracking
address_verified BOOLEAN DEFAULT FALSE,
last_verified_at TIMESTAMP
```

#### Global Complex Registry:
```sql
CREATE TABLE global_complex_registry (
  id SERIAL PRIMARY KEY,
  global_complex_id TEXT UNIQUE NOT NULL,
  canonical_name TEXT NOT NULL,
  canonical_address TEXT NOT NULL,
  mapbox_place_id TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  -- ... additional location fields
);
```

## Benefits Over Google Maps

### 1. Cost Efficiency
- **Lower Pricing**: Mapbox typically costs 50-75% less than Google Maps
- **Predictable Billing**: Clearer pricing structure
- **Higher Free Tier**: 100K requests vs Google's smaller limits

### 2. Enhanced Features
- **Better Autocomplete**: More accurate place suggestions
- **Global Coverage**: Excellent international address support
- **Customization**: More control over search parameters

### 3. Multi-Tenant Architecture
- **Conflict Prevention**: Built-in system to prevent double-bookings
- **Global Registry**: Centralized complex management
- **Organization Isolation**: Proper data separation between clients

## Migration Strategy

### Phase 1: Parallel Operation (Recommended)
1. Deploy Mapbox components alongside Google Maps
2. Allow users to choose between services
3. Gradually migrate complexes to Mapbox verification
4. Monitor performance and accuracy

### Phase 2: Full Migration
1. Set Google Maps API key to empty to disable service
2. All new complexes use Mapbox verification
3. Run verification script for existing complexes
4. Remove Google Maps dependencies

### Phase 3: Multi-Tenant Optimization
1. Enable cross-organization conflict detection
2. Implement global registry synchronization
3. Add advanced scheduling conflict prevention
4. Deploy to all client instances

## Conflict Prevention System

### How It Works
1. **Address Standardization**: Mapbox normalizes all addresses
2. **Global ID Generation**: Creates unique identifiers based on precise location
3. **Conflict Detection**: Checks if another organization uses the same facility
4. **Resolution Workflow**: Provides tools to resolve scheduling conflicts

### Example Conflict Scenario
```
Organization A: "Metro Sports Complex"
Organization B: "Metropolitan Athletic Center" 
Same Location: 123 Sports Ave, City, State

System Response:
- Generates same global_complex_id for both
- Flags potential conflict during registration
- Suggests coordination between organizations
- Provides contact information for resolution
```

## Testing the Migration

### 1. Verify API Key
```javascript
// Check if Mapbox service is working
import { mapboxService } from './lib/mapbox-service';

console.log('Mapbox available:', mapboxService.isAvailable());
```

### 2. Test Address Search
1. Open Complex Editor
2. Start typing an address
3. Verify autocomplete suggestions appear
4. Select address and confirm coordinates populate

### 3. Verify Global Registry
1. Create a complex with verified address
2. Check database for global_complex_id
3. Try creating same complex in different organization
4. Confirm conflict detection works

## Troubleshooting

### Common Issues

#### "No API key" Error
- Ensure `VITE_MAPBOX_API_KEY` is set correctly
- Restart your development server
- Check environment variable is prefixed with `VITE_`

#### Autocomplete Not Working
- Verify API key has `geocoding:read` permission
- Check browser console for API errors
- Ensure request limits haven't been exceeded

#### Missing Coordinates
- Confirm address selection triggers onChange event
- Check that place details contain geometry data
- Verify form setValue calls are working

### Performance Optimization

#### Debouncing
- Autocomplete includes 300ms debounce
- Prevents excessive API calls during typing

#### Caching
- Results cached in component state
- Reduces duplicate requests for same queries

#### Rate Limiting
- Monitor API usage in Mapbox dashboard
- Implement additional client-side limiting if needed

## Support and Maintenance

### Monitoring
- Track API usage in Mapbox dashboard
- Monitor conflict detection accuracy
- Review global registry growth

### Updates
- Keep Mapbox API version current
- Update conflict resolution algorithms
- Enhance address normalization as needed

### Backup Strategy
- Maintain Google Maps integration as fallback
- Regular backups of global registry data
- Document all custom configuration changes