# Changelog

## 0.4.0 - 2026-07-27

- Added the hosted order-intake deployment profile for Google Cloud Run and Neon PostgreSQL.
- Added `/ready` database readiness checks, root service metadata, security headers, and guarded HTTP MCP error handling.
- Added a Chinese hosted-deployment runbook for `api.madeforai.net`, remote MCP clients, Secret Manager, and production validation.
- Hardened the production container to run as a non-root user and added focused Cloud Build ignore rules.
- Added a remote MCP smoke command and verified the complete approval-first order lifecycle against the hosted database.
- Expanded route and security regression coverage; 49 tests now pass across 6 files.
- Kept real payments and automatic supplier ordering out of scope; the hosted payment gate remains explicitly mocked.

## 0.3.4 - 2026-07-25

- Audited the supplied v0.3.3 archive and confirmed its 75 source files are byte-for-byte equivalent to the current implementation.
- Strengthened the competition Q&A with short and expanded answers that distinguish AI feedback from reproducible engineering evidence.
- Reframed the multi-model audit slide around source-to-claim verification, regression testing, and durable proof instead of brittle release or vulnerability counts.
- Retained the safer team slide and rejected claims whose exact historical counts are not required to demonstrate current product capability.
- Kept demo-route authentication while giving `/user` an English demo-access screen; `/operator` retains the Chinese production login.
- Kept the executable workflow unchanged: 16 MCP tools, 16 approval-first steps, nine phase-1 categories, and 48 focused tests.

## 0.3.3 - 2026-07-25

- Added manufacturing knowledge for print collateral, exhibition and retail display, and apparel and uniforms.
- Added bilingual, category-specific artwork preparation requirements for all three categories.
- Added Chinese production category names to order drafts and both operator interfaces.
- Expanded phase-1 coverage to nine corporate identity and high-frequency custom-goods categories.
- Added knowledge, sanity, bilingual brief, Chinese production-order, and operator-interface regressions; 48 tests now pass across 6 files.
- Added trigger-gated category and access-surface phases to the roadmap without adding a marketplace, automatic ordering, or real payment.
- Rejected the reviewed source archive's bundled `node_modules`; release packages remain source-only and credential-free.

## 0.3.1 - 2026-07-25

- Fixed the user-workspace one-click demo so it records quality check before shipment.
- Required `total_amount` and `currency` to be submitted together and removed the implicit CNY fallback from mock payment creation.
- Restricted `update_task_status` to low-risk coordination states; evidence-bearing stages now require dedicated business tools.
- Reduced the operator status selector to valid manual coordination choices.
- Added route and tool regressions for the audited gaps; 42 tests now pass across 6 files.
- Synchronized the roadmap with the current 16-tool v0.3.x implementation.

## 0.3.0 - 2026-07-25

- Bound every mock payment intent to the exact operator quote accepted by the user.
- Supersede stale payment links when a revised quote is accepted instead of reusing the old amount.
- Added a shared transition guard across critical state-writing tools, including draft confirmation, payment confirmation, fulfillment, and generic status updates.
- Required a recorded quality-check state before shipment and shipment information before completion.
- Prevented sample-result uploads from moving unrelated or later-stage tasks backward to `sample_ready`.
- Added route-level end-to-end coverage for the authenticated demo and operator console; 40 tests now pass across 6 files.
- Preserved separate Chinese production fields and completed-order-only anonymous category aggregates.

## 0.2.9 - 2026-07-25

- Made payment-link creation idempotent: retries reuse the existing link for the same accepted quote.
- Required at least one production update before shipment and shipment information before completion.
- Prevented production feedback from rewriting tasks after payment or fulfillment has started.
- Added focused Chinese quick actions for operator quote entry and production-photo updates without bypassing approval gates.
- Added regression coverage for infeasible quotes and fulfillment prerequisites; 35 tests now pass.
- Retained completed-order-only anonymous category aggregates and separate Chinese production fields.

## 0.2.8 - 2026-07-25

- Added `confirm_production_feedback` as an explicit second human approval gate with quote and risk snapshots.
- Locked mock payment amounts to the accepted operator quote; AI callers can no longer supply or alter payment amounts.
- Enforced allowed task-state transitions and rejected duplicate payment-link creation.
- Added privacy-safe category observations based only on aggregate coverage from completed orders.
- Added total amount and currency fields to the Chinese Reality Operator workspace.
- Added separate Chinese production titles, descriptions, and specification fields so global user language does not leak into the production workspace.
- Updated the user walkthrough, demo, HTTP smoke flow, competition deck, and defense notes to the 16-tool, 33-test, 16-step implementation.

## 0.2.5 - 2026-07-24

- Added `quick_start_prototype_pipeline`, a safe macro that stops before user confirmation.
- Added non-blocking category sanity heuristics and clarification guidance.
- Added `agent_should_pause` and status-aware pause instructions for AI clients.
- Added field-level Zod diagnostics for faster caller self-correction.
- Added a zero-config in-memory demo launcher and npm package metadata.
- Added a trigger-gated roadmap and manufacturing-category contribution guide.
- Synchronized competition claims with the executable product and expanded focused tests.
- Added coverage proving typical orders pass the category sanity layer without false warnings.

## 0.1.4 - 2026-07-24

- Added structured bilingual guidance to every MCP tool response for AI client orchestration.
- Added item-by-item order confirmation checklists and production-feedback narration branches.
- Added structured, actionable MCP validation and task-state errors.
- Split the operator queue into action-needed, waiting, production, and finished responsibilities.
- Added non-technical media-link guidance and larger mobile touch targets to the operator console.
- Fixed the production Docker image so the generated Prisma Client is available at runtime.
- Added a maintained Chinese README and focused guidance tests.

## 0.1.3 - 2026-07-24

- Rebuilt the English user experience as a staged, approval-first manufacturing workspace.
- Added live user-demo endpoints for order confirmation, human feedback, mock payment, and delivery.
- Rebuilt the Chinese operator console around task queues, next actions, and focused workflow tabs.
- Added responsive desktop and mobile layouts, loading states, feedback messages, and accessible focus states.
- Kept payment, production, and delivery gates enforced by the existing domain tools.

## 0.1.2 - 2026-07-24

- Protected local demo, user, and acceptance routes with the operator session.
- Preserved the originally requested page after successful operator login.
- Replaced open CORS behavior with an explicit origin allowlist that defaults to disabled.
- Rejected wildcard, credential-bearing, and path-bearing CORS origin values.
- Added focused route-authorization and CORS behavior tests.

## 0.1.1 - 2026-07-24

- Added signed, expiring operator sessions, logout, and failed-login rate limiting.
- Added bearer API key protection for production Streamable HTTP MCP access.
- Disabled demo, user, and acceptance routes in production mode.
- Deferred Prisma loading when the in-memory store is selected.
- Added a production-oriented Docker Compose configuration and deployment guidance.
- Added focused operator and HTTP security tests.

## 0.1.0 - 2026-05-22

- Added the initial human-operated supply chain task workflow.
- Added 14 MCP tools covering task creation through delivery tracking.
- Added PostgreSQL persistence, stdio and Streamable HTTP transports, bilingual outputs, local demos, and the Reality Operator console.
