/**
 * Field Size Validation Service
 * 
 * Strict enforcement of field size constraints based on age groups
 * and tournament requirements with comprehensive validation
 */

interface FieldSizeRequirement {
  ageGroup: string;
  requiredFieldSize: '4v4' | '7v7' | '9v9' | '11v11';
  minPlayersPerSide: number;
  maxPlayersPerSide: number;
  fieldDimensions: {
    length: string;
    width: string;
    goalSize: string;
  };
}

interface FieldAssignmentValidation {
  isValid: boolean;
  fieldId?: number;
  fieldName?: string;
  assignedSize?: string;
  requiredSize?: string;
  severity: 'ok' | 'warning' | 'critical';
  message: string;
  alternativeFields?: Array<{
    fieldId: number;
    fieldName: string;
    complexName: string;
    availability: 'available' | 'limited' | 'unavailable';
  }>;
}

interface FieldCapacityRule {
  fieldSize: '4v4' | '7v7' | '9v9' | '11v11';
  maxConcurrentGames: number;
  bufferTimeMinutes: number;
  setupTimeMinutes: number;
  cleanupTimeMinutes: number;
  maintenanceIntervalGames: number;
}

export class FieldSizeValidator {

  // Official field size requirements based on age groups
  private static readonly FIELD_SIZE_REQUIREMENTS: FieldSizeRequirement[] = [
    {
      ageGroup: 'U6',
      requiredFieldSize: '4v4',
      minPlayersPerSide: 3,
      maxPlayersPerSide: 4,
      fieldDimensions: { length: '25-35 yards', width: '20-30 yards', goalSize: '4x6 feet' }
    },
    {
      ageGroup: 'U8',
      requiredFieldSize: '4v4',
      minPlayersPerSide: 3,
      maxPlayersPerSide: 4,
      fieldDimensions: { length: '25-35 yards', width: '20-30 yards', goalSize: '4x6 feet' }
    },
    {
      ageGroup: 'U10',
      requiredFieldSize: '7v7',
      minPlayersPerSide: 6,
      maxPlayersPerSide: 7,
      fieldDimensions: { length: '50-60 yards', width: '35-45 yards', goalSize: '6x18 feet' }
    },
    {
      ageGroup: 'U12',
      requiredFieldSize: '9v9',
      minPlayersPerSide: 8,
      maxPlayersPerSide: 9,
      fieldDimensions: { length: '70-80 yards', width: '45-55 yards', goalSize: '7x21 feet' }
    },
    {
      ageGroup: 'U14',
      requiredFieldSize: '11v11',
      minPlayersPerSide: 10,
      maxPlayersPerSide: 11,
      fieldDimensions: { length: '100-120 yards', width: '50-80 yards', goalSize: '8x24 feet' }
    },
    {
      ageGroup: 'U16',
      requiredFieldSize: '11v11',
      minPlayersPerSide: 10,
      maxPlayersPerSide: 11,
      fieldDimensions: { length: '100-120 yards', width: '50-80 yards', goalSize: '8x24 feet' }
    },
    {
      ageGroup: 'U17',
      requiredFieldSize: '11v11',
      minPlayersPerSide: 10,
      maxPlayersPerSide: 11,
      fieldDimensions: { length: '100-120 yards', width: '50-80 yards', goalSize: '8x24 feet' }
    },
    {
      ageGroup: 'U19',
      requiredFieldSize: '11v11',
      minPlayersPerSide: 10,
      maxPlayersPerSide: 11,
      fieldDimensions: { length: '100-120 yards', width: '50-80 yards', goalSize: '8x24 feet' }
    },
    {
      ageGroup: 'Adult',
      requiredFieldSize: '11v11',
      minPlayersPerSide: 10,
      maxPlayersPerSide: 11,
      fieldDimensions: { length: '100-120 yards', width: '50-80 yards', goalSize: '8x24 feet' }
    }
  ];

  // Field capacity rules by size
  private static readonly FIELD_CAPACITY_RULES: FieldCapacityRule[] = [
    {
      fieldSize: '4v4',
      maxConcurrentGames: 4, // Small fields can handle multiple games
      bufferTimeMinutes: 10,
      setupTimeMinutes: 5,
      cleanupTimeMinutes: 5,
      maintenanceIntervalGames: 8
    },
    {
      fieldSize: '7v7',
      maxConcurrentGames: 2, // Medium fields
      bufferTimeMinutes: 15,
      setupTimeMinutes: 10,
      cleanupTimeMinutes: 5,
      maintenanceIntervalGames: 6
    },
    {
      fieldSize: '9v9',
      maxConcurrentGames: 1, // Larger fields, one game at a time
      bufferTimeMinutes: 15,
      setupTimeMinutes: 10,
      cleanupTimeMinutes: 5,
      maintenanceIntervalGames: 5
    },
    {
      fieldSize: '11v11',
      maxConcurrentGames: 1, // Full-size fields
      bufferTimeMinutes: 20,
      setupTimeMinutes: 15,
      cleanupTimeMinutes: 5,
      maintenanceIntervalGames: 4
    }
  ];

