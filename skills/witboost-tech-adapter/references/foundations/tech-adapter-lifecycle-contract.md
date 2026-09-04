# Tech Adapter Lifecycle Contract

## Purpose

A tech adapter translates Witboost lifecycle intent into provider-specific validation and reconciliation. The authoritative protocol is the Tech Adapter OpenAPI for the Witboost version installed in the target environment.

Determine that version from target-repository dependencies, configuration, or deployment documentation. When this evidence is unavailable or the installation is older than the latest public release, ask the user for the customer-local documentation or OpenAPI URL shipped with that installation. Use the public [Witboost Tech Adapter API](https://docs.witboost.com/docs/apis/extension-points/control-plane/builder/tech-adapter-api) only as the fallback for the latest released version. Never infer a protocol from another adapter.

## Normative Categories

Interpret this skill using three categories:

1. **Product Contract:** behavior required by the authoritative Tech Adapter OpenAPI for the installed Witboost version. A statement is a Product Contract only when explicitly labeled and tied to that source.
2. **Target Decision:** behavior that the adapter team must choose for its technology and record when accepted. Do not infer a Target Decision from another adapter or from a recommendation.
3. **Recommendation:** design, security, reliability, and operability guidance from this toolkit. Recommendations should be evaluated and deviations reported as risks, but they are not Witboost protocol incompatibilities unless the target has accepted them as decisions.

Within topic references, an explicitly labeled `Protocol Contract` is a Product Contract, `Design Decision` or `Design Decisions` identifies Target Decisions, and all other unlabeled design guidance, review signals, and test suggestions are Recommendations. Product documentation cited by a topic takes precedence over this classification when it states a requirement for the installed version.

Review findings must identify the category they rely on. Do not report a recommendation as a Product Contract violation.

## Product Contract: Lifecycle Actions

| Intent | Behavioral contract |
| --- | --- |
| `validate` | Validate a request using the installed-version request and response schemas. |
| `provision` | Provision a resource from its descriptor. Witboost may expose this as deploy in user-facing flows. |
| `unprovision` | Unprovision a resource. Preserve underlying data when `removeData=false`; delete underlying component data when `removeData=true`. Witboost may expose this as undeploy in user-facing flows. |
| `updateAcl` | Create or update access using the complete identity snapshot supplied by Witboost. |
| `reverse provisioning` | Import the current state of an existing target resource into Witboost when supported by the installed API version and adapter scope. |

## Product Contract: Support Endpoints

- **Status:** required for each action implemented asynchronously, using the routes and result schema defined by the installed-version OpenAPI.
- **Termination:** optional when exposed by that OpenAPI and supported by the adapter. Unsupported termination must use the protocol-defined response.

Status and termination support an action; they are not lifecycle actions themselves.

## Assessment Recommendation

Record each action as `supported`, `unsupported`, `not applicable`, or `unknown`, with its exact route and evidence from the installed-version OpenAPI and target implementation. Record sync/async mode and support endpoints separately for each action.

## Recommendations: Execution And State

- A synchronous operation returns its terminal result in the initiating response.
- An asynchronous operation returns a durable task identity and exposes a status path that can survive process restarts.
- Retries must resume or safely repeat work using stable resource and task identities.
- Partial failures must remain observable and recoverable; they must not be reported as success.
- Validation must not be used as a hidden provisioning step.

Read [Sync Versus Async](../topics/sync-vs-async.md) and [Idempotency And Retry Behavior](../topics/idempotency-and-retries.md) when execution or recovery behavior is in scope.

## Recommendations: Cross-Operation Invariants

- Actions that operate on the same target resource resolve the same stable identity from compatible descriptor, provisioning evidence, and configuration inputs.
- Validation rules agree with what provisioning can actually execute.
- Access reconciliation and resource reconciliation have explicit, non-overlapping ownership; `updateAcl` treats `refs` as a complete snapshot, never as a delta.
- Status reports the operation and resource identity initiated by the original request.
- Responses and logs preserve correlation while redacting credentials and sensitive configuration.
- Teardown and recreation define explicit postconditions for data, infrastructure, shared state, grants, and follow-up operations.

`unprovision` followed by `provision` is two opposite intents, not a retry. Use [Teardown And Recreate Safety](../topics/teardown-and-recreate-safety.md) to define what is removed, preserved, reconstructed, or restored by a later lifecycle operation.

## End-To-End Flow

1. Witboost submits descriptor and release context for one lifecycle intent.
2. The adapter validates the request and resolves stable identities and artifacts.
3. For side-effecting intents, the adapter reconciles only state inside its ownership boundary.
4. The adapter returns a terminal result or a durable asynchronous task reference.
5. Witboost and operators can observe the outcome through responses, status, and correlated diagnostics.
