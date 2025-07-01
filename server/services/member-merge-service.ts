/**
 * Member Merge Service
 * 
 * Handles duplicate member detection, comparison, and selective merging
 * with comprehensive data preservation options.
 */

import { db } from '../../db';
import { users, households, teams, players, eventAdministrators, adminRoles } from '../../db/schema';
import { eq, and, or, sql, ne, inArray } from 'drizzle-orm';

interface DuplicateCandidate {
  users: Array<{
    id: number;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    phone?: string;
    createdAt: string;
    lastLogin?: Date;
    householdId?: number;
    isAdmin: boolean;
    isParent: boolean;
  }>;
  matchReason: 'email' | 'name_phone' | 'similar_name' | 'same_household';
  confidence: number; // 0-100
  suggestedPrimary?: number; // User ID of suggested primary account
}

interface MergeConflict {
  field: string;
  userValues: Array<{
    userId: number;
    value: any;
    lastModified?: Date;
    recordCount?: number; // Number of associated records
  }>;
  recommendation: 'keep_newest' | 'keep_most_complete' | 'keep_most_active' | 'manual_review';
  reason: string;
}

interface MergePreview {
  primaryUser: any;
  secondaryUsers: any[];
  conflicts: MergeConflict[];
  relatedData: {
    teams: number;
    players: number;
    eventAdministrations: number;
    adminRoles: number;
    households: number;
  };
  recommendations: string[];
}

interface MergeRequest {
  primaryUserId: number;
  secondaryUserIds: number[];
  fieldResolutions: Record<string, {
    action: 'keep_primary' | 'keep_secondary' | 'use_value';
    value?: any;
    sourceUserId?: number;
  }>;
  preserveHistory: boolean;
  deleteSecondaryAccounts: boolean;
}

export class MemberMergeService {
  