  /**
   * Get required field size for an age group
   */
  static getRequiredFieldSize(ageGroup: string): '4v4' | '7v7' | '9v9' | '11v11' {
    // Normalize age group string
    const normalizedAgeGroup = ageGroup.replace(/\s+/g, '').toUpperCase();
    
    // Find exact match first
    let requirement = this.FIELD_SIZE_REQUIREMENTS.find(req => 
      req.ageGroup.toUpperCase() === normalizedAgeGroup
    );

    // If no exact match, try pattern matching
    if (!requirement) {
      // Extract age number from string like "U17 Boys" or "Under 17"
      const ageMatch = normalizedAgeGroup.match(/U?(\d+)/);
      if (ageMatch) {
        const age = parseInt(ageMatch[1]);
        requirement = this.FIELD_SIZE_REQUIREMENTS.find(req => {
          const reqAge = parseInt(req.ageGroup.replace('U', ''));
          return age <= reqAge;
        });
      }
    }

    if (!requirement) {
      console.warn(`⚠️ Unknown age group: ${ageGroup}, defaulting to 11v11`);
      return '11v11'; // Default to full field
    }

    return requirement.requiredFieldSize;
  }

  /**
   * Validate field assignment for a game
   */
  static async validateFieldAssignment(
    gameData: {
      gameId?: number;
      ageGroup: string;
      homeTeamName: string;
      awayTeamName: string;
      fieldId?: number;
      fieldName?: string;
      fieldSize?: string;
    },
    availableFields?: Array<{
      id: number;
      name: string;
      fieldSize: string;
      complexName: string;
      isAvailable: boolean;
    }>
  ): Promise<FieldAssignmentValidation> {

    console.log(`🏟️ Validating field assignment for ${gameData.homeTeamName} vs ${gameData.awayTeamName} (${gameData.ageGroup})`);

    const requiredSize = this.getRequiredFieldSize(gameData.ageGroup);
    
    // If no field assigned yet, this is a planning validation
    if (!gameData.fieldId || !gameData.fieldSize) {
      const suitableFields = availableFields?.filter(f => 
        f.fieldSize === requiredSize && f.isAvailable
      ) || [];

      if (suitableFields.length === 0) {
        return {
          isValid: false,
          requiredSize,
          severity: 'critical',
          message: `No available ${requiredSize} fields found for ${gameData.ageGroup} game`,
          alternativeFields: availableFields?.filter(f => f.isAvailable) || []
        };
      }

      return {
        isValid: true,
        requiredSize,
        severity: 'ok',
        message: `${suitableFields.length} suitable ${requiredSize} field(s) available`,
        alternativeFields: suitableFields
      };
    }

    // Validate existing field assignment
    const assignedSize = gameData.fieldSize as '4v4' | '7v7' | '9v9' | '11v11';
    
    if (assignedSize === requiredSize) {
      return {
        isValid: true,
        fieldId: gameData.fieldId,
        fieldName: gameData.fieldName,
        assignedSize,
        requiredSize,
        severity: 'ok',
        message: `Field assignment correct: ${gameData.fieldName} (${assignedSize}) matches requirement for ${gameData.ageGroup}`
      };
    }

    // Check if assigned field is larger (acceptable in some cases)
    const sizeHierarchy = ['4v4', '7v7', '9v9', '11v11'];
    const requiredIndex = sizeHierarchy.indexOf(requiredSize);
    const assignedIndex = sizeHierarchy.indexOf(assignedSize);

    if (assignedIndex > requiredIndex) {
      return {
        isValid: true,
        fieldId: gameData.fieldId,
        fieldName: gameData.fieldName,
        assignedSize,
        requiredSize,
        severity: 'warning',
        message: `Oversized field assignment: ${gameData.fieldName} (${assignedSize}) is larger than required ${requiredSize} for ${gameData.ageGroup}`,
        alternativeFields: availableFields?.filter(f => f.fieldSize === requiredSize) || []
      };
    }

    // Field is too small - critical error
    return {
      isValid: false,
      fieldId: gameData.fieldId,
      fieldName: gameData.fieldName,
      assignedSize,
      requiredSize,
      severity: 'critical',
      message: `Invalid field assignment: ${gameData.fieldName} (${assignedSize}) is too small for ${gameData.ageGroup} (requires ${requiredSize})`,
      alternativeFields: availableFields?.filter(f => 
        sizeHierarchy.indexOf(f.fieldSize) >= requiredIndex
      ) || []
    };
  }

