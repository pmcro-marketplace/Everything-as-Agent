export interface RecursiveCapabilityPath {
  originalCapabilityFound: boolean;
  originalInvocation: 'INVOKED' | 'NOT_INVOKED' | 'BLOCKED';
  creatorResolvedFromMarketplace: boolean;
  creatorProviderInvoked: boolean;
  candidateValidated: boolean;
  candidateRegistered: boolean;
  originalCapabilityReresolved: boolean;
  finalProviderAvailable: boolean;
  finalInvocation: 'INVOKED' | 'NOT_INVOKED' | 'BLOCKED';
  manualBypass: boolean;
  recursionCycleDetected: boolean;
}

export interface RecursiveCapabilityQaResult {
  status: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_INVOKED';
  disposition: string;
  errors: string[];
}

export function evaluateRecursiveCapabilityPath(path: RecursiveCapabilityPath): RecursiveCapabilityQaResult {
  const errors: string[] = [];

  if (path.manualBypass) {
    return {
      status: 'FAIL',
      disposition: 'MANUAL_BYPASS_REJECTED',
      errors: ['manual or host-tool bypass violates the Recursive Capability Law'],
    };
  }

  if (path.recursionCycleDetected) {
    return {
      status: 'BLOCKED',
      disposition: 'RECURSION_TRUST_ROOT_REQUIRED',
      errors: ['recursive capability acquisition did not reach an existing trusted bootstrap capability'],
    };
  }

  if (path.originalCapabilityFound) {
    if (!path.finalProviderAvailable) {
      return {
        status: 'NOT_INVOKED',
        disposition: 'PROVIDER_MISSING',
        errors: [],
      };
    }
    return path.finalInvocation === 'INVOKED'
      ? { status: 'PASS', disposition: 'EXISTING_CAPABILITY_INVOKED', errors: [] }
      : { status: 'NOT_INVOKED', disposition: 'EXISTING_CAPABILITY_NOT_INVOKED', errors: [] };
  }

  if (path.originalInvocation === 'INVOKED') {
    errors.push('missing original capability must not be invoked');
  }
  if (!path.creatorResolvedFromMarketplace) {
    errors.push('creator must resolve from an existing authorized marketplace capability');
  }
  if (!path.creatorProviderInvoked) {
    errors.push('claimed capability creation requires creator provider evidence');
  }
  if (!path.candidateValidated) {
    errors.push('candidate capability must be validated');
  }
  if (!path.candidateRegistered) {
    errors.push('validated candidate must be registered or installed before reuse');
  }
  if (!path.originalCapabilityReresolved) {
    errors.push('original capability must be re-resolved after registration');
  }

  if (errors.length > 0) {
    return {
      status: path.creatorResolvedFromMarketplace ? 'FAIL' : 'BLOCKED',
      disposition: 'RECURSIVE_PATH_INCOMPLETE',
      errors,
    };
  }

  if (!path.finalProviderAvailable) {
    return {
      status: 'NOT_INVOKED',
      disposition: 'FINAL_PROVIDER_MISSING',
      errors: [],
    };
  }

  if (path.finalInvocation !== 'INVOKED') {
    return {
      status: 'NOT_INVOKED',
      disposition: 'RERESOLVED_BUT_NOT_INVOKED',
      errors: [],
    };
  }

  return {
    status: 'PASS',
    disposition: 'RECURSIVE_CAPABILITY_PROVEN',
    errors: [],
  };
}
