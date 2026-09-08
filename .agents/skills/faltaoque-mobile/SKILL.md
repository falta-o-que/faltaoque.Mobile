---
name: faltaoque-mobile
description: Implement or review the FaltaOquê React Native mobile app according to its SDD, memory bank, approved Figma, and Expo SDK 57 constraints. Use only for work inside the FaltaOquê mobile repository; do not use for unrelated Expo or frontend projects.
---

# FaltaOquê Mobile

Use the repository documents as maintained sources of truth instead of copying their current contents into the skill.

## Establish context

Before planning project work, read these files in order:

1. `docs/project/overview.md`
2. `docs/project/decisions.md`
3. `docs/project/current-state.md`
4. `docs/agents/workflow.md`

Then read only the specification and architecture documents relevant to the requested slice. For the current delivery, use `docs/specs/milestone-2026-09-14.md`. For fiscal work, also read `docs/specs/nfce-sp-spike.md` and `docs/architecture/mobile.md`.

When a task changes a durable decision or completed project state, update the appropriate memory-bank file in Portuguese.

## Resolve conflicts

For visual decisions, follow the precedence recorded in `docs/project/overview.md`. Preserve the approved Figma direction; do not introduce a new aesthetic or reinterpret the product branding.

For functional behavior, the relevant SDD and confirmed entries in `docs/project/decisions.md` prevail over incomplete UI behavior. Surface unresolved conflicts instead of silently choosing a new requirement.

## Implement mobile code

- Target React Native with Expo SDK 57 and JavaScript. Before writing Expo-dependent code, consult the exact versioned documentation at `https://docs.expo.dev/versions/v57.0.0/`.
- Use `styled-components/native` and the shared theme. Keep every `styled.*` declaration in the sibling `styles.js`; keep logic and JSX in `index.js`.
- Keep screens independent from persistence technology. Route behavior through application services and repository contracts so local adapters can later be replaced by backend adapters.
- Isolate persisted data by `accountId`, version local schemas, and preserve existing data on errors. Never store passwords in plaintext.
- Install Expo-compatible native packages with `npx expo install` only when the requested slice needs them.
- Do not add a global state, form, or database library without a demonstrated need and an explicit architectural decision.

When translating approved Figma nodes into repository code, also use `figma-implement-design`. Convert Figma output to the project's React Native conventions; never copy web/Tailwind output literally. Use `figma-use` only when the user asks to modify or programmatically inspect the Figma file itself.

## Protect ownership and verify

Inspect the working tree before editing and preserve unrelated human changes. Treat the protected paths listed in `docs/project/current-state.md` and `AGENTS.md` as read-only unless the user explicitly assigns them.

Verify changes in proportion to risk. A UI slice should at least bundle successfully and be checked against its Figma reference. Persistence and domain work should exercise failure paths and account isolation. Camera, NFC-e, and lifecycle behavior require an Android physical-device validation note; explicitly report when iOS was not physically tested.

Leave changes uncommitted unless the user explicitly requests a commit, push, merge, or pull request.
