# Lifecycle Contract

## Actors And Ownership

| Actor | Owns | Must Not Own |
| --- | --- | --- |
| Template | Repository scaffolding, initial metadata, generated files, application build contract | Runtime provisioning, cloud secrets, target-environment lifecycle |
| Descriptor | Portable desired state and deployment metadata | Operator credentials, installation wiring, adapter internals |
| Workload CI/CD | Build, test, and immutable workload release publication | Runtime infrastructure reconciliation |
| Witboost Builder | Lifecycle orchestration, request submission, and status surfacing | Provider-specific implementation details |
| Tech adapter | Validation, artifact resolution, resource reconciliation, identity and secret wiring, and deployment information | Application business logic and repository scaffolding |

## Lifecycle Map

| Operation | Contract |
| --- | --- |
| `validate` | Parse and validate the request without side effects. |
| `deploy` or `provision` | Reconcile desired infrastructure and runtime state and publish observable progress. |
| `undeploy` or `unprovision` | Reconcile owned resources toward the documented removed state. |
| `updateAcl` | Reconcile access grants independently from deployment when supported by the adapter contract. |
| `status` | Return observable progress or a terminal result for an asynchronous action. |

Names, request schemas, response codes, execution mode, and status routes must be recovered from the target repository and its Witboost API contract. Do not infer them from examples or another adapter.

## Re-Provisioning Parity

`unprovision` followed by `provision` is not the same guarantee as retrying one operation: it is two opposite intents in sequence, and each can be individually correct while the round trip still degrades the outcome, for example by losing state an operator, another team, or another system added outside the adapter's own lifecycle actions. See [Re-Provisioning Parity](../topics/re-provisioning-parity.md) for the full contract, scan questions, and review signals.

## End-To-End Flow

1. A template may scaffold the workload repository and descriptor metadata.
2. Workload development and CI/CD produce an immutable release when the component contains executable business logic.
3. Witboost selects a descriptor and release context and invokes the target adapter.
4. The adapter validates inputs and reconciles provider state according to the lifecycle operation.
5. The adapter exposes enough result and status information for Witboost and operators to understand the outcome.