# Observability And Debuggability

## Concept

Tech adapter observability serves two audiences:

1. **Administrative observability:** diagnostic logs and optional operational telemetry used by adapter operators to investigate behavior in the deployed runtime.
2. **Witboost-visible lifecycle output:** response, status, validation, error, and provisioning-information fields defined by the installed-version Tech Adapter API and consumed through Witboost.

Witboost-visible output is part of the protocol, not a substitute for diagnostic logs. Metrics, traces, health signals, and protected audit records support the administrative audience when the target's operational requirements justify them.

## Protocol Contract

Use only lifecycle result, error, status, logs, and provisioning-information fields defined by the installed-version OpenAPI. Preserve their schemas and semantics. Do not add a mandatory correlation field that the API version does not expose.

## Design Decision

For each lifecycle action, decide:

1. Which Witboost-visible fields communicate progress, terminal outcome, provisioning information, and actionable remediation.
2. Which diagnostic events operators need for action, target resource, provider call, attempt, outcome, and technical failure context.
3. Which existing request, task token, trace, resource, or provider-operation identifiers correlate the two audiences without changing the API contract.
4. Which data classifications may appear in each destination and how redaction is applied centrally.
5. Whether ACL or security events require a protected audit sink, including authorized viewers, retention, integrity, and deletion policy.
6. Which metrics, traces, health/readiness signals, alerts, and service-level indicators are required by the target operating model.
7. How long async status, terminal results, diagnostic evidence, and audit records remain available.

## Recommendations

- Make Witboost-visible failures concise and actionable. Do not expose stack traces, raw provider responses, credentials, authorization headers, or secret values.
- Include enough stable context in diagnostic logs to identify lifecycle action, target resource, attempt, phase, and outcome.
- Correlate using identifiers already available in the API and runtime stack. For async actions, the task token is a natural protocol correlation point; traces and provider operation IDs may extend it administratively.
- Minimize or pseudonymize user and group identifiers in ordinary diagnostic logs. Real identities may appear in a protected audit sink when needed for accountability and governed by access and retention policy.
- Prevent log injection by structuring untrusted values and avoiding direct concatenation of descriptor or provider text.
- Control metric and trace cardinality; do not use resource names, user IDs, task tokens, or raw errors as unbounded metric labels.
- Keep terminal async results queryable according to the accepted retention decision.

## Review Signals

- Responses or diagnostic destinations expose credentials, reusable tokens, secret values, or raw sensitive payloads.
- Witboost receives no useful terminal result or remediation within fields supported by the API.
- Diagnostic logs lack action, resource, phase, or technical failure context.
- Correlation depends on a field not supported by the installed API or cannot connect task status to administrative evidence.
- Ordinary logs contain unnecessary principal PII, while ACL/security actions have no protected audit trail where one is required.
- Audit access, retention, or integrity is undefined.
- Untrusted provider or descriptor text can forge log entries.
- Metrics or traces use unbounded high-cardinality attributes.
- Health signals report ready while required provider connectivity or task processing is unavailable, contrary to the accepted operating model.

## Test Coverage

- Verify successful and failed lifecycle actions produce the expected Witboost-visible result fields for the installed API version.
- Verify diagnostic events contain action, target, phase, attempt, outcome, and available correlation identifiers.
- Trace an async task from acceptance through status to provider evidence using existing identifiers.
- Seed synthetic credentials, authorization headers, secret values, and provider payloads and prove they are redacted from both audiences.
- Verify ordinary logs minimize principal PII and protected audit records capture authorized ACL evidence with configured access and retention.
- Exercise log-injection payloads and structured logging behavior.
- Test metrics, traces, health, readiness, alerts, and retention only when they are accepted target decisions.
