import { useState } from 'react';
import {
  GitBranch,
  GitCommit,
  RefreshCw,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  FEDERATION_RULES,
  MEMBER_MARKETPLACES,
  VALIDATION_SNAPSHOT,
} from '../data/ecosystem';
import type { PmcroRepoSnapshot } from '../data/pmcroOrgSnapshot';
import {
  evaluateRepoHealth,
  evaluateSingleRepoHealth,
  type RepoSyncHealth,
} from '../utils/repoHealth';

const HEALTH_BADGE_STYLES: Record<
  RepoSyncHealth,
  { container: string; icon: typeof CheckCircle2 }
> = {
  Synced: {
    container: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
  },
  Stale: {
    container: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Clock,
  },
  Error: {
    container: 'bg-red-50 text-red-800 border-red-200',
    icon: AlertCircle,
  },
};

function RepoHealthBadge({
  status,
  testId,
}: {
  status: RepoSyncHealth;
  testId?: string;
}) {
  const style = HEALTH_BADGE_STYLES[status];
  const Icon = style.icon;
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-medium rounded border whitespace-nowrap shrink-0 ${style.container}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}

interface AtlasViewProps {
  repos: PmcroRepoSnapshot[];
  repoSource: 'snapshot' | 'live';
  repoUpdatedAt: string;
  repoError?: string | null;
  repoRateLimited?: boolean;
  repoStatusCode?: number | null;
  isRefreshingRepos: boolean;
  onRefreshRepos: () => void;
  onBrowseMarketplace: (marketplaceId: 'creators' | 'pmcr-o' | 'agent-skills' | 'csuite-candidate') => void;
}

