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

The local operator bridge lists exact marketplace/agent/plugin/skill routes:

```sh
python3 eng/marketplaces/resolve.py discover
python3 eng/marketplaces/resolve.py discover --marketplace project-management
python3 eng/marketplaces/test_resolve.py
```

It emits a PMCR-O `BehavioralIntent` handoff while retaining the original prompt.
The catalog is not the Dispatch registry: a discovered skill is not automatically
an executable adapter. The first independently reviewed adapter is the read-only
`/dotagents:doctor` entrypoint. Resolve it without execution using an existing
AgentSkills checkout containing the pinned commit, an initialized disposable or
explicitly authorized project root, an installed trusted DotAgents CLI on PATH,
and the exact operation on stdin:

```sh
printf '%s' '{"operation":"check"}' | python3 eng/marketplaces/resolve.py resolve \
  --marketplace project-management --agent dotagents-agent \
  --plugin dotagents --skill doctor \
  --checkout shawn2024bellazan-prog/agent-skills=/absolute/agentskills \
  --project /absolute/project
```

Only an independent operator may append `--execute --allow /dotagents:doctor`.
The bridge verifies the catalog pin, Git origin, reviewed adapter hashes, scope
and exact read-only request. It invokes the existing fixed-verb provider from
the pinned Git objects; it does not implement `doctor`, accept `--fix`, install
anything, expose a web execution endpoint, or accept a grant from message data.
The receipt reports the real adapter/provider exit and observed health check
plus an output digest, without printing private provider output. The preserved
prompt may itself be private; keep local handoff receipts private.

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
