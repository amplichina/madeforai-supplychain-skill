# MadeForAI Product Specification

## Target Outcome

MadeForAI should let a user work through their own AI interface, such as Codex, Claude, or Gemini, to turn a product idea into a production-ready small-batch manufacturing task.

The AI client guides the user to create production-ready artwork and product requirements, submits the task to MadeForAI, receives structured operator feedback, asks the user for confirmation, creates a payment link after approval, and then tracks production, shipping, and delivery feedback from the production side.

## Intended Workflow

1. User talks to an AI client.
2. AI client helps the user prepare production-standard assets and product requirements.
3. AI client calls MadeForAI MCP tools to submit a structured supply chain task.
4. MadeForAI creates a task order draft with fields such as:
   - product name
   - product category
   - quantity
   - material
   - dimensions
   - process
   - artwork or asset links
   - packaging requirements
   - target market
   - shipping destination
   - budget or quoted price
   - deadline
   - notes
5. MadeForAI returns the task order draft to the user's AI interface for confirmation.
6. After user confirmation, MadeForAI sends a production request to the production/operator backend.
7. The production side reviews the task and returns:
   - feasibility
   - missing questions
   - confirmed process
   - quote
   - sample cost, if any
   - estimated production time
   - estimated shipping time
   - risks or constraints
8. MadeForAI returns the production feedback to the user's AI interface.
9. The AI client asks the user to confirm the exact operator quote and stated risks.
10. MadeForAI records the accepted quote ID, quote snapshot, and risk snapshot.
11. After that explicit confirmation, MadeForAI creates a payment link from the accepted server-side quote snapshot.
12. The user pays through the external payment provider.
13. Payment confirmation returns to MadeForAI through a future webhook or current manual operator confirmation.
14. MadeForAI moves the task back to the production side for execution.
15. Production side updates progress, sample status, production status, logistics, tracking number, and final delivery notes.
16. MadeForAI returns progress and completion information to the user's AI interface.

## Non-Negotiable Boundaries

MadeForAI should keep the human-approval-first workflow.

MadeForAI must not automatically place real-world orders before explicit user confirmation and payment confirmation.

MadeForAI must not invent prices. Prices must come from a human Reality Operator, supplier quote, configured price table, or approved production backend.

MadeForAI must not generate images itself. The user's AI client may guide the user to generate or prepare artwork, but MadeForAI only accepts asset links and production requirements.

MadeForAI must not store sensitive payment card details. Payment must be handled by an external payment provider.

MadeForAI must not store unnecessary personal identity information.

## Product Modules

### MCP Skill Layer

Used by Codex, Claude, Gemini, or other AI agents.

Responsibilities:

- receive manufacturing task requests
- validate structured input
- create task order drafts
- return missing questions
- return operator feedback
- request user confirmation
- create payment link after user confirmation
- return production and shipping status

### Task Order Layer

Stores structured task/order data.

Core entities:

- task
- order draft
- quote
- user confirmation
- payment intent
- production request
- production feedback
- sample result
- shipment
- task event history

### Production Backend

Used by Reality Operators and production-side staff.

Responsibilities:

- review submitted task requirements
- ask clarification questions
- confirm feasibility
- fill quote and lead time
- upload sample feedback
- update production progress
- upload logistics and tracking information
- mark delivery complete

### Payment Adapter

Payment should be implemented as a provider adapter.

Responsibilities:

- create payment link
- store only payment provider IDs and payment status
- receive webhook or manual confirmation
- move task to production after payment confirmation

Provider examples may include Stripe, Lemon Squeezy, Paddle, Creem, or local payment providers, but the provider must be chosen explicitly before real integration.

## Proposed Phases

### v0.1: MCP Skeleton

Current status: implemented.

- create supply chain task
- generate quote request
- update status
- upload sample result
- get task
- local rules-based manufacturing assessment
- no payment
- no automatic ordering
- no AI image generation

### v0.2: Task Order Draft and User Confirmation

Goal: make the AI-facing workflow feel like an order process, without payment yet.

Add:

- richer product requirement schema
- task order draft generation
- missing requirement questions
- user confirmation tool
- production request creation after confirmation
- production feedback fields
- production backend console or API endpoints

Initial implementation status: added MCP tools for order draft generation, user confirmation, and production feedback. A production backend console remains future work.

### v0.3: Production Backend Console

Goal: give Reality Operators a simple web interface.

Add:

- task list
- task detail page
- quote/lead-time form
- sample result form
- production progress form
- shipment/tracking form
- event history view

Initial implementation status: added a minimal operator console at `/operator` with task list, task detail, status update, production feedback, sample result upload, and event history.

### v0.4: Payment Link Flow

Goal: add payment after quote and user confirmation.

Add:

- payment adapter interface
- mock payment provider for local testing
- real provider integration after provider choice
- payment status model
- webhook endpoint
- manual payment confirmation fallback
- transition from quoted/confirmed to paid/production-ready

Initial implementation status: added mock payment link creation and mock payment confirmation tools. These do not process real money and exist only to validate the workflow before selecting a real payment provider.

### v0.5: Production and Fulfillment Tracking

Goal: complete post-payment fulfillment loop.

Add:

- production stages
- shipment and tracking status
- delivery confirmation
- final operator notes
- full task timeline returned to AI clients

Initial implementation status: added paid-order production status updates, shipment tracking submission, and final completion tools. These updates are returned to the user's AI interface through `get_task` and are visible in the operator console.

## Recommended Next Step

Build v0.2 first.

Do not start with real payment. Payment depends on provider account, business entity, compliance requirements, refund policy, and webhook security. The correct next technical step is to add task order draft, confirmation, and production feedback workflow. That creates the stable foundation that payment can attach to later.
