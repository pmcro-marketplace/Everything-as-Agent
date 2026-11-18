export interface AutonomousExecution {
  promotedBehavior: boolean;
  currentAuthorization: boolean;
  currentPolicyAllows: boolean;
  capabilityResolved: boolean;
  providerAvailable: boolean;
  providerInvoked: boolean;
  behavioralIntentSatisfied: boolean;
  checkerVerdict: string;
  cognitiveTrailVerified: boolean;
  driftDetected: boolean;
  priorHumanApproval: boolean;
}

export interface AutonomyQaResult {
  status: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_INVOKED';
  disposition: string;
  errors: string[];
}

export function evaluateAutonomousExecution(run: AutonomousExecution): AutonomyQaResult {
  if (!run.promotedBehavior) {
    return {
      status: 'BLOCKED',
      disposition: 'UNPROMOTED_BEHAVIOR',
      errors: ['autonomous execution requires promoted behavior'],
    };
  }

  if (!run.currentAuthorization || !run.currentPolicyAllows) {
    return {
      status: 'BLOCKED',
      disposition: 'CURRENT_AUTHORITY_REQUIRED',
      errors: [
        run.priorHumanApproval
          ? 'prior human approval does not grant current autonomous authority'
          : 'current authorization and policy must allow the behavior',
      ],
    };
  }

  if (!run.capabilityResolved) {
    return {
      status: 'BLOCKED',
      disposition: 'CAPABILITY_UNRESOLVED',
      errors: ['autonomous execution may not invent or infer a missing capability'],
    };
  }

  if (!run.providerAvailable || !run.providerInvoked) {
    return {
      status: 'NOT_INVOKED',
      disposition: 'PROVIDER_NOT_INVOKED',
      errors: [],
    };
  }

  const errors: string[] = [];
  if (run.driftDetected) errors.push('behavioral drift detected');
  if (!run.behavioralIntentSatisfied) errors.push('observable behavior did not satisfy Behavioral Intent');
  if (run.checkerVerdict !== 'PASS') errors.push('Checker verdict must be PASS');
  if (!run.cognitiveTrailVerified) errors.push('Cognitive Trail must be verified');

  if (errors.length > 0) {
    return {
      status: 'FAIL',
      disposition: 'AUTONOMOUS_EXECUTION_REJECTED',
      errors,
    };
  }

  return {
    status: 'PASS',
    disposition: 'AUTONOMOUS_EXECUTION_PROVEN',
    errors: [],
  };
}
