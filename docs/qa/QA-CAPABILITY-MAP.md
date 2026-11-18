# Everything-as-Agent QA Capability Map

Status: FOUNDATION DISCOVERY
Date: 2026-11-18

## Goal

Create a generic QA system that proves Behavioral Intent became real, authorized, observable behavior across the Everything-as-Agent ecosystem.

## Existing reusable capabilities

### PMCR-O lifecycle
- Orchestrate, Plan, Make, Check, Reflect are already modeled as separate role skills.
- Checker owns evidence-based PASS / LOOP / HALT-style verification.
- Reflector owns evidence-linked lessons and next-intent proposals.

### Skill / plugin / marketplace validation
- Agent repositories already include Layer-0 validators.
- Skill Agent provides the reusable validator foundation.
- Skill Agent PR #2 adds YAML -> Agent Skill candidate conversion that reuses existing identities before generating missing candidates and records provider execution as NOT_INVOKED.

### GitHub / CI
- GitHub Agent already exposes repository discovery, change management, Actions, local Actions rehearsal, and sync skills.
- Existing GitHub Actions are therefore execution/proof providers, not a separate QA architecture.

### A2A
Existing open proofs cover:
- five independent PMCR-O role service hosts;
- official Agent Framework A2A client probes;
- Orchestrator-owned dispatch chain;
- correlation preservation across Planner -> Maker -> Checker -> Reflector;
- explicit NOT_INVOKED provider states where real reasoning is absent.

### PMCR-O self-proof
pmcro-agent PR #6 adds a self-proof that:
- validates marketplace pins;
- validates A2A governance/transport contracts;
- executes a bounded five-phase cycle;
- seals and reopens the Trail;
- rejects inflated execution/approval claims.

### Everything-as-Agent application
Current main already contains:
- dynamic skill runtime tests;
- PMCR-O engine tests;
- repository health tests.

These become subjects/providers under the generic QA system rather than duplicated test frameworks.

## Newly created QA domain

Private plugin: `qa` v0.1.0

Skills:
- `qa` — generic QA router
- `capability-qa` — verifies Agent -> Plugin -> Skill -> Function and provider existence
- `cognitive-trail-qa` — verifies reconstructible externalized Cognitive Trails
- `self-proof` — negative and positive self-tests for the QA system

Current limitation:
- the plugin release exists and its source files are verified;
- the current chat session has not refreshed the skill registry, so direct invocation of the new QA skills is currently NOT_INVOKED here.

## QA layers

L0 Structural
L1 Contract
L2 Capability
L3 Provider
L4 Execution
L5 Behavioral
L6 Integration
L7 Cognitive Trail
L8 Governance
L9 Learning
L10 Autonomy
L11 Recursive Capability
L12 Self-Reference

## Core invariant

No PASS without evidence.

The following are never execution proof by themselves:
- routing
- emission
- documentation
- source-code presence
- a declared function
- a plan
- model knowledge

## Recursive Capability Law

If a required capability is missing:
1. record the gap;
2. resolve an already-existing authorized creator;
3. create a candidate;
4. validate;
5. register/install;
6. re-resolve the original capability;
7. invoke only after resolution succeeds.

If the creator is missing, recursion continues only through existing trusted bootstrap capabilities. No ad-hoc bypass is allowed.

## Cognitive Trail QA

Cognitive Trail means the observable execution record, not hidden chain-of-thought.

A reconstructible trail should link:
- behavioral intent;
- capability resolution;
- plan;
- actual provider invocation;
- state before/after;
- execution receipts;
- Checker verdict;
- human correction when present;
- Reflect lesson;
- next intent;
- learning/promotion state when applicable.

Audit evidence may be embedded in the Cognitive Trail but is not the whole Cognitive Trail.

## Learning and PMCR-O fine-tuning boundary

PMCR-O may eventually fine-tune or otherwise improve PMCR-O, but training remains a resolved capability.

Required promotion separation:
RECORDED -> VERIFIED -> EVALUATED -> APPROVED_FOR_LEARNING -> CANDIDATE -> TESTED -> PROMOTED

Evidence != truth.
Truth != training approval.
Training approval != runtime authorization.

## Proven gap

No dedicated QA Agent repository currently exists in pmcro-marketplace.

The connected GitHub provider in this session does not expose repository creation, so a new QA Agent repo is not being fabricated. The QA plugin exists through the authorized Plugin Creator provider; GitHub projection remains a follow-on capability.

## Next QA intents

1. Make the QA plugin discoverable in a fresh runtime/session.
2. Add a reusable QA report schema and defect taxonomy.
3. Compose the existing Skill validator, Checker, GitHub Actions, A2A proof, and PMCR-O self-proof under QA routing.
4. Add a Cognitive Trail schema/validator.
5. Add learning-candidate QA and PMCR-O self-training gates.
6. Run QA against QA and prove both negative rejection cases and one valid end-to-end case.
