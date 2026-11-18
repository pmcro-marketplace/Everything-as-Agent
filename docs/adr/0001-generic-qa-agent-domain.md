# ADR 0001: Generic QA as an Agent-domain over existing proof capabilities

- Status: proposed
- Date: 2026-11-18

## Context

Everything-as-Agent already contains many isolated verification capabilities: Layer-0 validators, Checker, GitHub Actions, A2A transport/correlation proofs, PMCR-O self-proof, and application tests. Creating another independent testing stack would duplicate these capabilities and violate reuse-before-create.

The system also needs to verify more than source code. It must prove capability resolution, provider execution, Behavioral Intent, Cognitive Trails, governance, learning promotion, recursive capability creation, autonomy, and self-reference.

## Decision

Create QA as a first-class Agent domain with generic QA contracts. QA owns routing and proof composition, while actual execution remains delegated to the existing capability/provider that owns the function being tested.

Adopt twelve QA layers from structural through self-reference. Require evidence for PASS. Treat Cognitive Trails as externalized, reconstructible execution records rather than hidden model reasoning.

Training and fine-tuning are QA-governed capabilities, not automatic consequences of recorded Trails. PMCR-O may eventually improve or fine-tune PMCR-O only through explicit learning-candidate, evaluation, promotion, and provider-resolution gates.

## Consequences

Benefits:
- existing validators and proofs are reused;
- new Agent types inherit common QA behavior;
- hallucinated functions/providers become explicit failures;
- Cognitive Trails can support trustworthy learning without equating logs with training data;
- QA can test PMCR-O and itself.

Tradeoffs:
- a QA router alone is not an executable test provider;
- new provider integrations still require capability resolution;
- self-review by the same model is not independent review;
- the current GitHub provider cannot create the dedicated QA Agent repository in this session.

## Evidence

- Existing pmcro-marketplace repositories and validators discovered on 2026-11-18.
- Skill Agent PR #2: YAML -> Agent Skill candidate conversion.
- pmcro-agent PR #6: PMCR-O self-proof.
- Existing Everything-as-Agent tests for dynamic skill runtime, PMCR-O engine, and repo health.
- Private `qa` plugin v0.1.0 created through Plugin Creator and source release verified.
