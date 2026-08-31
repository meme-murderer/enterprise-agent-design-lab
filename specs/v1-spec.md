# Codex Build Specification: Enterprise Agent Design Lab — v1

> Historical build request supplied by the workshop creator. This is not the current implementation contract. Presenter attribution has been consolidated in the main README; the remaining requirements are preserved, including inconsistencies and features later changed or deferred. See [the build narrative](../HOW_WE_BUILT_AND_REVISED_THE_LAB.md).

## Objective

Build a mobile-first web application for a 45-minute conference workshop. The application helps enterprise leaders evaluate whether a business process should use:

1. Conventional automation
2. AI assistance
3. A bounded agentic pilot
4. No AI at this time

Participants complete an adaptive AI interview and receive an “Agent Experiment Canvas.” They may optionally share an anonymized canvas with the facilitators for live discussion.

This is an educational decision-support exercise. It must not connect to enterprise systems, execute tools, or recommend production deployment.

## Primary users

### Participant

An executive, manager, or practitioner attending AICC 2026 on a mobile device.

### Facilitator

A workshop facilitator, using a laptop connected to the presentation display.

## Core principles

- No participant account or login.
- No file uploads.
- No enterprise integrations.
- No external tools available to the model.
- Do not request names, employers, email addresses, or confidential information.
- Prefer the least autonomous solution capable of producing the desired outcome.
- Every agent recommendation must include human oversight, monitoring, rollback, and stop conditions.
- The participant experience must take no more than 15 minutes.
- The complete workshop must work even if anonymous sharing is unavailable.

## Technology

Use:

- Next.js with the App Router
- TypeScript
- Tailwind CSS
- OpenAI Node SDK and Responses API
- Zod for server-side validation
- Vitest for unit tests
- Playwright for browser tests
- ESLint and Prettier

Configuration:

```text
OPENAI_API_KEY=
OPENAI_MODEL=
FACILITATOR_PIN=
REDIS_URL=            # Optional
REDIS_TOKEN=          # Optional
```

Never hardcode an API key or model ID. `OPENAI_MODEL` is required at runtime.

Keep all OpenAI requests on the server. Use structured JSON output. Set `store: false`.

## Application routes

```text
/                       Landing and safety notice
/lab                    Participant activity
/canvas                 Completed participant canvas
/facilitator             Facilitator dashboard
/facilitator/demo        Seeded offline examples
/api/interview/start
/api/interview/answer
/api/interview/stress-test
/api/share
/api/facilitator/submissions
```

## Participant experience

### Screen 1: Welcome

Display:

- Enterprise Agent Design Lab
- “Evaluate one organizational process and leave with a bounded AI experiment.”
- Estimated time: 12–15 minutes
- Start button

### Screen 2: Safety notice

Display prominently:

> Use a hypothetical or sanitized process. Do not enter customer, employee, patient, financial, credential, security-sensitive, regulated, proprietary, or confidential information.

Require the participant to check:

> I will use generalized or hypothetical information.

Do not allow progression until checked.

### Screen 3: Process selection

Collect:

- Process name, maximum 80 characters
- Desired business outcome, maximum 300 characters
- Business function, optional:
  - Operations
  - Finance
  - Human Resources
  - Information Technology
  - Security
  - Customer Service
  - Sales and Marketing
  - Supply Chain
  - Other

Example placeholder:

> Vendor onboarding — reduce delays while preserving compliance approvals.

### Screen 4: Adaptive interview

The AI asks one question at a time.

Requirements:

- Maximum six questions
- Display “Question X of up to 6”
- One multiline answer field
- Answer maximum: 1,000 characters
- Back button to review prior answers
- “Start over” action
- Loading state under five seconds when possible
- Friendly retry state for model or network failure

The interview must cover:

- Current process and pain point
- Frequency, volume, and standardization
- Decisions or actions involved
- Required data and systems
- Exceptions and uncertainty
- Consequences of incorrect action
- Human approval and reversibility

The model should avoid asking for information already supplied.

After six answers, the server must generate the canvas even if the model requests another question.

### Screen 5: Agent Experiment Canvas

Display a clear recommendation badge:

- Conventional Automation
- AI Assistance
- Bounded Agentic Pilot
- Not Currently Suitable

Display:

- Business outcome
- Current pain point
- Recommendation and rationale
- Why autonomy is or is not necessary
- Permitted actions
- Actions requiring human approval
- Data and system boundaries
- Primary risks
- Required controls
- Thirty-day experiment
- Success metrics
- Stop conditions
- Most important unanswered question

Actions:

- Stress Test This Plan
- Copy Canvas
- Print
- Share Anonymously
- Start Over

Do not collect an email address or offer to email results.

### Screen 6: Stress test

When selected, ask the AI:

> Assume this experiment failed badly six months from now. Identify the three most plausible causes. Revise the controls, pilot boundaries, and stop conditions accordingly.

Show:

- Three likely failure scenarios
- What would reveal each failure early
- Revised controls
- Revised stop conditions
- Revised pilot boundary

