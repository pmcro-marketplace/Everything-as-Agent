import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRecursiveCapabilityPath } from './recursiveCapabilityQa';

const validPath = {
  originalCapabilityFound: false,
  originalInvocation: 'NOT_INVOKED' as const,
  creatorResolvedFromMarketplace: true,
  creatorProviderInvoked: true,
  candidateValidated: true,
  candidateRegistered: true,
  originalCapabilityReresolved: true,
  finalProviderAvailable: true,
  finalInvocation: 'INVOKED' as const,
  manualBypass: false,
  recursionCycleDetected: false,
};

test('recursive creation passes only after creation, validation, registration, re-resolution, and invocation', () => {
  assert.deepEqual(evaluateRecursiveCapabilityPath(validPath), {
    status: 'PASS',
    disposition: 'RECURSIVE_CAPABILITY_PROVEN',
    errors: [],
  });
});

test('missing functionality cannot be claimed as invoked before creation', () => {
  const result = evaluateRecursiveCapabilityPath({
    ...validPath,
    originalInvocation: 'INVOKED',
  });
  assert.equal(result.status, 'FAIL');
  assert.ok(result.errors.includes('missing original capability must not be invoked'));
});

test('manual host-tool bypass is rejected', () => {
  const result = evaluateRecursiveCapabilityPath({
    ...validPath,
    manualBypass: true,
  });
  assert.equal(result.status, 'FAIL');
  assert.equal(result.disposition, 'MANUAL_BYPASS_REJECTED');
});

test('recursive creator cycles fail closed at the trust-root boundary', () => {
  const result = evaluateRecursiveCapabilityPath({
    ...validPath,
    recursionCycleDetected: true,
  });
  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.disposition, 'RECURSION_TRUST_ROOT_REQUIRED');
});

test('registration without a final provider remains NOT_INVOKED', () => {
  const result = evaluateRecursiveCapabilityPath({
    ...validPath,
    finalProviderAvailable: false,
    finalInvocation: 'NOT_INVOKED',
  });
  assert.equal(result.status, 'NOT_INVOKED');
  assert.equal(result.disposition, 'FINAL_PROVIDER_MISSING');
});
