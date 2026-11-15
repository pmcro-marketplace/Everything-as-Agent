import {
  CATALOG_PACKAGES,
  EXECUTIVE_ROLES,
  MEMBER_MARKETPLACES,
  TEAM_COMPOSITIONS,
  type CompositionId,
  type PromotionGate,
} from '../data/ecosystem';

export type CyclePhaseName = 'seed' | 'orchestrate' | 'plan' | 'make' | 'check' | 'reflect';

export type PhaseStatus = 'PENDING' | 'COMPLETED' | 'REFUSED' | 'HALTED' | 'SKIPPED';

export interface CyclePhaseResult {
  phase: CyclePhaseName;
  status: PhaseStatus;
  summary: string;
  detail: string;
}

export interface CycleExecutionResult {
  rawSeed: string;
  rehearsalGrant: boolean;
  halted: boolean;
  refused: boolean;
  finalVerdict: 'PASS' | 'REFUSED_NO_GRANT' | 'HALTED_SKIP_CHECK';
  haltReason?: string;
  earnedConstraint?: string;
  unexecutedNextSeed?: string;
  phases: CyclePhaseResult[];
}

export interface RoundtableDraft {
  roleId: string;
  roleTitle: string;
  fullName: string;
  isDefaultOrchestrator: boolean;
  scopeBoundary: string;
  position: string;
  dissentOrRisk: string;
  evidenceNeeded: string;
}

export interface RoundtableTranscript {
  compositionId: CompositionId;
  topic: string;
  mode: 'local-office-drafts';
  liveModelUsed: false;
  orchestrators: string[];
  drafts: RoundtableDraft[];
}

export type StudioArtifactKind = 'marketplace' | 'plugin' | 'skill' | 'template';

export interface StudioDraftInput {
  kind: StudioArtifactKind;
  canonicalId: string;
  requestedRenameId?: string;
  sourceNamespace: string;
  summary: string;
  commands: string[];
  ollamaModel: string;
  githubRepo: string;
  workflowFile: string;
}

export interface StudioDraftOutput {
  accepted: boolean;
  identityPreserved: boolean;
  error?: string;
  canonicalId: string;
  kind: StudioArtifactKind;
  skillMarkdown: string;
  projectionJson: string;
  workflowYaml: string;
  digest: string;
}

export interface InstallPlanPayload {
  schema: 'pmcro.install-plan/v1';
  executed: false;
  notice: string;
  compositionId: CompositionId;
  orchestrators: string[];
  teamMembers: string[];
  stagedPackages: Array<{
    id: string;
    marketplaceId: string;
    sourceRepo: string;
    version: string;
    skillsCount: number;
  }>;
  totalStagedSkills: number;
  cliPreview: string[];
}

export interface PromotionReadinessSummary {
  totalGates: number;
  verifiedCount: number;
  rehearsedCount: number;
  missingCount: number;
  noteCheckedCount: number;
  readyForProduction: boolean;
  advisoryNotice: string;
}

export function validateEcosystemCounts() {
  const packageCount = CATALOG_PACKAGES.length;
  const skillCount = CATALOG_PACKAGES.reduce((acc, pkg) => acc + pkg.skills.length, 0);
  const marketplaceCount = MEMBER_MARKETPLACES.length;
  return {
    marketplaceCount,
    packageCount,
    skillCount,
  };
}

