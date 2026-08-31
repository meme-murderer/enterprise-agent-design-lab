# Privacy, data flow, and limitations

**Use hypothetical or sanitized material only.** The lab's safety notice is a constraint on use, not a promise that software can reliably detect every sensitive submission.

## What goes where

| Information                                          | Current behavior                                                                                                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Draft process, selections, answers, completed canvas | Stored in browser `sessionStorage` for refresh recovery when browser storage is available.                                                                                  |
| Context for live model writing                       | Sent from the browser to the application server and then to the model provider. No browser-only processing is claimed.                                                      |
| Full interview transcript                            | Not deliberately persisted by the app's sharing store. Model requests still process the relevant input. Hosting/provider logs require a separate review.                    |
| Explicitly shared canvas                             | Stored with a share identifier and timestamp. It includes process context, structured signals, generated plan, and any revision; it is more than a short anonymous summary. |
| Usage events                                         | Model identifier, operation, token counts, timing, outcome, and observed request limits. The usage-event schema does not contain participant prose.                         |
| Facilitator PIN                                      | Kept in the facilitator tab's session storage and sent in a header to protected APIs. A shared PIN does not identify individual administrators.                             |
| Email draft                                          | A `mailto:` action opens the participant's email app with a summary. Sending is a separate user action outside the lab.                                                     |

No name, employer, or contact field is requested. Free text can nevertheless identify someone or disclose confidential information. “Anonymous sharing” describes the absence of requested identity fields; it is not verified anonymization.

## Retention and deletion

The code has **no automatic 24-hour expiry** for shared canvases. That was a historical v1 requirement, not current behavior. Firestore, Redis, and the local JSON store retain shares until explicitly purged. The facilitator view lists at most 500 recent cloud-backed submissions; that display limit is not a retention limit.

Participant reset clears the app's local session keys. It does **not** delete a previously shared canvas, provider-held information, or an email already sent. The facilitator purge removes shared submissions; usage-event purging is separate. Do not project deletion controls casually or use a store containing real participant records for demonstration.

## Controls this lab has—and their limits

- Server-side schemas reject malformed requests and bound text lengths. Pattern checks catch some identifiers and credential-like strings in selected input paths; they are incomplete and not a data-loss-prevention system.
- Current v2 categories and required control profiles are selected in code. A deterministic rubric can still encode incomplete assumptions or a poor policy.
- The model has no tools, browsing, uploads, or enterprise connectors. Prompt injection may still influence generated prose; structured JSON does not make prose trustworthy.
- Model calls request `store: false`. This flag alone is not a guarantee about all provider retention, abuse monitoring, or hosting logs.
- Rate counters are process-local and use a browser-supplied identifier when available. They are not robust identity, distributed abuse protection, or a fleet-wide spending limit.
- The facilitator APIs require a configured secret. The workshop does not provide individual accounts, role-based administration, or a tamper-evident audit system.
- The prepared tool trace is a scripted illustration. It does not exercise actual permissions, rollback, or a kill switch.

The current code does not configure a Content Security Policy or provide a comprehensive security hardening baseline. Its draft state is client-controlled. Treat results as discussion material, not authorization records, certifications, or evidence that an enterprise deployment is safe.

## When adaptation requires a new review

Reassess the design before adding identity capture, uploads, real business data, model tools, enterprise integrations, unattended actions, broader sharing, persistent history, or new retention behavior. Document the new data flow and failure consequences first. The workshop's limited consequence model does not transfer automatically to a production service.
