import test from 'node:test';
import assert from 'node:assert/strict';
import {
  abortDynamicRunRecord,
  buildDynamicSkillDefinition,
  checkExecutionPolicyGate,
  type DynamicSkillRun,
} from './dynamicSkillRuntime';

test('buildDynamicSkillDefinition enforces identity preservation and validates IDs', () => {
  const rejected = buildDynamicSkillDefinition({
    id: 'live-skill-one',
    requestedRenameId: 'renamed-skill',
    sourceNamespace: 'pmcr-o/skills',
    summary: 'Dynamic skill',
    trigger: 'workflow_dispatch',
    runtimeTarget: 'local-ollama',
    ollamaModel: 'qwen2.5-coder:7b',
    githubRepo: 'pmcr-o/skills',
    workflowFile: 'live-skill-one.yml',
    timeoutMs: 10000,
    requiresApprovalGate: false,
  });
  assert.equal(rejected.ok, false);

  const created = buildDynamicSkillDefinition({
    id: 'live-skill-one',
    sourceNamespace: 'pmcr-o/skills',
    summary: 'Dynamic skill',
    trigger: 'workflow_dispatch',
    runtimeTarget: 'local-ollama',
    ollamaModel: 'qwen2.5-coder:7b',
    githubRepo: 'pmcr-o/skills',
    workflowFile: 'live-skill-one.yml',
    timeoutMs: 10000,
    requiresApprovalGate: true,
  });
  assert.equal(created.ok, true);
  if (created.ok) {
    assert.equal(created.skill.policy.timeoutMs, 10000);
    assert.equal(created.skill.policy.requiresApprovalGate, true);
    assert.ok(created.skill.workflowYaml.includes('workflow_dispatch'));
  }
});

test('checkExecutionPolicyGate enforces skip-check halt and approval gate', () => {
  const created = buildDynamicSkillDefinition({
    id: 'gated-skill',
    sourceNamespace: 'pmcr-o/skills',
    summary: 'Gated skill',
    trigger: 'manual',
    runtimeTarget: 'github-actions',
    ollamaModel: 'qwen2.5-coder:7b',
    githubRepo: 'pmcr-o/skills',
    workflowFile: 'gated.yml',
    timeoutMs: 15000,
    requiresApprovalGate: true,
  });
  assert.equal(created.ok, true);
  if (!created.ok) return;

  assert.equal(
    checkExecutionPolicyGate(created.skill, { seed: 'skip check now', approvalGranted: true }).allowed,
    false
  );
  assert.equal(
    checkExecutionPolicyGate(created.skill, { seed: 'Valid seed', approvalGranted: false }).allowed,
    false
  );
  assert.equal(
    checkExecutionPolicyGate(created.skill, { seed: 'Valid seed', approvalGranted: true }).allowed,
    true
  );
});

test('abortDynamicRunRecord cancels an active RUNNING run and appends CANCEL trail frame', () => {
  const activeRun: DynamicSkillRun = {
    runId: 'run-123',
    skillId: 'live-skill-one',
    seed: 'Execute check',
    status: 'RUNNING',
    runtimeTarget: 'bounded-rehearsal',
    startedAt: '2026-11-15T03:00:00.000Z',
    trailFrames: [
      {
        phase: 'ORCHESTRATE',
        status: 'OK',
        message: 'Admitted seed',
        timestamp: '2026-11-15T03:00:00.100Z',
      },
    ],
  };

  const aborted = abortDynamicRunRecord(
    activeRun,
    'Emergency kill switch triggered',
    '2026-11-15T03:00:02.000Z'
  );
  assert.equal(aborted.status, 'CANCELLED');
  assert.equal(aborted.elapsedMs, 2000);
  assert.equal(aborted.trailFrames.at(-1)?.phase, 'CANCEL');
  assert.equal(aborted.trailFrames.at(-1)?.status, 'CANCELLED');
});
