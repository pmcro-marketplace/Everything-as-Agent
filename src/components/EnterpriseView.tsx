import { FileCheck2, Info } from 'lucide-react';
import type { PromotionGate } from '../data/ecosystem';
import { evaluatePromotionReadiness } from '../utils/pmcroEngine';

interface EnterpriseViewProps {
  gates: PromotionGate[];
  onToggleNoteCheckbox: (gateId: string) => void;
  onAttachDemoEvidence: (gateId: string) => void;
}

export function EnterpriseView({
  gates,
  onToggleNoteCheckbox,
  onAttachDemoEvidence,
}: EnterpriseViewProps) {
  const summary = evaluatePromotionReadiness(gates);

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Enterprise Readiness & Seven Promotion Gates
          </h1>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            Production readiness is governed strictly by verifiable artifacts across seven promotion gates. A checkbox is a note, not evidence.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-6 text-right shrink-0">
          <div>
            <div className="text-xs text-slate-500">Verified Gates</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-slate-900">
              {summary.verifiedCount}/{summary.totalGates}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Note Checkboxes</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-slate-500">
              {summary.noteCheckedCount}/{summary.totalGates}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Promotion Status</div>
            <div
              className={`text-sm font-mono font-semibold mt-1 ${
                summary.readyForProduction ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {summary.readyForProduction ? 'READY' : 'BLOCKED'}
            </div>
          </div>
        </div>
      </section>

      <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <strong className="font-semibold text-slate-900">Rule: A checkbox is a note, not evidence.</strong>{' '}
          {summary.advisoryNotice} Run Roundtable, Cycle (grant OFF and "skip check"), Studio drafts, and Plan exports to generate real gate evidence—or attach a verified artifact digest per gate below.
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden" aria-label="Seven promotion gates">
        <div className="divide-y divide-slate-200">
          {gates.map((gate) => (
            <div
              key={gate.id}
              className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    Gate 0{gate.order}
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900">{gate.title}</h2>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{gate.requirement}</p>
                <div className="text-xs font-mono text-slate-500">
                  Required artifact: {gate.evidenceType}
                  {gate.evidenceArtifact ? ` · Attached: ${gate.evidenceArtifact}` : ''}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 shrink-0">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={gate.noteChecked}
                    onChange={() => onToggleNoteCheckbox(gate.id)}
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-blue-700"
                  />
                  <span>Operator note only</span>
                </label>

                <div className="w-28 text-right font-mono text-xs font-semibold">
                  <span
                    className={
                      gate.evidenceStatus === 'VERIFIED'
                        ? 'text-emerald-700'
                        : gate.evidenceStatus === 'REHEARSED'
                        ? 'text-blue-700'
                        : 'text-red-700'
                    }
                  >
                    {gate.evidenceStatus}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onAttachDemoEvidence(gate.id)}
                  disabled={gate.evidenceStatus === 'VERIFIED'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0"
                >
                  <FileCheck2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {gate.evidenceStatus === 'VERIFIED' ? 'Evidence Verified' : 'Record Evidence'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
