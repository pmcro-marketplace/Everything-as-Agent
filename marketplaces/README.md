# Federated micro-marketplaces

These four independently addressable catalogs reuse existing plugin packages. Each
`marketplace.yaml` is the authored source of its own marketplace membership. The
catalogs use JSON syntax (valid YAML 1.2) so validation needs only Python and Git.
The existing ecosystem snapshot and provider repositories are not replaced.

| Catalog | Existing providers | Boundary |
| --- | --- | --- |
| [Project management](project-management/marketplace.yaml) | `projects`, `dotagents`, host `project` | Workspace registration, portable configuration and private lifecycle; AI host project creation needs a real host provider. |
| [Template generation](template-generation/marketplace.yaml) | `template` from the organization's Template Agent | Reuse before creation; render from a declared contract; independently validate output. |
| [Skill creation](skill-creation/marketplace.yaml) | `skill`, `skill-creator`, `skills` | Discover a suitable skill first; create only a missing capability. |
| [Plugin creation](plugin-creation/marketplace.yaml) | `plugin`, host `plugin-creator`, `skill-creator` | Discover first; delegate creation/update to the actual provider. |

Repository members pin an existing commit, package path and exact skill names.
The AgentSkills source is pinned to the reviewed DotAgents PR head, not to a
mutable branch. Host members refer to existing host plugins and require fresh
discovery by the consuming host. No private plugin IDs, credentials, project
memory, tasks or trails are published. Nothing in these manifests installs a
plugin, authorizes execution, or starts a runtime. They are PMCR-O logical
catalogs, not native Claude/Codex install manifests.

## Resolve and verify

Run the catalog shape check:

```sh
python3 eng/marketplaces/validate.py
python3 eng/marketplaces/test_validate.py
```

To check a specific catalog, add `--marketplace project-management` (or another
catalog name). For real provider resolution, pass `--checkout OWNER/REPO=PATH`
for each Git checkout with the pinned commit and matching GitHub origin. The
validator reads the manifests and skill entrypoints from those immutable Git
objects, not potentially modified working-tree files. For a host dependency, add
`--host PLUGIN=SKILL,SKILL` only after the active host actually exposes those
skills. Use `--require-resolution` to deny unresolved enabled dependencies.

`catalog_validation: PASS` proves structural validity. `provider_resolution:
PASS` means sources/host skill names were resolved, not that an operation ran.
`invocation: NOT_INVOKED` intentionally remains the result of catalog validation.
Dispatch must independently resolve authorization, executable provider, input
contract and actual result. Missing host capabilities remain blocked.

## Governed discovery and invocation

