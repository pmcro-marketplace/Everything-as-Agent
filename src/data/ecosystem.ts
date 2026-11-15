export type MemberMarketplaceId = 'creators' | 'pmcr-o' | 'agent-skills' | 'csuite-candidate';

export interface MemberMarketplace {
  id: MemberMarketplaceId;
  name: string;
  canonicalOwner: string;
  sourceRepo: string;
  schema: string;
  status: 'canonical' | 'candidate';
  summary: string;
  validationStatus: 'PASS' | 'CANDIDATE';
  packageCount: number;
  skillCount: number;
}

export interface CatalogSkill {
  id: string;
  summary: string;
  readOnly: boolean;
}

export interface CatalogPackage {
  id: string;
  name: string;
  marketplaceId: MemberMarketplaceId;
  sourceRepo: string;
  version: string;
  mandate: string;
  authority: 'read-only discovery' | 'bounded execution (grant required)' | 'advisory decision support';
  grantRequirement: string;
  commands: string[];
  skills: CatalogSkill[];
}

export interface FederationRule {
  id: string;
  title: string;
  contractKey: string;
  enforcement: string;
}

export interface ValidationSnapshot {
  schemaVersion: string;
  generatedFrom: string;
  reposAudited: number;
  packagesCount: number;
  skillsCount: number;
  makerMaySelfApprove: boolean;
  grantDefault: string;
  credentialsPolicy: string;
  identityRenamingAllowed: boolean;
  lastVerifiedCommit: string;
}

export type CompositionId = 'startup' | 'bank' | 'enterprise';

export interface ExecutiveRole {
  id: string;
  title: string;
  fullName: string;
  mandate: string;
  defaultOrchestrator: boolean;
  scopeBoundary: string;
  officeDraftTemplate: (topic: string, composition: CompositionId) => {
    position: string;
    dissentOrRisk: string;
    evidenceNeeded: string;
  };
}

export interface TeamComposition {
  id: CompositionId;
  name: string;
  summary: string;
  orchestratorIds: string[];
  memberIds: string[];
  recommendedPackages: string[];
}

export interface PromotionGate {
  id: string;
  order: number;
  title: string;
  requirement: string;
  evidenceType: string;
  noteChecked: boolean;
  evidenceStatus: 'MISSING' | 'REHEARSED' | 'VERIFIED';
  evidenceArtifact?: string;
}

export const MEMBER_MARKETPLACES: MemberMarketplace[] = [
  {
    id: 'creators',
    name: 'Creators Marketplace',
    canonicalOwner: 'pmcr-o',
    sourceRepo: 'https://github.com/pmcr-o/skill-creator-agent',
    schema: 'pmcro.marketplace/v1',
    status: 'canonical',
    summary:
      'Skill authoring, portable skill packs, dotagents typed workspaces, and self-contained repository templates.',
    validationStatus: 'PASS',
    packageCount: 8,
    skillCount: 12,
  },
  {
    id: 'pmcr-o',
    name: 'PMCR-O Product Line',
    canonicalOwner: 'pmcr-o',
    sourceRepo: 'https://github.com/pmcr-o/pmcro-agent',
    schema: 'pmcro.lifecycle/v1',
    status: 'canonical',
    summary:
      'Canonical cognitive loop plugins: Orchestrator, Planner, Maker, Checker, Reflector, Governance, Queue, and Project integration.',
    validationStatus: 'PASS',
    packageCount: 10,
    skillCount: 16,
  },
  {
    id: 'agent-skills',
    name: 'Agent-Skills Ecosystem',
    canonicalOwner: 'pmcr-o',
    sourceRepo: 'https://github.com/pmcr-o/skills',
    schema: 'pmcro.domain-orchestrators/v2',
    status: 'canonical',
    summary:
      'Independently addressable domain orchestrators for GitHub, Model Gateway (Ollama), .NET, Aspire, MAF, Reasoning, Eval, and Federation.',
    validationStatus: 'PASS',
    packageCount: 19,
    skillCount: 29,
  },
  {
    id: 'csuite-candidate',
    name: 'C-Suite Candidate',
    canonicalOwner: 'pmcr-o',
    sourceRepo: 'https://github.com/pmcr-o/csuite-agent',
    schema: 'pmcro.csuite-candidate/v1',
    status: 'candidate',
    summary:
      'Executive council candidate marketplace: CEO & CTO default orchestrators plus bounded CFO, CISO, CLO, CMO, COO, and CHRO advisory offices.',
    validationStatus: 'CANDIDATE',
    packageCount: 9,
    skillCount: 13,
  },
];

export const VALIDATION_SNAPSHOT: ValidationSnapshot = {
  schemaVersion: 'pmcro.ecosystem/v1',
  generatedFrom: '.agents/catalog.json',
  reposAudited: 26,
  packagesCount: 46,
  skillsCount: 70,
  makerMaySelfApprove: false,
  grantDefault: 'least-authority (rehearsal grant OFF by default)',
  credentialsPolicy: 'never-discover',
  identityRenamingAllowed: false,
  lastVerifiedCommit: '17f0870',
};

export const FEDERATION_RULES: FederationRule[] = [
  {
    id: 'rule-identity',
    title: 'Canonical Identity Preservation',
    contractKey: 'federation.identity.immutable',
    enforcement: 'Drafting a marketplace, plugin, skill, or template preserves existing canonical IDs without renaming.',
  },
  {
    id: 'rule-authority',
    title: 'Least-Authority & Explicit Grants',
    contractKey: 'grants.default = "least-authority"',
    enforcement: 'Control plane browses, composes, and rehearses only. Maker refuses execution unless an explicit rehearsal grant is active.',
  },
  {
    id: 'rule-checker',
    title: 'Independent Checker Invariant',
    contractKey: 'checker.makerMaySelfApprove = false',
    enforcement: 'Maker never issues its own verdict. Any seed containing "skip check" halts immediately prior to execution.',
  },
  {
    id: 'rule-seed',
    title: 'Verbatim Seed Preservation',
    contractKey: 'ingress.preserveRawSeedVerbatim = true',
    enforcement: 'Raw seeds enter at Orchestrate verbatim; reflected next seeds stay unexecuted until a bounded new cycle consumes them.',
  },
  {
    id: 'rule-credentials',
    title: 'Zero Credential Discovery',
    contractKey: 'grants.credentials = "never-discover"',
    enforcement: 'Agents cannot probe host environment secrets; GitHub Actions dispatch and Ollama endpoints require explicit operator supply.',
  },
  {
    id: 'rule-evidence',
    title: 'Evidence Over Checkboxes',
    contractKey: 'promotion.gates = 7',
    enforcement: 'Enterprise promotion requires artifact-backed evidence per gate. Operator checkboxes are recorded solely as non-binding notes.',
  },
];