export function AtlasView({
  repos,
  repoSource,
  repoUpdatedAt,
  repoError,
  repoRateLimited,
  repoStatusCode,
  isRefreshingRepos,
  onRefreshRepos,
  onBrowseMarketplace,
}: AtlasViewProps) {
  const [repoQuery, setRepoQuery] = useState('');
  const [selectedRepoName, setSelectedRepoName] = useState<string>(repos[0]?.name ?? 'pmcro-agent');

  const healthAssessment = evaluateRepoHealth({
    source: repoSource,
    updatedAt: repoUpdatedAt,
    reposCount: repos.length,
    error: repoError,
    rateLimited: repoRateLimited,
    statusCode: repoStatusCode,
  });

  const filteredRepos = repos.filter((repo) => {
    const q = repoQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      repo.name.toLowerCase().includes(q) ||
      repo.description.toLowerCase().includes(q) ||
      repo.branches.some((b) => b.toLowerCase().includes(q))
    );
  });

  const activeRepo =
    repos.find((r) => r.name === selectedRepoName) ?? filteredRepos[0] ?? repos[0];
  const activeRepoStatus = activeRepo
    ? evaluateSingleRepoHealth(activeRepo, healthAssessment.status)
    : healthAssessment.status;

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 text-balance">
            Consolidated <span className="whitespace-nowrap">PMCR-O</span> Ecosystem Atlas
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Four federated member marketplaces governed under least-authority boundaries. This control plane browses, composes, and rehearses—it does not install, activate, or grant execution.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-6 shrink-0 text-right">
          <div>
            <div className="text-xs text-slate-500">Marketplaces</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-slate-900">4</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Packages</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-slate-900">
              {VALIDATION_SNAPSHOT.packagesCount}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Skills</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-slate-900">
              {VALIDATION_SNAPSHOT.skillsCount}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="member-marketplaces-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="member-marketplaces-heading" className="text-base font-semibold text-slate-900">
            01. Four Member Marketplaces
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            schema: {VALIDATION_SNAPSHOT.schemaVersion}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MEMBER_MARKETPLACES.map((mp) => (
            <div
              key={mp.id}
              className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-base font-semibold text-slate-900">{mp.name}</h3>
                  <span
                    className={`text-xs font-mono font-medium ${
                      mp.validationStatus === 'PASS' ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {mp.validationStatus}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono">
                  <span>{mp.id}</span>
                  <span aria-hidden="true">·</span>
                  <span>{mp.schema}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{mp.packageCount} pkg</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{mp.skillCount} skills</span>
                </div>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{mp.summary}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <a
                  href={mp.sourceRepo}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
                >
                  <span>Upstream repo</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={() => onBrowseMarketplace(mp.id)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-900 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  Browse {mp.packageCount} packages
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-slate-900">02. Validation Snapshot</h2>
          <p className="mt-1 text-xs text-slate-500">
            Audited from {VALIDATION_SNAPSHOT.generatedFrom} across {VALIDATION_SNAPSHOT.reposAudited} repositories.
          </p>
          <dl className="mt-4 divide-y divide-slate-100 text-sm">
            <div className="py-2.5 flex items-baseline justify-between gap-4">
              <dt className="text-slate-500 shrink-0">Maker Self-Approval</dt>
              <dd className="font-mono text-xs text-slate-900 text-right">
                {String(VALIDATION_SNAPSHOT.makerMaySelfApprove)}
              </dd>
            </div>
            <div className="py-2.5 flex items-baseline justify-between gap-4">
              <dt className="text-slate-500 shrink-0">Default Grant Policy</dt>
              <dd className="font-mono text-xs text-slate-900 text-right">{VALIDATION_SNAPSHOT.grantDefault}</dd>
            </div>
            <div className="py-2.5 flex items-baseline justify-between gap-4">
              <dt className="text-slate-500 shrink-0">Credentials Policy</dt>
              <dd className="font-mono text-xs text-slate-900 text-right">{VALIDATION_SNAPSHOT.credentialsPolicy}</dd>
            </div>
            <div className="py-2.5 flex items-baseline justify-between gap-4">
              <dt className="text-slate-500 shrink-0">Identity Renaming</dt>
              <dd className="font-mono text-xs text-slate-900 text-right">
                {VALIDATION_SNAPSHOT.identityRenamingAllowed ? 'allowed' : 'prohibited'}
              </dd>
            </div>
            <div className="py-2.5 flex items-baseline justify-between gap-4">
              <dt className="text-slate-500 shrink-0">Last Verified Commit</dt>
              <dd className="font-mono text-xs text-slate-900 tabular-nums text-right">
                {VALIDATION_SNAPSHOT.lastVerifiedCommit}
              </dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-slate-900">03. Federation Rules</h2>
          <p className="mt-1 text-xs text-slate-500">
            Non-negotiable invariants enforced across Catalog, C-suite, Cycle, Studio, and Enterprise.
          </p>
          <div className="mt-4 divide-y divide-slate-100">
            {FEDERATION_RULES.map((rule) => (
              <div key={rule.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-slate-900">{rule.title}</span>
                  <span className="text-xs font-mono text-slate-500">{rule.contractKey}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">{rule.enforcement}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-lg p-5" aria-labelledby="pmcro-org-heading">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="pmcro-org-heading" className="text-base font-semibold text-slate-900">
                04. pmcr-o Organization Repositories, Branches & Commits ({repos.length})
              </h2>
              <RepoHealthBadge status={healthAssessment.status} testId="repo-health-badge" />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {healthAssessment.detail} · Updated{' '}
              <span className="font-mono tabular-nums">{repoUpdatedAt.slice(0, 19).replace('T', ' ')}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="search"
                aria-label="Filter pmcr-o repositories or branches"
                value={repoQuery}
                onChange={(e) => setRepoQuery(e.target.value)}
                placeholder="Filter repos or branches..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700"
              />
            </div>
            <button
              type="button"
              onClick={onRefreshRepos}
              disabled={isRefreshingRepos}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingRepos ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{isRefreshingRepos ? 'Syncing...' : 'Sync GitHub'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
          <div className="lg:col-span-7 max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-md">
            {filteredRepos.map((repo) => {
              const isSelected = activeRepo?.name === repo.name;
              const repoStatus = evaluateSingleRepoHealth(repo, healthAssessment.status);
              return (
                <button
                  key={repo.name}
                  type="button"
                  onClick={() => setSelectedRepoName(repo.name)}
                  className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between gap-4 ${
                    isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-slate-900 font-mono truncate">
                        {repo.fullName}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">{repo.description}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <RepoHealthBadge status={repoStatus} />
                    <div className="text-right text-xs font-mono text-slate-500 tabular-nums">
                      <div>{repo.branches.length} branches</div>
                      <div className="text-slate-400">{repo.recentCommits[0]?.sha ?? '—'}</div>
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredRepos.length === 0 && (
              <div className="p-6 text-xs text-slate-500 text-center">
                No pmcr-o repositories matched "{repoQuery}".
              </div>
            )}
          </div>

          <div className="lg:col-span-5 border border-slate-200 rounded-md p-4 bg-slate-50/50">
            {activeRepo ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold font-mono text-slate-900">
                        {activeRepo.fullName}
                      </div>
                      <RepoHealthBadge status={activeRepoStatus} testId="active-repo-health-badge" />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {activeRepo.role} · default {activeRepo.defaultBranch}
                      {activeRepo.language ? ` · ${activeRepo.language}` : ''}
                    </div>
                  </div>
                  <a
                    href={activeRepo.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${activeRepo.fullName} on GitHub`}
                    className="text-xs text-blue-700 hover:underline inline-flex items-center gap-1 shrink-0"
                  >
                    <span>GitHub</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{activeRepo.description}</p>

                <div>
                  <div className="text-xs font-medium text-slate-700 flex items-center gap-1.5 mb-2">
                    <GitBranch className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                    <span>Branches ({activeRepo.branches.length})</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1 text-xs font-mono text-slate-700 bg-white border border-slate-200 rounded p-2.5">
                    {activeRepo.branches.map((branch) => (
                      <div key={branch} className="truncate">
                        {branch}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-slate-700 flex items-center gap-1.5 mb-2">
                    <GitCommit className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                    <span>Recent Commits</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {activeRepo.recentCommits.map((commit) => (
                      <div key={commit.sha} className="bg-white border border-slate-200 rounded p-2.5">
                        <span className="font-mono text-blue-700 mr-2">{commit.sha}</span>
                        <span className="text-slate-700">{commit.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500">Select a repository to inspect branches and commits.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
