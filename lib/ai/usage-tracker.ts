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
    const { count, error } = await (supabase.from('tutorials') as any)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error(`[Usage Tracker] ❌ Error querying tutorial count for user ${userId}:`, error);
      throw error;
    }

    const currentCount = count || 0;
    
    // Future: check user subscription tier from profiles / stripe table
    // For now, default users are Free tier unless specified
    const isUnlimited = false;
    const maxAllowed = isUnlimited ? null : FREE_TIER_MAX_PATTERNS;
    const canUpload = isUnlimited || currentCount < FREE_TIER_MAX_PATTERNS;

    console.log(
      `[Usage Tracker] 📊 User ${userId} has ${currentCount}/${maxAllowed ?? '∞'} patterns | Allowed: ${canUpload}`
    );

    return {
      canUpload,
      currentCount,
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
