# Contributing a Manufacturing Category

Manufacturing knowledge and sanity heuristics live in `src/domain/manufacturingKnowledge.ts`.

For each category, provide:

- likely manufacturing processes;
- risks requiring human confirmation;
- questions the AI should ask before submission;
- estimated complexity;
- a configurable small-batch quantity heuristic;
- process keywords that should trigger clarification.

Sanity heuristics are never rejection rules. A structurally valid but unusual request becomes a question to the user, and the Reality Operator makes the final feasibility decision.

Add the category slug to `ProductCategorySchema`, then add tests covering:

- an ordinary in-range request with no flag;
- an unusual quantity that produces a clarification;
- an incompatible-process keyword that produces a clarification.

Do not add supplier names or prices. Quantity heuristics should be reviewed against real operator experience and updated as genuine orders provide evidence.
