# ADR 0002: Govern PMCR-O self-improvement through Cognitive Trail promotion gates

- Status: proposed
- Date: 2026-11-18

## Context

Everything-as-Agent can generate structured Cognitive Trails containing Behavioral Intent, capability resolution, actual provider execution, evidence, Checker verdicts, and Reflector lessons. Those records can support retrieval, skill extraction, prompt/policy improvement, and eventually model fine-tuning.

A recursive system creates a special risk: PMCR-O may eventually improve or fine-tune PMCR-O. Without explicit separation, a system could train on its own failed behavior, approve its own candidate, or mistake a recorded execution for training authorization.

Current marketplace discovery on 2026-11-18 found no installed fine-tune/training skill and no training/model-learning repository. Model training is therefore NOT_INVOKED in the current ecosystem.

## Decision

Treat model learning as a governed capability, not an automatic consequence of a Trail.

Use the ordered promotion states:

`RECORDED -> VERIFIED -> EVALUATED -> APPROVED_FOR_LEARNING -> CANDIDATE -> TESTED -> PROMOTED`

PMCR-O self-improvement must preserve role separation:

- Reflector extracts evidence-linked lessons/candidates.
- Checker verifies source behavior and evidence.
- Learning capability curates and approves allowed learning use.
- Training Agent, when one actually exists, invokes the real training provider.
- Evaluation capability tests the candidate model or policy.
- Model capability registers, promotes, rolls back, or deploys only after successful evaluation.

No component may treat its own model confidence as approval. Training does not grant runtime authority. A promoted model still resolves marketplace capabilities and providers under the same Invocation and Recursive Capability laws.

## Consequences

Benefits:
- PMCR-O can eventually fine-tune PMCR-O without circular self-approval.
- Cognitive Trails become useful behavioral supervision while remaining auditable evidence.
- Retrieval and skill/policy learning can mature before a model-training provider exists.
- Missing training infrastructure is represented truthfully as NOT_INVOKED.

Tradeoffs:
- learning requires explicit lineage and promotion state;
- training and evaluation providers remain separate capabilities;
- a completed training run still requires independent QA before promotion;
- current runtime cannot execute model fine-tuning until a real marketplace capability/provider is added.

## Evidence

- Canonical PMCR-O Trail implementation: `pmcro-marketplace/marketplace-agent@5a384a33fed247fb2b85b177ccb9b6ca3901c36c:skills/marketplace/scripts/trail.py`.
- QA Agent v0.2.0 includes learning, recursive-capability, and autonomy QA skills.
- Marketplace/installed-skill discovery found no current training/fine-tuning capability.
