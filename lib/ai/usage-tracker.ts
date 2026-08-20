import { createServerClient } from '@/lib/supabase/server';

export const FREE_TIER_MAX_PATTERNS = 3;

export interface TokenUsageRecord {
  userId: string;
  action: 'parse_pattern' | 'translate_pattern';
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  modelUsed: string;
}

export interface QuotaCheckResult {
  canUpload: boolean;
  currentCount: number;
  maxAllowed: number | null; // null for unlimited
  isUnlimited: boolean;
}

/**
 * Checks whether the user can upload a new pattern according to their active tier.
 * Free tier limit: 3 pattern uploads in total.
 */
export async function checkUserUploadQuota(userId: string): Promise<QuotaCheckResult> {
  const supabase = await createServerClient();

  console.log(`[Usage Tracker] 🔍 Checking upload quota for user ${userId}...`);

  try {
    // 1. Check lifetime parse attempts from ai_usage to prevent delete & re-upload abuse
    const { count: usageCount, error: usageError } = await (supabase.from('ai_usage') as any)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'parse_pattern');

    // 2. Also check current active tutorials in library
    const { count: tutorialCount, error: tutorialError } = await (supabase.from('tutorials') as any)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (usageError && tutorialError) {
      console.error(`[Usage Tracker] ❌ Error querying quota for user ${userId}:`, usageError || tutorialError);
      throw usageError || tutorialError;
    }

    // Lifetime attempts cannot be reset by deleting a project
    const lifetimeCount = Math.max(usageCount || 0, tutorialCount || 0);
    
    // In local development, enable unlimited uploads unless SIMULATE_FREE_TIER is explicitly enabled
    const isDev = process.env.NODE_ENV === 'development';
    const isUnlimited = isDev && process.env.SIMULATE_FREE_TIER !== 'true';
    const maxAllowed = isUnlimited ? null : FREE_TIER_MAX_PATTERNS;
    const canUpload = isUnlimited || lifetimeCount < FREE_TIER_MAX_PATTERNS;

    console.log(
      `[Usage Tracker] 📊 User ${userId} has ${lifetimeCount}/${maxAllowed ?? '∞ (dev)'} lifetime pattern parses | Allowed: ${canUpload}`
    );

    return {
      canUpload,
      currentCount: lifetimeCount,
      maxAllowed,
      isUnlimited,
    };
  } catch (error) {
    console.error(`[Usage Tracker] ❌ Failed to check quota for user ${userId}:`, error);
    // Allow upload if quota check fails unexpectedly to prevent blocking user, but log error
    return {
      canUpload: true,
      currentCount: 0,
      maxAllowed: FREE_TIER_MAX_PATTERNS,
      isUnlimited: false,
    };
  }
}

/**
 * Asynchronously records token consumption into the `ai_usage` table.
 */
export async function recordAiTokenUsage(record: TokenUsageRecord): Promise<void> {
  const supabase = await createServerClient();

  console.log(
    `[Usage Tracker] 💾 Logging AI usage for user ${record.userId}: action=${record.action}, tokens=${record.totalTokens}, model=${record.modelUsed}`
  );

  try {
    const { error } = await (supabase.from('ai_usage') as any).insert({
      user_id: record.userId,
      action: record.action,
      input_tokens: record.inputTokens,
      output_tokens: record.outputTokens,
      total_tokens: record.totalTokens,
      model_used: record.modelUsed,
    });

    if (error) {
      console.warn(`[Usage Tracker] ⚠️ Failed to insert into ai_usage table:`, error.message);
    } else {
      console.log(`[Usage Tracker] ✅ Token usage record saved successfully.`);
    }
  } catch (err) {
    console.warn(`[Usage Tracker] ⚠️ Non-blocking exception logging AI usage:`, err);
  }
}
