# Observability And Debuggability

## Concept

Observability has two equally important audiences:

1. **Admin logs** are emitted through the application logging framework to stdout or a logging backend. Tech adapter administrators use them from the pod; they may be technical.
2. **Witboost-visible logs** are serialized in HTTP responses to Witboost, especially status responses for async operations and direct lifecycle responses for sync operations. They must explain progress, outcome, and remediation without requiring platform expertise.

Logging for both audiences is mandatory. The same operation ID must connect both views, and neither may expose secrets or sensitive descriptor data. Metrics, traces, and richer telemetry are recommended for production, but are not required for a correct adapter.

## Design Decision

- **Admin logs**: log operation, action, phase, resource, provider call, attempt, outcome, and technical error context. Logs must be sufficient to diagnose a failed lifecycle operation from the pod.
- **Witboost-visible logs**: report important phase changes and terminal outcomes in concise, non-technical language. Failures identify what could not be done and what the user can correct or retry; omit stack traces and raw provider errors.
- Generate or accept one operation ID, return it to Witboost, and include it in admin logs so support can correlate the two views.
- Redact both channels centrally. Do not log full descriptors, credentials, authorization headers, provider payloads, or principal lists.
- For async actions, keep Witboost-visible logs and the terminal result queryable with the operation status.
- For production, add metrics, distributed traces, and meaningful health probes where operational needs justify them. Their absence alone is not a lifecycle-contract finding.

### Existing Adapter Scan

Identify channels by following where each message is written, not by its class or variable name:

- logger calls and logging appenders belong to admin logs;
- fields in lifecycle response models, status/task records, validation results, and error payloads belong to Witboost-visible logs;
- a message copied to both channels must be evaluated separately for each audience.

For each lifecycle operation, answer:

1. Which logger calls reach pod stdout or the configured logging backend, and do they contain enough context to diagnose success and failure?
2. Which endpoint and response fields carry lifecycle logs or results back to Witboost?
3. Are user-visible messages concise, non-technical, and actionable?
4. Which operation ID correlates the two channels and provider calls?
5. Are sensitive values redacted from both channels?
6. Are async logs and terminal results retained with operation status?
7. Do tests cover both logging channels, correlation, and redaction?
8. Which optional metrics, traces, and health signals support production operations?

## Review Signals

- **High**: either channel exposes secrets or sensitive payloads.
- **High**: Witboost receives no useful progress or terminal explanation.
- **Medium**: admin and Witboost-visible logs cannot be correlated.
- **Medium**: user-visible messages expose stack traces/provider internals or are too generic to act on.
- **Medium**: admin logs lack lifecycle, resource, or technical failure context.

## Test Coverage

- Assert that each lifecycle phase emits useful admin logs and an appropriate Witboost-visible message.
- Assert that the same operation ID connects request, status, admin logs, and user-visible logs.
- Assert that validation and terminal failures are actionable for users while retaining technical context for administrators.
- Seed synthetic secrets and verify that neither channel exposes them.
- For async actions, assert that logs and terminal results remain available through status polling.
- Test metrics, traces, and health signals when the adapter implements them; do not require them by default.