The local operator bridge delegates to Marketplace Agent at the reviewed
commit `5a384a33fed247fb2b85b177ccb9b6ca3901c36c`. Supply an existing canonical
absolute Git checkout of [Marketplace Agent](https://github.com/pmcro-marketplace/marketplace-agent)
containing this commit. The bridge verifies the origin and materializes only
reviewed immutable source objects into a temporary directory. It has no fallback
execution implementation. It lists exact marketplace/agent/plugin/skill routes:

```sh
python3 eng/marketplaces/resolve.py discover --provider-checkout /absolute/marketplace-agent
python3 eng/marketplaces/resolve.py discover --provider-checkout /absolute/marketplace-agent --marketplace project-management
PMCRO_MARKETPLACE_PROVIDER_CHECKOUT=/absolute/marketplace-agent python3 eng/marketplaces/test_resolve.py
```

It emits a PMCR-O `BehavioralIntent` handoff while retaining the original prompt.
The catalog is not the Dispatch registry: a discovered skill is not automatically
an executable adapter. The independently reviewed read-only entrypoints are
`/dotagents:doctor`, `/dotagents:list`, and `/projects:project-lifecycle`
(status and runtime resolution). Resolve doctor without execution using an existing
AgentSkills checkout containing the pinned commit, an initialized disposable or
explicitly authorized project root, an installed trusted DotAgents CLI on PATH,
and the exact operation on stdin:

```sh
printf '%s' '{"operation":"check"}' | python3 eng/marketplaces/resolve.py resolve \
  --provider-checkout /absolute/marketplace-agent \
  --marketplace project-management --agent dotagents-agent \
  --plugin dotagents --skill doctor \
  --checkout shawn2024bellazan-prog/agent-skills=/absolute/agentskills \
  --project /absolute/project
```

Only an independent operator may append `--execute --allow /dotagents:doctor --project-id demo`.
The bridge verifies the catalog pin, Git origin, reviewed adapter hashes, scope
and exact read-only request. It invokes the existing fixed-verb provider from
the pinned Git objects; it does not implement `doctor`, accept `--fix`, install
anything, expose a web execution endpoint, or accept a grant from message data.
The receipt reports the real adapter/provider exit and observed health check
plus an output digest, without printing private provider output. The preserved
prompt may itself be private; keep local handoff receipts private. Every
execution attempt requires an explicit project ID registered under
`~/.pmcro/projects/` with owner-only POSIX permissions. The canonical provider
persists resolver, capability and adapter frames before and after actual
invocation, seals their inventory, and returns correlation IDs. If the private
trail cannot be written, execution fails closed. The reviewed provider does
not yet support Windows-native trail storage; use a validated POSIX host.

For list, use the same command with `--skill list`, the exact stdin request
`{"operation":"list"}`, and execution grant `--execute --allow /dotagents:list`.
The receipt reports counts, not private skill or plugin names.

For project status, resolve against the registered project and explicit private
registry root (normally the operator's `~/.pmcro`):

```sh
printf '%s' '{"operation":"status"}' | python3 eng/marketplaces/resolve.py resolve \
  --provider-checkout /absolute/marketplace-agent \
  --marketplace project-management --agent project-agent \
  --plugin projects --skill project-lifecycle \
  --checkout shawn2024bellazan-prog/agent-skills=/absolute/agentskills \
  --project /absolute/project --project-id demo --pmcro-root /absolute/private/.pmcro
```

Use `{"operation":"runtime"}` to resolve runtime scope without starting it.
If the project has a bound DotAgents configuration, independently authorize its
exact reviewed adapter with `--bound-adapter /absolute/path/to/dotagents.py`.
Append `--execute --allow /projects:project-lifecycle` only with independent
authorization. Do not change the registry or adapter concurrently with invocation.
Neither operation reads memory contents, creates a host project, or starts runtime.

## Catalog-only trail acceptance

The same provider implements a bounded catalog-only acceptance cycle. It
scaffolds a disposable catalog, validates and discovers its routes, then
checks and reflects on the persisted evidence. Use an existing authorized
private test project, never a live production project for a rehearsal:

```sh
python3 eng/marketplaces/resolve.py catalog-cycle \
  --provider-checkout /absolute/marketplace-agent \
  --project-id demo --operation run --execute
python3 eng/marketplaces/resolve.py catalog-cycle \
  --provider-checkout /absolute/marketplace-agent \
  --project-id demo --operation verify --trail-id RETURNED_UUID
```

Reopening checks the ten terminal frames, their start records, parent
correlations, and SHA-256 seal. These are real local deterministic catalog
operations, not independent host-agent invocations or approval decisions.
The test workflow uses an isolated temporary private project and publishes
only its non-sensitive Checker summary, never raw trail files.

Creator handoffs use the existing exact routes:

| Domain | Route | Admission requirement |
| --- | --- | --- |
| Template | `/template:template`, `/template:creator` | Declared template and output contract, authorized host adapter |
| Skill | `/skill:skill`, `/skill-creator:create-skill` | Proven capability gap, concrete skill target, authorized host adapter |
| Plugin | `/plugin:plugin`, `/plugin:create-domain`, `/plugin-creator:create-plugin` | Proven plugin gap, concrete target, authorized host adapter |

All remaining capabilities, including the host creator skills, return
`BLOCKED` / `NOT_INVOKED` until their real operator-authorized executable adapters
are available. The handoff can be sent to the existing PMCR-O Dispatch/host
provider when registered; it is not itself evidence of dispatch or network
delivery. A known catalog member lacking an adapter is not a missing skill.

## Governance

Only Marketplace Agent changes membership; provider source changes belong to the
appropriate domain agent. Update pins only after validating the new provider
version and its capabilities. Shared members reuse their existing packages, not
copies. Project private runtime state stays in the project registry; generated
artifacts stay outside authored catalogs.

## GitHub accountability

The PMCR-O Checker workflow runs structural and fail-closed regression tests,
TypeScript checks and the control-plane build on pull requests. Its job summary
provides evidence for the actual run; it does not validate private local runtime
state. PR comments may record independently verified trail summaries. Approvals
remain independent review decisions; a passing check is not an approval.
