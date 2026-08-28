# Connectivity To The Target Technology

## Concept

A tech adapter must connect to the target technology to perform lifecycle operations. Connectivity is the responsibility of the tech adapter alone: the descriptor carries only technology-specific parameters (region, project, resource names), while endpoints, credentials, and client construction live in the adapter configuration and code.

Three families recur across existing adapters, and the choice is driven by what the target technology exposes:

1. **Cloud SDK** (e.g. AWS, GCP): the provider SDK resolves endpoints from region/project; credentials come from the runtime default credentials chain.
2. **Generated OpenAPI client** (e.g. ArgoCD, dbt-cloud): a typed client is generated from the provider OpenAPI spec; `basePath`/`host` and a token are injected from configuration.
3. **Native provider SDK** (e.g. Databricks, Kafka): the provider's own SDK is configured with a connection string, a config dict, or host plus credentials from environment variables.

## Design Decision

- **Never hardcode endpoints or credentials.** Resolve them from environment variables or `application.yml` placeholders (`${ENV}`). The descriptor must not carry adapter secrets.
- **Delegate credentials to the runtime where possible.** For cloud SDKs, rely on the default credentials chain (IRSA, Workload Identity, ADC, instance profile). For SaaS services, inject a token or API key via a Kubernetes secret.
- **Build clients per dynamic target key and cache them.** When the target is region-scoped (AWS) or project-scoped (GCP), construct the client on demand from the descriptor parameter and cache it in a `ConcurrentHashMap` (Java) or equivalent (Python) keyed by that parameter. Do not rebuild the client on every call.
- **Inject configuration at deployment time.** Helm injects secrets via `secretKeyRef` (e.g. `witboost-secrets`) and config via `configMap` plus `SPRING_CONFIG_LOCATION` (Java) or env vars (Python). Keep the chart's `extraEnvVars` as the extension point for technology-specific keys.
- **Keep connectivity out of the template and descriptor.** The template defines the resource shape; the descriptor carries only the parameters the adapter needs to address the target (region, project, resource name). The adapter owns client construction, authentication, and endpoint resolution.
- **Prefer a generated typed client over hand-rolled HTTP.** When the provider publishes an OpenAPI spec, generate the client (OpenAPI Generator) and configure `basePath` plus auth header centrally, rather than calling raw endpoints in each manager.
- **Centralize HTTP concerns.** When using a generic HTTP client (Spring `RestClient`, Python `httpx`/`requests`), wrap it in a single helper that sets auth headers, content type, error mapping, and logging. Do not scatter `Authorization` headers across services.
- **Bound every remote call.** Apply timeouts and retries at the client level (SDK retry policy, `RestClient` timeout, waiter configuration). Long-running provider operations should be modeled as async lifecycle actions, not as blocking HTTP calls.

### Existing Adapter Scan

For each lifecycle operation, answer:

1. Which client class or SDK is used to reach the target technology, and is it the provider's official SDK or a generated OpenAPI client?
2. Where do endpoint and credentials come from (env var, `application.yml`, default credentials chain), and are they ever hardcoded?
3. When the target is region- or project-scoped, is the client built per key and cached, or rebuilt per call?
4. Is authentication delegated to the runtime (cloud SDK) or carried explicitly (token/connection string), and is the secret injected via Kubernetes secret?
5. Are timeouts, retries, and error mapping applied centrally, or are they scattered per call site?
6. Does the descriptor carry only addressing parameters (region, project, resource name), or does it leak adapter configuration?
7. Do Helm `values.yaml` and `deployment.yaml` inject all required env vars and secrets, and is `extraEnvVars` the documented extension point?

## Review Signals

- **High**: endpoints or credentials are hardcoded in source or committed in `application.yml`.
- **High**: the descriptor carries secrets or adapter-side endpoint configuration.
- **Medium**: cloud clients are rebuilt on every call instead of cached per region/project.
- **Medium**: HTTP auth headers or error handling are duplicated across services instead of centralized.
- **Medium**: remote calls lack timeouts or retries, or long-running provider operations block the request synchronously.
- **Low**: `extraEnvVars` is not documented as the extension point for technology-specific connectivity keys.

## Test Coverage

- Assert that client construction reads endpoint and credentials from configuration, not from hardcoded values.
- For region- or project-scoped clients, assert that the same key returns a cached instance and that different keys produce distinct clients.
- Assert that authentication headers or tokens are applied centrally and redacted from logs.
- Assert that timeouts and retries are configured on the client and exercised by a simulated slow or failing provider call.
- Assert that the adapter fails fast with an actionable error when a required connectivity env var or secret is missing.
