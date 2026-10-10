# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Project agent workflow

## Project context for every chat

- Use the repository-local skill at `.agents/skills/faltaoque-mobile/SKILL.md` for work in this project. Follow its instructions and read the repository files it references rather than copying their contents into chat instructions.
- The project memory bank is `docs/project/overview.md`, `docs/project/decisions.md`, and `docs/project/current-state.md`. Read these files before planning project work.
- Read `docs/specs/milestone-2026-09-14.md` for the original local MVP and `docs/specs/integracao-e-fluxos-2026-10-05.md` for later backend and front-end decisions. Read the task-relevant parts before implementation. For NFC-e work, also read `docs/specs/nfce-sp-spike.md` and `docs/architecture/mobile.md`. For hosted data work, inspect the latest dated model snapshot, currently `docs/architecture/hosted-database-model-2026-10-08.json`; it does not confirm the deployed schema.
- Keep this context in the repository so every new chat opened for this local project uses the same maintained sources.
- For a user-requested handoff to another computer, update the current-state memory, relevant decisions and SDD, and the repository skill when the handoff workflow itself changes. Commit/push only when the user explicitly asks to synchronize; never include `.env.local` or other local secrets.

- The root agent is the orchestrator and should use `gpt-6-sol` with `low` reasoning by default.
- Delegate bounded, independent work to subagents using `gpt-5.6-luna` with `medium` reasoning by default.
- Use at most three concurrent subagents across the entire agent tree, subject to runtime capacity.
- Use `gpt-5.6-sol` with `medium` reasoning for independent work requiring more synthesis or coupling; use `high` when justified. Choose a stronger available worker directly when Luna is unsuitable; a failed Luna attempt is not required.
- Recommend that the user raise the root's reasoning to `medium` or `high` for demanding architecture, security or debugging when concrete complexity warrants it. Explain the reason; do not claim to change the root model or effort yourself.
- Delegate directly to the suitable worker; do not require a chain between models. Explain the delegation split at the start of substantial implementation work.
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
