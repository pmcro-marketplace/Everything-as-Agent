import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateAutonomousExecution } from './autonomyQa';
import { evaluateLearningUse } from './learningQa';
import { evaluateRecursiveCapabilityPath } from './recursiveCapabilityQa';
import { validateCognitiveTrailEnvelope, validateQaReport } from './qaContracts';

const trailId = '123e4567-e89b-42d3-a456-426614174000';
const cycleId = '223e4567-e89b-42d3-a456-426614174001';

test('QA self-proof rejects a fabricated PASS with no execution evidence', () => {
  const errors = validateQaReport({
    subject: 'qa-self-proof',
    behavioral_intent: 'Prove QA against itself',
    resolved_capability: {
      agent: 'qa-agent',
      plugin: 'qa',
      skill: 'self-proof',
      function: 'run',
    },
    provider: 'declared-only',
    environment: 'test',
    status: 'PASS',
    tests_performed: ['claimed-test'],
    tests_skipped: [],
    evidence: [],
    cognitive_trail_id: null,
    defects: [],
    capability_gaps: [],
    governance_violations: [],
    regressions: [],
    learning_candidates: [],
    checker_verdict: 'PASS',
    next_intent: 'none',
  });

  assert.ok(errors.includes('PASS requires evidence'));
});

test('QA self-proof rejects Cognitive Trails that require hidden chain-of-thought', () => {
  const errors = validateCognitiveTrailEnvelope({
    kind: 'CognitiveTrail',
    version: 1,
    trail_id: trailId,
    cycle_id: cycleId,
    raw_intent: 'Prove QA',
    high_level_goal: 'Keep evidence reconstructible',
    complete_cycle: false,
    frames: [{
      kind: 'PmcroTrailFrame',
      version: 1,
      trail_id: trailId,
      frame_id: '323e4567-e89b-42d3-a456-426614174002',
      parent_id: null,
      phase: 'check',
      route: { address: '/checker:check:check' },
      intent: 'Prove QA',
      inputs: {},
      started_at: '2026-11-18T18:00:00Z',
      status: 'PASS',
      finished_at: '2026-11-18T18:00:01Z',
      outcome: { invocation: 'INVOKED' },
      evidence: ['receipt'],
    }],
    checker_verdict: 'PASS',
    hidden_chain_of_thought_required: true,
  });

  assert.ok(errors.includes('Cognitive Trail must not require hidden chain-of-thought'));
});

test('QA self-proof keeps PMCR-O fine-tuning NOT_INVOKED without a training provider', () => {
  const result = evaluateLearningUse({
    source_trail_verified: true,
    checker_verdict: 'PASS',
    promotion_state: 'CANDIDATE',
    approved_uses: ['model-training'],
    evidence: ['verified-trail', 'checker-pass'],
  }, 'model-training', null);

  assert.equal(result.status, 'NOT_INVOKED');
  assert.equal(result.disposition, 'TRAINING_PROVIDER_MISSING');
  assert.equal(result.training_invocation, 'NOT_INVOKED');
});

test('QA self-proof rejects recursive capability bypass', () => {
  const result = evaluateRecursiveCapabilityPath({
    originalCapabilityFound: false,
    originalInvocation: 'NOT_INVOKED',
    creatorResolvedFromMarketplace: true,
    creatorProviderInvoked: true,
    candidateValidated: true,
    candidateRegistered: true,
    originalCapabilityReresolved: true,
    finalProviderAvailable: true,
    finalInvocation: 'INVOKED',
    manualBypass: true,
    recursionCycleDetected: false,
  });

  assert.equal(result.status, 'FAIL');
  assert.equal(result.disposition, 'MANUAL_BYPASS_REJECTED');
});

test('QA self-proof blocks unpromoted autonomous behavior', () => {
  const result = evaluateAutonomousExecution({
    promotedBehavior: false,
    currentAuthorization: true,
    currentPolicyAllows: true,
    capabilityResolved: true,
    providerAvailable: true,
    providerInvoked: true,
    behavioralIntentSatisfied: true,
    checkerVerdict: 'PASS',
    cognitiveTrailVerified: true,
    driftDetected: false,
    priorHumanApproval: false,
  });

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.disposition, 'UNPROMOTED_BEHAVIOR');
});

test('QA self-proof accepts one fully governed evidence-backed path', () => {
  const reportErrors = validateQaReport({
    subject: 'Everything-as-Agent QA',
    behavioral_intent: 'Prove a governed path',
    resolved_capability: {
      agent: 'github-agent',
      plugin: 'github',
      skill: 'actions',
      function: 'verify-run',
    },
    provider: 'GitHub Actions',
    environment: 'github-hosted',
    status: 'PASS',
    tests_performed: ['contract', 'behavior', 'build'],
    tests_skipped: [],
    evidence: ['workflow-run-receipt'],
    cognitive_trail_id: null,
    defects: [],
    capability_gaps: [],
    governance_violations: [],
    regressions: [],
    learning_candidates: [],
    checker_verdict: 'PASS',
    next_intent: 'continue-self-proof',
  });
  assert.deepEqual(reportErrors, []);

  const learning = evaluateLearningUse({
    source_trail_verified: true,
    checker_verdict: 'PASS',
    promotion_state: 'APPROVED_FOR_LEARNING',
    approved_uses: ['retrieval'],
    evidence: ['verified-trail'],
  }, 'retrieval', null);
  assert.equal(learning.status, 'PASS');

  const recursive = evaluateRecursiveCapabilityPath({
    originalCapabilityFound: false,
    originalInvocation: 'NOT_INVOKED',
    creatorResolvedFromMarketplace: true,
    creatorProviderInvoked: true,
    candidateValidated: true,
    candidateRegistered: true,
    originalCapabilityReresolved: true,
    finalProviderAvailable: true,
    finalInvocation: 'INVOKED',
    manualBypass: false,
    recursionCycleDetected: false,
  });
  assert.equal(recursive.status, 'PASS');

  const autonomy = evaluateAutonomousExecution({
    promotedBehavior: true,
    currentAuthorization: true,
    currentPolicyAllows: true,
    capabilityResolved: true,
    providerAvailable: true,
    providerInvoked: true,
    behavioralIntentSatisfied: true,
    checkerVerdict: 'PASS',
    cognitiveTrailVerified: true,
    driftDetected: false,
    priorHumanApproval: false,
  });
  assert.equal(autonomy.status, 'PASS');
});
