import {
  Compass,
  Package,
  Users,
  RefreshCw,
  Wrench,
  ShieldCheck,
  FileCode2,
} from 'lucide-react';
import type { CompositionId } from '../data/ecosystem';

export type NavSectionId = 'atlas' | 'catalog' | 'csuite' | 'cycle' | 'studio' | 'enterprise' | 'plan';

interface SidebarNavProps {
  activeSection: NavSectionId;
  onSelectSection: (section: NavSectionId) => void;
  compositionId: CompositionId;
  stagedCount: number;
  stagedSkillsCount: number;
  rehearsalGrant: boolean;
}

const NAV_ITEMS: Array<{ id: NavSectionId; label: string; icon: typeof Compass }> = [
  { id: 'atlas', label: 'Atlas', icon: Compass },
  { id: 'catalog', label: 'Catalog', icon: Package },
  { id: 'csuite', label: 'C-suite', icon: Users },
  { id: 'cycle', label: 'Cycle', icon: RefreshCw },
  { id: 'studio', label: 'Studio', icon: Wrench },
  { id: 'enterprise', label: 'Enterprise', icon: ShieldCheck },
  { id: 'plan', label: 'Plan', icon: FileCode2 },
];

export function SidebarNav({
  activeSection,
  onSelectSection,
  compositionId,
  stagedCount,
  stagedSkillsCount,
  rehearsalGrant,
}: SidebarNavProps) {
  return (
    <aside className="w-full lg:w-64 lg:shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col justify-between">
      <div>
        <div className="px-5 py-5 border-b border-slate-200">
          <div className="text-base font-semibold tracking-tight text-slate-900 whitespace-nowrap">
            Everything Marketplaces
          </div>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            PMCR-O control plane. Browses, composes, and rehearses only.
          </p>
        </div>

        <nav aria-label="Control plane sections" className="p-3 flex flex-wrap lg:flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center justify-between px-2.5 py-2 lg:px-3 lg:py-2.5 rounded-lg text-xs lg:text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
                {item.id === 'catalog' && (
                  <span
                    className={`text-xs font-mono tabular-nums ml-3 ${
                      isActive ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    46
                  </span>
                )}
                {item.id === 'plan' && stagedCount > 0 && (
                  <span
                    className={`text-xs font-mono tabular-nums ml-3 ${
                      isActive ? 'text-slate-300' : 'text-blue-700'
                    }`}
                  >
                    {stagedCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="hidden lg:block px-5 py-4 border-t border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Team</span>
          <span className="font-medium text-slate-900 capitalize">{compositionId}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Orchestrators</span>
          <span className="font-mono text-slate-800">CEO · CTO</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Staged</span>
          <span className="font-mono tabular-nums text-slate-800">
            {stagedCount} pkg · {stagedSkillsCount} skills
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Rehearsal grant</span>
          <span
            className={`font-mono font-medium ${
              rehearsalGrant ? 'text-amber-700' : 'text-slate-700'
            }`}
          >
            {rehearsalGrant ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>
    </aside>
  );
}
