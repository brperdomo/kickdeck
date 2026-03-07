/**
 * Per-tenant OpenAI client factory.
 *
 * Resolution order:
 *   1. Organization's encrypted key from database → decrypt → create client
 *   2. process.env.OPENAI_API_KEY (platform-level fallback)
 *   3. null (AI features disabled)
 *
 * Clients are cached in memory for 5 minutes to avoid repeated DB lookups
 * and decryption on every request.
 */
import OpenAI from 'openai';
import { db } from '../../db';
import { organizationSettings } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { decrypt, maskApiKey } from './encryption';

interface CachedClient {
  client: OpenAI;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const clientCache = new Map<string, CachedClient>();

// Fallback client from env var (created once)
let envClient: OpenAI | null | undefined; // undefined = not yet initialized

function getEnvClient(): OpenAI | null {
  if (envClient === undefined) {
    envClient = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
  }
  return envClient;
}

/**
 * Get an OpenAI client for the given organization.
 *
 * @param orgId - Organization settings ID. If omitted, uses env var fallback only.
 * @returns An OpenAI client, or null if no key is configured anywhere.
 */
export async function getOpenAIClient(orgId?: number): Promise<OpenAI | null> {
  // If no orgId provided, use env var directly
  if (!orgId) {
    return getEnvClient();
  }

  const cacheKey = `org-${orgId}`;

  // Check cache first
  const cached = clientCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.client;
  }

  // Look up org's encrypted key from database
  try {
    const [org] = await db
      .select({ openaiApiKey: organizationSettings.openaiApiKey })
      .from(organizationSettings)
      .where(eq(organizationSettings.id, orgId))
      .limit(1);

    if (org?.openaiApiKey) {
      const apiKey = decrypt(org.openaiApiKey);
      const client = new OpenAI({ apiKey });

      // Cache the client
      clientCache.set(cacheKey, {
        client,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      return client;
    }
  } catch (error) {
    console.error(`[OpenAI Factory] Failed to load key for org ${orgId}:`, error);
  }

  // Fall back to env var
  return getEnvClient();
}

/**
 * Check whether AI is configured for an organization.
 * Returns status info without exposing the actual key.
 */
export async function getAIStatus(orgId?: number): Promise<{
  configured: boolean;
  source: 'organization' | 'platform' | 'none';
  preview: string | null;
}> {
  // Check org key first
  if (orgId) {
    try {
      const [org] = await db
        .select({ openaiApiKey: organizationSettings.openaiApiKey })
        .from(organizationSettings)
        .where(eq(organizationSettings.id, orgId))
        .limit(1);

      if (org?.openaiApiKey) {
        const apiKey = decrypt(org.openaiApiKey);
        return {
          configured: true,
          source: 'organization',
          preview: maskApiKey(apiKey),
        };
      }
    } catch (error) {
      console.error(`[OpenAI Factory] Failed to check AI status for org ${orgId}:`, error);
    }
  }

  // Check env var fallback
  if (process.env.OPENAI_API_KEY) {
    return {
      configured: true,
      source: 'platform',
      preview: maskApiKey(process.env.OPENAI_API_KEY),
    };
  }

  return { configured: false, source: 'none', preview: null };
}

/**
 * Clear the cached client for an organization.
 * Call this after saving or removing an API key.
 */
export function clearClientCache(orgId: number): void {
  clientCache.delete(`org-${orgId}`);
}
