import { useMemo, useState } from 'react';
import { Search, Check, Plus } from 'lucide-react';
import {
  CATALOG_PACKAGES,
  MEMBER_MARKETPLACES,
  type CatalogPackage,
  type MemberMarketplaceId,
} from '../data/ecosystem';

interface CatalogViewProps {
  selectedMarketplace: MemberMarketplaceId | 'all';
  onSelectMarketplace: (id: MemberMarketplaceId | 'all') => void;
  stagedPackageIds: string[];
  onToggleStage: (packageId: string) => void;
  onGoToPlan: () => void;
}

export function CatalogView({
  selectedMarketplace,
  onSelectMarketplace,
  stagedPackageIds,
  onToggleStage,
  onGoToPlan,
}: CatalogViewProps) {
  const [query, setQuery] = useState('');
  const [selectedPkgId, setSelectedPkgId] = useState<string>(CATALOG_PACKAGES[0].id);

  const filteredPackages = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG_PACKAGES.filter((pkg) => {
      if (selectedMarketplace !== 'all' && pkg.marketplaceId !== selectedMarketplace) return false;
      if (!q) return true;
      return (
        pkg.name.toLowerCase().includes(q) ||
        pkg.mandate.toLowerCase().includes(q) ||
        pkg.sourceRepo.toLowerCase().includes(q) ||
        pkg.skills.some((s) => s.id.toLowerCase().includes(q)) ||
        pkg.commands.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [selectedMarketplace, query]);

  const activePackage: CatalogPackage | undefined =
    filteredPackages.find((p) => p.id === selectedPkgId) ?? filteredPackages[0];

  const totalSkillsInView = filteredPackages.reduce((acc, p) => acc + p.skills.length, 0);

  return (
    <div className="space-y-6">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Ecosystem Catalog
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            46 packages and 70 skills across four member marketplaces. Open a package to inspect its mandate, commands, and skills, then stage it into your install plan.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-600 shrink-0">
          <span className="font-mono tabular-nums">
            Showing {filteredPackages.length} packages · {totalSkillsInView} skills
          </span>
          <button
            type="button"
            onClick={onGoToPlan}
            className="px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 bg-blue-50/50 rounded-md hover:bg-blue-50 whitespace-nowrap shrink-0"
          >
            Staged ({stagedPackageIds.length})
          </button>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto" role="tablist" aria-label="Filter by member marketplace">
          <button
            type="button"
            role="tab"
            aria-selected={selectedMarketplace === 'all'}
            onClick={() => onSelectMarketplace('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              selectedMarketplace === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All (46)
          </button>
          {MEMBER_MARKETPLACES.map((mp) => (
            <button
              key={mp.id}
              type="button"
              role="tab"
              aria-selected={selectedMarketplace === mp.id}
              onClick={() => onSelectMarketplace(mp.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedMarketplace === mp.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mp.id} ({mp.packageCount})
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            aria-label="Search packages, commands, or skills"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search packages, commands, skills..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
            {filteredPackages.map((pkg) => {
              const isSelected = activePackage?.id === pkg.id;
              const isStaged = stagedPackageIds.includes(pkg.id);
              return (
                <div
                  key={pkg.id}
                  className={`px-4 py-3 flex items-center justify-between gap-4 transition-colors ${
                    isSelected ? 'bg-slate-100/80' : 'hover:bg-slate-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className="flex-1 text-left min-w-0 focus-visible:outline-2 focus-visible:outline-blue-700"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-slate-900 font-mono truncate">
                        {pkg.name}
                      </span>
                      <span className="text-xs text-slate-400 font-mono tabular-nums">
                        v{pkg.version}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 flex items-center gap-2">
                      <span>{pkg.marketplaceId}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{pkg.skills.length} skills</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate font-mono">{pkg.commands.join(' ')}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleStage(pkg.id)}
                    aria-label={isStaged ? `Unstage ${pkg.name}` : `Stage ${pkg.name}`}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
                      isStaged
                        ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                        : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {isStaged ? (
                      <>
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Staged</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Stage</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
            {filteredPackages.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">
                No packages matched your filter. Try clearing the search box.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 sticky top-6">
          {activePackage ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="text-lg font-semibold font-mono text-slate-900">
                    {activePackage.name}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 font-mono">
                    {activePackage.marketplaceId} · {activePackage.sourceRepo} · v{activePackage.version}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleStage(activePackage.id)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    stagedPackageIds.includes(activePackage.id)
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : 'bg-blue-700 text-white hover:bg-blue-800'
                  }`}
                >
                  {stagedPackageIds.includes(activePackage.id) ? 'Unstage Package' : 'Stage Package'}
                </button>
              </div>

              <div>
                <h2 className="text-xs font-semibold text-slate-500 tracking-wide">Mandate</h2>
                <p className="mt-1.5 text-sm text-slate-800 leading-relaxed">{activePackage.mandate}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <div className="text-slate-500">Authority</div>
                  <div className="mt-0.5 font-medium text-slate-900">{activePackage.authority}</div>
                </div>
                <div>
                  <div className="text-slate-500">Grant Scope</div>
                  <div className="mt-0.5 font-mono text-slate-900">{activePackage.grantRequirement}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h2 className="text-xs font-semibold text-slate-500">Commands</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {activePackage.commands.map((cmd) => (
                    <code
                      key={cmd}
                      className="px-2 py-1 text-xs font-mono bg-slate-100 text-slate-800 rounded border border-slate-200"
                    >
                      {cmd}
                    </code>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h2 className="text-xs font-semibold text-slate-500">
                  Skills ({activePackage.skills.length})
                </h2>
                <div className="mt-2 divide-y divide-slate-100">
                  {activePackage.skills.map((skill) => (
                    <div key={skill.id} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-semibold text-slate-900">
                          {skill.id}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {skill.readOnly ? 'read-only' : 'grant-gated'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">{skill.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Select a package to inspect its details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