export const CATALOG_PACKAGES: CatalogPackage[] = [
  // 1. CREATORS (8 packages, 12 skills)
  {
    id: 'skill-creator',
    name: 'skill-creator',
    marketplaceId: 'creators',
    sourceRepo: 'pmcr-o/skill-creator-agent',
    version: '1.5.0',
    mandate: 'Author, validate, and delete candidate AgentSkill packages without auto-registering them into production catalogs.',
    authority: 'bounded execution (grant required)',
    grantRequirement: 'candidate-workspace-write',
    commands: ['/create-skill', '/delete-skill'],
    skills: [
      { id: 'create-skill', summary: 'Create a candidate skill package with SKILL.md, projection.json, and tests.', readOnly: false },
      { id: 'delete-skill', summary: 'Delete an unregistered candidate skill package; refuses cataloged skills.', readOnly: false },
    ],
  },
  {
    id: 'dotagents-foundation',
    name: 'dotagents-foundation',
    marketplaceId: 'creators',
    sourceRepo: 'pmcr-o/dotagents-agent',
    version: '1.4.2',
    mandate: 'Scaffold typed .agents/ workspaces, capability manifests, and lifecycle surface definitions.',
    authority: 'bounded execution (grant required)',
    grantRequirement: 'workspace-manifest-init',
    commands: ['/dotagents-init', '/dotagents-sync'],
    skills: [
      { id: 'dotagents-init', summary: 'Initialize .agents/ directory contracts and schema bindings.', readOnly: false },
      { id: 'dotagents-sync', summary: 'Reconcile projection.json and marketplace.json declarations.', readOnly: true },
    ],
  },
  {
    id: 'agent-skills-template',
    name: 'agent-skills-template',
    marketplaceId: 'creators',
    sourceRepo: 'pmcr-o/agent-skills-template',
    version: '1.5.0',
    mandate: 'Self-contained repository blueprint for publishing multi-host agent skill marketplaces.',
    authority: 'read-only discovery',
    grantRequirement: 'none (template read)',
    commands: ['/surface-emit', '/crud-blueprint'],
    skills: [
      { id: 'pmcro-agent-surface', summary: 'Project agent contracts across .agents/ and .claude-plugin/ surfaces.', readOnly: true },
      { id: 'pmcro-generic-crud', summary: 'Scaffold bounded CRUD handler schemas with dry-run defaults.', readOnly: true },
    ],
  },
  {
    id: 'skill-lifecycle',
    name: 'skill-lifecycle',
    marketplaceId: 'creators',
    sourceRepo: 'pmcr-o/skill-creator-agent',
    version: '1.3.1',
    mandate: 'Manage promotion of evaluated skill candidates through checked lifecycle gates.',
    authority: 'bounded execution (grant required)',
    grantRequirement: 'lifecycle-promote',
    commands: ['/lifecycle-audit', '/promote-candidate'],
    skills: [
      { id: 'pmcro-skill-lifecycle', summary: 'Inspect draft, candidate, and canonical lifecycle states.', readOnly: true },
      { id: 'promote-candidate', summary: 'Emit promotion request packet after eval evidence passes.', readOnly: false },
    ],
  },
  {
    id: 'desktop-commander-adapter',
    name: 'desktop-commander-adapter',
    marketplaceId: 'creators',
    sourceRepo: 'pmcr-o/desktop-commander-agent',
    version: '1.1.0',
    mandate: 'Provide shared agent and manual script entrypoints for local workstation automation adapters.',
    authority: 'bounded execution (grant required)',
    grantRequirement: 'local-adapter-exec',
    commands: ['/dc-entrypoint'],
    skills: [
      { id: 'desktop-commander', summary: 'Bind local terminal/script entrypoint under dry-run guard.', readOnly: false },
    ],
  },
  {
    id: 'artops-portable',
    name: 'artops-portable',
    marketplaceId: 'creators',
    sourceRepo: 'ShawnDelaineBellazanLoop/artops-portable',
    version: '1.0.4',
    mandate: 'Zero-install portable four-agent Plan->Make->Check->Reflect skill pack for cross-host JSON handoffs.',
    authority: 'read-only discovery',
    grantRequirement: 'none (portable pack)',
    commands: ['/export-portable'],
    skills: [
      { id: 'portable-pack-export', summary: 'Bundle standalone SKILL.md pack for platform-agnostic execution.', readOnly: true },
    ],
  },
  {
    id: 'template-archive',
    name: 'template-archive',
    marketplaceId: 'creators',
    sourceRepo: 'ShawnDelaineBellazanLoop/pmcro-templatearchive',
    version: '1.2.0',
    mandate: 'Emit autonomous Cline and host-specific PMCR-O starter templates preserving original identities.',
    authority: 'read-only discovery',
    grantRequirement: 'none (archive read)',
    commands: ['/emit-template'],
    skills: [
      { id: 'cline-template-emit', summary: 'Render host-specific PMCR-O loop instructions from canonical templates.', readOnly: true },
    ],
  },
  {
    id: 'skill-directory-explorer',
    name: 'skill-directory-explorer',
    marketplaceId: 'creators',
    sourceRepo: 'ShawnDelaineBellazanLoop/agent-skillsarchive',
    version: '1.1.2',
    mandate: 'Index hierarchical project and global AGENTS.md, rules, commands, and skill directories.',
    authority: 'read-only discovery',
    grantRequirement: 'none (read-only scan)',
    commands: ['/scan-tree'],
    skills: [
      { id: 'tree-projection-scan', summary: 'Map local AGENTS.md and .agents/skills/ hierarchy.', readOnly: true },
    ],
  },

  // 2. PMCR-O PRODUCT LINE (10 packages, 16 skills)
  {
    id: 'pmcro-core',
    name: 'pmcro-core',
    marketplaceId: 'pmcr-o',
    sourceRepo: 'pmcr-o/pmcro-agent',
    version: '1.5.0',
    mandate: 'Core four-phase Plan, Make, Check, Reflect skill suite owned by pmcro-agent.',
    authority: 'bounded execution (grant required)',
    grantRequirement: 'cycle-rehearsal-grant',
    commands: ['/plan', '/make', '/check', '/reflect'],
    skills: [
      { id: 'plan', summary: 'Plan minimum PMCR-O work from a seed and registered plugin (read-only).', readOnly: true },
      { id: 'make', summary: 'Execute one accepted plan inside declared target; never self-approves.', readOnly: false },
      { id: 'check', summary: 'Verify artifact against acceptance criteria and emit one verdict.', readOnly: true },
      { id: 'reflect', summary: 'Record one earned constraint and one unexecuted next seed.', readOnly: true },
    ],
  },
  {
    id: 'pmcro-orchestrator',
    name: 'pmcro-orchestrator',
    marketplaceId: 'pmcr-o',
    sourceRepo: 'pmcr-o/pmcro-agent',
    version: '1.5.0',
    mandate: 'Global routing engine that admits or denies raw seeds and dispatches bounded cycles.',
    authority: 'bounded execution (grant required)',
    grantRequirement: 'orchestrate-route',
    commands: ['/orchestrate'],
    skills: [
      { id: 'orchestrate', summary: 'Admit raw seed verbatim and route cycle across registered capabilities.', readOnly: true },
    ],
  },
  {
    id: 'pmcro-planner',
    name: 'pmcro-planner',
    marketplaceId: 'pmcr-o',
    sourceRepo: 'pmcr-o/pmcro-agent',
    version: '1.5.0',
    mandate: 'Dedicated read-only strategic planner decomposing admitted intents into minimal step manifests.',
    authority: 'read-only discovery',
    grantRequirement: 'none (read-only)',
    commands: ['/plan-manifest'],
    skills: [
      { id: 'plan-manifest', summary: 'Produce bounded step manifest and acceptance criteria without side effects.', readOnly: true },
    ],
  },
  {
    id: 'pmcro-maker',
    name: 'pmcro-maker',
    marketplaceId: 'pmcr-o',
    sourceRepo: 'pmcr-o/pmcro-agent',
    version: '1.5.0',
    mandate: 'Target-scoped executor requiring an explicit grant; refuses ungranted mutation or self-approval.',
    authority: 'bounded execution (grant required)',
    grantRequirement: 'maker-explicit-grant',
    commands: ['/make-target'],
    skills: [
      { id: 'make-target', summary: 'Apply accepted plan within explicit target bounds when grant is active.', readOnly: false },
    ],
  },
  {
    id: 'pmcro-checker',
    name: 'pmcro-checker',
    marketplaceId: 'pmcr-o',
    sourceRepo: 'pmcr-o/pmcro-agent',
    version: '1.5.0',
    mandate: 'Independent verification controller enforcing acceptance criteria; Maker may never self-approve.',
    authority: 'read-only discovery',
    grantRequirement: 'none (independent audit)',
    commands: ['/check-verdict'],
    skills: [
      { id: 'check-verdict', summary: 'Emit deterministic PASS, REPAIR, or HALT verdict with evidence refs.', readOnly: true },
    ],
  },
  {
    id: 'pmcro-reflector',
    name: 'pmcro-reflector',
    marketplaceId: 'pmcr-o',
    sourceRepo: 'pmcr-o/pmcro-agent',
    version: '1.5.0',
    mandate: 'Cognitive critic capturing earned constraints and queueing an unexecuted next seed.',
    authority: 'read-only discovery',
    grantRequirement: 'none (reflection log)',
    commands: ['/reflect-constraint'],
    skills: [
      { id: 'reflect-constraint', summary: 'Extract earned constraint and emit unexecuted next seed for queue.', readOnly: true },
    ],
  },
  {
    id: 'pmcro-governance',
    name: 'pmcro-governance',
    marketplaceId: 'pmcr-o',
    sourceRepo: 'pmcr-o/pmcro-agent',
    version: '1.5.0',
    mandate: 'Separate PMCR-O workflow YAML from ACS manifests; refuse synthesized or ungrounded policy.',
    authority: 'read-only discovery',
    grantRequirement: 'none (policy audit)',
    commands: ['/govern-boundary', '/acs-audit'],
    skills: [
      { id: 'govern-boundary', summary: 'Enforce tool-call boundary verdicts without synthesizing unverified policy.', readOnly: true },
      { id: 'acs-manifest-audit', summary: 'Validate separation between workflow YAML and ACS security manifests.', readOnly: true },
    ],
  },
  {
    id: 'pmcro-project',
    name: 'pmcro-project',
    marketplaceId: 'pmcr-o',
    sourceRepo: 'pmcr-o/pmcro-agent',
    version: '1.5.0',
    mandate: 'Dry-run inspection and controlled integration of PMCR-O surfaces into existing repositories.',
    authority: 'bounded execution (grant required)',
    grantRequirement: 'project-apply-explicit',
    commands: ['/setup-project', '/integrate-project'],
    skills: [
      { id: 'setup-project', summary: 'Inspect existing repo and output dry-run integration plan without changes.', readOnly: true },
      { id: 'integrate-project', summary: 'Apply PMCR-O control, host, and queue references when explicitly granted.', readOnly: false },
    ],
  },
  {
    id: 'pmcro-queue',
    name: 'pmcro-queue',
    marketplaceId: 'pmcr-o',
    sourceRepo: 'pmcr-o/pmcro-agent',
    version: '1.5.0',
    mandate: 'Durable single-colony priority queue under .pmcro/ for unexecuted reflected seeds and reconnect resume.',
    authority: 'bounded execution (grant required)',
    grantRequirement: 'queue-state-write',
    commands: ['/queue-enqueue', '/queue-reconcile'],
    skills: [
      { id: 'queue-enqueue', summary: 'Append unexecuted reflected seed to durable colony queue.', readOnly: false },
      { id: 'queue-reconcile', summary: 'Resume durable trail state across host reconnects.', readOnly: true },
    ],
  },
  {
    id: 'pmcro-reasoning-core',
    name: 'pmcro-reasoning-core',
    marketplaceId: 'pmcr-o',
    sourceRepo: 'pmcr-o/pmcro-agent',
    version: '1.5.0',
    mandate: 'Orchestrator-owned refinement of raw seeds into exact-source-grounded intent claims before Plan.',
    authority: 'read-only discovery',
    grantRequirement: 'none (orchestrate pre-plan)',
    commands: ['/intent-refinement'],
    skills: [
      { id: 'intent-refinement', summary: 'Refine raw seed into verifiable, source-grounded intent claims.', readOnly: true },
    ],
  },

  // 3. AGENT-SKILLS ECOSYSTEM (19 packages, 29 skills)
  {
    id: 'github-agent',
    name: 'github-agent',
    marketplaceId: 'agent-skills',
    sourceRepo: 'pmcr-o/github-agent',
    version: '1.4.0',
    mandate: 'Bounded GitHub repository, branch, commit, pull request, checks, and workflow_dispatch operations.',
    authority: 'bounded execution (grant required)',
    grantRequirement: 'github-workflow-dispatch',
    commands: ['/gh-inspect', '/gh-dispatch', '/gh-checks'],
    skills: [
      { id: 'gh-repo-inspect', summary: 'Read-only inspection of pmcr-o repositories, branches, and commits.', readOnly: true },
      { id: 'gh-workflow-dispatch', summary: 'Trigger explicit GitHub Actions workflow_dispatch with input payload.', readOnly: false },
      { id: 'gh-pr-checks', summary: 'Verify pull request status checks and CI run conclusions.', readOnly: true },
    ],
  },
  {
    id: 'model-gateway-agent',
    name: 'model-gateway-agent',
    marketplaceId: 'agent-skills',
    sourceRepo: 'pmcr-o/model-gateway-agent',
    version: '1.3.0',
    mandate: 'Provider-neutral model exchange bridging local Ollama runtimes and bounded remote providers.',
    authority: 'bounded execution (grant required)',
    grantRequirement: 'local-ollama-bridge',
    commands: ['/ollama-run', '/gateway-exchange'],
    skills: [
      { id: 'ollama-local-bridge', summary: 'Invoke local Ollama model endpoint for dynamic AgentSkill execution.', readOnly: false },
      { id: 'provider-exchange', summary: 'Normalize prompt/response envelopes across local and cloud gateways.', readOnly: true },
    ],
  },
  {
    id: 'dotnet-agent',
    name: 'dotnet-agent',
    marketplaceId: 'agent-skills',
    sourceRepo: 'pmcr-o/dotnet-agent',
    version: '1.4.0',
    mandate: 'Pinned .NET skills mirror plus PMCR-O wrappers for AOT diagnostics, Roslyn analysis, and test runs.',
    authority: 'bounded execution (grant required)',
    grantRequirement: 'dotnet-cli-exec',
    commands: ['/dotnet-aot', '/dotnet-analyze', '/dotnet-test'],
    skills: [
      { id: 'dotnet-aot-diagnostics', summary: 'Audit trimming and NativeAOT compatibility warnings.', readOnly: true },
      { id: 'dotnet-build-analyze', summary: 'Run structured MSBuild and Roslyn analyzer diagnostics.', readOnly: true },
      { id: 'dotnet-test-runner', summary: 'Execute deterministic xUnit/MSTest verification suites.', readOnly: false },
    ],
  },
  {
    id: 'aspire-agent',
    name: 'aspire-agent',
    marketplaceId: 'agent-skills',
    sourceRepo: 'pmcr-o/aspire-agent',
    version: '1.2.1',
    mandate: 'Inspect .NET Aspire AppHost graphs, agent MCP bindings, and Python resource integration plans.',
    authority: 'read-only discovery',
    grantRequirement: 'none (AppHost inspection)',
    commands: ['/aspire-inspect', '/aspire-mcp'],
    skills: [
      { id: 'aspire-apphost-inspect', summary: 'Read AppHost topology and service dependency bindings.', readOnly: true },
      { id: 'aspire-mcp-resource', summary: 'Plan MCP tool resource wiring across Aspire hosts.', readOnly: true },
    ],
  },
  {
    id: 'maf-agent',
    name: 'maf-agent',
    marketplaceId: 'agent-skills',
    sourceRepo: 'pmcr-o/maf-agent',
    version: '1.2.0',
    mandate: 'Microsoft Agent Framework workflows, MCP tool registration, and bounded local-model agent patterns.',
    authority: 'read-only discovery',
    grantRequirement: 'none (workflow blueprint)',
    commands: ['/maf-route', '/maf-local'],
    skills: [
      { id: 'maf-workflow-route', summary: 'Compose deterministic MAF multi-step agent graphs.', readOnly: true },
      { id: 'maf-local-model-pattern', summary: 'Bind local Ollama/ONNX models to bounded MAF agent executors.', readOnly: true },
    ],
  },
  {
    id: 'reasoning-agent',
    name: 'reasoning-agent',
    marketplaceId: 'agent-skills',
    sourceRepo: 'pmcr-o/reasoning-agent',
    version: '1.3.0',
    mandate: 'Routing, checker patterns, adaptive effort, majority voting, and test-time compute controls.',
    authority: 'read-only discovery',
    grantRequirement: 'none (reasoning policy)',
    commands: ['/compute-vote', '/loop-check'],
    skills: [
      { id: 'test-time-compute-vote', summary: 'Execute bounded candidate voting under compute budget.', readOnly: true },
      { id: 'tool-loop-checker', summary: 'Detect cyclic tool loops and enforce termination limits.', readOnly: true },
    ],
  },
  {
    id: 'eval-agent',
    name: 'eval-agent',
    marketplaceId: 'agent-skills',
    sourceRepo: 'pmcr-o/eval-agent',
    version: '1.3.0',
    mandate: 'Deterministic run scoring and evidence-backed procedure promotion.',
    authority: 'read-only discovery',
    grantRequirement: 'none (deterministic scoring)',
    commands: ['/eval-score', '/eval-promote'],
    skills: [
      { id: 'eval-deterministic-score', summary: 'Compute reproducible rubric scores from recorded cycle traces.', readOnly: true },
      { id: 'eval-evidence-promote', summary: 'Emit signed evidence bundle required by enterprise promotion gates.', readOnly: true },
    ],
  },
  {
    id: 'federation-agent',
    name: 'federation-agent',
    marketplaceId: 'agent-skills',
    sourceRepo: 'pmcr-o/federation-agent',
    version: '1.2.0',
    mandate: 'Bounded orchestrator-federation rounds with explicit budgets, independent referees, and evidence winners.',
    authority: 'read-only discovery',
    grantRequirement: 'none (federation referee)',
    commands: ['/fed-compete', '/fed-referee'],
    skills: [
      { id: 'federation-round-compete', summary: 'Run bounded multi-orchestrator competition under budget cap.', readOnly: true },
      { id: 'federation-referee-audit', summary: 'Adjudicate federation round outcomes from verifiable logs.', readOnly: true },
    ],
  },
  {
    id: 'confidentiality-agent',
    name: 'confidentiality-agent',
    marketplaceId: 'agent-skills',
    sourceRepo: 'pmcr-o/confidentiality-agent',
    version: '1.1.0',
    mandate: 'Data classification, minimum disclosure enforcement, and governed learning-artifact promotion.',
    authority: 'read-only discovery',
    grantRequirement: 'none (classification guard)',
    commands: ['/classify-disclosure'],
    skills: [
      { id: 'classify-disclosure', summary: 'Audit artifact payload against declared confidentiality tier.', readOnly: true },
    ],
  },
  {
    id: 'resource-registry-agent',
    name: 'resource-registry-agent',
    marketplaceId: 'agent-skills',
    sourceRepo: 'pmcr-o/resource-registry-agent',
    version: '1.1.0',
    mandate: 'Append-only evidence-backed planning resources, revocation lists, and SHA integrity verification.',
    authority: 'read-only discovery',
    grantRequirement: 'none (integrity check)',
    commands: ['/registry-verify'],
    skills: [
      { id: 'registry-append-verify', summary: 'Verify append-only resource hash and revocation status.', readOnly: true },
    ],
  },
  {
    id: 'economics-agent',
    name: 'economics-agent',
    marketplaceId: 'agent-skills',
    sourceRepo: 'pmcr-o/economics-agent',
    version: '1.1.0',
    mandate: 'Usage evidence, managed-service entitlements, unit economics, and bounded wake/sleep policy.',
    authority: 'read-only discovery',
    grantRequirement: 'none (economic ledger)',
    commands: ['/economic-heartbeat'],
    skills: [
      { id: 'economic-heartbeat', summary: 'Evaluate unit-economic budget bounds before spawning cycles.', readOnly: true },
    ],
  },
  {
    id: 'docker-agent',
    name: 'docker-agent',
    marketplaceId: 'agent-skills',
    sourceRepo: 'pmcr-o/docker-agent',
    version: '1.2.0',
    mandate: 'Dry-run-first container engine inspection and bounded OCI image builds.',
    authority: 'bounded execution (grant required)',
    grantRequirement: 'docker-socket-bounded',
    commands: ['/docker-dryrun'],
    skills: [
      { id: 'docker-dryrun-inspect', summary: 'Inspect compose/Dockerfile targets with dry-run plan output.', readOnly: true },
    ],
  },
  {
    id: 'powershell-agent',
    name: 'powershell-agent',
    marketplaceId: 'agent-skills',
    sourceRepo: 'pmcr-o/powershell-agent',
    version: '1.2.0',
    mandate: 'Dry-run-first PowerShell script verification and constrained execution.',
    authority: 'bounded execution (grant required)',
    grantRequirement: 'pwsh-whatif-grant',
    commands: ['/pwsh-dryrun'],
    skills: [
      { id: 'pwsh-dryrun-script', summary: 'Validate PowerShell scripts under -WhatIf rehearsal semantics.', readOnly: true },
    ],
  },
  {
    id: 'filesystem-agent',
    name: 'filesystem-agent',
    marketplaceId: 'agent-skills',
    sourceRepo: 'pmcr-o/filesystem-agent',
    version: '1.2.0',
    mandate: 'Workspace-confined read/list filesystem operations rejecting path traversal.',
    authority: 'read-only discovery',
    grantRequirement: 'workspace-read-confined',
    commands: ['/fs-list'],
    skills: [
      { id: 'fs-confined-read', summary: 'List and read files strictly inside declared workspace root.', readOnly: true },
    ],
  },
  {
    id: 'governance-agent',
    name: 'governance-agent',
    marketplaceId: 'agent-skills',
    sourceRepo: 'pmcr-o/governance-agent',
    version: '1.2.0',
    mandate: 'Apply Agent Governance Toolkit verdict semantics at PMCR-O tool-call boundaries.',
    authority: 'read-only discovery',
    grantRequirement: 'none (verdict gate)',
    commands: ['/agt-verdict'],
    skills: [
      { id: 'agt-verdict-boundary', summary: 'Evaluate tool call request against AGT boundary manifest.', readOnly: true },
    ],
  },
  {
    id: 'git-agent',
    name: 'git-agent',
    marketplaceId: 'agent-skills',
    sourceRepo: 'pmcr-o/git-agent',
    version: '1.2.0',
    mandate: 'Local Git repository branch/commit inspection and explicit commit mechanics.',
    authority: 'bounded execution (grant required)',
    grantRequirement: 'git-local-write',
    commands: ['/git-branch-audit'],
    skills: [
      { id: 'git-local-branch-audit', summary: 'Inspect local branches, working tree status, and commit graph.', readOnly: true },
    ],
  },
  {
    id: 'python-agent',
    name: 'python-agent',
    marketplaceId: 'agent-skills',
    sourceRepo: 'pmcr-o/python-agent',
    version: '1.2.0',
    mandate: 'Python runtime inspection and workspace-confined script execution.',
    authority: 'bounded execution (grant required)',
    grantRequirement: 'python-sandbox-exec',
    commands: ['/py-exec'],
    skills: [
      { id: 'py-confined-exec', summary: 'Inspect venv/uv runtime and rehearse confined Python scripts.', readOnly: false },
    ],
  },
  {
    id: 'computer-use-agent',
    name: 'computer-use-agent',
    marketplaceId: 'agent-skills',
    sourceRepo: 'pmcr-o/computer-use-agent',
    version: '1.2.0',
    mandate: 'Record and replay checked UI/terminal procedures through registered adapters.',
    authority: 'bounded execution (grant required)',
    grantRequirement: 'ui-adapter-replay',
    commands: ['/ui-replay'],
    skills: [
      { id: 'ui-procedure-replay', summary: 'Replay checked Playwright/terminal procedure traces.', readOnly: false },
    ],
  },
  {
    id: 'social-media-agent',
    name: 'social-media-agent',
    marketplaceId: 'agent-skills',
    sourceRepo: 'pmcr-o/social-media-agent',
    version: '1.1.0',
    mandate: 'Adapter-gated social publishing drafts requiring explicit publication capability grant.',
    authority: 'bounded execution (grant required)',
    grantRequirement: 'publication-explicit-grant',
    commands: ['/social-draft'],
    skills: [
      { id: 'social-draft-compose', summary: 'Draft outbound social artifacts without automatic publication.', readOnly: true },
    ],
  },

  // 4. C-SUITE CANDIDATE (9 packages, 13 skills)
  {
    id: 'csuite-ceo',
    name: 'csuite-ceo',
    marketplaceId: 'csuite-candidate',
    sourceRepo: 'pmcr-o/csuite-agent',
    version: '1.0.0-rc1',
    mandate: 'Chief Executive Officer default orchestrator for enterprise direction, portfolio tradeoffs, and alignment.',
    authority: 'advisory decision support',
    grantRequirement: 'orchestrator-default',
    commands: ['/ceo-brief', '/ceo-tradeoff'],
    skills: [
      { id: 'ceo-portfolio-tradeoff', summary: 'Evaluate strategic portfolio tradeoffs across member marketplaces.', readOnly: true },
      { id: 'ceo-strategic-mandate', summary: 'Issue bounded priority ordering for C-suite roundtable cycles.', readOnly: true },
    ],
  },
  {
    id: 'csuite-cto',
    name: 'csuite-cto',
    marketplaceId: 'csuite-candidate',
    sourceRepo: 'pmcr-o/csuite-agent',
    version: '1.0.0-rc1',
    mandate: 'Chief Technology Officer default orchestrator for architecture, platform capabilities, and technical risk.',
    authority: 'advisory decision support',
    grantRequirement: 'orchestrator-default',
    commands: ['/cto-arch', '/cto-risk'],
    skills: [
      { id: 'cto-architecture-review', summary: 'Audit cross-repo architectural boundaries and Ollama/CI bridges.', readOnly: true },
      { id: 'cto-platform-risk', summary: 'Assess runtime capability grants, schema drift, and build verification.', readOnly: true },
    ],
  },
  {
    id: 'csuite-cfo',
    name: 'csuite-cfo',
    marketplaceId: 'csuite-candidate',
    sourceRepo: 'pmcr-o/csuite-agent',
    version: '1.0.0-rc1',
    mandate: 'Chief Financial Officer decision support for budgets, unit economics, capital allocation, and runway.',
    authority: 'advisory decision support',
    grantRequirement: 'csuite-advisory',
    commands: ['/cfo-economics', '/cfo-runway'],
    skills: [
      { id: 'cfo-unit-economics', summary: 'Review per-cycle compute cost and economic-heartbeat caps.', readOnly: true },
      { id: 'cfo-capital-runway', summary: 'Model infrastructure runway under startup, bank, or enterprise scale.', readOnly: true },
    ],
  },
  {
    id: 'csuite-ciso',
    name: 'csuite-ciso',
    marketplaceId: 'csuite-candidate',
    sourceRepo: 'pmcr-o/csuite-agent',
    version: '1.0.0-rc1',
    mandate: 'Chief Information Security Officer support for access governance, grant boundaries, and incident readiness.',
    authority: 'advisory decision support',
    grantRequirement: 'csuite-advisory',
    commands: ['/ciso-posture', '/ciso-incident'],
    skills: [
      { id: 'ciso-access-governance', summary: 'Enforce least-authority grant scoping and never-discover secret rules.', readOnly: true },
      { id: 'ciso-incident-readiness', summary: 'Validate halt triggers and audit trails on unauthorized execution attempts.', readOnly: true },
    ],
  },
  {
    id: 'csuite-clo',
    name: 'csuite-clo',
    marketplaceId: 'csuite-candidate',
    sourceRepo: 'pmcr-o/csuite-agent',
    version: '1.0.0-rc1',
    mandate: 'Chief Legal Officer support for license provenance, contract risk, compliance, and counsel escalation.',
    authority: 'advisory decision support',
    grantRequirement: 'csuite-advisory',
    commands: ['/clo-compliance'],
    skills: [
      { id: 'clo-compliance-triage', summary: 'Flag regulatory and licensing obligations requiring counsel review.', readOnly: true },
    ],
  },
  {
    id: 'csuite-cmo',
    name: 'csuite-cmo',
    marketplaceId: 'csuite-candidate',
    sourceRepo: 'pmcr-o/csuite-agent',
    version: '1.0.0-rc1',
    mandate: 'Chief Marketing Officer support for market positioning, developer adoption, and go-to-market learning.',
    authority: 'advisory decision support',
    grantRequirement: 'csuite-advisory',
    commands: ['/cmo-positioning'],
    skills: [
      { id: 'cmo-positioning-brief', summary: 'Draft factual positioning without unverified capability claims.', readOnly: true },
    ],
  },
  {
    id: 'csuite-coo',
    name: 'csuite-coo',
    marketplaceId: 'csuite-candidate',
    sourceRepo: 'pmcr-o/csuite-agent',
    version: '1.0.0-rc1',
    mandate: 'Chief Operating Officer support for delivery cadence, queue health, and cross-functional execution.',
    authority: 'advisory decision support',
    grantRequirement: 'csuite-advisory',
    commands: ['/coo-cadence'],
    skills: [
      { id: 'coo-delivery-cadence', summary: 'Assess queue depth, release bottlenecks, and operational SLAs.', readOnly: true },
    ],
  },
  {
    id: 'csuite-chro',
    name: 'csuite-chro',
    marketplaceId: 'csuite-candidate',
    sourceRepo: 'pmcr-o/csuite-agent',
    version: '1.0.0-rc1',
    mandate: 'Chief Human Resources Officer support for workforce clarity, human-in-the-loop boundaries, and role design.',
    authority: 'advisory decision support',
    grantRequirement: 'csuite-advisory',
    commands: ['/chro-clarity'],
    skills: [
      { id: 'chro-org-clarity', summary: 'Define human accountability boundaries across autonomous agent teams.', readOnly: true },
    ],
  },
  {
    id: 'csuite-executive-council',
    name: 'csuite-executive-council',
    marketplaceId: 'csuite-candidate',
    sourceRepo: 'pmcr-o/csuite-agent',
    version: '1.0.0-rc1',
    mandate: 'Coordinate bounded local office drafts from C-suite executives without erasing dissent or evidence gaps.',
    authority: 'advisory decision support',
    grantRequirement: 'csuite-advisory',
    commands: ['/executive-council'],
    skills: [
      { id: 'executive-council-convene', summary: 'Convene roundtable of seated executives preserving dissent and evidence status.', readOnly: true },
    ],
  },
];

