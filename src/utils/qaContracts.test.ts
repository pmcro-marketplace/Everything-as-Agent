import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCognitiveTrailEnvelope,
  validatePmcroTrailFrame,
  validateQaReport,
} from './qaContracts';

const trailId = '123e4567-e89b-42d3-a456-426614174000';
const cycleId = '223e4567-e89b-42d3-a456-426614174001';

function frame(phase: string, frameId: string, parentId: string | null = null) {
  return {
    kind: 'PmcroTrailFrame',
    version: 1,
    trail_id: trailId,
    frame_id: frameId,
    parent_id: parentId,
    phase,
    route: {
      agent: `${phase}-agent`,
      plugin: phase,
      skill: phase,
      address: `/${phase}:${phase}:${phase}`,
    },
    intent: 'Prove the QA foundation.',
    inputs: { cycle_id: cycleId },
    started_at: '2026-11-18T18:00:00+00:00',
    status: 'PASS',
    finished_at: '2026-11-18T18:00:01+00:00',
    outcome: { invocation: 'INVOKED' },
    evidence: [{ receipt: phase }],
  };
}

test('canonical PMCR-O terminal Trail frame validates', () => {
  assert.deepEqual(
    validatePmcroTrailFrame(frame('check', '323e4567-e89b-42d3-a456-426614174002')),
    []
  );
});

test('Trail frame rejects self-parenting and missing route address', () => {
  const id = '423e4567-e89b-42d3-a456-426614174003';
  const bad = frame('make', id, id);
  bad.route.address = '';
  const errors = validatePmcroTrailFrame(bad);
  assert.ok(errors.includes('parent_id must not equal frame_id'));
  assert.ok(errors.includes('route.address is required'));
});

test('complete Cognitive Trail requires all five PMCR-O phases', () => {
  const base = {
    kind: 'CognitiveTrail',
    version: 1,
    trail_id: trailId,
    cycle_id: cycleId,
    raw_intent: 'Create the complete QA system.',
    high_level_goal: 'Prove Everything-as-Agent behavior.',
    complete_cycle: true,
    frames: [
      frame('orchestrate', '523e4567-e89b-42d3-a456-426614174004'),
      frame('plan', '623e4567-e89b-42d3-a456-426614174005'),
      frame('make', '723e4567-e89b-42d3-a456-426614174006'),
      frame('check', '823e4567-e89b-42d3-a456-426614174007'),
      frame('reflect', '923e4567-e89b-42d3-a456-426614174008'),
    ],
    checker_verdict: 'PASS',
    promotion_state: 'VERIFIED',
    hidden_chain_of_thought_required: false,
  };
  assert.deepEqual(validateCognitiveTrailEnvelope(base), []);

  const broken = { ...base, frames: base.frames.filter((item) => item.phase !== 'reflect') };
  assert.ok(validateCognitiveTrailEnvelope(broken).includes('complete cycle is missing reflect frame'));
});

test('Cognitive Trail rejects hidden chain-of-thought as a requirement', () => {
  const errors = validateCognitiveTrailEnvelope({
    kind: 'CognitiveTrail',
    version: 1,
    trail_id: trailId,
    cycle_id: cycleId,
    raw_intent: 'test',
    high_level_goal: 'test',
    complete_cycle: false,
    frames: [frame('check', 'a23e4567-e89b-42d3-a456-426614174009')],
    checker_verdict: 'PASS',
    hidden_chain_of_thought_required: true,
  });
  assert.ok(errors.includes('Cognitive Trail must not require hidden chain-of-thought'));
});

test('QA PASS requires actual evidence and Checker PASS', () => {
  const report = {
    subject: 'Everything-as-Agent',
    behavioral_intent: 'Verify QA foundation',
    resolved_capability: {
      agent: 'github-agent',
      plugin: 'github',
      skill: 'actions',
      function: 'verify-run',
    },
    provider: 'GitHub Actions',
    environment: 'github-hosted',
    status: 'PASS',
    tests_performed: ['build'],
    tests_skipped: [],
    evidence: [],
    cognitive_trail_id: trailId,
    defects: [],
    capability_gaps: [],
    governance_violations: [],
    regressions: [],
    learning_candidates: [],
    checker_verdict: 'FAIL',
    next_intent: 'Fix failures',
  };
  const errors = validateQaReport(report);
  assert.ok(errors.includes('PASS requires evidence'));
  assert.ok(errors.includes('PASS requires checker_verdict PASS'));
});

test('NOT_INVOKED QA report can truthfully record an unavailable provider', () => {
  assert.deepEqual(validateQaReport({
    subject: 'Training Agent',
    behavioral_intent: 'Fine-tune PMCR-O',
    resolved_capability: {
      agent: 'training-agent',
      plugin: 'training',
      skill: 'fine-tune',
      function: 'run',
    },
    provider: null,
    environment: 'current-host',
    status: 'NOT_INVOKED',
    tests_performed: [],
    tests_skipped: ['training execution'],
    evidence: ['No executable training provider resolved'],
    cognitive_trail_id: null,
    defects: [],
    capability_gaps: ['training provider'],
    governance_violations: [],
    regressions: [],
    learning_candidates: [],
    checker_verdict: 'NOT_INVOKED',
    next_intent: 'Resolve an authorized training provider',
  }), []);
});
