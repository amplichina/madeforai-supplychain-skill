# Agent Maintenance Notes

This repository is the v0.1 MadeForAI supply chain skill. Keep the system minimal.

- Preserve the human-approval-first workflow.
- Do not add AI generation features.
- Do not add payment processing.
- Do not add automatic ordering unless explicitly requested.
- If payment is explicitly requested, implement it through a provider adapter and never store card details.
- Keep user confirmation and payment confirmation as separate workflow gates.
- Keep production-feedback confirmation as its own gate and derive payment amounts only from the accepted operator quote snapshot.
- Mock payment tools are allowed for local workflow validation, but they must clearly say they do not process real payments.
- Do not turn this into a marketplace in v0.1.
- Follow `PRODUCT_SPEC.md` for the long-term product workflow.
- Prefer typed schemas, Zod validation, and focused tests.
- Keep manufacturing logic in `src/domain/manufacturingKnowledge.ts`.
- Do not hardcode supplier names unless they are intentionally added to the knowledge base.
- Do not add shell execution, arbitrary file access, or external network calls.
- Do not store payment information or sensitive identity information.
- When adding MCP tools, keep outputs structured and suitable for AI agents and human Reality Operators.
- When changing task state behavior, update tests in `tests/tools.test.ts`.
- Production fulfillment must require payment confirmation before production/shipment/completion tools proceed.
