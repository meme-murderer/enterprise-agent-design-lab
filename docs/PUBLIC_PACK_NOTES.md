# Public-pack notes

Prepared 2026-08-31 from the working workshop project. This is a separate source snapshot for public GitHub distribution; the working app and hosted service were not changed. Only this sanitized pack is published, with a fresh version-control history.

## Included

- Application source, synthetic prepared examples, unit and browser tests, lockfile, and generic container definition.
- Blank credential configuration template and ordinary local-development configuration.
- The supplied eight-slide talk, copied byte for byte. Speaker notes and their source links are retained. The deck was not rewritten or updated; its external statistics remain claims from the supplied presentation.
- Historical v1 and v2 specifications, with editorial status notices. Presenter attribution in v1 is consolidated in the main README; substantive requirements are preserved.
- A new public README, build narrative, adaptation guide, facilitator guide, and accurate data-flow notes.
- The existing six-panel educational illustration.

## Deliberately excluded

Secret/environment files other than the blank example; cloud project names and numbers; deployment service URLs and service-account identities; private operational documentation; cloud build/deploy manifests; load-test targets and readiness scripts; participant data and exports; telemetry; generated logs and reports; old README/runbook PDF and DOCX files; dependency/build caches; screenshots of live participant content; private task transcripts; unrelated workspace files; and version-control history.

Generic names such as `GCP_PROJECT_ID` remain because optional storage adapters use them. They are configuration variable names, not the original project's identity. No real hosting address is needed to run the pack.

## Changes made only in the public copy

- Replaced the operational README with workshop-first documentation.
- Removed automatic loading of a parent workspace's environment file.
- Removed readiness commands targeting event infrastructure.
- Replaced historical model names and numeric PIN fixtures with clearly synthetic test values.
- Used filesystem-safe URL conversion for Vitest aliases on Windows.
- Added Vetitek attribution to the application footer.
- Applied the MIT License to the code and technical documentation; identified the separate rights for workshop materials in `REUSE.md`.

The participant decision logic, prompts, safeguards, storage adapters, and fallback behavior are otherwise retained. This is sanitization and documentation work, not a production-hardening release.

## Verification record

Checked on 2026-08-31:

- **34 unit tests passed** across 10 test files.
- **14 browser tests passed** across mobile Chrome and desktop Chrome profiles, using mocked model and facilitator responses.
- **Lint, formatting, TypeScript checking, and the application build passed.**
- Local Markdown file links and the build-narrative anchor resolved.
- The pack scan found no known original deployment identifiers, hosted-service targets, private machine paths, or strong credential patterns. The scan included XML and metadata inside the PowerPoint file; this is a packaging check, not a security certification.
- All eight supplied slides and the educational illustration were visually inspected. The deck is byte-identical to the attachment, including notes and source citations.
- Checksums confirmed that the included working-project source files were not changed. The archive contains only the public snapshot and its checksum manifest.

Application checks ran against an isolated copy with credentials and cloud configuration unset. Existing installed dependencies were copied for local validation; a fresh dependency installation, live model quality, actual cloud adapters, and container deployment were not tested. No live model requests, cloud-storage operations, participant-data access, or public deployment were performed. Tests do not establish production suitability.

## Redistribution

See [license and reuse](../REUSE.md). The deck's external citations and any third-party assets keep their own rights and attribution requirements. The public pack does not imply endorsement by a conference, provider, or cited organization.