  /**
   * Find potential duplicate members using multiple algorithms
   */
  static async findDuplicates(): Promise<DuplicateCandidate[]> {
    const candidates: DuplicateCandidate[] = [];
    
    // 1. Exact email matches (should be impossible due to unique constraint, but check for data integrity)
    const emailDuplicates = await this.findEmailDuplicates();
    candidates.push(...emailDuplicates);
    
    // 2. Same name + phone combinations
    const namePhoneDuplicates = await this.findNamePhoneDuplicates();
    candidates.push(...namePhoneDuplicates);
    
    // 3. Similar names (fuzzy matching)
    const similarNameDuplicates = await this.findSimilarNameDuplicates();
    candidates.push(...similarNameDuplicates);
    
    // 4. Same household with similar names
    const householdDuplicates = await this.findHouseholdDuplicates();
    candidates.push(...householdDuplicates);
    
    // Remove duplicates and sort by confidence
    return this.deduplicateCandidates(candidates)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get detailed merge preview for specific users
   */
  static async getMergePreview(userIds: number[]): Promise<MergePreview> {
    if (userIds.length < 2) {
      throw new Error('At least 2 users required for merge preview');
    }

    // Get user details
    const usersData = await db
      .select()
      .from(users)
      .where(inArray(users.id, userIds));

    if (usersData.length !== userIds.length) {
      throw new Error('Some users not found');
    }

    // Determine suggested primary account
    const primaryUser = this.determinePrimaryUser(usersData);
    const secondaryUsers = usersData.filter(u => u.id !== primaryUser.id);

    // Identify conflicts
    const conflicts = await this.identifyMergeConflicts(usersData);

    // Get related data counts
    const relatedData = await this.getRelatedDataCounts(userIds);

    // Generate recommendations
    const recommendations = this.generateMergeRecommendations(primaryUser, secondaryUsers, conflicts, relatedData);

    return {
      primaryUser,
      secondaryUsers,
      conflicts,
      relatedData,
      recommendations
    };
  }

  /**
   * Execute member merge with specified field resolutions
   */
  static async executeMerge(mergeRequest: MergeRequest): Promise<{
    success: boolean;
    mergedUserId: number;
    transferredRecords: {
      teams: number;
      players: number;
      eventAdministrations: number;
      adminRoles: number;
    };
    preservedData?: any;
    error?: string;
  }> {
    try {
      // Start transaction
      return await db.transaction(async (tx) => {
        const { primaryUserId, secondaryUserIds, fieldResolutions, preserveHistory, deleteSecondaryAccounts } = mergeRequest;

        // Get all users involved
        const allUserIds = [primaryUserId, ...secondaryUserIds];
        const usersData = await tx
          .select()
          .from(users)
          .where(inArray(users.id, allUserIds));

        const primaryUser = usersData.find(u => u.id === primaryUserId);
        if (!primaryUser) {
          throw new Error('Primary user not found');
        }

        // Apply field resolutions to primary user
        const updatedFields = await this.applyFieldResolutions(tx, primaryUser, usersData, fieldResolutions);

        // Transfer related records
        const transferredRecords = await this.transferRelatedRecords(tx, primaryUserId, secondaryUserIds);

        // Preserve history if requested
        let preservedData;
        if (preserveHistory) {
          preservedData = await this.preserveMergeHistory(tx, primaryUserId, secondaryUserIds, usersData);
        }

        // Delete or deactivate secondary accounts
        if (deleteSecondaryAccounts) {
          await tx
            .delete(users)
            .where(inArray(users.id, secondaryUserIds));
        } else {
          // Mark as merged (you might want to add a 'status' column for this)
          await tx
            .update(users)
            .set({ 
              email: sql`${users.email} || '_MERGED_' || ${new Date().getTime()}`,
              username: sql`${users.username} || '_MERGED_' || ${new Date().getTime()}`
            })
            .where(inArray(users.id, secondaryUserIds));
        }

        return {
          success: true,
          mergedUserId: primaryUserId,
          transferredRecords,
          preservedData
        };
      });
    } catch (error) {
      console.error('Error executing merge:', error);
      return {
        success: false,
        mergedUserId: mergeRequest.primaryUserId,
        transferredRecords: { teams: 0, players: 0, eventAdministrations: 0, adminRoles: 0 },
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Find email-based duplicates (shouldn't exist due to unique constraint)
   */
  private static async findEmailDuplicates(): Promise<DuplicateCandidate[]> {
    const duplicates = await db
      .select({
        email: users.email,
        userIds: sql<number[]>`array_agg(${users.id})`,
        count: sql<number>`count(*)`
      })
      .from(users)
      .groupBy(users.email)
      .having(sql`count(*) > 1`);

    return duplicates.map(dup => ({
      users: [], // Would need to fetch full user data
      matchReason: 'email' as const,
      confidence: 100,
      suggestedPrimary: dup.userIds[0]
    }));
  }

  /**
   * Find users with same name and phone
   */
  private static async findNamePhoneDuplicates(): Promise<DuplicateCandidate[]> {
    const candidates: DuplicateCandidate[] = [];
    
    const potentialDuplicates = await db
      .select()
      .from(users)
      .where(and(
        ne(users.phone, ''),
        sql`${users.phone} IS NOT NULL`
      ));

    // Group by name + phone combination
    const groups = new Map<string, typeof potentialDuplicates>();
    
    potentialDuplicates.forEach(user => {
      const key = `${user.firstName.toLowerCase()}_${user.lastName.toLowerCase()}_${user.phone}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(user);
    });

    // Find groups with multiple users
    for (const [key, usersInGroup] of groups) {
      if (usersInGroup.length > 1) {
        candidates.push({
          users: usersInGroup,
          matchReason: 'name_phone',
          confidence: 90,
          suggestedPrimary: this.determinePrimaryUser(usersInGroup).id
        });
      }
    }

    return candidates;
  }

  /**
   * Find users with similar names using fuzzy matching
   */
  private static async findSimilarNameDuplicates(): Promise<DuplicateCandidate[]> {
    const candidates: DuplicateCandidate[] = [];
    const allUsers = await db.select().from(users);

    // Simple similarity algorithm - you might want to use a more sophisticated one
    for (let i = 0; i < allUsers.length; i++) {
      for (let j = i + 1; j < allUsers.length; j++) {
        const user1 = allUsers[i];
        const user2 = allUsers[j];
        
        const similarity = this.calculateNameSimilarity(user1, user2);
        if (similarity > 0.8) { // 80% similarity threshold
          candidates.push({
            users: [user1, user2],
            matchReason: 'similar_name',
            confidence: Math.round(similarity * 100),
            suggestedPrimary: this.determinePrimaryUser([user1, user2]).id
          });
        }
      }
    }

    return candidates;
  }

  /**
   * Find users in same household with similar names
   */
  private static async findHouseholdDuplicates(): Promise<DuplicateCandidate[]> {
    const candidates: DuplicateCandidate[] = [];
    
    // Get users grouped by household
    const householdGroups = await db
      .select()
      .from(users)
      .where(sql`${users.householdId} IS NOT NULL`)
      .orderBy(users.householdId);

    const households = new Map<number, typeof householdGroups>();
    householdGroups.forEach(user => {
      if (!households.has(user.householdId!)) {
        households.set(user.householdId!, []);
      }
      households.get(user.householdId!)!.push(user);
    });

    // Check for potential duplicates within households
    for (const [householdId, householdUsers] of households) {
      if (householdUsers.length > 1) {
        // Check for similar names within household
        for (let i = 0; i < householdUsers.length; i++) {
          for (let j = i + 1; j < householdUsers.length; j++) {
            const similarity = this.calculateNameSimilarity(householdUsers[i], householdUsers[j]);
            if (similarity > 0.7) { // Lower threshold for household members
              candidates.push({
                users: [householdUsers[i], householdUsers[j]],
                matchReason: 'same_household',
                confidence: Math.round(similarity * 80), // Max 80% for household matches
                suggestedPrimary: this.determinePrimaryUser([householdUsers[i], householdUsers[j]]).id
              });
            }
          }
        }
      }
    }

    return candidates;
  }

  /**
   * Calculate name similarity between two users
   */
  private static calculateNameSimilarity(user1: any, user2: any): number {
    const name1 = `${user1.firstName} ${user1.lastName}`.toLowerCase();
    const name2 = `${user2.firstName} ${user2.lastName}`.toLowerCase();
    
    // Simple Levenshtein distance ratio
    const distance = this.levenshteinDistance(name1, name2);
    const maxLength = Math.max(name1.length, name2.length);
    return 1 - (distance / maxLength);
  }

  /**
   * Levenshtein distance algorithm
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Determine which user should be the primary account
   */
  private static determinePrimaryUser(users: any[]): any {
    // Priority: Most recent login > Most complete profile > Oldest account > Admin status
    return users.reduce((primary, current) => {
      // Admin accounts take priority
      if (current.isAdmin && !primary.isAdmin) return current;
      if (primary.isAdmin && !current.isAdmin) return primary;

      // Most recent login
      if (current.lastLogin && (!primary.lastLogin || current.lastLogin > primary.lastLogin)) {
        return current;
      }

      // Most complete profile (has phone number)
      if (current.phone && !primary.phone) return current;
      if (primary.phone && !current.phone) return primary;

      // Oldest account (most established)
      if (new Date(current.createdAt) < new Date(primary.createdAt)) return current;

      return primary;
    });
  }

  /**
   * Identify conflicts between user records
   */
  private static async identifyMergeConflicts(users: any[]): Promise<MergeConflict[]> {
    const conflicts: MergeConflict[] = [];
    const fields = ['email', 'username', 'firstName', 'lastName', 'phone', 'isAdmin', 'isParent'];

    for (const field of fields) {
      const values = users.map(u => ({ userId: u.id, value: u[field] }));
      const uniqueValues = [...new Set(values.map(v => v.value))];

      if (uniqueValues.length > 1) {
        // Determine recommendation
        let recommendation: MergeConflict['recommendation'] = 'manual_review';
        let reason = 'Multiple different values require manual review';

        if (field === 'email' || field === 'username') {
          recommendation = 'keep_most_active';
          reason = 'Keep value from most recently active account';
        } else if (field === 'phone') {
          recommendation = 'keep_most_complete';
          reason = 'Keep the most complete phone number';
        }

        conflicts.push({
          field,
          userValues: values,
          recommendation,
          reason
        });
      }
    }

    return conflicts;
  }

  /**
   * Get counts of related data for users
   */
  private static async getRelatedDataCounts(userIds: number[]) {
    const [teamCounts, playerCounts, eventAdminCounts, adminRoleCounts] = await Promise.all([
      // Teams where user is manager/submitter
      db.select({ count: sql<number>`count(*)` }).from(teams)
        .where(sql`submitter_email IN (SELECT email FROM users WHERE id = ANY(${userIds}))`),
      
      // Players associated with users (assuming there's a userId field in players)
      db.select({ count: sql<number>`count(*)` }).from(players)
        .where(sql`user_id = ANY(${userIds})`),
      
      // Event administration roles
      db.select({ count: sql<number>`count(*)` }).from(eventAdministrators)
        .where(inArray(eventAdministrators.userId, userIds)),
      
      // Admin roles
      db.select({ count: sql<number>`count(*)` }).from(adminRoles)
        .where(inArray(adminRoles.userId, userIds))
    ]);

    return {
      teams: teamCounts[0]?.count || 0,
      players: playerCounts[0]?.count || 0,
      eventAdministrations: eventAdminCounts[0]?.count || 0,
      adminRoles: adminRoleCounts[0]?.count || 0,
      households: 0 // You might want to add household ownership logic
    };
  }

  /**
   * Generate merge recommendations
   */
  private static generateMergeRecommendations(primary: any, secondary: any[], conflicts: MergeConflict[], relatedData: any): string[] {
    const recommendations = [];

    if (primary.isAdmin) {
      recommendations.push('Primary account has admin privileges - ensure permissions are preserved');
    }

    if (relatedData.teams > 0) {
      recommendations.push(`${relatedData.teams} team registrations will be transferred to primary account`);
    }

    if (relatedData.eventAdministrations > 0) {
      recommendations.push(`${relatedData.eventAdministrations} event administration roles will be consolidated`);
    }

    if (conflicts.length > 0) {
      recommendations.push(`${conflicts.length} field conflicts require resolution before merge`);
    }

    if (secondary.length > 1) {
      recommendations.push('Multiple accounts being merged - review carefully for data integrity');
    }

    return recommendations;
  }

  /**
   * Apply field resolutions during merge
   */
  private static async applyFieldResolutions(tx: any, primaryUser: any, allUsers: any[], resolutions: any) {
    const updateFields: any = {};

    for (const [field, resolution] of Object.entries(resolutions)) {
      switch (resolution.action) {
        case 'keep_primary':
          // No action needed - primary value already exists
          break;
        case 'keep_secondary':
          if (resolution.sourceUserId) {
            const sourceUser = allUsers.find(u => u.id === resolution.sourceUserId);
            if (sourceUser) {
              updateFields[field] = sourceUser[field];
            }
          }
          break;
        case 'use_value':
          updateFields[field] = resolution.value;
          break;
      }
    }

    if (Object.keys(updateFields).length > 0) {
      await tx
        .update(users)
        .set(updateFields)
        .where(eq(users.id, primaryUser.id));
    }

    return updateFields;
  }

  /**
   * Transfer related records to primary user
   */
  private static async transferRelatedRecords(tx: any, primaryUserId: number, secondaryUserIds: number[]) {
    const transferred = {
      teams: 0,
      players: 0,
      eventAdministrations: 0,
      adminRoles: 0
    };

    // Get primary user email for team transfers
    const primaryUser = await tx.select().from(users).where(eq(users.id, primaryUserId)).limit(1);
    if (!primaryUser.length) throw new Error('Primary user not found');

    // Transfer teams (update submitter_email)
    const teamTransfer = await tx
      .update(teams)
      .set({ submitterEmail: primaryUser[0].email })
      .where(sql`submitter_email IN (SELECT email FROM users WHERE id = ANY(${secondaryUserIds}))`)
      .returning({ count: sql<number>`1` });
    transferred.teams = teamTransfer.length;

    // Transfer player associations (if user_id exists in players table)
    try {
      const playerTransfer = await tx
        .update(players)
        .set({ userId: primaryUserId })
        .where(inArray(players.userId, secondaryUserIds))
        .returning({ count: sql<number>`1` });
      transferred.players = playerTransfer.length;
    } catch (error) {
      // Field might not exist
    }

    // Transfer event administrations
    const eventAdminTransfer = await tx
      .update(eventAdministrators)
      .set({ userId: primaryUserId })
      .where(inArray(eventAdministrators.userId, secondaryUserIds))
      .returning({ count: sql<number>`1` });
    transferred.eventAdministrations = eventAdminTransfer.length;

    // Transfer admin roles (remove duplicates)
    const existingRoles = await tx
      .select({ roleId: adminRoles.roleId })
      .from(adminRoles)
      .where(eq(adminRoles.userId, primaryUserId));
    
    const existingRoleIds = existingRoles.map(r => r.roleId);

    if (existingRoleIds.length > 0) {
      // Transfer non-duplicate roles
      const roleTransfer = await tx
        .update(adminRoles)
        .set({ userId: primaryUserId })
        .where(and(
          inArray(adminRoles.userId, secondaryUserIds),
          sql`${adminRoles.roleId} NOT IN (${existingRoleIds.join(',')})`
        ))
        .returning({ count: sql<number>`1` });
      transferred.adminRoles = roleTransfer.length;

      // Delete duplicate roles
      await tx
        .delete(adminRoles)
        .where(and(
          inArray(adminRoles.userId, secondaryUserIds),
          inArray(adminRoles.roleId, existingRoleIds)
        ));
    } else {
      // Transfer all roles
      const roleTransfer = await tx
        .update(adminRoles)
        .set({ userId: primaryUserId })
        .where(inArray(adminRoles.userId, secondaryUserIds))
        .returning({ count: sql<number>`1` });
      transferred.adminRoles = roleTransfer.length;
    }

    return transferred;
  }

  /**
   * Preserve merge history
   */
  private static async preserveMergeHistory(tx: any, primaryUserId: number, secondaryUserIds: number[], allUsers: any[]) {
    // Create a merge history record (you might want to create a dedicated table for this)
    const mergeHistory = {
      mergedAt: new Date().toISOString(),
      primaryUserId,
      secondaryUserIds,
      originalData: allUsers.filter(u => secondaryUserIds.includes(u.id))
    };

    // Store in user metadata or create a dedicated merge_history table
    return mergeHistory;
  }

  /**
   * Remove duplicate candidates
   */
  private static deduplicateCandidates(candidates: DuplicateCandidate[]): DuplicateCandidate[] {
    const seen = new Set<string>();
    return candidates.filter(candidate => {
      const key = candidate.users.map(u => u.id).sort().join('-');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}