Allow the participant to apply the revisions to the canvas.

### Anonymous sharing

Sharing must be explicit and optional.

Before submission, show exactly what will be shared. Include only:

- Process title
- Business function
- Business outcome
- Recommendation
- Risk level
- Most important control
- Most important unanswered question
- Sanitized canvas summary

Do not share the interview transcript.

Show:

> Your name, email address, and employer are not requested or included.

## Facilitator dashboard

Protect `/facilitator` with the `FACILITATOR_PIN`.

Display anonymous submissions as cards. Each card should show:

- Submission number
- Process title
- Business function
- Recommendation badge
- Risk level
- Business outcome
- Most important control
- Unanswered question
- Submission time

Controls:

- Filter by recommendation
- Filter by risk level
- Star a submission
- Hide a submission
- Open presentation view
- Refresh
- Load seeded examples

Presentation view must:

- Use large typography
- Hide administrative controls
- Show no identifiers
- Fit on a 16:9 display
- Allow movement between starred examples

If Redis is unavailable, disable live sharing gracefully and keep the participant exercise functional.

Shared submissions must expire automatically after 24 hours.

## AI behavior

The model is an Enterprise Agent Experiment Advisor.

It must:

- Ask concise, nonduplicative questions.
- Challenge the assumption that an agent is needed.
- Prefer conventional automation or AI assistance when autonomy adds little value.
- Treat irreversible actions, sensitive data, high-impact decisions, and poorly understood exceptions as risk multipliers.
- Never recommend unsupervised production deployment.
- Never ask for actual credentials, system names, customer data, employee data, or regulated information.
- Distinguish an AI assistant from an agent based on delegated authority and autonomous action—not marketing language.
- Produce concrete controls rather than generic advice.

The model has no tools, browsing, file access, code execution, or external-system access.

## Decision rubric

### Conventional automation

Recommend when:

- Rules are stable and deterministic.
- Inputs are structured.
- Exceptions are limited.
- The process does not require interpretation or adaptive planning.

### AI assistance

Recommend when:

- Interpretation or generation is useful.
- A human remains the decision-maker.
- The system prepares, summarizes, recommends, or drafts.
- Autonomous action is unnecessary.

### Bounded agentic pilot

Recommend only when:

- The objective is measurable.
- Multiple steps require adaptive decisions.
- Actions can be narrowly permissioned.
- Outcomes can be monitored.
- Humans can approve high-impact steps.
- Actions are reversible or containable.
- Clear stop conditions exist.

### Not currently suitable

Recommend when:

- Failure could create severe or irreversible harm.
- Required data or authority cannot be safely bounded.
- The process is poorly understood.
- Exceptions dominate the workflow.
- Success cannot be measured.
- Effective human oversight is unavailable.

## Structured response schemas

### Interview response

```ts
type InterviewResponse =
  | {
      phase: "interview";
      progress: {
        current: number;
        maximum: 6;
      };
      nextQuestion: string;
      reasonForQuestion: string;
    }
  | {
      phase: "canvas";
      canvas: AgentExperimentCanvas;
    };
```

### Canvas

```ts
type Recommendation =
  | "conventional_automation"
  | "ai_assistance"
  | "bounded_agentic_pilot"
  | "not_currently_suitable";

type RiskLevel = "low" | "moderate" | "high" | "critical";

type AgentExperimentCanvas = {
  processTitle: string;
  businessFunction: string | null;
  businessOutcome: string;
  currentPainPoint: string;
  recommendation: Recommendation;
  recommendationRationale: string;
  autonomyAssessment: string;
  riskLevel: RiskLevel;
  permittedActions: string[];
  humanApprovalRequired: string[];
  prohibitedActions: string[];
  dataAndSystemBoundaries: string[];
  primaryRisks: Array<{
    risk: string;
    consequence: string;
    control: string;
  }>;
  requiredControls: {
    identityAndAccess: string[];
    dataProtection: string[];
    humanOversight: string[];
    loggingAndMonitoring: string[];
    rollbackAndRecovery: string[];
  };
  pilot: {
    durationDays: 30;
    scope: string;
    participants: string;
    environment: string;
  };
  successMetrics: string[];
  stopConditions: string[];
  unansweredQuestion: string;
};
```

### Stress-test response

```ts
type StressTestResponse = {
  failureScenarios: Array<{
    scenario: string;
    earlyWarning: string;
    consequence: string;
  }>;
  revisedControls: string[];
  revisedStopConditions: string[];
  revisedPilotBoundary: string;
};
```

Validate every model response with Zod. If validation fails, retry once with a schema-correction instruction. If the second attempt fails, show a recoverable error.

## Session state

Store participant state in browser `sessionStorage`.

State includes:

- Random session ID
- Process context
- Questions and answers
- Completed canvas
- Stress-test result

Do not persist participant interview transcripts on the server.

Validate all client-supplied state on every request. Enforce field lengths server-side.

