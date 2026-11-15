import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_PROMOTION_GATES, TEAM_COMPOSITIONS } from '../data/ecosystem';
import {
  buildInstallPlan,
  conveneRoundtable,
  draftStudioArtifact,
  evaluatePromotionReadiness,
  runPmcroCycle,
  validateEcosystemCounts,
} from './pmcroEngine';

test('ecosystem catalog holds exactly 4 marketplaces, 46 packages, and 70 skills', () => {
  const counts = validateEcosystemCounts();
  assert.equal(counts.marketplaceCount, 4);
  assert.equal(counts.packageCount, 46);
  assert.equal(counts.skillCount, 70);
});

test('startup composition keeps CEO and CTO as default orchestrators and convenes local office drafts', () => {
  const startup = TEAM_COMPOSITIONS.find((c) => c.id === 'startup');
  assert.ok(startup);
  assert.deepEqual(startup.orchestratorIds, ['ceo', 'cto']);

  const transcript = conveneRoundtable('startup', 'Q4 Launch');
  assert.equal(transcript.liveModelUsed, false);
  assert.equal(transcript.mode, 'local-office-drafts');
  assert.deepEqual(transcript.orchestrators, ['ceo', 'cto']);
  assert.equal(transcript.drafts.length, 3);
  assert.equal(transcript.drafts[0].isDefaultOrchestrator, true);
  assert.equal(transcript.drafts[1].isDefaultOrchestrator, true);
});

test('Maker refuses when rehearsal grant is OFF', () => {
  const res = runPmcroCycle('Verify package staging manifest', {
    rehearsalGrant: false,
    compositionId: 'startup',
    stagedPackageIds: ['pmcro-core'],
  });
  assert.equal(res.refused, true);
  assert.equal(res.halted, false);
  assert.equal(res.finalVerdict, 'REFUSED_NO_GRANT');
  const makePhase = res.phases.find((p) => p.phase === 'make');
  assert.equal(makePhase?.status, 'REFUSED');
});

test('seed containing "skip check" halts immediately', () => {
  const res = runPmcroCycle('Deploy package and skip check to save time', {
    rehearsalGrant: true,
    compositionId: 'startup',
    stagedPackageIds: ['pmcro-core'],
  });
  assert.equal(res.halted, true);
  assert.equal(res.finalVerdict, 'HALTED_SKIP_CHECK');
  const orchPhase = res.phases.find((p) => p.phase === 'orchestrate');
  assert.equal(orchPhase?.status, 'HALTED');
});

test('Cycle completes full loop when rehearsal grant is ON and seed is valid', () => {
  const res = runPmcroCycle('Audit skill-creator projection manifest', {
    rehearsalGrant: true,
    compositionId: 'bank',
    stagedPackageIds: ['pmcro-core', 'skill-creator'],
  });
  assert.equal(res.halted, false);
  assert.equal(res.refused, false);
  assert.equal(res.finalVerdict, 'PASS');
  assert.equal(res.phases.length, 6);
  assert.equal(res.phases[5].phase, 'reflect');
});

test('Studio refuses drafts that attempt to rename canonical identities', () => {
  const bad = draftStudioArtifact({
    kind: 'skill',
    canonicalId: 'ollama-local-bridge',
    requestedRenameId: 'renamed-custom-bridge',
    sourceNamespace: 'pmcr-o/model-gateway-agent',
    summary: 'Bridge',
    commands: ['/ollama-run'],
    ollamaModel: 'qwen2.5-coder:7b',
    githubRepo: 'pmcr-o/skills',
    workflowFile: 'pmcro-skill-dispatch.yml',
  });
  assert.equal(bad.accepted, false);
  assert.equal(bad.identityPreserved, false);

  const good = draftStudioArtifact({
    kind: 'skill',
    canonicalId: 'ollama-local-bridge',
    requestedRenameId: 'ollama-local-bridge',
    sourceNamespace: 'pmcr-o/model-gateway-agent',
    summary: 'Local Ollama AgentSkill',
    commands: ['/ollama-run'],
    ollamaModel: 'qwen2.5-coder:7b',
    githubRepo: 'pmcr-o/skills',
    workflowFile: 'pmcro-skill-dispatch.yml',
  });
  assert.equal(good.accepted, true);
  assert.equal(good.identityPreserved, true);
  assert.ok(good.workflowYaml.includes('workflow_dispatch'));
});

test('Enterprise gates treat checkboxes as notes only, not evidence', () => {
  const gatesWithAllCheckboxesChecked = INITIAL_PROMOTION_GATES.map((g) => ({
    ...g,
    noteChecked: true,
    evidenceStatus: 'MISSING' as const,
  }));
  const readiness = evaluatePromotionReadiness(gatesWithAllCheckboxesChecked);
  assert.equal(readiness.noteCheckedCount, 7);
  assert.equal(readiness.verifiedCount, 0);
  assert.equal(readiness.readyForProduction, false);
});

test('Install plan combines staged packages and active C-suite team without executing', () => {
  const plan = buildInstallPlan(['pmcro-core', 'github-agent'], 'startup');
  assert.equal(plan.executed, false);
  assert.equal(plan.stagedPackages.length, 2);
  assert.equal(plan.totalStagedSkills, 7);
  assert.deepEqual(plan.orchestrators, ['ceo', 'cto']);
});
