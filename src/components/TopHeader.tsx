import type { NavSectionId } from './SidebarNav';

interface TopHeaderProps {
  activeSection: NavSectionId;
  stagedCount: number;
  onOpenPlan: () => void;
}

const SECTION_LABELS: Record<NavSectionId, string> = {
  atlas: 'Atlas',
  catalog: 'Catalog',
  csuite: 'C-suite',
  cycle: 'Cycle',
  studio: 'Studio',
  enterprise: 'Enterprise',
  plan: 'Plan',
};

export function TopHeader({ activeSection, stagedCount, onOpenPlan }: TopHeaderProps) {
  return (
    <header className="h-14 px-6 border-b border-slate-200 bg-white flex items-center justify-between gap-8 shrink-0">
      <div className="text-sm font-medium text-slate-900 whitespace-nowrap shrink-0">
        <span className="text-slate-500">Ecosystem</span>
        <span className="mx-2 text-slate-300" aria-hidden="true">
          /
        </span>
        <span>{SECTION_LABELS[activeSection]}</span>
      </div>

      <div className="hidden md:flex items-center gap-5 text-xs text-slate-500 whitespace-nowrap shrink-0">
        <span className="tabular-nums">4 Marketplaces</span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">46 Packages</span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">70 Skills</span>
        <span aria-hidden="true">·</span>
        <span>Read-only Control Plane</span>
      </div>

      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onOpenPlan}
          className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          Review Install Plan ({stagedCount})
        </button>
      </div>
    </header>
  );
}
