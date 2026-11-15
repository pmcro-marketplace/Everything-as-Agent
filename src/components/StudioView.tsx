import { useState } from 'react';
import { Lock, Terminal, Play, Send, AlertTriangle } from 'lucide-react';
import {
  draftStudioArtifact,
  type StudioArtifactKind,
  type StudioDraftOutput,
} from '../utils/pmcroEngine';
import { DynamicSkillRunner } from './DynamicSkillRunner';

interface StudioViewProps {
  onArtifactDrafted: (draft: StudioDraftOutput) => void;
}

interface OllamaResultState {
  ok: boolean;
  mode: string;
  endpoint: string;
  model: string;
  output?: string;
  message?: string;
  localCommand?: string;
}

interface GithubDispatchState {
  ok: boolean;
  mode: string;
  dispatched: boolean;
  message?: string;
  error?: string;
  cliCommand?: string;
}

export function StudioView({ onArtifactDrafted }: StudioViewProps) {
  const [kind, setKind] = useState<StudioArtifactKind>('skill');
  const [canonicalId, setCanonicalId] = useState('ollama-local-bridge');
  const [requestedRenameId, setRequestedRenameId] = useState('ollama-local-bridge');
  const [sourceNamespace, setSourceNamespace] = useState('pmcr-o/model-gateway-agent');
  const [summary, setSummary] = useState(
    'Dynamic PMCR-O AgentSkill executing bounded local Ollama inference and dispatching GitHub Actions verification workflows.'
  );
  const [commandsText, setCommandsText] = useState('/ollama-run, /gh-dispatch');
  const [ollamaEndpoint, setOllamaEndpoint] = useState('http://127.0.0.1:11434');
  const [ollamaModel, setOllamaModel] = useState('qwen2.5-coder:7b');
  const [githubRepo, setGithubRepo] = useState('pmcr-o/skills');
  const [githubRef, setGithubRef] = useState('main');
  const [workflowFile, setWorkflowFile] = useState('pmcro-skill-dispatch.yml');
  const [runtimeSeed, setRuntimeSeed] = useState(
    'Rehearse dynamic AgentSkill projection against pmcr-o/skills main branch'
  );
  const [dispatchMode, setDispatchMode] = useState<'rehearsal' | 'live'>('rehearsal');
  const [githubToken, setGithubToken] = useState('');

  const [draft, setDraft] = useState<StudioDraftOutput | null>(() =>
    draftStudioArtifact({
      kind: 'skill',
      canonicalId: 'ollama-local-bridge',
      requestedRenameId: 'ollama-local-bridge',
      sourceNamespace: 'pmcr-o/model-gateway-agent',
      summary:
        'Dynamic PMCR-O AgentSkill executing bounded local Ollama inference and dispatching GitHub Actions verification workflows.',
      commands: ['/ollama-run', '/gh-dispatch'],
      ollamaModel: 'qwen2.5-coder:7b',
      githubRepo: 'pmcr-o/skills',
      workflowFile: 'pmcro-skill-dispatch.yml',
    })
  );
  const [activeTab, setActiveTab] = useState<'skill' | 'projection' | 'workflow'>('skill');
  const [ollamaResult, setOllamaResult] = useState<OllamaResultState | null>(null);
  const [isRunningOllama, setIsRunningOllama] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<GithubDispatchState | null>(null);
  const [isDispatchingGh, setIsDispatchingGh] = useState(false);

  function handleDraftSubmit(e: React.FormEvent) {
    e.preventDefault();
    const commands = commandsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const result = draftStudioArtifact({
      kind,
      canonicalId,
      requestedRenameId,
      sourceNamespace,
      summary,
      commands,
      ollamaModel,
      githubRepo,
      workflowFile,
    });
    setDraft(result);
    if (result.accepted) {
      onArtifactDrafted(result);
    }
  }

  async function handleRunLocalOllama() {
    if (!draft?.accepted) return;
    setIsRunningOllama(true);
    try {
      const res = await fetch('/api/ollama/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: ollamaEndpoint,
          model: ollamaModel,
          skillId: draft.canonicalId,
          skillMarkdown: draft.skillMarkdown,
          seed: runtimeSeed,
        }),
      });
      const data = (await res.json()) as OllamaResultState;
      setOllamaResult(data);
    } catch (err) {
      setOllamaResult({
        ok: false,
        mode: 'offline-rehearsal',
        endpoint: ollamaEndpoint,
        model: ollamaModel,
        message: err instanceof Error ? err.message : 'Request failed',
      });
    } finally {
      setIsRunningOllama(false);
    }
  }

  async function handleDispatchGithubWorkflow() {
    if (!draft?.accepted) return;
    setIsDispatchingGh(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (dispatchMode === 'live' && githubToken.trim()) {
        headers.Authorization = `Bearer ${githubToken.trim()}`;
      }
      const res = await fetch('/api/github/dispatch', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mode: dispatchMode,
          repo: githubRepo,
          ref: githubRef,
          workflowFile,
          skillId: draft.canonicalId,
          ollamaModel,
          seed: runtimeSeed,
        }),
      });
      const data = (await res.json()) as GithubDispatchState;
      setDispatchResult(data);
    } catch (err) {
      setDispatchResult({
        ok: false,
        mode: dispatchMode,
        dispatched: false,
        error: err instanceof Error ? err.message : 'Dispatch failed',
      });
    } finally {
      setIsDispatchingGh(false);
    }
  }

  const renameMismatch = requestedRenameId.trim() !== canonicalId.trim();

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Studio & Dynamic AgentSkill Bridge
          </h1>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            Draft a marketplace, plugin, skill, or template without renaming canonical identities. Test dynamic AgentSkills against local Ollama and prepare or dispatch GitHub Actions workflows.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-700 shrink-0">
          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
          <span>identityImmutable = true</span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleDraftSubmit}
          className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-4"
        >
          <h2 className="text-base font-semibold text-slate-900">01. Identity-Preserving Draft</h2>

          <div>
            <span className="block text-xs font-medium text-slate-700 mb-1.5">Artifact Kind</span>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
              {(['marketplace', 'plugin', 'skill', 'template'] as StudioArtifactKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                    kind === k ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="canonical-id" className="block text-xs font-medium text-slate-700">
                Canonical ID (Source)
              </label>
              <input
                id="canonical-id"
                type="text"
                value={canonicalId}
                onChange={(e) => {
                  setCanonicalId(e.target.value);
                  setRequestedRenameId(e.target.value);
                }}
                className="mt-1 w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:border-blue-700"
              />
            </div>

            <div>
              <label htmlFor="target-identity" className="block text-xs font-medium text-slate-700">
                Emitted Identity (Must Match)
              </label>
              <input
                id="target-identity"
                type="text"
                value={requestedRenameId}
                onChange={(e) => setRequestedRenameId(e.target.value)}
                className={`mt-1 w-full px-3 py-2 text-xs font-mono border rounded-md bg-white text-slate-900 focus:outline-none ${
                  renameMismatch ? 'border-red-500' : 'border-slate-300 focus:border-blue-700'
                }`}
              />
            </div>
          </div>

          {renameMismatch && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-xs text-red-800">
              <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Renaming "{canonicalId}" to "{requestedRenameId}" violates identity preservation. Draft submission will refuse until identities match.
              </span>
            </div>
          )}

          <div>
            <label htmlFor="source-namespace" className="block text-xs font-medium text-slate-700">
              Source Namespace
            </label>
            <input
              id="source-namespace"
              type="text"
              value={sourceNamespace}
              onChange={(e) => setSourceNamespace(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:border-blue-700"
            />
          </div>

          <div>
            <label htmlFor="draft-summary" className="block text-xs font-medium text-slate-700">
              Mandate / Description
            </label>
            <textarea
              id="draft-summary"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:border-blue-700"
            />
          </div>

          <div>
            <label htmlFor="draft-commands" className="block text-xs font-medium text-slate-700">
              Commands (comma-separated)
            </label>
            <input
              id="draft-commands"
              type="text"
              value={commandsText}
              onChange={(e) => setCommandsText(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:border-blue-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label htmlFor="ollama-model" className="block text-xs font-medium text-slate-700">
                Local Ollama Model
              </label>
              <input
                id="ollama-model"
                type="text"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:border-blue-700"
              />
            </div>
            <div>
              <label htmlFor="gh-repo" className="block text-xs font-medium text-slate-700">
                GitHub Target Repo
              </label>
              <input
                id="gh-repo"
                type="text"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Generate Identity-Preserving Draft
          </button>

          {draft && !draft.accepted && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800">
              {draft.error}
            </div>
          )}
        </form>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'skill'}
                  onClick={() => setActiveTab('skill')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                    activeTab === 'skill' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  SKILL.md
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'projection'}
                  onClick={() => setActiveTab('projection')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                    activeTab === 'projection' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  projection.json
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'workflow'}
                  onClick={() => setActiveTab('workflow')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                    activeTab === 'workflow' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  GitHub Workflow YAML
                </button>
              </div>
              {draft?.accepted && (
                <span className="text-xs font-mono text-slate-500">digest: {draft.digest}</span>
              )}
            </div>

            {draft?.accepted ? (
              <pre className="p-4 bg-slate-950 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto max-h-72 leading-relaxed">
                {activeTab === 'skill'
                  ? draft.skillMarkdown
                  : activeTab === 'projection'
                  ? draft.projectionJson
                  : draft.workflowYaml}
              </pre>
            ) : (
              <div className="p-6 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 text-center">
                Draft blocked due to identity-preservation violation. Match Emitted Identity to Canonical ID and submit again.
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                02. Live Dynamic AgentSkill Execution (Local Ollama & GitHub Actions)
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Execute the drafted SKILL.md against a local Ollama endpoint or trigger a GitHub Actions workflow_dispatch run.
              </p>
            </div>

            <div>
              <label htmlFor="runtime-seed" className="block text-xs font-medium text-slate-700">
                Execution Seed
              </label>
              <input
                id="runtime-seed"
                type="text"
                value={runtimeSeed}
                onChange={(e) => setRuntimeSeed(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:border-blue-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                  <Terminal className="w-4 h-4 text-slate-500" aria-hidden="true" />
                  <span>Local Ollama Runner</span>
                </div>
                <div>
                  <label htmlFor="ollama-endpoint" className="block text-xs text-slate-600">
                    Endpoint URL
                  </label>
                  <input
                    id="ollama-endpoint"
                    type="text"
                    value={ollamaEndpoint}
                    onChange={(e) => setOllamaEndpoint(e.target.value)}
                    className="mt-1 w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-md"
                  />
                </div>
                <button
                  type="button"
                  disabled={!draft?.accepted || isRunningOllama}
                  onClick={handleRunLocalOllama}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isRunningOllama ? 'Calling Ollama...' : 'Run Local Ollama Skill'}</span>
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                  <Send className="w-4 h-4 text-slate-500" aria-hidden="true" />
                  <span>GitHub Actions Trigger</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label htmlFor="gh-workflow" className="block text-xs text-slate-600">
                      Workflow File
                    </label>
                    <input
                      id="gh-workflow"
                      type="text"
                      value={workflowFile}
                      onChange={(e) => setWorkflowFile(e.target.value)}
                      className="mt-1 w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-md"
                    />
                  </div>
                  <div className="col-span-1">
                    <label htmlFor="gh-ref" className="block text-xs text-slate-600">
                      Branch Ref
                    </label>
                    <input
                      id="gh-ref"
                      type="text"
                      value={githubRef}
                      onChange={(e) => setGithubRef(e.target.value)}
                      className="mt-1 w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <label className="inline-flex items-center gap-1.5 text-slate-700">
                    <input
                      type="radio"
                      name="dispatch-mode"
                      checked={dispatchMode === 'rehearsal'}
                      onChange={() => setDispatchMode('rehearsal')}
                    />
                    <span>Dry-run rehearsal</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-slate-700">
                    <input
                      type="radio"
                      name="dispatch-mode"
                      checked={dispatchMode === 'live'}
                      onChange={() => setDispatchMode('live')}
                    />
                    <span>Live dispatch</span>
                  </label>
                </div>
                {dispatchMode === 'live' && (
                  <div>
                    <label htmlFor="gh-bearer" className="block text-xs text-slate-600">
                      Session GitHub PAT (not persisted)
                    </label>
                    <input
                      id="gh-bearer"
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_... (optional for live dispatch)"
                      className="mt-1 w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-md"
                    />
                  </div>
                )}
                <button
                  type="button"
                  disabled={!draft?.accepted || isDispatchingGh}
                  onClick={handleDispatchGithubWorkflow}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-900 border border-slate-300 bg-white rounded-md hover:bg-slate-50 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {isDispatchingGh
                      ? 'Dispatching...'
                      : dispatchMode === 'live'
                      ? 'Trigger Live GitHub Action'
                      : 'Prepare GitHub Action Dispatch'}
                  </span>
                </button>
              </div>
            </div>

            {ollamaResult && (
              <div className="p-3.5 border border-slate-200 rounded-md bg-slate-50 text-xs space-y-2">
                <div className="font-mono font-semibold text-slate-900">
                  Ollama Result · mode={ollamaResult.mode} · model={ollamaResult.model}
                </div>
                {ollamaResult.output ? (
                  <pre className="p-2.5 bg-white border border-slate-200 rounded font-mono overflow-x-auto">
                    {ollamaResult.output}
                  </pre>
                ) : (
                  <p className="text-slate-600">{ollamaResult.message}</p>
                )}
                {ollamaResult.localCommand && (
                  <pre className="p-2.5 bg-slate-900 text-slate-100 rounded font-mono overflow-x-auto">
                    {ollamaResult.localCommand}
                  </pre>
                )}
              </div>
            )}

            {dispatchResult && (
              <div className="p-3.5 border border-slate-200 rounded-md bg-slate-50 text-xs space-y-2">
                <div className="font-mono font-semibold text-slate-900">
                  GitHub Actions · mode={dispatchResult.mode} · dispatched={String(dispatchResult.dispatched)}
                </div>
                <p className={dispatchResult.error ? 'text-red-700' : 'text-slate-700'}>
                  {dispatchResult.error ?? dispatchResult.message}
                </p>
                {dispatchResult.cliCommand && (
                  <pre className="p-2.5 bg-slate-900 text-slate-100 rounded font-mono overflow-x-auto">
                    {dispatchResult.cliCommand}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <DynamicSkillRunner />
    </div>
  );
}
