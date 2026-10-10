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

Then read only the specification and architecture documents relevant to the requested slice. Use `docs/specs/milestone-2026-09-14.md` for the original local MVP and `docs/specs/integracao-e-fluxos-2026-10-05.md` for the later backend and front-end decisions. For fiscal work, also read `docs/specs/nfce-sp-spike.md` and `docs/architecture/mobile.md`. For hosted data work, inspect the latest dated model snapshot (currently `docs/architecture/hosted-database-model-2026-10-08.json`) and compare it with the relevant SQL; a model snapshot does not prove a deployed migration.

When a task changes a durable decision or completed project state, update the appropriate memory-bank file in Portuguese.

When the user requests a handoff to another computer, record the current implementation, verification result, and the next concrete device or integration check in `docs/project/current-state.md`; update the applicable SDD and decisions as needed. Only commit or push when the user explicitly requests synchronization. Never include `.env.local`, API keys, or other local secrets in that handoff.

## Resolve conflicts

For visual decisions, follow the precedence recorded in `docs/project/overview.md`. Preserve the approved Figma direction; do not introduce a new aesthetic or reinterpret the product branding.

For functional behavior, the relevant SDD and confirmed entries in `docs/project/decisions.md` prevail over incomplete UI behavior. Surface unresolved conflicts instead of silently choosing a new requirement.

Later dated decisions override conflicting descriptions of earlier flows. The 2026-10-06 correction makes grocery lists hosted through `grocery_lists` and related tables. For NFC-e identity, extract the code between `p=` and the first `|` in the QR URL; the backend field and API contract remain unconfirmed. Do not implement the older local-only list or QR fingerprint proposals as the target hosted behavior.

## Implement mobile code

- Target React Native with Expo SDK 57 and JavaScript. Before writing Expo-dependent code, consult the exact versioned documentation at `https://docs.expo.dev/versions/v57.0.0/`.
- Use `styled-components/native` and the shared theme. Keep every `styled.*` declaration in the sibling `styles.js`; keep logic and JSX in `index.js`.
- Keep screens independent from persistence technology. Route behavior through application services and repository contracts so local adapters can later be replaced by backend adapters.
- Isolate persisted data by `accountId`, version local schemas, and preserve existing data on errors. Never store passwords in plaintext.
- Install Expo-compatible native packages with `npx expo install` only when the requested slice needs them.
- Do not add a global state, form, or database library without a demonstrated need and an explicit architectural decision.

When translating approved Figma nodes into repository code, also use `figma-implement-design`. Convert Figma output to the project's React Native conventions; never copy web/Tailwind output literally. Use `figma-use` only when the user asks to modify or programmatically inspect the Figma file itself.

## Validate responsive mobile lists

- Check list screens with empty, one-card, multi-card, overflow, small-screen, and long-label states.
- Keep scroll extent independent from floating-action placement. Do not use page padding to position an overlay when that padding would shorten the scroll viewport; give the floating action its own offset.
- Reserve internal scroll space around card shadows so clipping does not affect the first card or horizontal edges, while keeping the viewport clipped below section headings and above fixed navigation.
- On Android, do not assume iOS shadow properties or `boxShadow` render in the active build. Prefer a stable `elevation` plus a subtle outline when the approved uniform shadow cannot be reproduced, and verify the result on the target runtime before adding compensating layers.
- Constrain card titles and similar dynamic labels with flex shrink, one line, and tail ellipsis instead of allowing them to expand the card.

## Protect ownership and verify

Inspect the working tree before editing and preserve unrelated human changes. Treat the protected paths listed in `docs/project/current-state.md` and `AGENTS.md` as read-only unless the user explicitly assigns them.

Verify changes in proportion to risk. A UI slice should at least bundle successfully and be checked against its Figma reference. Persistence and domain work should exercise failure paths and account isolation. Camera, NFC-e, and lifecycle behavior require an Android physical-device validation note; explicitly report when iOS was not physically tested.

Leave changes uncommitted unless the user explicitly requests a commit, push, merge, or pull request.