export function runPmcroCycle(
  rawSeedInput: string,
  options: { rehearsalGrant: boolean; compositionId: CompositionId; stagedPackageIds: string[] }
): CycleExecutionResult {
  const rawSeed = rawSeedInput.trim() || 'Audit consolidated marketplace readiness for startup release.';
  const containsSkipCheck = /\bskip\s+check\b/i.test(rawSeed);
  const composition = TEAM_COMPOSITIONS.find((c) => c.id === options.compositionId) ?? TEAM_COMPOSITIONS[0];

  const phases: CyclePhaseResult[] = [
    {
      phase: 'seed',
      status: 'COMPLETED',
      summary: 'Raw seed captured verbatim.',
      detail: `ingress.preserveRawSeedVerbatim=true · length=${rawSeed.length} chars`,
    },
  ];

  if (containsSkipCheck) {
    phases.push(
      {
        phase: 'orchestrate',
        status: 'HALTED',
        summary: 'HALTED: Seed contains forbidden "skip check" directive.',
        detail:
          'Independent Checker invariant (checker.makerMaySelfApprove=false) prohibits bypassing Check. Cycle halted at Orchestrate.',
      },
      {
        phase: 'plan',
        status: 'SKIPPED',
        summary: 'Skipped due to Orchestrate invariant halt.',
        detail: 'No plan emitted.',
      },
      {
        phase: 'make',
        status: 'SKIPPED',
        summary: 'Skipped due to invariant halt.',
        detail: 'No target mutation attempted.',
      },
      {
        phase: 'check',
        status: 'HALTED',
        summary: 'Checker cannot be skipped.',
        detail: 'Invariant violation logged.',
      },
      {
        phase: 'reflect',
        status: 'COMPLETED',
        summary: 'Earned constraint recorded from halt.',
        detail: 'Constraint: Reject any seed attempting to bypass independent verification.',
      }
    );

    return {
      rawSeed,
      rehearsalGrant: options.rehearsalGrant,
      halted: true,
      refused: false,
      finalVerdict: 'HALTED_SKIP_CHECK',
      haltReason: 'HALT: Seed requested "skip check", violating independent Checker invariant (makerMaySelfApprove=false).',
      earnedConstraint: 'Never admit a seed that attempts to bypass the independent Checker phase.',
      unexecutedNextSeed: 'Re-submit seed without "skip check" so Orchestrate -> Plan -> Make -> Check -> Reflect can run.',
      phases,
    };
  }

  phases.push({
    phase: 'orchestrate',
    status: 'COMPLETED',
    summary: `Admitted by ${composition.orchestratorIds.map((x) => x.toUpperCase()).join(' + ')} orchestrators.`,
    detail: `Team=${composition.name} (${composition.memberIds.length} roles) · Staged packages=${options.stagedPackageIds.length}`,
  });

  phases.push({
    phase: 'plan',
    status: 'COMPLETED',
    summary: 'Read-only step manifest produced.',
    detail: `Planned bounded rehearsal against "${rawSeed.slice(0, 72)}${rawSeed.length > 72 ? '...' : ''}" without mutating external hosts.`,
  });

  if (!options.rehearsalGrant) {
    phases.push(
      {
        phase: 'make',
        status: 'REFUSED',
        summary: 'MAKER REFUSED: Rehearsal grant is OFF.',
        detail:
          'Least-authority boundary enforced (grants.default="least-authority"). Maker refuses to emit or apply target artifacts without an explicit rehearsal grant.',
      },
      {
        phase: 'check',
        status: 'SKIPPED',
        summary: 'No Maker artifact to verify.',
        detail: 'Enable the rehearsal grant to verify Maker output in Check.',
      },
      {
        phase: 'reflect',
        status: 'COMPLETED',
        summary: 'Recorded grant-boundary refusal.',
        detail: 'Earned constraint: Rehearsal grant must be explicitly enabled before Maker runs.',
      }
    );

    return {
      rawSeed,
      rehearsalGrant: false,
      halted: false,
      refused: true,
      finalVerdict: 'REFUSED_NO_GRANT',
      haltReason: 'Maker refused execution because the rehearsal grant is OFF.',
      earnedConstraint: 'Maker requires an explicit rehearsal grant before synthesizing target changes.',
      unexecutedNextSeed: `Grant rehearsal scope for "${rawSeed.slice(0, 48)}" or inspect staged plan read-only.`,
      phases,
    };
  }

  phases.push(
    {
      phase: 'make',
      status: 'COMPLETED',
      summary: 'Rehearsal artifact synthesized within bounded scope.',
      detail: 'Rehearsal grant active (non-installing). Generated dry-run manifest delta only; Maker did not self-approve.',
    },
    {
      phase: 'check',
      status: 'COMPLETED',
      summary: 'Independent Checker verdict: PASS.',
      detail: 'Verified identity preservation, least-authority scoping, and zero external side effects.',
    },
    {
      phase: 'reflect',
      status: 'COMPLETED',
      summary: 'Earned constraint and unexecuted next seed queued.',
      detail: 'Next seed stored unexecuted under .pmcro/queue.json awaiting explicit cycle admission.',
    }
  );

  return {
    rawSeed,
    rehearsalGrant: true,
    halted: false,
    refused: false,
    finalVerdict: 'PASS',
    earnedConstraint: `Bounded ${composition.name} rehearsal passed independent Check with zero host side effects.`,
    unexecutedNextSeed: `Verify Gate 6 dynamic skill workflow for "${rawSeed.slice(0, 44)}" (unexecuted).`,
    phases,
  };
}

