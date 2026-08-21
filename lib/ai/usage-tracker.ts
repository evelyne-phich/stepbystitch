import { createServerClient } from '@/lib/supabase/server';

export const DEFAULT_FREE_TIER_MAX_PATTERNS = 3;
export const DEFAULT_MONTHLY_SAFETY_CAP_PATTERNS = 500;

let cachedSettings: {
  monthlySafetyCap?: number;
  freeTierMax?: number;
  lastFetch: number;
} = { lastFetch: 0 };

/**
 * Fetches dynamic system settings from Supabase app_settings table with a 60s in-memory cache.
 * Enables changing the monthly cap or free quota directly from Supabase Table Editor without code redeployment.
 */
export async function getDynamicSystemSettings(): Promise<{
  monthlySafetyCap: number;
  freeTierMax: number;
}> {
  const now = Date.now();
  if (
    cachedSettings.monthlySafetyCap !== undefined &&
    cachedSettings.freeTierMax !== undefined &&
    now - cachedSettings.lastFetch < 60_000
  ) {
    return {
      monthlySafetyCap: cachedSettings.monthlySafetyCap,
      freeTierMax: cachedSettings.freeTierMax,
    };
  }

  let monthlySafetyCap = DEFAULT_MONTHLY_SAFETY_CAP_PATTERNS;
  let freeTierMax = DEFAULT_FREE_TIER_MAX_PATTERNS;

  try {
    const supabase = await createServerClient();
    const { data, error } = await (supabase.from('app_settings') as any)
      .select('key, value');

    if (!error && Array.isArray(data)) {
      for (const item of data) {
        if (item.key === 'monthly_safety_cap' && item.value != null) {
          const val = Number(item.value);
          if (!isNaN(val) && val > 0) monthlySafetyCap = val;
        } else if (item.key === 'free_tier_max_patterns' && item.value != null) {
          const val = Number(item.value);
          if (!isNaN(val) && val > 0) freeTierMax = val;
        }
      }
      cachedSettings = {
        monthlySafetyCap,
        freeTierMax,
        lastFetch: now,
      };
    }
  } catch (err) {
    console.warn('[Usage Tracker] Failed to query dynamic app_settings from Supabase, using fallback.');
  }

  return { monthlySafetyCap, freeTierMax };
}

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
  reason?: 'FREE_QUOTA_REACHED' | 'ABNORMAL_ACTIVITY';
}

/**
 * Checks whether the user can upload a new pattern according to their active tier and dynamic Supabase settings.
 * Free tier limit: dynamically fetched from Supabase (default: 3).
 * Safety Fair Use limit: dynamically fetched from Supabase (default: 500 per 30-day period).
 */
export async function checkUserUploadQuota(userId: string): Promise<QuotaCheckResult> {
  const supabase = await createServerClient();

  console.log(`[Usage Tracker] 🔍 Checking upload quota for user ${userId}...`);

  try {
    const dynamicSettings = await getDynamicSystemSettings();

    // Check optional per-user overrides in profile
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('monthly_cap_override, free_quota_override')
      .eq('id', userId)
      .single();

    const effectiveMonthlySafetyCap = profile?.monthly_cap_override ?? dynamicSettings.monthlySafetyCap;
    const effectiveFreeTierMax = profile?.free_quota_override ?? dynamicSettings.freeTierMax;

    // 1. Check monthly safety cap to prevent bot scraping / cost abuse
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: monthlyCount, error: monthlyError } = await (supabase.from('ai_usage') as any)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'parse_pattern')
      .gte('created_at', thirtyDaysAgo);

    if (monthlyCount && monthlyCount >= effectiveMonthlySafetyCap) {
      console.warn(
        `[Usage Tracker] 🛑 Monthly safety cap exceeded for user ${userId}: ${monthlyCount}/${effectiveMonthlySafetyCap} imports in last 30 days.`
      );
      return {
        canUpload: false,
        currentCount: monthlyCount,
        maxAllowed: effectiveMonthlySafetyCap,
        isUnlimited: false,
        reason: 'ABNORMAL_ACTIVITY',
      };
    }

    // 2. Check lifetime parse attempts from ai_usage to prevent delete & re-upload abuse on free tier
    const { count: usageCount, error: usageError } = await (supabase.from('ai_usage') as any)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'parse_pattern');

    // 3. Also check current active tutorials in library
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
    const maxAllowed = isUnlimited ? null : effectiveFreeTierMax;
    const canUpload = isUnlimited || lifetimeCount < effectiveFreeTierMax;

    console.log(
      `[Usage Tracker] 📊 User ${userId} has ${lifetimeCount}/${maxAllowed ?? '∞ (dev)'} lifetime pattern parses (Monthly: ${monthlyCount || 0}/${effectiveMonthlySafetyCap}) | Allowed: ${canUpload}`
    );

    return {
      canUpload,
      currentCount: lifetimeCount,
      maxAllowed,
      isUnlimited,
      reason: canUpload ? undefined : 'FREE_QUOTA_REACHED',
    };
  } catch (error) {
    console.error(`[Usage Tracker] ❌ Failed to check quota for user ${userId}:`, error);
    // Allow upload if quota check fails unexpectedly to prevent blocking user, but log error
    return {
      canUpload: true,
      currentCount: 0,
      maxAllowed: DEFAULT_FREE_TIER_MAX_PATTERNS,
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
