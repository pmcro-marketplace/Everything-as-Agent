const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const TRAIL_TERMINAL_STATUSES = [
  'PASS',
  'FAIL',
  'BLOCKED',
  'READY_FOR_HANDOFF',
  'UNVERIFIED',
] as const;

export const QA_STATUSES = [
  'PASS',
  'FAIL',
  'LOOP',
  'HALT',
  'BLOCKED',
  'NOT_INVOKED',
  'UNVERIFIED',
] as const;

export const LEARNING_PROMOTION_STATES = [
  'RECORDED',
  'VERIFIED',
  'EVALUATED',
  'APPROVED_FOR_LEARNING',
  'CANDIDATE',
  'TESTED',
  'PROMOTED',
] as const;

export const QA_DEFECT_CATEGORIES = [
  'STRUCTURAL',
  'CONTRACT',
  'RESOLUTION',
  'CAPABILITY',
  'PROVIDER',
  'EXECUTION',
  'BEHAVIOR',
  'INTEGRATION',
  'SECURITY',
  'GOVERNANCE',
  'EVIDENCE',
  'COGNITIVE_TRAIL',
  'LEARNING',
  'AUTONOMY',
  'REGRESSION',
  'DOCUMENTATION',
] as const;

type RecordLike = Record<string, unknown>;

function isRecord(value: unknown): value is RecordLike {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoTimestamp(value: unknown): value is string {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

function hasOwn(value: RecordLike, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export function validatePmcroTrailFrame(input: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(input)) return ['frame must be an object'];

  if (input.kind !== 'PmcroTrailFrame') errors.push('kind must be PmcroTrailFrame');
  if (input.version !== 1) errors.push('version must be 1');

  if (!isNonEmptyString(input.trail_id) || !UUID_V4.test(input.trail_id)) {
    errors.push('trail_id must be a UUID v4');
  }
  if (!isNonEmptyString(input.frame_id) || !UUID_V4.test(input.frame_id)) {
    errors.push('frame_id must be a UUID v4');
  }

  if (input.parent_id !== null && input.parent_id !== undefined) {
    if (!isNonEmptyString(input.parent_id) || !UUID_V4.test(input.parent_id)) {
      errors.push('parent_id must be null or a UUID v4');
    } else if (input.parent_id === input.frame_id) {
      errors.push('parent_id must not equal frame_id');
    }
  }

  if (!isNonEmptyString(input.phase)) errors.push('phase is required');

  if (!isRecord(input.route)) {
    errors.push('route must be an object');
  } else if (!isNonEmptyString(input.route.address)) {
    errors.push('route.address is required');
  }

  if (!isNonEmptyString(input.intent)) errors.push('intent is required');
  if (!hasOwn(input, 'inputs')) errors.push('inputs are required');
  if (!isIsoTimestamp(input.started_at)) errors.push('started_at must be an ISO timestamp');

  const status = input.status;
  const terminal = (TRAIL_TERMINAL_STATUSES as readonly unknown[]).includes(status);
  if (status !== 'STARTED' && !terminal) {
    errors.push('status must be STARTED or a canonical PMCR-O terminal status');
  }

  if (terminal) {
    if (!isIsoTimestamp(input.finished_at)) errors.push('finished_at is required for terminal frames');
    if (!hasOwn(input, 'outcome')) errors.push('outcome is required for terminal frames');
    if (!hasOwn(input, 'evidence')) errors.push('evidence is required for terminal frames');
  }

  return errors;
}

export function validateCognitiveTrailEnvelope(input: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(input)) return ['trail must be an object'];

  if (input.kind !== 'CognitiveTrail') errors.push('kind must be CognitiveTrail');
  if (input.version !== 1) errors.push('version must be 1');

  if (!isNonEmptyString(input.trail_id) || !UUID_V4.test(input.trail_id)) {
    errors.push('trail_id must be a UUID v4');
  }
  if (!isNonEmptyString(input.cycle_id) || !UUID_V4.test(input.cycle_id)) {
    errors.push('cycle_id must be a UUID v4');
  }
  if (!isNonEmptyString(input.raw_intent)) errors.push('raw_intent is required');
  if (!isNonEmptyString(input.high_level_goal)) errors.push('high_level_goal is required');

  if (!Array.isArray(input.frames) || input.frames.length === 0) {
    errors.push('frames must contain at least one PMCR-O Trail frame');
  } else {
    input.frames.forEach((frame, index) => {
      const frameErrors = validatePmcroTrailFrame(frame);
      for (const error of frameErrors) errors.push(`frames[${index}]: ${error}`);
      if (isRecord(frame) && isNonEmptyString(input.trail_id) && frame.trail_id !== input.trail_id) {
        errors.push(`frames[${index}]: trail_id does not match envelope`);
      }
    });

    if (input.complete_cycle === true) {
      const phases = new Set(
        input.frames
          .filter(isRecord)
          .map((frame) => frame.phase)
          .filter(isNonEmptyString)
      );
      for (const phase of ['orchestrate', 'plan', 'make', 'check', 'reflect']) {
        if (!phases.has(phase)) errors.push(`complete cycle is missing ${phase} frame`);
      }
    }
  }

  if (!isNonEmptyString(input.checker_verdict)) errors.push('checker_verdict is required');

  if (input.promotion_state !== undefined &&
      !(LEARNING_PROMOTION_STATES as readonly unknown[]).includes(input.promotion_state)) {
    errors.push('promotion_state is invalid');
  }

  if (input.hidden_chain_of_thought_required === true) {
    errors.push('Cognitive Trail must not require hidden chain-of-thought');
  }

  return errors;
}

export function validateQaReport(input: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(input)) return ['report must be an object'];

  for (const key of ['subject', 'behavioral_intent', 'environment', 'next_intent']) {
    if (!isNonEmptyString(input[key])) errors.push(`${key} is required`);
  }

  if (!(QA_STATUSES as readonly unknown[]).includes(input.status)) {
    errors.push('status is invalid');
  }

  if (!isRecord(input.resolved_capability)) {
    errors.push('resolved_capability must be an object');
  } else {
    for (const key of ['agent', 'plugin', 'skill', 'function']) {
      if (!isNonEmptyString(input.resolved_capability[key])) {
        errors.push(`resolved_capability.${key} is required`);
      }
    }
  }

  for (const key of [
    'tests_performed',
    'tests_skipped',
    'evidence',
    'defects',
    'capability_gaps',
    'governance_violations',
    'regressions',
    'learning_candidates',
  ]) {
    if (!Array.isArray(input[key])) errors.push(`${key} must be an array`);
  }

  if (!isNonEmptyString(input.checker_verdict)) errors.push('checker_verdict is required');

  if (input.status === 'PASS') {
    if (!Array.isArray(input.evidence) || input.evidence.length === 0) {
      errors.push('PASS requires evidence');
    }
    if (input.checker_verdict !== 'PASS') {
      errors.push('PASS requires checker_verdict PASS');
    }
  }

  if (input.cognitive_trail_id !== null && input.cognitive_trail_id !== undefined) {
    if (!isNonEmptyString(input.cognitive_trail_id) || !UUID_V4.test(input.cognitive_trail_id)) {
      errors.push('cognitive_trail_id must be null or a UUID v4');
    }
  }

  return errors;
}