export function conveneRoundtable(compositionId: CompositionId, topicInput?: string): RoundtableTranscript {
  const composition = TEAM_COMPOSITIONS.find((c) => c.id === compositionId) ?? TEAM_COMPOSITIONS[0];
  const topic = (topicInput || '').trim() || `${composition.name} Marketplace Composition & Promotion Readiness`;

  const drafts: RoundtableDraft[] = composition.memberIds
    .map((id) => EXECUTIVE_ROLES.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((role) => {
      const drafted = role.officeDraftTemplate(topic, compositionId);
      return {
        roleId: role.id,
        roleTitle: role.title,
        fullName: role.fullName,
        isDefaultOrchestrator: role.defaultOrchestrator,
        scopeBoundary: role.scopeBoundary,
        position: drafted.position,
        dissentOrRisk: drafted.dissentOrRisk,
        evidenceNeeded: drafted.evidenceNeeded,
      };
    });

  return {
    compositionId,
    topic,
    mode: 'local-office-drafts',
    liveModelUsed: false,
    orchestrators: [...composition.orchestratorIds],
    drafts,
  };
}

export function draftStudioArtifact(input: StudioDraftInput): StudioDraftOutput {
  const canonicalId = input.canonicalId.trim();
  const requestedRenameId = (input.requestedRenameId ?? canonicalId).trim();

  if (!canonicalId) {
    return {
      accepted: false,
      identityPreserved: false,
      error: 'Canonical ID is required.',
      canonicalId: '',
      kind: input.kind,
      skillMarkdown: '',
      projectionJson: '',
      workflowYaml: '',
      digest: '',
    };
  }

  if (requestedRenameId !== canonicalId) {
    return {
      accepted: false,
      identityPreserved: false,
      error: `Identity preservation violated: cannot rename "${canonicalId}" to "${requestedRenameId}". Studio drafts must preserve canonical identities.`,
      canonicalId,
      kind: input.kind,
      skillMarkdown: '',
      projectionJson: '',
      workflowYaml: '',
      digest: '',
    };
  }

  const commandsList = input.commands.length > 0 ? input.commands : [`/${canonicalId}`];
  const skillMarkdown = `---
name: ${canonicalId}
kind: ${input.kind}
sourceNamespace: ${input.sourceNamespace}
identityImmutable: true
authority: least-authority
---

# ${canonicalId}

I am the \`${canonicalId}\` ${input.kind} operating within \`${input.sourceNamespace}\` under PMCR-O governance.

## Mandate
${input.summary || 'Deterministic local-first skill execution with GitHub Actions workflow dispatch support.'}

## Commands
${commandsList.map((cmd) => `- \`${cmd}\``).join('\n')}

