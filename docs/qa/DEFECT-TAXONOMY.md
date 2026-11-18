# QA Defect Taxonomy

Status: canonical QA vocabulary
Date: 2026-11-18

A defect is a traceable mismatch between Behavioral Intent, declared capability, actual provider execution, observable state, governance requirements, or evidence.

| Category | Meaning |
| --- | --- |
| STRUCTURAL | Required files, manifests, schemas, names, packaging, or directory contracts are invalid. |
| CONTRACT | Inputs, outputs, invariants, lifecycle, or declared failure semantics do not match the governing contract. |
| RESOLUTION | Agent → Plugin → Skill → Function resolution is ambiguous, wrong, or impossible. |
| CAPABILITY | The requested validated capability does not exist. |
| PROVIDER | Capability exists but no executable provider is available or provider identity is false. |
| EXECUTION | A resolved provider was invoked but did not complete as required. |
| BEHAVIOR | Observable result does not satisfy the original Behavioral Intent. |
| INTEGRATION | A2A, MCP, GitHub Actions, runtime, storage, cloud, or other boundary interaction fails. |
| SECURITY | Security property, isolation rule, credential boundary, or least-authority requirement fails. |
| GOVERNANCE | Authorization, policy, separation-of-duties, approval, or fail-closed rule fails. |
| EVIDENCE | Claimed result lacks sufficient provider-backed evidence or evidence does not match the claim. |
| COGNITIVE_TRAIL | Trail is incomplete, mutable, unsealed, unreconstructible, has broken parentage, or contradicts execution evidence. |
| LEARNING | Unverified or unapproved behavior enters retrieval, optimization, training, or promotion. |
| AUTONOMY | Autonomous execution exceeds promoted behavior, authority, policy, or evidence boundaries. |
| REGRESSION | Previously verified behavior no longer passes equivalent checks. |
| DOCUMENTATION | Documentation claims behavior or capability that current implementation/evidence does not support. |

## Severity

- `S0` — informational / no behavioral risk.
- `S1` — localized defect with safe fallback.
- `S2` — blocks a capability or invalidates a QA result.
- `S3` — governance/security/evidence failure that requires fail-closed behavior.
- `S4` — systemic integrity failure; stop affected autonomous execution.

## Required defect fields

Every persisted defect should include:

- stable defect ID;
- category;
- severity;
- subject;
- Behavioral Intent;
- resolved capability identity when one exists;
- provider identity when one exists;
- expected behavior;
- observed behavior;
- evidence references;
- Cognitive Trail ID when available;
- disposition;
- remediation or next intent.

## Core rules

1. A missing capability is not an execution failure; classify it as CAPABILITY and return `BLOCKED` or `NOT_INVOKED`.
2. A missing provider is PROVIDER, not proof that the capability itself is absent.
3. Emission, routing, source presence, plans, and documentation are never execution evidence.
4. A Checker defect report must not silently repair the artifact.
5. A recorded Cognitive Trail is evidence material, not automatically a learning-approved example.
6. QA must preserve the distinction between failure, blocked work, not-invoked work, and unverified work.
