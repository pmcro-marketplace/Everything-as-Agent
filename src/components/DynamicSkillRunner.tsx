import { useEffect, useState } from 'react';
import { Play, Square, OctagonX, Plus, Loader2, ShieldCheck } from 'lucide-react';
import type {
  DynamicSkillDefinition,
  DynamicSkillRun,
  DynamicTriggerKind,
} from '../utils/dynamicSkillRuntime';

export function DynamicSkillRunner() {
  const [skills, setSkills] = useState<DynamicSkillDefinition[]>([]);
  const [runs, setRuns] = useState<DynamicSkillRun[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string>('ollama-local-bridge');
  const [seed, setSeed] = useState<string>('Verify pmcr-o/pmcro-agent runtime projection dynamically');
  const [approvalGranted, setApprovalGranted] = useState<boolean>(false);
  const [stepDelayMs, setStepDelayMs] = useState<number>(600);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create new live dynamic AgentSkill form
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newId, setNewId] = useState<string>('dynamic-ci-probe');
  const [newTrigger, setNewTrigger] = useState<DynamicTriggerKind>('workflow_dispatch');
  const [newTarget, setNewTarget] = useState<DynamicSkillDefinition['runtimeTarget']>('bounded-rehearsal');
  const [newSummary, setNewSummary] = useState<string>(
    'Dynamically created PMCR-O skill with cancellation contract and Trail Frame logging.'
  );
  const [newTimeoutMs, setNewTimeoutMs] = useState<number>(15000);
  const [newApprovalGate, setNewApprovalGate] = useState<boolean>(false);

  async function refreshState() {
    try {
      const res = await fetch('/api/skills/dynamic');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.skills)) {
          setSkills(data.skills);
          if (!data.skills.some((s: DynamicSkillDefinition) => s.id === selectedSkillId) && data.skills[0]) {
            setSelectedSkillId(data.skills[0].id);
          }
        }
        if (Array.isArray(data.runs)) {
          setRuns(data.runs);
        }
      }
    } catch {
      // ignore transient poll failures
    }
  }

  useEffect(() => {
    refreshState();
  }, []);

  const hasActiveRun = runs.some((r) => r.status === 'RUNNING' || r.status === 'QUEUED');

  useEffect(() => {
    if (!hasActiveRun) return;
    const timer = setInterval(() => {
      refreshState();
    }, 300);
    return () => clearInterval(timer);
  }, [hasActiveRun]);

  async function handleCreateDynamicSkill(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    const res = await fetch('/api/skills/dynamic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newId,
        sourceNamespace: 'pmcr-o/skills',
        summary: newSummary,
        trigger: newTrigger,
        runtimeTarget: newTarget,
        ollamaModel: 'qwen2.5-coder:7b',
        githubRepo: 'pmcr-o/skills',
        workflowFile: `${newId}.yml`,
        timeoutMs: newTimeoutMs,
        requiresApprovalGate: newApprovalGate,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setErrorMsg(data.error || 'Failed to register dynamic skill.');
      return;
    }
    setSelectedSkillId(data.skill.id);
    setShowCreateForm(false);
    await refreshState();
  }

  async function handleRunSelectedSkill() {
    if (!selectedSkillId) return;
    setErrorMsg(null);
    const res = await fetch(`/api/skills/dynamic/${encodeURIComponent(selectedSkillId)}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seed,
        approvalGranted,
        stepDelayMs,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setErrorMsg(data.error || 'Execution policy blocked run.');
      return;
    }
    await refreshState();
  }

  async function handleKillRun(runId: string) {
    setErrorMsg(null);
    const res = await fetch(`/api/skills/dynamic/runs/${encodeURIComponent(runId)}/kill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Operator triggered live agent kill switch' }),
    });
    if (res.ok) {
      await refreshState();
    }
  }

  async function handleKillAll() {
    setErrorMsg(null);
    const res = await fetch('/api/skills/dynamic/kill-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Global emergency agent kill switch activated' }),
    });
    if (res.ok) {
      await refreshState();
    }
  }

  const selectedSkill = skills.find((s) => s.id === selectedSkillId);

  return (
    <section
      className="bg-white border border-slate-200 rounded-lg p-5 space-y-5"
      aria-labelledby="live-dynamic-runner-heading"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 id="live-dynamic-runner-heading" className="text-base font-semibold text-slate-900">
            03. Live Dynamic AgentSkill Execution & Kill Switch
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Register dynamic AgentSkills on the server runtime, execute them asynchronously through PMCR-O Trail Frames, and abort active executions immediately with the live kill switch.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 border border-slate-300 rounded-md hover:bg-slate-50 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{showCreateForm ? 'Close New Skill Form' : 'New Dynamic Skill'}</span>
          </button>

          <button
            type="button"
            onClick={handleKillAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 whitespace-nowrap"
          >
            <OctagonX className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Kill All Active ({runs.filter((r) => r.status === 'RUNNING').length})</span>
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreateDynamicSkill}
          className="p-4 border border-slate-200 rounded-md bg-slate-50 space-y-3"
        >
          <div className="text-xs font-semibold text-slate-900">Register Live Dynamic AgentSkill</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label htmlFor="dyn-skill-id" className="block text-xs text-slate-600">
                Canonical Skill ID
              </label>
              <input
                id="dyn-skill-id"
                type="text"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                className="mt-1 w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
              />
            </div>
            <div>
              <label htmlFor="dyn-trigger" className="block text-xs text-slate-600">
                Trigger
              </label>
              <select
                id="dyn-trigger"
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value as DynamicTriggerKind)}
                className="mt-1 w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
              >
                <option value="workflow_dispatch">workflow_dispatch</option>
                <option value="manual">manual</option>
                <option value="schedule">schedule</option>
                <option value="pull_request">pull_request</option>
              </select>
            </div>
            <div>
              <label htmlFor="dyn-target" className="block text-xs text-slate-600">
                Runtime Target
              </label>
              <select
                id="dyn-target"
                value={newTarget}
                onChange={(e) =>
                  setNewTarget(e.target.value as DynamicSkillDefinition['runtimeTarget'])
                }
                className="mt-1 w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
              >
                <option value="bounded-rehearsal">bounded-rehearsal</option>
                <option value="local-ollama">local-ollama</option>
                <option value="github-actions">github-actions</option>
              </select>
            </div>
            <div>
              <label htmlFor="dyn-timeout" className="block text-xs text-slate-600">
                Timeout (ms)
              </label>
              <input
                id="dyn-timeout"
                type="number"
                min={1000}
                max={120000}
                value={newTimeoutMs}
                onChange={(e) => setNewTimeoutMs(Number(e.target.value))}
                className="mt-1 w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <input
              type="text"
              aria-label="Dynamic skill mandate summary"
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
            />
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 shrink-0">
              <input
                type="checkbox"
                checked={newApprovalGate}
                onChange={(e) => setNewApprovalGate(e.target.checked)}
              />
              <span>Require approval gate</span>
            </label>
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 shrink-0"
            >
              Register Skill
            </button>
          </div>
        </form>
      )}

      {errorMsg && (
        <div role="alert" className="p-3 border border-red-200 bg-red-50 rounded-md text-xs text-red-800">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5 space-y-3">
          <div>
            <label htmlFor="select-dynamic-skill" className="block text-xs font-medium text-slate-700">
              Registered Dynamic AgentSkills ({skills.length})
            </label>
            <select
              id="select-dynamic-skill"
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-md bg-white text-slate-900"
            >
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.id} · {skill.runtimeTarget} · {skill.trigger}
                </option>
              ))}
            </select>
          </div>

          {selectedSkill && (
            <div className="p-3 border border-slate-200 rounded-md bg-slate-50 text-xs space-y-1.5">
              <div className="font-mono font-semibold text-slate-900">{selectedSkill.id}</div>
              <p className="text-slate-600">{selectedSkill.summary}</p>
              <div className="font-mono text-slate-500">
                timeout={selectedSkill.policy.timeoutMs}ms · approvalGate={String(selectedSkill.policy.requiresApprovalGate)}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="dyn-exec-seed" className="block text-xs font-medium text-slate-700">
              Dynamic Execution Seed
            </label>
            <input
              id="dyn-exec-seed"
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-md bg-white"
            />
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            <label className="inline-flex items-center gap-1.5 text-slate-700">
              <input
                type="checkbox"
                checked={approvalGranted}
                onChange={(e) => setApprovalGranted(e.target.checked)}
              />
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span>Explicit execution approval</span>
            </label>
            <div className="flex items-center gap-1.5">
              <label htmlFor="step-delay-ms" className="text-slate-500">
                Pace (ms)
              </label>
              <input
                id="step-delay-ms"
                type="number"
                min={150}
                max={3000}
                step={150}
                value={stepDelayMs}
                onChange={(e) => setStepDelayMs(Number(e.target.value))}
                className="w-20 px-2 py-1 font-mono border border-slate-300 rounded bg-white"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunSelectedSkill}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800"
          >
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Run Dynamic Skill Live</span>
          </button>
        </div>

        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800">
              Live Execution Runs & Enterprise Trail Frames ({runs.length})
            </span>
            <span className="font-mono text-slate-500">AbortController kill-ready</span>
          </div>

          {runs.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-300 rounded-md text-center text-xs text-slate-500">
              No dynamic skill runs yet. Click "Run Dynamic Skill Live" to execute and observe live Trail Frames or trigger the Kill Switch.
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {runs.map((run) => {
                const isRunning = run.status === 'RUNNING' || run.status === 'QUEUED';
                return (
                  <div
                    key={run.runId}
                    data-testid={`dynamic-run-${run.runId}`}
                    className="border border-slate-200 rounded-md p-3.5 space-y-2.5 bg-white"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isRunning && (
                          <Loader2 className="w-3.5 h-3.5 text-blue-700 animate-spin" aria-hidden="true" />
                        )}
                        <span className="text-xs font-mono font-semibold text-slate-900">
                          {run.skillId}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{run.runId}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-mono font-medium rounded border ${
                            run.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : run.status === 'RUNNING'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-red-50 text-red-800 border-red-200'
                          }`}
                        >
                          {run.status}
                        </span>
                        {isRunning && (
                          <button
                            type="button"
                            onClick={() => handleKillRun(run.runId)}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium text-red-800 bg-red-50 border border-red-300 rounded hover:bg-red-100"
                          >
                            <Square className="w-3 h-3 fill-current" aria-hidden="true" />
                            <span>Kill Run</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs font-mono text-slate-600 truncate">Seed: {run.seed}</div>

                    <div className="space-y-1 border-t border-slate-100 pt-2">
                      {run.trailFrames.map((frame, i) => (
                        <div key={`${run.runId}-${i}`} className="flex items-start gap-2 text-xs">
                          <span
                            className={`font-mono font-semibold shrink-0 w-24 ${
                              frame.status === 'CANCELLED' || frame.status === 'ERROR'
                                ? 'text-red-700'
                                : 'text-slate-700'
                            }`}
                          >
                            {frame.phase}
                          </span>
                          <span className="text-slate-600">{frame.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
