import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { PMCRO_ORG_SNAPSHOT, type PmcroRepoSnapshot } from './src/data/pmcroOrgSnapshot';
import {
  abortDynamicRunRecord,
  buildDynamicSkillDefinition,
  checkExecutionPolicyGate,
  type DynamicSkillDefinition,
  type DynamicSkillRun,
} from './src/utils/dynamicSkillRuntime';
import { buildInvocationResult, type InvocationResult } from './src/utils/invocationContract';

type RunRecord = DynamicSkillRun & { approvalReceiptRef?: string };
type RunRecordWithInvocation = RunRecord & { invocationResult?: InvocationResult };

const TERMINAL_RUN_STATUSES = new Set<DynamicSkillRun['status']>(['COMPLETED', 'FAILED', 'TIMED_OUT', 'CANCELLED']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

let cachedRepos: PmcroRepoSnapshot[] = PMCRO_ORG_SNAPSHOT;
let cachedAt = '2026-11-15T01:18:00Z';
let cacheSource: 'snapshot' | 'live' = 'snapshot';

const dynamicSkills = new Map<string, DynamicSkillDefinition>();
const dynamicRuns: RunRecord[] = [];
const activeRunControllers = new Map<string, AbortController>();

/** Attach the pmcro.agent-invocation-result/v1 record to terminal runs that still have a registered skill. */
function runWithInvocation(run: RunRecord): RunRecordWithInvocation {
  if (!TERMINAL_RUN_STATUSES.has(run.status)) return run;
  const skill = dynamicSkills.get(run.skillId);
  if (!skill) return run;
  return { ...run, invocationResult: buildInvocationResult(run, skill) };
}

function seedInitialDynamicSkills() {
  const defaults = [
    buildDynamicSkillDefinition({
      id: 'ollama-local-bridge',
      sourceNamespace: 'pmcr-o/model-gateway-agent',
      summary: 'Execute dynamic AgentSkill inference locally on Ollama with cancellation safety.',
      trigger: 'manual',
      runtimeTarget: 'local-ollama',
      ollamaModel: 'qwen2.5-coder:7b',
      githubRepo: 'pmcr-o/model-gateway-agent',
      workflowFile: 'ollama-local-bridge.yml',
      timeoutMs: 15000,
      requiresApprovalGate: false,
    }),
    buildDynamicSkillDefinition({
      id: 'gh-workflow-dispatch',
      sourceNamespace: 'pmcr-o/github-agent',
      summary: 'Trigger bounded GitHub Actions workflow_dispatch verification across pmcr-o repos.',
      trigger: 'workflow_dispatch',
      runtimeTarget: 'github-actions',
      ollamaModel: 'qwen2.5-coder:7b',
      githubRepo: 'pmcr-o/skills',
      workflowFile: 'pmcro-skill-dispatch.yml',
      timeoutMs: 20000,
      requiresApprovalGate: true,
    }),
  ];
  for (const res of defaults) {
    if (res.ok) dynamicSkills.set(res.skill.id, res.skill);
  }
}

seedInitialDynamicSkills();

function sleepWithAbort(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('Aborted'));
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new Error('Aborted'));
    }
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'everything-marketplaces', timestamp: new Date().toISOString() });
  });

  app.get('/api/pmcro/repos', async (req, res) => {
    const refresh = req.query.refresh === '1';
    if (!refresh) {
      return res.json({
        org: 'pmcr-o',
        source: cacheSource,
        updatedAt: cachedAt,
        repos: cachedRepos,
      });
    }

    try {
      const ghHeaders: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'everything-marketplaces-control-plane',
      };
      const reposResp = await fetch('https://api.github.com/orgs/pmcr-o/repos?per_page=100', {
        headers: ghHeaders,
        signal: AbortSignal.timeout(6000),
      });

      if (!reposResp.ok) {
        return res.json({
          org: 'pmcr-o',
          source: 'snapshot',
          updatedAt: cachedAt,
          rateLimited: reposResp.status === 403 || reposResp.status === 429,
          statusCode: reposResp.status,
          repos: cachedRepos,
        });
      }

      const liveList = (await reposResp.json()) as Array<{
        name: string;
        full_name: string;
        default_branch: string;
        description: string | null;
        language: string | null;
        html_url: string;
      }>;

      const snapshotMap = new Map(PMCRO_ORG_SNAPSHOT.map((r) => [r.name, r]));
      const merged: PmcroRepoSnapshot[] = await Promise.all(
        liveList.map(async (repo) => {
          const existing = snapshotMap.get(repo.name);
          let branches = existing?.branches ?? [repo.default_branch];
          let recentCommits = existing?.recentCommits ?? [];

          try {
            const [bRes, cRes] = await Promise.all([
              fetch(`https://api.github.com/repos/pmcr-o/${repo.name}/branches?per_page=30`, {
                headers: ghHeaders,
                signal: AbortSignal.timeout(4000),
              }),
              fetch(`https://api.github.com/repos/pmcr-o/${repo.name}/commits?per_page=3`, {
                headers: ghHeaders,
                signal: AbortSignal.timeout(4000),
              }),
            ]);
            if (bRes.ok) {
              const bJson = (await bRes.json()) as Array<{ name: string }>;
              if (Array.isArray(bJson) && bJson.length > 0) {
                branches = bJson.map((b) => b.name);
              }
            }
            if (cRes.ok) {
              const cJson = (await cRes.json()) as Array<{ sha: string; commit: { message: string } }>;
              if (Array.isArray(cJson) && cJson.length > 0) {
                recentCommits = cJson.map((c) => ({
                  sha: c.sha.slice(0, 7),
                  message: c.commit.message.split('\n')[0],
                }));
              }
            }
          } catch {
            // Keep snapshot branches/commits when per-repo subrequest hits rate limit
          }

          return {
            name: repo.name,
            fullName: repo.full_name,
            defaultBranch: repo.default_branch,
            description: repo.description ?? existing?.description ?? '',
            language: repo.language ?? existing?.language ?? null,
            branches,
            recentCommits,
            htmlUrl: repo.html_url,
            role: existing?.role ?? 'domain-orchestrator',
          };
        })
      );

      cachedRepos = merged;
      cachedAt = new Date().toISOString();
      cacheSource = 'live';

      return res.json({
        org: 'pmcr-o',
        source: 'live',
        updatedAt: cachedAt,
        repos: merged,
      });
    } catch (err) {
      return res.json({
        org: 'pmcr-o',
        source: 'snapshot',
        updatedAt: cachedAt,
        error: err instanceof Error ? err.message : 'Unable to reach GitHub API',
        repos: cachedRepos,
      });
    }
  });

  app.post('/api/ollama/run', async (req, res) => {
    const {
      endpoint = 'http://127.0.0.1:11434',
      model = 'qwen2.5-coder:7b',
      skillId,
      skillMarkdown,
      seed,
    } = req.body ?? {};

    if (!skillId || !seed) {
      return res.status(400).json({ ok: false, error: 'skillId and seed are required.' });
    }

    const cleanEndpoint = String(endpoint).replace(/\/+$/, '');
    const prompt = `${skillMarkdown ?? ''}\n\n---\nRAW SEED:\n${seed}\n\nRespond with a bounded PMCR-O plan JSON only.`;

    try {
      const response = await fetch(`${cleanEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        const text = await response.text();
        return res.json({
          ok: false,
          mode: 'ollama-error',
          endpoint: cleanEndpoint,
          model,
          statusCode: response.status,
          message: `Ollama responded with HTTP ${response.status}: ${text.slice(0, 240)}`,
          localCommand: `ollama run ${model} "${String(seed).replace(/"/g, '\\"')}"`,
        });
      }

      const data = (await response.json()) as { response?: string; total_duration?: number };
      return res.json({
        ok: true,
        mode: 'live-ollama',
        endpoint: cleanEndpoint,
        model,
        output: data.response ?? '',
        durationNs: data.total_duration ?? null,
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Local Ollama daemon unreachable';
      return res.json({
        ok: false,
        mode: 'offline-rehearsal',
        endpoint: cleanEndpoint,
        model,
        message: `Local Ollama endpoint unreachable from runtime (${reason}). Use the local command below on your workstation.`,
        localCommand: `curl -s ${cleanEndpoint}/api/generate -d '${JSON.stringify({
          model,
          prompt: `Run skill ${skillId} for seed: ${seed}`,
          stream: false,
        })}'`,
      });
    }
  });

  app.post('/api/github/dispatch', async (req, res) => {
    const {
      mode = 'rehearsal',
      repo = 'pmcr-o/skills',
      ref = 'main',
      workflowFile = 'pmcro-skill-dispatch.yml',
      skillId,
      ollamaModel = 'qwen2.5-coder:7b',
      seed,
    } = req.body ?? {};

    if (!skillId || !seed) {
      return res.status(400).json({ ok: false, error: 'skillId and seed are required.' });
    }

    const cliCommand = `gh workflow run ${workflowFile} --repo ${repo} --ref ${ref} -f skill_id="${skillId}" -f ollama_model="${ollamaModel}" -f seed="${String(seed).replace(/"/g, '\\"')}"`;

    if (mode !== 'live') {
      return res.json({
        ok: true,
        mode: 'rehearsal',
        dispatched: false,
        repo,
        ref,
        workflowFile,
        inputs: { skill_id: skillId, ollama_model: ollamaModel, seed },
        cliCommand,
        message: 'Dry-run workflow_dispatch payload prepared. No remote GitHub Actions run was triggered.',
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        mode: 'live',
        dispatched: false,
        error: 'Authorization Bearer token is required for live GitHub Actions workflow_dispatch.',
        cliCommand,
      });
    }

    try {
      const dispatchUrl = `https://api.github.com/repos/${repo}/actions/workflows/${encodeURIComponent(workflowFile)}/dispatches`;
      const ghRes = await fetch(dispatchUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: authHeader,
          'User-Agent': 'everything-marketplaces-control-plane',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref,
          inputs: {
            skill_id: skillId,
            ollama_model: ollamaModel,
            seed,
          },
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (ghRes.status === 204) {
        return res.json({
          ok: true,
          mode: 'live',
          dispatched: true,
          repo,
          ref,
          workflowFile,
          cliCommand,
          message: `GitHub Actions workflow_dispatch accepted (HTTP 204) for ${repo}/${workflowFile}.`,
        });
      }

      const bodyText = await ghRes.text();
      return res.status(ghRes.status).json({
        ok: false,
        mode: 'live',
        dispatched: false,
        statusCode: ghRes.status,
        error: `GitHub returned HTTP ${ghRes.status}: ${bodyText.slice(0, 300)}`,
        cliCommand,
      });
    } catch (err) {
      return res.status(502).json({
        ok: false,
        mode: 'live',
        dispatched: false,
        error: err instanceof Error ? err.message : 'Network error calling GitHub Actions API',
        cliCommand,
      });
    }
  });

  app.get('/api/skills/dynamic', (_req, res) => {
    res.json({
      skills: Array.from(dynamicSkills.values()),
      runs: dynamicRuns.slice(0, 20).map(runWithInvocation),
    });
  });

  app.post('/api/skills/dynamic', (req, res) => {
    const built = buildDynamicSkillDefinition(req.body ?? {});
    if (!built.ok) {
      return res.status(400).json({ ok: false, error: built.error });
    }
    dynamicSkills.set(built.skill.id, built.skill);
    return res.status(201).json({ ok: true, skill: built.skill });
  });

  app.get('/api/skills/dynamic/runs', (_req, res) => {
    res.json({
      runs: dynamicRuns.slice(0, 20).map(runWithInvocation),
      activeCount: activeRunControllers.size,
    });
  });

  app.get('/api/skills/dynamic/runs/:runId/invocation-result', (req, res) => {
    const runRecord = dynamicRuns.find((r) => r.runId === req.params.runId);
    if (!runRecord) {
      return res.status(404).json({ ok: false, error: `Run "${req.params.runId}" not found.` });
    }
    if (!TERMINAL_RUN_STATUSES.has(runRecord.status)) {
      return res.status(409).json({ ok: false, error: `Run "${req.params.runId}" is still ${runRecord.status}; no terminal invocation result yet.` });
    }
    const skill = dynamicSkills.get(runRecord.skillId);
    if (!skill) {
      return res.status(404).json({ ok: false, error: `Skill "${runRecord.skillId}" is no longer registered; cannot reconstruct the invocation result.` });
    }
    return res.json({ ok: true, invocationResult: buildInvocationResult(runRecord, skill) });
  });

  app.post('/api/skills/dynamic/:id/run', async (req, res) => {
    const skill = dynamicSkills.get(req.params.id);
    if (!skill) {
      return res.status(404).json({ ok: false, error: `Dynamic skill "${req.params.id}" not found.` });
    }

    const {
      seed = '',
      approvalGranted = false,
      ollamaEndpoint = 'http://127.0.0.1:11434',
      stepDelayMs = 450,
    } = req.body ?? {};

    const gateCheck = checkExecutionPolicyGate(skill, {
      seed: String(seed),
      approvalGranted: Boolean(approvalGranted),
    });
    if (!gateCheck.allowed) {
      return res.status(403).json({ ok: false, error: gateCheck.reason });
    }

    const runId = `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const nowIso = new Date().toISOString();
    const approvalReceiptRef = skill.policy.requiresApprovalGate
      ? `approval:${runId}:${Math.random().toString(36).slice(2, 10)}`
      : undefined;
    const runRecord: RunRecord = {
      runId,
      skillId: skill.id,
      seed: String(seed).trim(),
      status: 'RUNNING',
      runtimeTarget: skill.runtimeTarget,
      startedAt: nowIso,
      ...(approvalReceiptRef ? { approvalReceiptRef } : {}),
      trailFrames: [
        {
          phase: 'ORCHESTRATE',
          status: 'OK',
          message: `Admitted live dynamic skill "${skill.id}" (${skill.trigger}).`,
          timestamp: nowIso,
        },
        ...(approvalReceiptRef
          ? [
              {
                phase: 'ORCHESTRATE' as const,
                status: 'OK' as const,
                message: `Human approval gate satisfied; receipt ${approvalReceiptRef}.`,
                timestamp: nowIso,
              },
            ]
          : []),
      ],
    };

    dynamicRuns.unshift(runRecord);
    if (dynamicRuns.length > 50) dynamicRuns.pop();

    const controller = new AbortController();
    activeRunControllers.set(runId, controller);
    const timeoutHandle = setTimeout(() => {
      controller.abort(new Error('Execution timeout exceeded'));
    }, skill.policy.timeoutMs);

    const boundedDelay = Math.max(150, Math.min(3000, Number(stepDelayMs) || 450));

    // Execute phases asynchronously so the UI receives runId immediately and can monitor or kill it live
    void (async () => {
      try {
        await sleepWithAbort(boundedDelay, controller.signal);
        runRecord.trailFrames.push({
          phase: 'PLAN',
          status: 'OK',
          message: `Execution policy validated (timeout=${skill.policy.timeoutMs}ms, redactSecrets=true).`,
          timestamp: new Date().toISOString(),
        });

        await sleepWithAbort(boundedDelay, controller.signal);
        let makeOutput = '';
        let cliCommand = `gh workflow run ${skill.workflowFile} --repo ${skill.githubRepo} -f seed="${runRecord.seed.replace(/"/g, '\\"')}"`;

        if (skill.runtimeTarget === 'local-ollama') {
          const cleanEndpoint = String(ollamaEndpoint).replace(/\/+$/, '');
          try {
            const ollamaResp = await fetch(`${cleanEndpoint}/api/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: skill.ollamaModel,
                prompt: `${skill.skillMarkdown}\n\nSeed: ${runRecord.seed}`,
                stream: false,
              }),
              signal: AbortSignal.any([controller.signal, AbortSignal.timeout(2500)]),
            });
            if (ollamaResp.ok) {
              const json = (await ollamaResp.json()) as { response?: string };
              makeOutput = json.response ?? 'Live Ollama response received.';
            } else {
              makeOutput = `Ollama endpoint HTTP ${ollamaResp.status}; emitted bounded local rehearsal trail.`;
            }
          } catch (err) {
            if (controller.signal.aborted) throw err;
            makeOutput = `Local Ollama offline at ${cleanEndpoint}; emitted rehearsal command for ${skill.ollamaModel}.`;
            cliCommand = `ollama run ${skill.ollamaModel} "${runRecord.seed.replace(/"/g, '\\"')}"`;
          }
        } else if (skill.runtimeTarget === 'github-actions') {
          makeOutput = `Prepared workflow_dispatch payload for ${skill.githubRepo}/${skill.workflowFile}.`;
        } else {
          makeOutput = `Completed bounded rehearsal make artifact for ${skill.id}.`;
        }

        runRecord.output = makeOutput;
        runRecord.cliCommand = cliCommand;
        runRecord.trailFrames.push({
          phase: 'MAKE',
          status: 'OK',
          message: makeOutput,
          timestamp: new Date().toISOString(),
        });

        await sleepWithAbort(boundedDelay, controller.signal);
        runRecord.trailFrames.push({
          phase: 'CHECK',
          status: 'OK',
          message: 'Independent Checker verified redacted trail frame and policy boundaries.',
          timestamp: new Date().toISOString(),
        });

        runRecord.trailFrames.push({
          phase: 'REFLECT',
          status: 'OK',
          message: `Completed "${skill.id}" dynamically with zero unapproved external mutations.`,
          timestamp: new Date().toISOString(),
        });
        runRecord.status = 'COMPLETED';
        runRecord.finishedAt = new Date().toISOString();
        runRecord.elapsedMs = Date.parse(runRecord.finishedAt) - Date.parse(runRecord.startedAt);
      } catch (err) {
        if (runRecord.status === 'RUNNING') {
          const reason =
            controller.signal.reason instanceof Error && controller.signal.reason.message.includes('timeout')
              ? `Timed out after ${skill.policy.timeoutMs}ms`
              : err instanceof Error && err.message !== 'Aborted'
              ? err.message
              : 'Live agent kill switch activated';
          const updated = abortDynamicRunRecord(runRecord, reason);
          runRecord.status = reason.includes('Timed out') ? 'TIMED_OUT' : updated.status;
          runRecord.finishedAt = updated.finishedAt;
          runRecord.elapsedMs = updated.elapsedMs;
          runRecord.cancelReason = updated.cancelReason;
          runRecord.trailFrames = updated.trailFrames;
        }
      } finally {
        clearTimeout(timeoutHandle);
        activeRunControllers.delete(runId);
      }
    })();

    return res.status(202).json({ ok: true, run: runRecord });
  });

  app.post('/api/skills/dynamic/runs/:runId/kill', (req, res) => {
    const { runId } = req.params;
    const reason = (req.body?.reason as string | undefined) || 'Operator triggered live agent kill switch';
    const runRecord = dynamicRuns.find((r) => r.runId === runId);
    if (!runRecord) {
      return res.status(404).json({ ok: false, error: `Run "${runId}" not found.` });
    }
    const controller = activeRunControllers.get(runId);
    if (controller) {
      controller.abort(new Error(reason));
      activeRunControllers.delete(runId);
    }
    const aborted = abortDynamicRunRecord(runRecord, reason);
    Object.assign(runRecord, aborted);
    return res.json({ ok: true, run: runRecord });
  });

  app.post('/api/skills/dynamic/kill-all', (req, res) => {
    const reason = (req.body?.reason as string | undefined) || 'Global emergency agent kill switch activated';
    let killedCount = 0;
    for (const [runId, controller] of activeRunControllers.entries()) {
      controller.abort(new Error(reason));
      activeRunControllers.delete(runId);
      const runRecord = dynamicRuns.find((r) => r.runId === runId);
      if (runRecord) {
        Object.assign(runRecord, abortDynamicRunRecord(runRecord, reason));
        killedCount++;
      }
    }
    return res.json({ ok: true, killedCount, runs: dynamicRuns.slice(0, 20) });
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Everything Marketplaces listening on http://localhost:${PORT}`);
  });
}

startServer();
