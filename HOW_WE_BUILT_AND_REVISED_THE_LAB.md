# How we built and revised the lab

**AICC 2026 · Content created by Vetitek**

The design problem was educational: help enterprise leaders make a better decision about delegated authority in the time available for a workshop. Building a working app was necessary, but a working app alone would not meet that goal.

The first specification defined a sensible safety boundary. Its weakness was the interaction it put inside that boundary: too much interview, too little time to inspect and challenge the result. The redesign moved attention from generating a canvas to explaining and revising a decision.

## 1. Start with the decision and the boundary

The [v1 build specification](specs/v1-spec.md) asked Codex for a mobile-first workshop application. Its four possible outcomes deliberately included conventional automation and no AI at this time. An agent was never the default answer.

The original constraints mattered: no participant accounts, uploads, enterprise integrations, or model tools; no request for identifying or confidential information; human oversight, monitoring, rollback, and stop conditions in agent recommendations; and a workshop that could continue without anonymous sharing.

Those constraints made it possible to discuss consequential systems without connecting the lab to any of them. The application would help a person reason about authority. It would not exercise that authority.

## 2. Build v1—and examine what “working” missed

V1 centered on an adaptive interview with up to six free-text answers, followed by a generated canvas and an optional stress test. This was a reasonable first expression of the idea, but the design review identified three problems:

| Problem in the first design                   | Why it mattered in the workshop                                                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Six written answers on a phone                | Routine data entry competed with time for thought and discussion. The v2 notes estimated 15–25 minutes of typing against a shorter activity budget; that was a design estimate, not a measured participant result. |
| A model-selected recommendation               | A facilitator could not reliably explain why identical answers should receive the same category.                                                                                                                   |
| Safeguards mostly expressed as generated text | The canvas could sound responsible without giving participants a concrete vocabulary for authority, approval, detection, and recovery.                                                                             |

The first spec was also uneven. It described four outcomes with inconsistent labels and asked for features that later changed or were deferred. We preserve it because those weaknesses explain the redesign. It is a record of an initial request, not a polished account written after success.

## 3. Revise the specification around thinking time

The [v2 specification](specs/v2-spec.md) gave the redesign a clear principle: **chips for facts, typing for judgment**.

Structured intake collected facts about the process. A deterministic rubric selected the category, limited autonomy, and attached a control profile. Model-generated writing explained the plan within those boundaries. A pre-mortem asked participants to imagine failure and revise their proposed controls.

The separation made the teaching claim more defensible: the recommendation could be traced to a rule, and the participant could challenge the evidence behind it. A fluent explanation no longer chose the category.

V2 also introduced a scripted poisoned-document demonstration and a printable takeaway. The demonstration makes the distinction between untrusted content and authorized instructions visible. Its apparent tool calls are staged text, and its approval gate is part of the illustration. It is not a live exploit or an operational security control being tested.

## 4. Review the experience through three subagents

Once the redesign existed, Codex created an unlinked page showing participant and facilitator screens and their important states. Three subagents then reviewed the implementation independently. Their roles were distinct:

| Review subagent                    | Review question                                                                          | What the consolidated review changed                                                                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Educational design**             | Will the participant understand the choices and practice the intended judgment?          | Teach the four options before intake; make the failure exercise active; connect the recommendation, revision, and reusable takeaway.                               |
| **Executive management / content** | Is the language useful to an accountable decision-maker?                                 | Lead with a short decision summary; use plain-language outcomes; ask for owner and approver roles; include staff effort and the share of cases requiring judgment. |
| **UX / usability**                 | Can someone complete and review the activity on a phone, including when something fails? | Improve focus and scrolling, touch targets, loading and error states, sharing feedback, destructive-action confirmation, and demonstration keyboard behavior.      |

These descriptions summarize the review responsibilities and the resulting consolidated changes. They do not claim each change came from only one reviewer. The project checkpoint record says all three reviews converged on a shared concern: the lab needed to teach the choices before gathering evidence and present the result as a management decision rather than a long report.

**These were development-time review subagents. They are not agents running inside the participant application.** The public application is a guided web flow with deterministic rules and bounded model requests, not a three-agent orchestration system.

## 5. Consolidate, implement, and review again

The main build process selected changes from the review findings and implemented them. It also explicitly deferred features, including live submission comparison, participant filtering, and a separate facilitator presentation mode.