export const EXECUTIVE_ROLES: ExecutiveRole[] = [
  {
    id: 'ceo',
    title: 'CEO',
    fullName: 'Chief Executive Officer',
    mandate: 'Enterprise direction, strategic priorities, and portfolio tradeoffs.',
    defaultOrchestrator: true,
    scopeBoundary: 'Default Orchestrator · Advisory only, never silently mutates external state.',
    officeDraftTemplate: (topic, composition) => ({
      position: `Prioritize verifiable ${composition} readiness around "${topic}" using staged ecosystem packages before expanding scope.`,
      dissentOrRisk: 'Scope creep across unvalidated candidate skills dilutes delivery focus if staging discipline slips.',
      evidenceNeeded: 'Signed Cycle reflection receipt and explicit staged install plan.',
    }),
  },
  {
    id: 'cto',
    title: 'CTO',
    fullName: 'Chief Technology Officer',
    mandate: 'Technical architecture, capability contracts, local Ollama / GitHub Actions bridges.',
    defaultOrchestrator: true,
    scopeBoundary: 'Default Orchestrator · Enforces independent Checker and immutable identities.',
    officeDraftTemplate: (topic, composition) => ({
      position: `Bind "${topic}" to canonical .agents/ contracts with ${composition}-appropriate least-authority grants and local Ollama dry-runs.`,
      dissentOrRisk: 'Any bypass of Checker (such as "skip check") or implicit Maker grant invalidates architectural trust.',
      evidenceNeeded: 'Schema validation pass, unit test proof, and GitHub Actions workflow manifest.',
    }),
  },
  {
    id: 'cfo',
    title: 'CFO',
    fullName: 'Chief Financial Officer',
    mandate: 'Budgets, unit economics, compute caps, and capital runway.',
    defaultOrchestrator: false,
    scopeBoundary: 'Seated Advisor · Reviews economic-heartbeat bounds only.',
    officeDraftTemplate: (topic, composition) => ({
      position: `Cap "${topic}" rehearsal compute to local Ollama inference first; defer cloud spend until ${composition} gate #5 passes.`,
      dissentOrRisk: 'Unbounded recursive cycles can exhaust token and CI runner budgets without unit-economic ceilings.',
      evidenceNeeded: 'Economics-agent heartbeat estimate and CI minute ceiling.',
    }),
  },
  {
    id: 'ciso',
    title: 'CISO',
    fullName: 'Chief Information Security Officer',
    mandate: 'Access governance, least-authority grant scoping, and secret isolation.',
    defaultOrchestrator: false,
    scopeBoundary: 'Seated Advisor · Blocks credential discovery and ungranted Maker actions.',
    officeDraftTemplate: (topic) => ({
      position: `Enforce grants.credentials="never-discover" for "${topic}" and require explicit operator grant prior to Maker simulation.`,
      dissentOrRisk: 'Conflating operator note checkboxes with security evidence creates false compliance assurance.',
      evidenceNeeded: 'Governance-agent boundary verdict and non-self-approval audit.',
    }),
  },
  {
    id: 'clo',
    title: 'CLO',
    fullName: 'Chief Legal Officer',
    mandate: 'License provenance, regulatory compliance, and counsel escalation.',
    defaultOrchestrator: false,
    scopeBoundary: 'Seated Advisor · Escalates binding legal determinations to qualified counsel.',
    officeDraftTemplate: (topic) => ({
      position: `Preserve upstream repository attribution and canonical identities across all "${topic}" marketplace drafts.`,
      dissentOrRisk: 'Renaming package identities breaks provenance chains and creates license attribution ambiguity.',
      evidenceNeeded: 'Identity-preservation diff showing zero renamed canonical IDs.',
    }),
  },
  {
    id: 'coo',
    title: 'COO',
    fullName: 'Chief Operating Officer',
    mandate: 'Operating cadence, durable queue health, and cross-functional handoffs.',
    defaultOrchestrator: false,
    scopeBoundary: 'Seated Advisor · Tracks queue quiescence and repair limits.',
    officeDraftTemplate: (topic) => ({
      position: `Stage "${topic}" through the single .pmcro/ priority queue with repairLimitPerCycle=1.`,
      dissentOrRisk: 'Parallel uncoordinated edits bypass durable queue resumption on reconnect.',
      evidenceNeeded: 'Queue snapshot and clean Cycle reflection log.',
    }),
  },
  {
    id: 'cmo',
    title: 'CMO',
    fullName: 'Chief Marketing Officer',
    mandate: 'Ecosystem positioning, developer clarity, and factual documentation.',
    defaultOrchestrator: false,
    scopeBoundary: 'Seated Advisor · Restricts claims to verified capabilities.',
    officeDraftTemplate: (topic) => ({
      position: `Describe "${topic}" strictly as a rehearsal and composition control plane—never claim live auto-installation.`,
      dissentOrRisk: 'Overstating execution authority confuses operators about what Everything Marketplaces runs.',
      evidenceNeeded: 'Copy audit confirming read-only plan language.',
    }),
  },
  {
    id: 'chro',
    title: 'CHRO',
    fullName: 'Chief Human Resources Officer',
    mandate: 'Human accountability boundaries and role clarity.',
    defaultOrchestrator: false,
    scopeBoundary: 'Seated Advisor · Keeps human sign-off distinct from agent drafts.',
    officeDraftTemplate: (topic) => ({
      position: `Require named human operator ownership for "${topic}" enterprise gate sign-off rather than delegated agent approvals.`,
      dissentOrRisk: 'Anonymous checkboxes hide who actually reviewed the evidence.',
      evidenceNeeded: 'Named operator review log alongside artifact hash.',
    }),
  },
];

