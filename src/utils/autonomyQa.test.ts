import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAutonomousExecution } from './autonomyQa';

const validRun = {
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
};

test('validated promoted behavior can pass Autonomous-in-the-Loop QA', () => {
  assert.deepEqual(evaluateAutonomousExecution(validRun), {
    status: 'PASS',
    disposition: 'AUTONOMOUS_EXECUTION_PROVEN',
    errors: [],
  });
});

test('prior human approval does not replace current authorization', () => {
  const result = evaluateAutonomousExecution({
    ...validRun,
    currentAuthorization: false,
    priorHumanApproval: true,
  });
  assert.equal(result.status, 'BLOCKED');
  assert.ok(result.errors.includes('prior human approval does not grant current autonomous authority'));
});

test('unpromoted behavior is blocked before execution', () => {
  const result = evaluateAutonomousExecution({
    ...validRun,
    promotedBehavior: false,
  });
  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.disposition, 'UNPROMOTED_BEHAVIOR');
});

test('providerless autonomous behavior is NOT_INVOKED', () => {
  const result = evaluateAutonomousExecution({
    ...validRun,
    providerAvailable: false,
    providerInvoked: false,
  });
  assert.equal(result.status, 'NOT_INVOKED');
  assert.equal(result.disposition, 'PROVIDER_NOT_INVOKED');
});

test('behavioral drift or an unverified trail rejects autonomous execution', () => {
  const result = evaluateAutonomousExecution({
    ...validRun,
    driftDetected: true,
    cognitiveTrailVerified: false,
  });
  assert.equal(result.status, 'FAIL');
  assert.ok(result.errors.includes('behavioral drift detected'));
  assert.ok(result.errors.includes('Cognitive Trail must be verified'));
});
