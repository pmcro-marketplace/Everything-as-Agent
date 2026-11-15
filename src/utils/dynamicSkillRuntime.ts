export type DynamicTriggerKind = 'manual' | 'workflow_dispatch' | 'schedule' | 'pull_request';

export type DynamicRunStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'TIMED_OUT' | 'FAILED';

export interface ExecutionSafetyPolicy {
  timeoutMs: number;
  maxRetries: number;
  requiresApprovalGate: boolean;
  redactSecrets: boolean;
}

export interface DynamicSkillDefinition {
  id: string;
  sourceNamespace: string;
  summary: string;
  trigger: DynamicTriggerKind;
  runtimeTarget: 'local-ollama' | 'github-actions' | 'bounded-rehearsal';
  ollamaModel: string;
  githubRepo: string;
  workflowFile: string;
  policy: ExecutionSafetyPolicy;
  createdAt: string;
  skillMarkdown: string;
  workflowYaml: string;
}

export interface EnterpriseTrailFrame {
  phase: 'ORCHESTRATE' | 'PLAN' | 'MAKE' | 'CHECK' | 'REFLECT' | 'CANCEL';
  status: 'OK' | 'BLOCKED' | 'CANCELLED' | 'ERROR';
  message: string;
  timestamp: string;
}

export interface DynamicSkillRun {
  runId: string;
  skillId: string;
  seed: string;
  status: DynamicRunStatus;
  runtimeTarget: DynamicSkillDefinition['runtimeTarget'];
  startedAt: string;
  finishedAt?: string;
  elapsedMs?: number;
  output?: string;
  cliCommand?: string;
  cancelReason?: string;
  trailFrames: EnterpriseTrailFrame[];
}

export interface CreateDynamicSkillInput {
  id: string;
  requestedRenameId?: string;
  sourceNamespace: string;
  summary: string;
  trigger: DynamicTriggerKind;
  runtimeTarget: DynamicSkillDefinition['runtimeTarget'];
  ollamaModel: string;
  githubRepo: string;
  workflowFile: string;
  timeoutMs: number;
  requiresApprovalGate: boolean;
}

export function buildDynamicSkillDefinition(
  input: CreateDynamicSkillInput,
  nowIso = new Date().toISOString()
): { ok: true; skill: DynamicSkillDefinition } | { ok: false; error: string } {
  const id = input.id.trim();
  const requestedRenameId = (input.requestedRenameId ?? id).trim();

  if (!id) {
    return { ok: false, error: 'Dynamic AgentSkill ID is required.' };
  }
  if (!/^[a-z0-9][a-z0-9-_]{1,63}$/i.test(id)) {
    return {
      ok: false,
      error: 'Dynamic AgentSkill ID must be 2–64 alphanumeric, hyphen, or underscore characters.',
    };
  }
  if (requestedRenameId !== id) {
    return {
      ok: false,
      error: `Identity preservation violated: cannot rename "${id}" to "${requestedRenameId}".`,
    };
  }

  const timeoutMs = Math.max(1000, Math.min(120000, Number(input.timeoutMs) || 15000));
  const triggerLine =
    input.trigger === 'schedule'
      ? `schedule:\n    - cron: '0 */6 * * *'`
      : input.trigger === 'pull_request'
      ? `pull_request:\n    branches: [main]`
      : input.trigger === 'manual'
      ? `workflow_dispatch:`
      : `workflow_dispatch:\n    inputs:\n      seed:\n        required: true\n        default: 'Run dynamic skill ${id}'`;

  const skillMarkdown = `---
name: ${id}
sourceNamespace: ${input.sourceNamespace}
trigger: ${input.trigger}
runtimeTarget: ${input.runtimeTarget}
timeoutMs: ${timeoutMs}
requiresApprovalGate: ${input.requiresApprovalGate}
identityImmutable: true
---

# ${id}

I am the live dynamic AgentSkill \`${id}\` operating under PMCR-O Increment 15 & 18 execution safety contracts.

## Mandate
${input.summary || 'Execute bounded dynamic PMCR-O skill steps with explicit cancellation support.'}

## Execution Safety & Policy
- Timeout Contract: \`${timeoutMs}ms\`
- Cancellation: Immediate \`AbortController\` kill signal supported
- Evidence Redaction: \`redactSecrets=true\`
- Approval Gate: \`${input.requiresApprovalGate}\`
`;

  const workflowYaml = `name: PMCR-O Live Dynamic Skill (${id})

on:
  ${triggerLine}

jobs:
  execute-dynamic-skill:
    runs-on: ubuntu-latest
    timeout-minutes: ${Math.max(1, Math.ceil(timeoutMs / 60000))}
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - name: Execute ${id} (${input.runtimeTarget})
        run: |
          echo "Running dynamic AgentSkill ${id} with model ${input.ollamaModel}"
`;

  return {
    ok: true,
    skill: {
      id,
      sourceNamespace: input.sourceNamespace.trim() || 'pmcr-o/skills',
      summary: input.summary.trim() || 'Bounded dynamic PMCR-O AgentSkill.',
      trigger: input.trigger,
      runtimeTarget: input.runtimeTarget,
      ollamaModel: input.ollamaModel.trim() || 'qwen2.5-coder:7b',
      githubRepo: input.githubRepo.trim() || 'pmcr-o/skills',
      workflowFile: input.workflowFile.trim() || `${id}.yml`,
      policy: {
        timeoutMs,
        maxRetries: 1,
        requiresApprovalGate: Boolean(input.requiresApprovalGate),
        redactSecrets: true,
      },
      createdAt: nowIso,
      skillMarkdown,
      workflowYaml,
    },
  };
}

export function checkExecutionPolicyGate(
  skill: DynamicSkillDefinition,
  options: { seed: string; approvalGranted: boolean }
): { allowed: boolean; reason?: string } {
  if (!options.seed.trim()) {
    return { allowed: false, reason: 'Raw seed cannot be empty.' };
  }
  if (/\bskip\s+check\b/i.test(options.seed)) {
    return {
      allowed: false,
      reason: 'HALT: Seed contains "skip check", violating independent Checker invariant.',
    };
  }
  if (skill.policy.requiresApprovalGate && !options.approvalGranted) {
    return {
      allowed: false,
      reason: `Approval gate active for "${skill.id}". Grant explicit execution approval before running.`,
    };
  }
  return { allowed: true };
}

export function abortDynamicRunRecord(
  run: DynamicSkillRun,
  reason = 'Operator triggered live agent kill switch',
  nowIso = new Date().toISOString()
): DynamicSkillRun {
  if (run.status !== 'RUNNING' && run.status !== 'QUEUED') {
    return run;
  }
  const elapsedMs = Math.max(0, Date.parse(nowIso) - Date.parse(run.startedAt) || 0);
  return {
    ...run,
    status: 'CANCELLED',
    finishedAt: nowIso,
    elapsedMs,
    cancelReason: reason,
    trailFrames: [
      ...run.trailFrames,
      {
        phase: 'CANCEL',
        status: 'CANCELLED',
        message: `${reason} (${elapsedMs}ms elapsed).`,
        timestamp: nowIso,
      },
    ],
  };
}
