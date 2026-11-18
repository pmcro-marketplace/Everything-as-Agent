import { LEARNING_PROMOTION_STATES } from './qaContracts';

export type LearningUse =
  | 'retrieval'
  | 'skill-generation'
  | 'policy-optimization'
  | 'prompt-optimization'
  | 'model-training';

export interface LearningCandidate {
  source_trail_verified: boolean;
  checker_verdict: string;
  promotion_state: string;
  approved_uses: string[];
  evidence: unknown[];
}

export interface LearningQaResult {
  status: 'PASS' | 'BLOCKED' | 'NOT_INVOKED';
  disposition: string;
  training_invocation: 'INVOKED' | 'NOT_INVOKED';
  errors: string[];
}

function promotionIndex(state: string): number {
  return (LEARNING_PROMOTION_STATES as readonly string[]).indexOf(state);
}

export function validatePromotionTransition(from: string, to: string): string[] {
  const fromIndex = promotionIndex(from);
  const toIndex = promotionIndex(to);
  if (fromIndex < 0) return ['source promotion state is invalid'];
  if (toIndex < 0) return ['target promotion state is invalid'];
  if (toIndex !== fromIndex && toIndex !== fromIndex + 1) {
    return ['promotion may advance by only one governed state at a time'];
  }
  return [];
}

export function evaluateLearningUse(
  candidate: LearningCandidate,
  requestedUse: LearningUse,
  trainingProvider: string | null
): LearningQaResult {
  const errors: string[] = [];

  if (!candidate.source_trail_verified) errors.push('source Cognitive Trail is not verified');
  if (candidate.checker_verdict !== 'PASS') errors.push('source Checker verdict must be PASS');
  if (promotionIndex(candidate.promotion_state) < 0) errors.push('promotion state is invalid');
  if (!Array.isArray(candidate.evidence) || candidate.evidence.length === 0) {
    errors.push('learning candidate requires evidence');
  }
  if (!candidate.approved_uses.includes(requestedUse)) {
    errors.push('requested learning use is not approved');
  }

  if (errors.length > 0) {
    return {
      status: 'BLOCKED',
      disposition: 'REJECT_LEARNING_USE',
      training_invocation: 'NOT_INVOKED',
      errors,
    };
  }

  const stateIndex = promotionIndex(candidate.promotion_state);

  if (requestedUse === 'model-training') {
    const candidateIndex = promotionIndex('CANDIDATE');
    if (stateIndex < candidateIndex) {
      return {
        status: 'BLOCKED',
        disposition: 'NOT_READY_FOR_TRAINING',
        training_invocation: 'NOT_INVOKED',
        errors: ['model training requires CANDIDATE or later promotion state'],
      };
    }

    if (!trainingProvider) {
      return {
        status: 'NOT_INVOKED',
        disposition: 'TRAINING_PROVIDER_MISSING',
        training_invocation: 'NOT_INVOKED',
        errors: [],
      };
    }

    return {
      status: 'PASS',
      disposition: 'READY_FOR_TRAINING',
      training_invocation: 'NOT_INVOKED',
      errors: [],
    };
  }

  const approvedIndex = promotionIndex('APPROVED_FOR_LEARNING');
  if (stateIndex < approvedIndex) {
    return {
      status: 'BLOCKED',
      disposition: 'NOT_APPROVED_FOR_LEARNING',
      training_invocation: 'NOT_INVOKED',
      errors: ['non-training reuse requires APPROVED_FOR_LEARNING or later'],
    };
  }

  return {
    status: 'PASS',
    disposition: 'LEARNING_USE_ALLOWED',
    training_invocation: 'NOT_INVOKED',
    errors: [],
  };
}