The reviews were repeated after implementation. The checkpoint record documents corrections to rule-specific explanations, the stop-rule before/after display, recommendation-specific plan language, controlled examples, and validation consistency. Those records are evidence of iteration, not independent certification of safety or educational effectiveness.

```text
Workshop purpose and boundaries
        ↓
v1 specification → working interview and canvas
        ↓
v2 specification → structured intake, explicit rules, control profiles
        ↓
All-screens review surface
        ↓
Educational design + executive content + UX/usability reviews
        ↓
Consolidated decisions → implementation → second review and checks
        ↓
Workshop application and this public source snapshot
```

The development process is a secondary lesson. The primary lesson remains how to make a defensible decision about authority. Specifications and review agents helped translate that intent into the interface; they did not replace human choices about what the workshop should teach.

## What the code does now

The specifications are historical documents. The public code snapshot includes later changes, so neither specification should be treated as an exact feature inventory.

| Topic                | Historical request                                                           | Public code snapshot                                                                                                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interview            | V1: up to six model-generated questions. V2: fewer typed judgment questions. | Eight participant steps: safety, process, four structured screens, hard cases, and review/stop. Judgment prompts are selected locally from the answers. The old API path remains for compatibility.                                      |
| Recommendation       | V1 allowed a model-selected category.                                        | Current v2 requests use `evaluateRubric`; the response category and control profile come from application code. The legacy v1 path still differs.                                                                                        |
| Economics            | Early design relied on frequency and volume.                                 | Current intake includes monthly staff effort and how many cases require judgment. These are workshop heuristics, not a financial model.                                                                                                  |
| Revision             | V2 proposed blocking export and sharing until revision.                      | The failure exercise is optional. Copy, print, and email draft are available before it; sharing has a separate consent control. A revised stop rule can still be saved and displayed.                                                    |
| Sharing              | V1 requested a limited summary and 24-hour expiry.                           | Sharing saves the schema-validated completed canvas, including its structured context and any revision. No complete interview transcript is stored by the sharing route. There is no automatic expiry; a facilitator must purge records. |
| Email                | V1 said not to offer email.                                                  | The browser can open a `mailto:` draft. There is no application email service, collected recipient field, or automatic send.                                                                                                             |
| Examples             | The v2 draft described a vendor pair.                                        | The controlled comparison in the current interface uses invoice exception triage: review before payment versus discovery through supplier complaints.                                                                                    |
| Model failure        | Early versions emphasized retry and error handling.                          | The current v2 canvas route uses a standard plan on generation failure; failure prompts and revision coaching also have fallbacks.                                                                                                       |
| Facilitator features | V1 requested filters, starring, hiding, and a separate presentation view.    | These requirements are not a promise that each feature shipped. Use the included UI and facilitator guide as the feature reference.                                                                                                      |

Relevant implementation files: [intake](src/components/lab-experience.tsx), [judgment prompts](src/lib/judgment-questions.ts), [rubric](src/lib/rubric.ts), [answer API](src/app/api/interview/answer/route.ts), [canvas UI](src/components/participant-canvas.tsx), [sharing](src/lib/share-store.ts), and [prepared examples](src/lib/demo-data.ts).

## What another builder can carry forward

Start by deciding what evidence the user needs to supply and what judgment they must practice. Use structured controls for facts with known categories, and ask for writing where the answer needs context or accountability.

Keep consequential classifications inspectable. A domain-specific rubric should have named rules and meaningful counterexamples. Make generated explanations subordinate to that rubric, and make uncertainty visible. This particular rubric is intentionally simplified: its thresholds and ordering need review before reuse in another domain.

Design the result for a decision and a conversation. Show the main conclusion, the reason, the owner, the next test, and the stop condition before exposing the longer document. Then ask what plausible failure would change the design.

Finally, review the experience from different perspectives. A technically correct form can still be a poor learning activity, an unhelpful executive report, or an unusable mobile flow. The three reviews were useful because they examined different ways the same application could fail its purpose.

### Source record

This narrative is grounded in the supplied v1 request, the included v2 specification, the original project's review checkpoints, the original build-task record confirming the three review roles, and the source code packaged here. Private build conversations, operational logs, and deployment records are not included. No participant results or testimonials have been invented or republished.
