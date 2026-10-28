export const COGNITION_CONTENT = {
  "QUESTIONS": [
    {
      "pillar": "Knowledge",
      "topic": "Central context layer",
      "q": "Which sounds more like your organization?",
      "strong": 1,
      "opts": [
        "Each team connects its own data sources into its own agents.",
        "Every agent draws business context from one central governed context layer."
      ],
      "rec": [
        "Unify context in one governed layer.",
        "Give every digital worker the same source of business truth. Map your highest-value domains into a Knowledge Mesh before adding new agents."
      ],
      "id": "S1"
    },
    {
      "pillar": "Knowledge",
      "topic": "Model diversity",
      "q": "Which sounds more like your organization?",
      "strong": 0,
      "opts": [
        "We can swap models in or out without rebuilding our agents.",
        "We’re built on one model provider. Switching would take real rework."
      ],
      "rec": [
        "Stay model-agnostic.",
        "Keep context, memory, and policy outside the model so you can adopt or replace any model without rebuilding your agents."
      ],
      "id": "S2"
    },
    {
      "pillar": "Knowledge",
      "topic": "Rules vs. AI reasoning",
      "q": "Which sounds more like your organization?",
      "strong": 1,
      "opts": [
        "We route most decisions through the LLM, including calculations and policy checks.",
        "Deterministic rules handle policy and calculations. AI handles judgment calls, with clear handoffs between the two."
      ],
      "rec": [
        "Draw a hard line between rules and reasoning.",
        "Keep calculations, limits, and policy deterministic. Reserve AI reasoning for judgment calls, with explicit handoffs between the two."
      ],
      "id": "S3"
    },
    {
      "pillar": "Memory",
      "topic": "Institutional memory",
      "q": "Which sounds more like your organization?",
      "strong": 0,
      "opts": [
        "Decisions, exceptions, and outcomes from past work are captured and available to future agents.",
        "Each agent session starts from scratch. There’s no carryover from previous work."
      ],
      "rec": [
        "Capture memory of work, not conversations.",
        "Persist decisions, exceptions, and precedents as institutional memory the enterprise owns, not chat history tied to one user."
      ],
      "id": "S4"
    },
    {
      "pillar": "Memory",
      "topic": "Self-learning",
      "q": "Which sounds more like your organization?",
      "strong": 1,
      "opts": [
        "When agents get something wrong, we fix the prompts manually after user feedback.",
        "Agent corrections and outcomes feed back automatically into the system so performance improves over time."
      ],
      "rec": [
        "Close the Intelligence Loop.",
        "Feed outcomes, overrides, and corrections back into memory so digital workers improve with every case."
      ],
      "id": "S5"
    },
    {
      "pillar": "Memory",
      "topic": "Evaluation",
      "q": "Which sounds more like your organization?",
      "strong": 0,
      "opts": [
        "We evaluate agent decisions against policy, expected outcomes, and expert benchmarks in a structured way.",
        "We review agent quality through user testing and periodic spot checks."
      ],
      "rec": [
        "Evaluate decisions, not just answers.",
        "Score every agent decision against enterprise policy, expected outcomes, and expert precedent, before launch and in production."
      ],
      "id": "S6"
    },
    {
      "pillar": "Governance",
      "topic": "Independent access control",
      "q": "Which sounds more like your organization?",
      "strong": 1,
      "opts": [
        "Agents use shared service accounts or app-level API keys for data access.",
        "Each agent’s data access is enforced per user, per record, and per action in a separate control layer."
      ],
      "rec": [
        "Enforce access outside the agent.",
        "Apply entitlements per user, per record, and per action in an independent layer. Never let an agent inherit a service account’s reach."
      ],
      "id": "S7"
    },
    {
      "pillar": "Governance",
      "topic": "Action gating",
      "q": "Which sounds more like your organization?",
      "strong": 0,
      "opts": [
        "Policy & Quality checks can stop an agent before a high-risk action goes through.",
        "We catch mistakes after the fact, through reviews or user-reported issues."
      ],
      "rec": [
        "Stop wrong actions before they execute.",
        "Encode limits as Policy-as-code. Tier actions by risk, halt on threshold breach, and escalate to a named owner."
      ],
      "id": "S8"
    },
    {
      "pillar": "Governance",
      "topic": "Observability",
      "q": "Which sounds more like your organization?",
      "strong": 1,
      "opts": [
        "Debugging a bad agent output means pulling logs from multiple systems and piecing things together.",
        "We can trace any agent output back to the context, tools, and checks that produced it."
      ],
      "rec": [
        "Trace every answer to its source.",
        "Capture context retrieved, tools called, model used, and policy checks passed in one trace your team can read."
      ],
      "id": "S9"
    },
    {
      "pillar": "Governance",
      "topic": "Outcome Ledger",
      "q": "Which sounds more like your organization?",
      "strong": 0,
      "opts": [
        "We can produce a full audit trail for any agent decision on demand.",
        "Reconstructing how an agent reached a past decision takes manual effort across multiple systems."
      ],
      "rec": [
        "Make every decision examinable.",
        "Record inputs, reasoning, approvals, and outcomes in an immutable Outcome Ledger. Produce compliance evidence on demand."
      ],
      "id": "S10"
    }
  ],
  "TIERS": [
    {
      "min": 0,
      "name": "Fragmented",
      "desc": "Your AI Cognition Gap is wide. Agents run on isolated context with little oversight, so pilots stall before production."
    },
    {
      "min": 40,
      "name": "Connected",
      "desc": "Foundations exist, but knowledge, memory, and governance work in isolation. Scale will expose the gaps."
    },
    {
      "min": 65,
      "name": "Governed",
      "desc": "You run AI with real controls. Close the remaining gaps to move from agents to accountable digital workers."
    },
    {
      "min": 85,
      "name": "Cognitive",
      "desc": "You operate accountable digital workers. Keep the Intelligence Loop tight as you scale."
    }
  ]
};
