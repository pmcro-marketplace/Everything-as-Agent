import { useState } from 'react';
import { Lock, MessageSquare } from 'lucide-react';
import {
  EXECUTIVE_ROLES,
  TEAM_COMPOSITIONS,
  type CompositionId,
} from '../data/ecosystem';
import type { RoundtableTranscript } from '../utils/pmcroEngine';

interface CsuiteViewProps {
  compositionId: CompositionId;
  onSelectComposition: (id: CompositionId) => void;
  roundtable: RoundtableTranscript | null;
  onConveneRoundtable: (topic: string) => void;
  onApplyRecommendedPackages: (packageIds: string[]) => void;
}

export function CsuiteView({
  compositionId,
  onSelectComposition,
  roundtable,
  onConveneRoundtable,
  onApplyRecommendedPackages,
}: CsuiteViewProps) {
  const [topic, setTopic] = useState('Ecosystem readiness & rehearsal governance');

  const activeComp =
    TEAM_COMPOSITIONS.find((c) => c.id === compositionId) ?? TEAM_COMPOSITIONS[0];

  const seatedRoles = EXECUTIVE_ROLES.filter((role) =>
    activeComp.memberIds.includes(role.id)
  );

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            C-Suite Team Composition & Roundtable
          </h1>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            Select startup, bank, or enterprise composition. CEO and CTO remain locked as default orchestrators. Convening a roundtable generates deterministic local office drafts—not a live model call.
          </p>
        </div>
        <div className="text-xs text-slate-600 font-mono shrink-0">
          Orchestrators: CEO + CTO (locked)
        </div>
      </section>

      <section aria-label="Team compositions">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEAM_COMPOSITIONS.map((comp) => {
            const isSelected = comp.id === compositionId;
            return (
              <button
                key={comp.id}
                type="button"
                onClick={() => onSelectComposition(comp.id)}
                aria-pressed={isSelected}
                className={`text-left p-5 rounded-lg border transition-colors ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-base font-semibold">{comp.name}</span>
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {comp.memberIds.length} roles
                  </span>
                </div>
                <p
                  className={`mt-2 text-xs leading-relaxed ${
                    isSelected ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {comp.summary}
                </p>
                <div
                  className={`mt-3 text-xs font-mono ${
                    isSelected ? 'text-blue-300' : 'text-slate-500'
                  }`}
                >
                  {comp.memberIds.map((m) => m.toUpperCase()).join(' · ')}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-slate-900">
              Seated Executive Roster ({seatedRoles.length})
            </h2>
            <button
              type="button"
              onClick={() => onApplyRecommendedPackages(activeComp.recommendedPackages)}
              className="text-xs font-medium text-blue-700 hover:underline whitespace-nowrap shrink-0"
            >
              Stage {activeComp.name} baseline ({activeComp.recommendedPackages.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {seatedRoles.map((role) => (
              <div key={role.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 font-mono">
                      {role.title}
                    </span>
                    <span className="text-xs text-slate-500">{role.fullName}</span>
                  </div>
                  {role.defaultOrchestrator ? (
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-blue-700">
                      <Lock className="w-3 h-3" aria-hidden="true" />
                      <span>Default Orchestrator</span>
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-slate-400">Advisory Office</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">{role.mandate}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Roundtable — Local Office Drafts
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Generates bounded local office drafts from every seated executive without calling a live LLM or erasing dissent.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <label htmlFor="roundtable-topic" className="sr-only">
              Roundtable agenda topic
            </label>
            <input
              id="roundtable-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter roundtable agenda topic..."
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:border-blue-700"
            />
            <button
              type="button"
              onClick={() => onConveneRoundtable(topic)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
              <span>Convene Roundtable</span>
            </button>
          </div>

          {roundtable ? (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-mono">
                <span>
                  Mode: {roundtable.mode} · liveModelUsed={String(roundtable.liveModelUsed)}
                </span>
                <span>
                  Team: {roundtable.compositionId} ({roundtable.drafts.length} drafts)
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {roundtable.drafts.map((draft) => (
                  <div key={draft.roleId} className="py-4 first:pt-1 last:pb-0 space-y-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-900">
                        <span className="font-mono mr-2">{draft.roleTitle}</span>
                        <span className="font-normal text-slate-500">{draft.fullName}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-500">
                        {draft.isDefaultOrchestrator ? 'Default Orchestrator' : 'Seated Advisor'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed">
                      <strong className="font-medium text-slate-900">Office Draft:</strong> {draft.position}
                    </p>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      <strong className="font-medium">Dissent / Risk:</strong> {draft.dissentOrRisk}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">
                      Evidence needed: {draft.evidenceNeeded}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-300 rounded-lg p-8 text-center text-sm text-slate-500">
              No roundtable convened yet for {activeComp.name}. Click "Convene Roundtable" to generate local office drafts.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
