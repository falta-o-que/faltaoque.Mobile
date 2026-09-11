# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Project agent workflow

- The root agent is the orchestrator and should use `gpt-5.6-terra` with `low` reasoning by default to prioritize token economy.
- Delegate bounded, independent work to subagents using `gpt-5.6-luna` with `medium` reasoning by default.
- Use at most three concurrent subagents across the entire agent tree, subject to runtime capacity.
- Use `gpt-5.6-sol` with `medium` reasoning for independent work requiring more synthesis or coupling; use `high` when justified. Choose a stronger available worker directly when Luna is unsuitable; a failed Luna attempt is not required.
- Recommend that the user raise Terra to `medium`, or switch the root to Sol/Astra for demanding architecture, security or debugging, when concrete complexity warrants it. Explain the reason; do not claim to change the root model or effort yourself.
- Delegate directly to the suitable worker; do not require a Terra-to-Sol-to-Luna chain. Explain the delegation split at the start of substantial implementation work.
- The orchestrator may select a stronger subagent model when complexity, risk, ambiguity, or cross-module coupling makes Luna unsuitable.
- Keep urgent blocking work and tightly coupled integration work with the orchestrator.
- Give coding subagents disjoint write scopes. Never let two agents edit the same files concurrently.
- Review and verify every subagent result before accepting it.
- Leave changes uncommitted unless the user explicitly requests a commit, push, merge, or pull request.
- Treat `src/components/Navbar/` and `src/assets/icons/` as active human work areas. Do not modify them unless the user explicitly assigns that work.
- Keep component and screen styling in a sibling `styles.js` file. `index.js` must contain component logic and JSX, not `styled.*` declarations.
- Follow `docs/agents/workflow.md` for delegation and escalation details.
- Before planning project work, read `docs/project/overview.md`, `docs/project/decisions.md`, and `docs/project/current-state.md`. Read only the task-relevant specifications after that.
- Keep agent-facing operational instructions in English and human-facing project documentation in Portuguese.
