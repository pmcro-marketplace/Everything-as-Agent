import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLearningUse, validatePromotionTransition } from './learningQa';

const verifiedCandidate = {
  source_trail_verified: true,
  checker_verdict: 'PASS',
  promotion_state: 'CANDIDATE',
  approved_uses: ['retrieval', 'model-training'],
  evidence: ['checker-pass', 'trail-seal'],
};

test('learning promotion cannot skip governed states', () => {
  assert.deepEqual(validatePromotionTransition('RECORDED', 'VERIFIED'), []);
  assert.deepEqual(
    validatePromotionTransition('RECORDED', 'CANDIDATE'),
    ['promotion may advance by only one governed state at a time']
  );
});

test('PMCR-O fine-tuning stays NOT_INVOKED when no training provider resolves', () => {
  assert.deepEqual(evaluateLearningUse(verifiedCandidate, 'model-training', null), {
    status: 'NOT_INVOKED',
    disposition: 'TRAINING_PROVIDER_MISSING',
    training_invocation: 'NOT_INVOKED',
    errors: [],
  });
});

test('a real provider makes a candidate ready but does not imply training executed', () => {
  assert.deepEqual(evaluateLearningUse(verifiedCandidate, 'model-training', 'training-provider'), {
    status: 'PASS',
    disposition: 'READY_FOR_TRAINING',
    training_invocation: 'NOT_INVOKED',
    errors: [],
  });
});

test('unverified trails cannot become learning input', () => {
  const result = evaluateLearningUse(
    { ...verifiedCandidate, source_trail_verified: false },
    'retrieval',
    null
  );
  assert.equal(result.status, 'BLOCKED');
  assert.ok(result.errors.includes('source Cognitive Trail is not verified'));
});

test('recorded evidence is not automatically approved for retrieval', () => {
  const result = evaluateLearningUse(
    { ...verifiedCandidate, promotion_state: 'RECORDED' },
    'retrieval',
    null
  );
  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.disposition, 'NOT_APPROVED_FOR_LEARNING');
});
