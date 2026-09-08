# Agent Workflow

## Purpose

Use subagents to reduce elapsed time and context usage while keeping one accountable orchestrator in control of scope, integration, and final verification.

## Model policy

- Orchestrator: `gpt-5.6-sol`.
- Default worker: `gpt-5.6-luna`, reasoning effort `medium`.
- Normal concurrency limit: three workers.
- The orchestrator may exceed the limit when tasks are independent, have disjoint write scopes, and the expected gain justifies the additional token usage.

The model setting of the current root task is controlled by Codex. These rules describe the required project workflow: work should begin from a Sol task, and spawned workers should receive the explicit Luna/medium override by default.

## Delegation rules

Delegate work when it is concrete, bounded, and can proceed without blocking the orchestrator's immediate next action. Good worker tasks include:

- Implementing one isolated component.
- Reviewing a bounded group of SVG assets.
- Writing tests for an already stable module.
- Researching one external integration and returning evidence.
- Auditing one screen against a specific Figma node.

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
