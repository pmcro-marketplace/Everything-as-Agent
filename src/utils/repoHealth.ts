import type { PmcroRepoSnapshot } from '../data/pmcroOrgSnapshot';

export type RepoSyncHealth = 'Synced' | 'Stale' | 'Error';

export interface RepoHealthInput {
  source: 'snapshot' | 'live';
  updatedAt: string;
  reposCount: number;
  error?: string | null;
  rateLimited?: boolean;
  statusCode?: number | null;
  nowMs?: number;
  staleAfterMs?: number;
}

export interface RepoHealthAssessment {
  status: RepoSyncHealth;
  detail: string;
  ageMinutes: number | null;
}

export const DEFAULT_STALE_THRESHOLD_MS = 15 * 60 * 1000;

export function evaluateRepoHealth(input: RepoHealthInput): RepoHealthAssessment {
  const nowMs = input.nowMs ?? Date.now();
  const staleAfterMs = input.staleAfterMs ?? DEFAULT_STALE_THRESHOLD_MS;

  const parsedTime = Date.parse(input.updatedAt);
  const ageMinutes = Number.isFinite(parsedTime)
    ? Math.max(0, Math.round((nowMs - parsedTime) / 60000))
    : null;

  if (input.error && input.error.trim().length > 0) {
    return {
      status: 'Error',
      detail: input.error.trim(),
      ageMinutes,
    };
  }

  if (input.rateLimited) {
    return {
      status: 'Error',
      detail: `GitHub API rate limit reached${input.statusCode ? ` (HTTP ${input.statusCode})` : ''}.`,
      ageMinutes,
    };
  }

  if (input.statusCode && input.statusCode >= 400) {
    return {
      status: 'Error',
      detail: `GitHub API returned HTTP ${input.statusCode}.`,
      ageMinutes,
    };
  }

  if (input.reposCount === 0) {
    return {
      status: 'Error',
      detail: 'No repository records returned.',
      ageMinutes,
    };
  }

  if (input.source !== 'live') {
    return {
      status: 'Stale',
      detail: 'Serving audited org snapshot. Sync GitHub for live branch and commit state.',
      ageMinutes,
    };
  }

  if (!Number.isFinite(parsedTime) || nowMs - parsedTime > staleAfterMs) {
    return {
      status: 'Stale',
      detail:
        ageMinutes !== null
          ? `Last live sync was ${ageMinutes}m ago. Refresh to verify latest commits.`
          : 'Last live sync timestamp is unavailable.',
      ageMinutes,
    };
  }

  return {
    status: 'Synced',
    detail: `Live GitHub API verified across ${input.reposCount} repositories.`,
    ageMinutes,
  };
}

export function evaluateSingleRepoHealth(
  repo: PmcroRepoSnapshot,
  orgStatus: RepoSyncHealth
): RepoSyncHealth {
  if (orgStatus === 'Error') return 'Error';
  if (repo.branches.length === 0 || repo.recentCommits.length === 0) return 'Error';
  if (orgStatus === 'Stale') return 'Stale';
  return 'Synced';
}
