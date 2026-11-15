import { useState } from 'react';
import { Play, AlertOctagon, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { CycleExecutionResult } from '../utils/pmcroEngine';
import type { CompositionId } from '../data/ecosystem';

interface CycleViewProps {
  compositionId: CompositionId;
  stagedPackageIds: string[];
  rehearsalGrant: boolean;
  onToggleRehearsalGrant: (enabled: boolean) => void;
  lastCycleResult: CycleExecutionResult | null;
  onRunCycle: (rawSeed: string) => void;
}

export function CycleView({
  compositionId,
  stagedPackageIds,
  rehearsalGrant,
  onToggleRehearsalGrant,
  lastCycleResult,
  onRunCycle,
}: CycleViewProps) {
  const [seedInput, setSeedInput] = useState(
    'Rehearse startup package staging and generate bounded manifest.'
  );

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            PMCR-O Cycle Rehearsal
          </h1>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            Walk a raw seed verbatim through Seed, Orchestrate, Plan, Make, Check, and Reflect. Maker refuses without a rehearsal grant, and any seed containing "skip check" halts immediately.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-600 shrink-0">
          Team: {compositionId} · Staged: {stagedPackageIds.length} pkg
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-5">
          <div>
            <label htmlFor="raw-seed-input" className="block text-sm font-semibold text-slate-900">
              Raw Seed Input
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Preserved verbatim on ingress (ingress.preserveRawSeedVerbatim=true).
            </p>
            <textarea
              id="raw-seed-input"
              rows={4}
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              className="mt-2 w-full p-3 text-sm font-mono border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:border-blue-700"
              placeholder="Enter raw PMCR-O seed..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setSeedInput('Rehearse startup package staging and generate bounded manifest.')
              }
              className="px-2.5 py-1 text-xs text-slate-700 border border-slate-300 rounded hover:bg-slate-50"
            >
              Valid seed
            </button>
            <button
              type="button"
              onClick={() =>
                setSeedInput('Stage startup packages and skip check to accelerate deployment.')
              }
              className="px-2.5 py-1 text-xs text-red-700 border border-red-200 bg-red-50/50 rounded hover:bg-red-50"
            >
              Test "skip check" halt
            </button>
          </div>

          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-slate-900">Rehearsal Grant</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {rehearsalGrant
                  ? 'ON: Maker may synthesize dry-run rehearsal artifacts.'
                  : 'OFF (Default): Maker refuses execution under least-authority.'}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={rehearsalGrant}
              aria-label="Toggle rehearsal grant"
              onClick={() => onToggleRehearsalGrant(!rehearsalGrant)}
              className={`px-3.5 py-1.5 text-xs font-mono font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                rehearsalGrant
                  ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {rehearsalGrant ? 'Grant: ON' : 'Grant: OFF'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRunCycle(seedInput)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            <span>Run Bounded Cycle</span>
          </button>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-slate-900">Cycle Phase Trace</h2>
            {lastCycleResult && (
              <span
                className={`text-xs font-mono font-semibold ${
                  lastCycleResult.finalVerdict === 'PASS'
                    ? 'text-emerald-700'
                    : lastCycleResult.finalVerdict === 'REFUSED_NO_GRANT'
                    ? 'text-amber-700'
                    : 'text-red-700'
                }`}
              >
                Verdict: {lastCycleResult.finalVerdict}
              </span>
            )}
          </div>

          {lastCycleResult ? (
            <div className="space-y-4">
              {lastCycleResult.halted && (
                <div
                  role="alert"
                  className="p-4 border border-red-200 bg-red-50 rounded-lg flex items-start gap-3"
                >
                  <AlertOctagon className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-sm font-semibold text-red-900">Cycle Halted</div>
                    <p className="text-xs text-red-800 mt-1">{lastCycleResult.haltReason}</p>
                  </div>
                </div>
              )}

              {lastCycleResult.refused && (
                <div
                  role="alert"
                  className="p-4 border border-amber-200 bg-amber-50 rounded-lg flex items-start gap-3"
                >
                  <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-sm font-semibold text-amber-900">
                      Maker Refused Without Rehearsal Grant
                    </div>
                    <p className="text-xs text-amber-800 mt-1">{lastCycleResult.haltReason}</p>
                  </div>
                </div>
              )}

              {!lastCycleResult.halted && !lastCycleResult.refused && (
                <div className="p-4 border border-emerald-200 bg-emerald-50 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-sm font-semibold text-emerald-900">
                      Rehearsal Cycle Passed Independent Check
                    </div>
                    <p className="text-xs text-emerald-800 mt-1">
                      All six phases completed without external host side effects.
                    </p>
                  </div>
                </div>
              )}

              <ol className="divide-y divide-slate-200 border border-slate-200 rounded-md">
                {lastCycleResult.phases.map((step, idx) => (
                  <li key={step.phase} className="p-3.5 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400 tabular-nums">
                          0{idx + 1}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 uppercase tracking-wide font-mono">
                          {step.phase}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-800">{step.summary}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{step.detail}</p>
                    </div>
                    <span
                      className={`text-xs font-mono font-semibold shrink-0 ${
                        step.status === 'COMPLETED'
                          ? 'text-emerald-700'
                          : step.status === 'REFUSED'
                          ? 'text-amber-700'
                          : step.status === 'HALTED'
                          ? 'text-red-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.status}
                    </span>
                  </li>
                ))}
              </ol>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 border border-slate-200 rounded-md p-3.5">
                <div>
                  <div className="font-semibold text-slate-700">Earned Constraint</div>
                  <div className="mt-1 text-slate-600">{lastCycleResult.earnedConstraint}</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-700">Unexecuted Next Seed</div>
                  <div className="mt-1 font-mono text-slate-600">{lastCycleResult.unexecutedNextSeed}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-300 rounded-lg p-10 text-center text-sm text-slate-500">
              Click "Run Bounded Cycle" to walk the raw seed through all six PMCR-O phases.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