  /**
   * Validate field capacity constraints
   */
  static validateFieldCapacity(
    fieldSize: '4v4' | '7v7' | '9v9' | '11v11',
    currentGames: number,
    requestedTime: string,
    existingGames: Array<{
      startTime: string;
      endTime: string;
      fieldId: number;
    }>
  ): {
    isValid: boolean;
    currentCapacity: number;
    maxCapacity: number;
    message: string;
    recommendation?: string;
  } {

    const capacityRule = this.FIELD_CAPACITY_RULES.find(rule => rule.fieldSize === fieldSize);
    
    if (!capacityRule) {
      return {
        isValid: false,
        currentCapacity: currentGames,
        maxCapacity: 1,
        message: `Unknown field size: ${fieldSize}`,
        recommendation: 'Use standard field capacity rules'
      };
    }

    if (currentGames >= capacityRule.maxConcurrentGames) {
      return {
        isValid: false,
        currentCapacity: currentGames,
        maxCapacity: capacityRule.maxConcurrentGames,
        message: `Field capacity exceeded: ${currentGames}/${capacityRule.maxConcurrentGames} concurrent games`,
        recommendation: `Wait ${capacityRule.bufferTimeMinutes} minutes or use different field`
      };
    }

    return {
      isValid: true,
      currentCapacity: currentGames,
      maxCapacity: capacityRule.maxConcurrentGames,
      message: `Field capacity OK: ${currentGames}/${capacityRule.maxConcurrentGames} games`
    };
  }

  /**
   * Get field capacity rules for a specific field size
   */
  static getFieldCapacityRules(fieldSize: '4v4' | '7v7' | '9v9' | '11v11'): FieldCapacityRule | null {
    return this.FIELD_CAPACITY_RULES.find(rule => rule.fieldSize === fieldSize) || null;
  }

  /**
   * Validate an entire schedule for field size compliance
   */
  static async validateScheduleFieldSizes(
    games: Array<{
      gameId: number;
      ageGroup: string;
      homeTeamName: string;
      awayTeamName: string;
      fieldId?: number;
      fieldName?: string;
      fieldSize?: string;
    }>,
    availableFields: Array<{
      id: number;
      name: string;
      fieldSize: string;
      complexName: string;
      isAvailable: boolean;
    }>
  ): Promise<{
    validGames: number;
    invalidGames: number;
    warnings: number;
    violations: FieldAssignmentValidation[];
    summary: string;
  }> {

    console.log(`🔍 Validating field sizes for ${games.length} games`);

    const violations: FieldAssignmentValidation[] = [];
    let validGames = 0;
    let warnings = 0;

    for (const game of games) {
      const validation = await this.validateFieldAssignment(game, availableFields);
      
      if (!validation.isValid) {
        violations.push(validation);
      } else if (validation.severity === 'warning') {
        warnings++;
        violations.push(validation);
      } else {
        validGames++;
      }
    }

    const invalidGames = violations.filter(v => !v.isValid).length;

    const summary = `Field size validation: ${validGames} valid, ${warnings} warnings, ${invalidGames} violations`;

    console.log(`📊 ${summary}`);

    return {
      validGames,
      invalidGames: invalidGames,
      warnings,
      violations,
      summary
    };
  }

  /**
   * Get all field size requirements
   */
  static getAllFieldSizeRequirements(): FieldSizeRequirement[] {
    return [...this.FIELD_SIZE_REQUIREMENTS];
  }

  /**
   * Get field capacity rules for all sizes
   */
  static getAllFieldCapacityRules(): FieldCapacityRule[] {
    return [...this.FIELD_CAPACITY_RULES];
  }

  /**
   * Find best field matches for an age group
   */
  static findBestFieldMatches(
    ageGroup: string,
    availableFields: Array<{
      id: number;
      name: string;
      fieldSize: string;
      complexName: string;
      isAvailable: boolean;
    }>
  ): Array<{
    fieldId: number;
    fieldName: string;
    complexName: string;
    matchQuality: 'perfect' | 'acceptable' | 'suboptimal';
    reason: string;
  }> {

    const requiredSize = this.getRequiredFieldSize(ageGroup);
    const matches: Array<{
      fieldId: number;
      fieldName: string;
      complexName: string;
      matchQuality: 'perfect' | 'acceptable' | 'suboptimal';
      reason: string;
    }> = [];

    const sizeHierarchy = ['4v4', '7v7', '9v9', '11v11'];
    const requiredIndex = sizeHierarchy.indexOf(requiredSize);

    for (const field of availableFields.filter(f => f.isAvailable)) {
      const fieldIndex = sizeHierarchy.indexOf(field.fieldSize);
      
      if (fieldIndex === requiredIndex) {
        matches.push({
          fieldId: field.id,
          fieldName: field.name,
          complexName: field.complexName,
          matchQuality: 'perfect',
          reason: `Perfect match: ${field.fieldSize} field for ${ageGroup}`
        });
      } else if (fieldIndex > requiredIndex) {
        matches.push({
          fieldId: field.id,
          fieldName: field.name,
          complexName: field.complexName,
          matchQuality: 'acceptable',
          reason: `Acceptable: ${field.fieldSize} field can accommodate ${ageGroup} (oversized)`
        });
      } else {
        matches.push({
          fieldId: field.id,
          fieldName: field.name,
          complexName: field.complexName,
          matchQuality: 'suboptimal',
          reason: `Suboptimal: ${field.fieldSize} field too small for ${ageGroup}`
        });
      }
    }

    // Sort by match quality
    const qualityOrder = ['perfect', 'acceptable', 'suboptimal'];
    matches.sort((a, b) => 
      qualityOrder.indexOf(a.matchQuality) - qualityOrder.indexOf(b.matchQuality)
    );

    return matches;
  }
}