# Adapting the guided Q&A flow

The reusable pattern is a guided decision process: collect evidence, apply explicit rules, generate a constrained explanation, and help the user challenge the result. Start with [the workshop purpose](../README.md) and [license and reuse](../REUSE.md).

## Where to change what

| Concern                    | Files                                                                                               | Adaptation task                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Audience and question flow | `src/components/lab-experience.tsx`                                                                 | Change the steps, instructions, help text, and labels. Keep a visible safety boundary.                         |
| Input and output contracts | `src/lib/schemas.ts`                                                                                | Define required signals and output fields; enforce lengths and supported values server-side.                   |
| Follow-up selection        | `src/lib/judgment-questions.ts`                                                                     | Choose questions based on known evidence. Current v2 questions are selected in code, not generated live.       |
| Decision policy            | `src/lib/rubric.ts` and its tests                                                                   | Replace the workshop heuristics with rules appropriate to your domain; test boundary and counterexample cases. |
| Names shown to users       | `src/lib/recommendation-language.ts`                                                                | Keep labels understandable without changing stored enums accidentally.                                         |
| Required safeguards        | `src/lib/control-catalog.ts`                                                                        | Attach concrete controls to each outcome.                                                                      |
| Generated explanation      | `src/lib/prompts.ts`, `src/lib/openai.ts`                                                           | Specify what the model may explain, what it must not invent, and the structured output contract.               |
| Fallback result            | `src/lib/canvas-fallback.ts`                                                                        | Provide a useful, clearly labeled result when generation is unavailable.                                       |
| Result and revision        | `src/components/participant-canvas.tsx`, `src/components/canvas-view.tsx`, `src/lib/canvas-text.ts` | Keep the screen, copy, print, and email draft consistent.                                                      |
| Demonstration data         | `src/lib/demo-data.ts`                                                                              | Replace prepared examples with synthetic cases covering every outcome.                                         |
| State and sharing          | `src/lib/session.ts`, `src/lib/share-store.ts`, `src/app/api/share/route.ts`                        | Reassess the data collected, transmitted, retained, and displayed.                                             |

The current v2 server evaluates the rubric before requesting model-written content. It then applies the deterministic category and control profile and replaces owner/approval fields with participant-supplied roles. The model's prose is not an authorization mechanism.

There are also legacy six-question interview endpoints. For a new product, deliberately retain or remove that compatibility path; do not assume every API request uses the current v2 decision rules.

## Configuration

Run `npm ci` with Node.js 24. The lockfile records the dependency versions in this snapshot even though several ranges in `package.json` say `latest`. Use `npm ci`, and review upgrades separately.

Copy `.env.example` to `.env.local` in the app root. Never commit credentials. The public copy does not load a parent workspace's environment file.

| Variable                                  | Purpose                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`                          | Your own server-side API key, needed for live model writing and coaching.                                                       |
| `OPENAI_MODEL`                            | An accessible model compatible with the request settings in `src/lib/openai.ts`; no default is hardcoded.                       |
| `FACILITATOR_PIN`                         | Your own secret for facilitator data APIs. This shared-PIN mechanism is for the workshop, not enterprise identity management.   |
| `GOOGLE_CLOUD_PROJECT` / `GCP_PROJECT_ID` | Optional configuration for your own Firestore project. No original project identifier is included. The former takes precedence. |
| `FIRESTORE_COLLECTION`                    | Optional collection name; a generic default is included.                                                                        |
| `FIRESTORE_USAGE_COLLECTION`              | Optional usage collection; defaults to the submissions collection name plus `-usage`.                                           |
| `REDIS_URL`, `REDIS_TOKEN`                | Optional Upstash REST store when no Google Cloud project is configured.                                                         |
| `LOCAL_SHARE_FILE`                        | Optional local development data path. Do not point it at real participant exports.                                              |

Start with the storage variables unset, including any inherited shell configuration. In development, explicit shares use `.data/submissions.json`; in production mode, sharing is disabled without Firestore or Redis. Usage events use Firestore, development memory, or disabled mode respectively; Redis does not store usage events.

Model requests use structured output, `store: false`, and an empty tool list. These are the code's request settings, not a claim of zero provider retention. Live requests may incur charges. The request's reasoning and token settings need to be compatible with the model you select.

## Verification

```sh
npm run test
npm run lint
npm run build
npm run test:e2e
```

The browser suite starts the built app on local port 3199. Install the Playwright Chromium browser first if your environment does not have it (`npx playwright install chromium`). Browser tests mock model and facilitator responses; they do not evaluate model quality or prove cloud-storage behavior. Unit tests include local storage and authorization checks with synthetic data.

Before running tests, use a clean shell without live API or cloud configuration. Do not use production participant stores for tests. Check the current [verification record](PUBLIC_PACK_NOTES.md) for which commands were actually run while packaging this copy.

For a new decision domain, meaningful tests include two cases that differ in exactly one important signal, boundary conditions that change the outcome, malformed input, missing ownership, unsuitable output, and a failed model request. Passing the inherited workshop tests is not sufficient evidence for the new domain.

## Hosting boundary

The generic `Dockerfile` is retained for a local/container workflow. Original deployment manifests, cloud commands, service addresses, readiness/load scripts, and export utilities are omitted. No deployment is configured by this pack.

Before any wider hosting, assess authentication, authorization, request abuse, spend limits, logging, retention, dependencies, network boundaries, and incident response. Those are new design decisions, not tasks that become complete because the workshop app builds.