## Runtime Bridges
- Local Ollama Model: \`${input.ollamaModel || 'qwen2.5-coder:7b'}\`
- GitHub Actions Target: \`${input.githubRepo || 'pmcr-o/skills'}\` (\`${input.workflowFile || 'pmcro-skill-dispatch.yml'}\`)
- Invariants: \`makerMaySelfApprove=false\`, \`identityRenamingAllowed=false\`
`;

  const projectionObj = {
    schema: 'pmcro.projection/v1',
    kind: input.kind,
    id: canonicalId,
    sourceNamespace: input.sourceNamespace,
    identityImmutable: true,
    commands: commandsList,
    runtime: {
      ollamaModel: input.ollamaModel || 'qwen2.5-coder:7b',
      githubWorkflow: {
        repository: input.githubRepo || 'pmcr-o/skills',
        workflow: input.workflowFile || 'pmcro-skill-dispatch.yml',
      },
    },
  };

  const workflowYaml = `name: PMCR-O Dynamic Skill (${canonicalId})

on:
  workflow_dispatch:
    inputs:
      skill_id:
        description: 'Immutable canonical skill identity'
        required: true
        default: '${canonicalId}'
      ollama_model:
        description: 'Local Ollama model tag'
        required: true
        default: '${input.ollamaModel || 'qwen2.5-coder:7b'}'
      seed:
        description: 'Verbatim PMCR-O seed'
        required: true
        default: 'Rehearse bounded check for ${canonicalId}'

jobs:
  pmcro-dynamic-skill:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - name: Verify Identity Preservation
        run: |
          if [ "\${{ inputs.skill_id }}" != "${canonicalId}" ]; then
            echo "Identity rename prohibited" && exit 1
          fi
      - name: Run Local Ollama Rehearsal (Self-Hosted / Runner Bridge)
        run: |
          echo "Skill: ${canonicalId} | Model: \${{ inputs.ollama_model }}"
          echo "Seed: \${{ inputs.seed }}"
`;

  const rawForHash = `${canonicalId}:${input.kind}:${input.sourceNamespace}:${input.ollamaModel}`;
  let hash = 2166136261;
  for (let i = 0; i < rawForHash.length; i++) {
    hash ^= rawForHash.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const digest = `sha256-sim-${(hash >>> 0).toString(16).padStart(8, '0')}`;

  return {
    accepted: true,
    identityPreserved: true,
    canonicalId,
    kind: input.kind,
    skillMarkdown,
    projectionJson: JSON.stringify(projectionObj, null, 2),
    workflowYaml,
    digest,
  };
}

export function buildInstallPlan(stagedPackageIds: string[], compositionId: CompositionId): InstallPlanPayload {
  const composition = TEAM_COMPOSITIONS.find((c) => c.id === compositionId) ?? TEAM_COMPOSITIONS[0];
  const staged = stagedPackageIds
    .map((id) => CATALOG_PACKAGES.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const totalStagedSkills = staged.reduce((acc, pkg) => acc + pkg.skills.length, 0);

  const cliPreview = [
    `# Everything Marketplaces — Read-Only Install Plan (NOT EXECUTED)`,
    `# Team Composition: ${composition.name} | Orchestrators: ${composition.orchestratorIds.join(', ')}`,
    ...staged.map(
      (pkg) =>
        `pmcro stage add ${pkg.id}@${pkg.version} --marketplace=${pkg.marketplaceId} --repo=${pkg.sourceRepo} # ${pkg.skills.length} skills`
    ),
    ...(staged.length === 0 ? ['# No packages staged yet. Stage packages from Catalog to populate CLI commands.'] : []),
  ];

  return {
    schema: 'pmcro.install-plan/v1',
    executed: false,
    notice: 'Rehearsal & composition plan only. Everything Marketplaces does not install, activate, or grant execution.',
    compositionId: composition.id,
    orchestrators: [...composition.orchestratorIds],
    teamMembers: [...composition.memberIds],
    stagedPackages: staged.map((pkg) => ({
      id: pkg.id,
      marketplaceId: pkg.marketplaceId,
      sourceRepo: pkg.sourceRepo,
      version: pkg.version,
      skillsCount: pkg.skills.length,
    })),
    totalStagedSkills,
    cliPreview,
  };
}

export function evaluatePromotionReadiness(gates: PromotionGate[]): PromotionReadinessSummary {
  const verifiedCount = gates.filter((g) => g.evidenceStatus === 'VERIFIED').length;
  const rehearsedCount = gates.filter((g) => g.evidenceStatus === 'REHEARSED').length;
  const missingCount = gates.filter((g) => g.evidenceStatus === 'MISSING').length;
  const noteCheckedCount = gates.filter((g) => g.noteChecked).length;

  return {
    totalGates: gates.length,
    verifiedCount,
    rehearsedCount,
    missingCount,
    noteCheckedCount,
    readyForProduction: verifiedCount === gates.length && gates.length > 0,
    advisoryNotice:
      noteCheckedCount > verifiedCount
        ? 'A checkbox is a note, not evidence. Checked operator notes do not satisfy promotion gates.'
        : 'All gate verdicts are derived strictly from attached evidence artifacts.',
  };
}