Provide a “Delete my session” action that clears local state immediately.

## Shared-submission storage

Create a storage interface:

```ts
interface SubmissionStore {
  save(submission: SharedSubmission): Promise<void>;
  list(): Promise<SharedSubmission[]>;
  hide(id: string): Promise<void>;
}
```

Implement:

- In-memory adapter for development
- Redis adapter for production
- Automatic 24-hour expiration

Do not block production startup if Redis is absent. Disable sharing and show a facilitator-visible warning.

## Visual design

Style:

- Executive, calm, and credible
- Dark navy, white, muted gray, and restrained cyan accent
- Avoid “robot,” science-fiction, or glowing AI imagery
- Large touch targets
- Minimum 16px body text
- WCAG AA contrast
- Responsive from 360px mobile width through desktop
- Visible progress and clear primary action on every screen

Recommendation colors:

- Conventional automation: gray-blue
- AI assistance: blue
- Bounded agentic pilot: green
- Not currently suitable: amber
- Critical risk: red

Never use color as the only signal.

## Seeded examples

Include at least three facilitator examples:

### Vendor onboarding

Expected result: AI assistance or bounded agentic pilot, depending on permitted actions and approval gates.

### Invoice-exception resolution

Expected result: bounded pilot only when financial actions require human approval and transaction limits are enforced.

### Autonomous wire-transfer approval

Expected result: not currently suitable because of irreversible financial impact and excessive delegated authority.

Seeded examples must look visually identical to participant submissions but be labeled “Prepared Example.”

## Failure handling

The application must handle:

- Poor mobile connectivity
- API timeout
- Rate limiting
- Invalid model output
- Redis unavailable
- Page refresh during the interview
- Participant abandoning the activity
- Zero live submissions
- Too many live submissions

Participant work must survive a page refresh through `sessionStorage`.

Provide a demo mode with pre-generated canvases requiring no OpenAI request.

## Rate limiting

Apply rate limits by anonymous session ID and IP:

- Interview: maximum 12 model calls per session
- Stress test: maximum two calls per session
- Sharing: maximum one active submission per session

Return a friendly error rather than a raw API response.

## Accessibility

- All controls keyboard accessible
- Proper labels and landmarks
- Visible focus states
- Screen-reader announcements for loading and new questions
- Do not automatically move focus unpredictably
- Respect reduced-motion preferences
- Print-friendly canvas layout

## Testing

### Unit tests

Test:

- Request validation
- Recommendation enum handling
- Canvas schema validation
- Retry behavior
- Session state reducer
- Redis and memory adapters
- Expiration behavior
- Sanitized shared-submission mapping

### Model evaluation cases

Create at least twelve fixed process scenarios covering:

- Deterministic automation
- Drafting and summarization
- Bounded multi-step agents
- Sensitive personal data
- Financial transactions
- Safety-critical operations
- High exception rates
- Irreversible actions
- Weak success measures

Assert that clearly unsafe scenarios do not receive an unrestricted agent recommendation.

### Browser tests

Test at:

- 360 × 800
- 390 × 844
- 768 × 1024
- 1440 × 900

Test the full participant flow, refresh recovery, stress testing, sharing, facilitator filtering, and presentation mode.

## Acceptance criteria

The MVP is complete when:

1. A first-time participant can complete the exercise on a phone in under 15 minutes.
2. The interview never exceeds six questions.
3. Every participant receives one of the four defined recommendations.
4. Every bounded-agent recommendation includes approval gates, monitoring, rollback, and stop conditions.
5. The model cannot access tools or external systems.
6. No API key is exposed to the browser.
7. Participant work survives a page refresh.
8. Anonymous sharing reveals no transcript or requested identity.
9. Facilitators can display two selected submissions.
10. The participant exercise works when shared storage is unavailable.
11. Demo mode works without internet or OpenAI access.
12. All automated tests pass.

## Implementation order

1. Create the project and visual shell.
2. Define TypeScript and Zod schemas.
3. Implement local participant state.
4. Implement the start and answer APIs.
5. Render the completed canvas.
6. Implement stress testing.
7. Add copy, print, reset, and delete actions.
8. Add shared-submission storage abstraction.
9. Build the facilitator dashboard and presentation view.
10. Add seeded demo mode.
11. Add rate limiting and error recovery.
12. Complete automated tests and accessibility review.
13. Generate a printable QR code pointing to the production URL.
14. Write a facilitator runbook and deployment README.

## Required documentation

Create:

```text
README.md
docs/facilitator-runbook.md
docs/privacy-and-data-flow.md
docs/model-evaluation-cases.md
.env.example
```

The README must explain local setup, environment variables, testing, production deployment, storage behavior, and demo mode.

## Non-goals

Do not build:

- A general-purpose chatbot
- User accounts
- Social login
- Enterprise connectors
- Agent tool execution
- File ingestion
- Long-term analytics
- CRM integration
- Email delivery
- Production deployment recommendations
- An autonomous system capable of acting on participant input