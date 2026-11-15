import { useEffect, useState } from 'react';
import {
  CATALOG_PACKAGES,
  INITIAL_PROMOTION_GATES,
  type CompositionId,
  type MemberMarketplaceId,
  type PromotionGate,
} from './data/ecosystem';
import { PMCRO_ORG_SNAPSHOT, type PmcroRepoSnapshot } from './data/pmcroOrgSnapshot';
import {
  conveneRoundtable,
  runPmcroCycle,
  type CycleExecutionResult,
  type RoundtableTranscript,
  type StudioDraftOutput,
} from './utils/pmcroEngine';
import { SidebarNav, type NavSectionId } from './components/SidebarNav';
import { TopHeader } from './components/TopHeader';
import { AtlasView } from './components/AtlasView';
import { CatalogView } from './components/CatalogView';
import { CsuiteView } from './components/CsuiteView';
import { CycleView } from './components/CycleView';
import { StudioView } from './components/StudioView';
import { EnterpriseView } from './components/EnterpriseView';
import { PlanView } from './components/PlanView';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSectionId>('atlas');
  const [selectedMarketplace, setSelectedMarketplace] = useState<MemberMarketplaceId | 'all'>('all');

  // Start with the startup team and default staged starter package
  const [compositionId, setCompositionId] = useState<CompositionId>('startup');
  const [stagedPackageIds, setStagedPackageIds] = useState<string[]>([
    'pmcro-core',
    'skill-creator',
    'model-gateway-agent',
  ]);
  const [rehearsalGrant, setRehearsalGrant] = useState<boolean>(false);
  const [roundtable, setRoundtable] = useState<RoundtableTranscript | null>(null);
  const [lastCycleResult, setLastCycleResult] = useState<CycleExecutionResult | null>(null);
  const [gates, setGates] = useState<PromotionGate[]>(INITIAL_PROMOTION_GATES);

  // pmcr-o GitHub org repository, branch, and commit telemetry
  const [repos, setRepos] = useState<PmcroRepoSnapshot[]>(PMCRO_ORG_SNAPSHOT);
  const [repoSource, setRepoSource] = useState<'snapshot' | 'live'>('snapshot');
  const [repoUpdatedAt, setRepoUpdatedAt] = useState<string>('2026-11-15T01:18:00Z');
  const [repoError, setRepoError] = useState<string | null>(null);
  const [repoRateLimited, setRepoRateLimited] = useState<boolean>(false);
  const [repoStatusCode, setRepoStatusCode] = useState<number | null>(null);
  const [isRefreshingRepos, setIsRefreshingRepos] = useState(false);

  useEffect(() => {
    fetch('/api/pmcro/repos')
      .then(async (r) => {
        if (!r.ok) {
          setRepoStatusCode(r.status);
          setRepoError(`Repository endpoint returned HTTP ${r.status}`);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data?.repos?.length) {
          setRepos(data.repos);
          setRepoSource(data.source === 'live' ? 'live' : 'snapshot');
          if (data.updatedAt) setRepoUpdatedAt(data.updatedAt);
          setRepoError(data.error ?? null);
          setRepoRateLimited(Boolean(data.rateLimited));
          setRepoStatusCode(data.statusCode ?? null);
        }
      })
      .catch((err) => {
        setRepoError(err instanceof Error ? err.message : 'Unable to reach repository telemetry API');
      });
  }, []);

  async function handleRefreshRepos() {
    setIsRefreshingRepos(true);
    try {
      const res = await fetch('/api/pmcro/repos?refresh=1');
      if (!res.ok) {
        setRepoStatusCode(res.status);
        setRepoError(`GitHub sync endpoint returned HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      if (data?.repos?.length) {
        setRepos(data.repos);
        setRepoSource(data.source === 'live' ? 'live' : 'snapshot');
        if (data.updatedAt) setRepoUpdatedAt(data.updatedAt);
      }
      setRepoError(data?.error ?? null);
      setRepoRateLimited(Boolean(data?.rateLimited));
      setRepoStatusCode(data?.statusCode ?? null);
    } catch (err) {
      setRepoError(err instanceof Error ? err.message : 'Network error syncing GitHub repositories');
    } finally {
      setIsRefreshingRepos(false);
    }
  }

  function updateGateEvidence(gateId: string, status: PromotionGate['evidenceStatus'], artifact: string) {
    setGates((prev) =>
      prev.map((g) => (g.id === gateId ? { ...g, evidenceStatus: status, evidenceArtifact: artifact } : g))
    );
  }

  function handleToggleStage(packageId: string) {
    setStagedPackageIds((prev) =>
      prev.includes(packageId) ? prev.filter((id) => id !== packageId) : [...prev, packageId]
    );
  }

  function handleConveneRoundtable(topic: string) {
    const transcript = conveneRoundtable(compositionId, topic);
    setRoundtable(transcript);
    updateGateEvidence(
      'gate-4',
      'VERIFIED',
      `Roundtable (${transcript.compositionId}, ${transcript.drafts.length} drafts)`
    );
  }

  function handleRunCycle(rawSeed: string) {
    const result = runPmcroCycle(rawSeed, {
      rehearsalGrant,
      compositionId,
      stagedPackageIds,
    });
    setLastCycleResult(result);

    if (result.finalVerdict === 'REFUSED_NO_GRANT') {
      updateGateEvidence('gate-2', 'VERIFIED', 'Maker refused with grant=OFF');
    } else if (result.finalVerdict === 'HALTED_SKIP_CHECK') {
      updateGateEvidence('gate-3', 'VERIFIED', 'Cycle HALTED on "skip check"');
    } else if (result.finalVerdict === 'PASS') {
      updateGateEvidence('gate-5', 'REHEARSED', 'Bounded rehearsal PASS');
    }
  }

  function handleArtifactDrafted(draft: StudioDraftOutput) {
    if (draft.accepted) {
      updateGateEvidence('gate-1', 'VERIFIED', `${draft.canonicalId} (${draft.digest})`);
      updateGateEvidence('gate-6', 'VERIFIED', `Workflow manifest ${draft.digest}`);
    }
  }

  function handlePlanCopied() {
    updateGateEvidence('gate-7', 'VERIFIED', `Exported (${stagedPackageIds.length} staged, ${compositionId})`);
  }

  function handleToggleNoteCheckbox(gateId: string) {
    setGates((prev) =>
      prev.map((g) => (g.id === gateId ? { ...g, noteChecked: !g.noteChecked } : g))
    );
  }

  function handleAttachDemoEvidence(gateId: string) {
    updateGateEvidence(gateId, 'VERIFIED', `Operator-attached artifact (${gateId})`);
  }

  const stagedSkillsCount = stagedPackageIds.reduce((sum, id) => {
    const pkg = CATALOG_PACKAGES.find((p) => p.id === id);
    return sum + (pkg?.skills.length ?? 0);
  }, 0);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-900">
      <SidebarNav
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        compositionId={compositionId}
        stagedCount={stagedPackageIds.length}
        stagedSkillsCount={stagedSkillsCount}
        rehearsalGrant={rehearsalGrant}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          activeSection={activeSection}
          stagedCount={stagedPackageIds.length}
          onOpenPlan={() => setActiveSection('plan')}
        />

        <main className="flex-1 p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {activeSection === 'atlas' && (
            <AtlasView
              repos={repos}
              repoSource={repoSource}
              repoUpdatedAt={repoUpdatedAt}
              repoError={repoError}
              repoRateLimited={repoRateLimited}
              repoStatusCode={repoStatusCode}
              isRefreshingRepos={isRefreshingRepos}
              onRefreshRepos={handleRefreshRepos}
              onBrowseMarketplace={(mpId) => {
                setSelectedMarketplace(mpId);
                setActiveSection('catalog');
              }}
            />
          )}

          {activeSection === 'catalog' && (
            <CatalogView
              selectedMarketplace={selectedMarketplace}
              onSelectMarketplace={setSelectedMarketplace}
              stagedPackageIds={stagedPackageIds}
              onToggleStage={handleToggleStage}
              onGoToPlan={() => setActiveSection('plan')}
            />
          )}

          {activeSection === 'csuite' && (
            <CsuiteView
              compositionId={compositionId}
              onSelectComposition={setCompositionId}
              roundtable={roundtable}
              onConveneRoundtable={handleConveneRoundtable}
              onApplyRecommendedPackages={(pkgIds) => setStagedPackageIds(pkgIds)}
            />
          )}

          {activeSection === 'cycle' && (
            <CycleView
              compositionId={compositionId}
              stagedPackageIds={stagedPackageIds}
              rehearsalGrant={rehearsalGrant}
              onToggleRehearsalGrant={setRehearsalGrant}
              lastCycleResult={lastCycleResult}
              onRunCycle={handleRunCycle}
            />
          )}

          {activeSection === 'studio' && <StudioView onArtifactDrafted={handleArtifactDrafted} />}

          {activeSection === 'enterprise' && (
            <EnterpriseView
              gates={gates}
              onToggleNoteCheckbox={handleToggleNoteCheckbox}
              onAttachDemoEvidence={handleAttachDemoEvidence}
            />
          )}

          {activeSection === 'plan' && (
            <PlanView
              stagedPackageIds={stagedPackageIds}
              compositionId={compositionId}
              onUnstagePackage={(id) =>
                setStagedPackageIds((prev) => prev.filter((item) => item !== id))
              }
              onClearStaged={() => setStagedPackageIds([])}
              onPlanCopied={handlePlanCopied}
              onBrowseCatalog={() => setActiveSection('catalog')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