export const TEAM_COMPOSITIONS: TeamComposition[] = [
  {
    id: 'startup',
    name: 'Startup',
    summary: 'Lean execution unit: CEO & CTO orchestrators with CFO runway guardrails.',
    orchestratorIds: ['ceo', 'cto'],
    memberIds: ['ceo', 'cto', 'cfo'],
    recommendedPackages: ['pmcro-core', 'skill-creator', 'model-gateway-agent'],
  },
  {
    id: 'bank',
    name: 'Bank',
    summary: 'Regulated financial unit: CEO & CTO orchestrators joined by CFO, CISO, CLO, and COO.',
    orchestratorIds: ['ceo', 'cto'],
    memberIds: ['ceo', 'cto', 'cfo', 'ciso', 'clo', 'coo'],
    recommendedPackages: ['pmcro-core', 'pmcro-governance', 'confidentiality-agent', 'eval-agent', 'csuite-ciso'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    summary: 'Full Executive Council: CEO & CTO orchestrators with all six advisory offices seated.',
    orchestratorIds: ['ceo', 'cto'],
    memberIds: ['ceo', 'cto', 'cfo', 'ciso', 'clo', 'coo', 'cmo', 'chro'],
    recommendedPackages: [
      'pmcro-core',
      'pmcro-governance',
      'github-agent',
      'model-gateway-agent',
      'federation-agent',
      'resource-registry-agent',
      'csuite-executive-council',
    ],
  },
];

export const INITIAL_PROMOTION_GATES: PromotionGate[] = [
  {
    id: 'gate-1',
    order: 1,
    title: 'Identity & Manifest Schema Integrity',
    requirement: 'All drafted marketplaces, plugins, and skills retain canonical IDs and validate against pmcro.ecosystem/v1.',
    evidenceType: 'Studio manifest hash / schema validation output',
    noteChecked: false,
    evidenceStatus: 'MISSING',
  },
  {
    id: 'gate-2',
    order: 2,
    title: 'Least-Authority Grant Boundary Proof',
    requirement: 'Verify Maker refuses execution when rehearsal grant is OFF and honors explicit capability scope.',
    evidenceType: 'Cycle refusal receipt (grant=OFF)',
    noteChecked: false,
    evidenceStatus: 'MISSING',
  },
  {
    id: 'gate-3',
    order: 3,
    title: 'Independent Checker Invariant',
    requirement: 'Confirm makerMaySelfApprove=false and "skip check" seeds halt immediately before Plan/Make.',
    evidenceType: 'Cycle HALT invariant transcript',
    noteChecked: false,
    evidenceStatus: 'MISSING',
  },
  {
    id: 'gate-4',
    order: 4,
    title: 'C-Suite Roundtable Dissent Record',
    requirement: 'Convene local office drafts preserving dissent, evidence gaps, and CEO/CTO orchestrator locks.',
    evidenceType: 'Roundtable local office transcript',
    noteChecked: false,
    evidenceStatus: 'MISSING',
  },
  {
    id: 'gate-5',
    order: 5,
    title: 'Unit Economics & Budget Ceiling',
    requirement: 'Confirm cycle compute bounds and local Ollama / CI runner budget limits.',
    evidenceType: 'Economics-agent cap declaration',
    noteChecked: false,
    evidenceStatus: 'MISSING',
  },
  {
    id: 'gate-6',
    order: 6,
    title: 'Dynamic Skill Rehearsal & CI Workflow',
    requirement: 'Verify dynamic AgentSkill SKILL.md + GitHub Actions workflow_dispatch manifest.',
    evidenceType: 'Studio dynamic skill + workflow YAML digest',
    noteChecked: false,
    evidenceStatus: 'MISSING',
  },
  {
    id: 'gate-7',
    order: 7,
    title: 'Read-Only Install Plan Export',
    requirement: 'Generate deterministic install plan combining staged packages and active C-suite composition.',
    evidenceType: 'Exported .agents/install-plan.json SHA',
    noteChecked: false,
    evidenceStatus: 'MISSING',
  },
];
