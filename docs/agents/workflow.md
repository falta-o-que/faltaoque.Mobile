# Agent Workflow

## Purpose

Use subagents to reduce elapsed time and context usage while keeping one accountable orchestrator in control of scope, integration, and final verification.

## Model policy

- Orchestrator: `gpt-5.6-terra`, reasoning effort `low` by default, prioritizing token economy.
- Default worker: `gpt-5.6-luna`, reasoning effort `medium`.
- Intermediate worker: `gpt-5.6-sol`, reasoning effort `medium`, or `high` for demanding bounded work.
- Concurrency limit: three workers across the whole tree, including descendants, and never beyond runtime capacity. The current runtime supports four agents including the root.

The user controls the root model and reasoning setting in Codex. These instructions do not change that setting. Workers must receive explicit model/effort overrides with only the relevant context. Smaller workers here are available Codex models; do not assume a local inference runtime exists.

## Routing and root reasoning

Terra owns macro planning, SDD decisions, architectural boundaries, final integration and acceptance. Low is the routine starting point for clear requests, triage, delegation and small reviews. Keep reports concise and load only task-relevant context; use workers when independent work saves time or improves quality, not to satisfy a quota.

Use Luna/medium for closed scopes with clear acceptance criteria. Use Sol/medium for medium-complexity implementations spanning a few related modules, substantive documentation, structured-data work, investigations or independent technical reviews. Sol is an optional execution lead, not a mandatory management layer. Simple text work may remain with the root or Luna.

Prefer Terra directly assigning Luna or Sol. Sol may delegate a genuinely independent subtask only within its assigned scope, exclusive file ownership and the global concurrency budget; it must not expand the task. Do not introduce a Terra-to-Sol-to-Luna chain without a concrete benefit.

Recommend raising the root Terra to medium when unresolved ambiguity or cross-module integration requires deeper reasoning. For demanding data migration, authentication/security decisions, fiscal extraction or difficult debugging, recommend switching the root to Sol or Astra when appropriate, or assign a bounded investigation to a stronger worker. Explain the actual issue and expected benefit in Portuguese. Do not repeat the recommendation for the same unchanged condition. High or higher is exceptional and needs a concrete difficult problem.

Continue useful independent work while the user adjusts the setting. A recommendation alone is not a blocker, and elapsed time is not confirmation that the setting changed. Report any actual blocker separately. After the demanding stage, suggest returning to low when appropriate.

## Delegation rules

Delegate work when it is concrete, bounded, and can proceed without blocking the orchestrator's immediate next action. Good worker tasks include:

- Implementing one isolated component.
- Reviewing a bounded group of SVG assets.
- Writing tests for an already stable module.
- Researching one external integration and returning evidence.
- Auditing one screen against a specific Figma node.

At the beginning of substantial implementation work, briefly state what stays with the orchestrator and what is delegated. If there is no useful independent work, explain that briefly instead of spawning an idle worker.

Keep work with the orchestrator when it involves:

- Architecture or changes across several modules.
- Security, authentication, or credential storage.
- SEFAZ page extraction and normalization.
- Ambiguous conflicts between Figma, requirements, and existing code.
- Integration of results produced by multiple workers.
- Any urgent task that blocks the next implementation step.

## Escalation

The orchestrator may replace Luna with a stronger available model when at least one of these applies:

- The task remains ambiguous after inspecting the relevant sources.
- Failure would affect several features or corrupt persisted data.
- The change crosses multiple architectural boundaries.
- The work requires difficult debugging, extensive synthesis, or security judgment.
- A previous bounded Luna attempt produced an incomplete or unreliable result.

Escalation is a judgment call, not an automatic retry ladder. Prefer improving the task boundary and context before spending more tokens on a stronger model.

Choose Sol or another stronger available worker before starting when the complexity is already evident. When escalating an active assignment, stop or finish the previous worker, inspect its changes, and transfer exclusive file ownership along with findings, attempted checks and unresolved issues. Never let the replacement edit files while the original worker still owns them. Keep responsibility for high-risk architecture and security decisions with the orchestrator, recommending a stronger root when needed; a worker can investigate or review bounded evidence independently.

## Context and token discipline

- Give each worker only the relevant specification, file paths, Figma node IDs, constraints, and acceptance criteria.
- Do not copy the full memory bank or full conversation into every worker prompt.
- Do not delegate the same task to multiple workers unless an independent comparison is explicitly valuable.
- Return concise findings, changed file paths, verification results, and unresolved risks.
- Reuse decisions recorded in the repository instead of rediscovering them.

## Git and ownership

- Human contributors work in individual branches.
- Agent changes remain uncommitted until the user requests otherwise.
- Each coding worker receives an exclusive set of files.
- Inspect the working tree before delegation and preserve unrelated human changes.
- `src/components/Navbar/` and `src/assets/icons/` are currently protected human work areas.

## Completion rule

The orchestrator must inspect worker output, resolve integration issues, run proportionate verification, and report remaining uncertainty. A worker saying that a task is complete is not sufficient by itself.

For substantial changes, use an independent review or meaningful test subtask when a suitable independent scope exists. Do not force redundant reviews for trivial edits. Reviewers should receive acceptance criteria and evidence, not instructions to approve a predetermined conclusion.
