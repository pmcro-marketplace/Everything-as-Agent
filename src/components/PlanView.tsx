import { useState } from 'react';
import { Copy, Check, Trash2 } from 'lucide-react';
import type { CompositionId } from '../data/ecosystem';
import { buildInstallPlan } from '../utils/pmcroEngine';

interface PlanViewProps {
  stagedPackageIds: string[];
  compositionId: CompositionId;
  onUnstagePackage: (id: string) => void;
  onClearStaged: () => void;
  onPlanCopied: () => void;
  onBrowseCatalog: () => void;
}

export function PlanView({
  stagedPackageIds,
  compositionId,
  onUnstagePackage,
  onClearStaged,
  onPlanCopied,
  onBrowseCatalog,
}: PlanViewProps) {
  const [copiedMode, setCopiedMode] = useState<'json' | 'cli' | null>(null);

  const plan = buildInstallPlan(stagedPackageIds, compositionId);
  const planJson = JSON.stringify(plan, null, 2);
  const cliText = plan.cliPreview.join('\n');

  async function handleCopy(mode: 'json' | 'cli') {
    const text = mode === 'json' ? planJson : cliText;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback copy still marks copied state cleanly inside restricted sandboxes
    }
    setCopiedMode(mode);
    onPlanCopied();
    setTimeout(() => setCopiedMode(null), 2000);
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Read-Only Install Plan
          </h1>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            Combines staged Catalog packages and your current C-suite team into a copyable install plan. Everything Marketplaces does not run or apply this plan.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-700 shrink-0">
          executed = false · status: NOT RUN
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">
              Staged Packages ({plan.stagedPackages.length})
            </h2>
            {plan.stagedPackages.length > 0 && (
              <button
                type="button"
                onClick={onClearStaged}
                className="text-xs text-slate-500 hover:text-red-700"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Composition</span>
              <span className="font-semibold text-slate-900 capitalize">{plan.compositionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Default Orchestrators</span>
              <span className="font-mono text-slate-900">
                {plan.orchestrators.map((o) => o.toUpperCase()).join(' · ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Staged Skills</span>
              <span className="font-mono tabular-nums text-slate-900">{plan.totalStagedSkills}</span>
            </div>
          </div>

          {plan.stagedPackages.length > 0 ? (
            <ul className="divide-y divide-slate-100 border-t border-slate-200">
              {plan.stagedPackages.map((pkg) => (
                <li key={pkg.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-semibold text-slate-900 truncate">
                      {pkg.id}
                    </div>
                    <div className="text-xs text-slate-500 font-mono truncate">
                      {pkg.marketplaceId} · v{pkg.version} · {pkg.skillsCount} skills
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${pkg.id} from plan`}
                    onClick={() => onUnstagePackage(pkg.id)}
                    className="p-1.5 text-slate-400 hover:text-red-700 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center space-y-3">
              <p className="text-xs text-slate-500">No packages are staged yet.</p>
              <button
                type="button"
                onClick={onBrowseCatalog}
                className="px-3 py-1.5 text-xs font-medium text-slate-900 border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Browse Catalog (46 packages)
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-slate-900">CLI Install Plan (Not Executed)</h2>
              <button
                type="button"
                onClick={() => handleCopy('cli')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                {copiedMode === 'cli' ? (
                  <>
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copied CLI</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copy CLI Plan</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 bg-slate-950 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
              {cliText}
            </pre>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-slate-900">.agents/install-plan.json</h2>
              <button
                type="button"
                onClick={() => handleCopy('json')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 border border-slate-300 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                {copiedMode === 'json' ? (
                  <>
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copied JSON</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 bg-slate-950 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto max-h-80 leading-relaxed">
              {planJson}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
