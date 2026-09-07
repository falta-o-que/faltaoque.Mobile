# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Project agent workflow

- The root agent is the orchestrator and should use `gpt-5.6-sol`.
- Delegate bounded, independent work to subagents using `gpt-5.6-luna` with `medium` reasoning by default.
- Use at most three subagents concurrently under normal conditions.
- The orchestrator may exceed three only when additional tasks are truly independent and parallelism materially improves delivery time or quality.
- The orchestrator may select a stronger subagent model when complexity, risk, ambiguity, or cross-module coupling makes Luna unsuitable.
- Keep urgent blocking work and tightly coupled integration work with the orchestrator.
- Give coding subagents disjoint write scopes. Never let two agents edit the same files concurrently.
- Review and verify every subagent result before accepting it.
- Leave changes uncommitted unless the user explicitly requests a commit, push, merge, or pull request.
- Treat `src/components/Navbar/` and `src/assets/icons/` as active human work areas. Do not modify them unless the user explicitly assigns that work.
- Follow `docs/agents/workflow.md` for delegation and escalation details.
- Before planning project work, read `docs/project/overview.md`, `docs/project/decisions.md`, and `docs/project/current-state.md`. Read only the task-relevant specifications after that.
- Keep agent-facing operational instructions in English and human-facing project documentation in Portuguese.
