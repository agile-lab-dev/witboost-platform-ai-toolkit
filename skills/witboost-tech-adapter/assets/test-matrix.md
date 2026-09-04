# Test Matrix

- Mode: design | local execution | target execution
- Environment: local | `<named target>`
- Side effects approved: not applicable | yes/no
- Destructive `removeData=true` approved: not applicable | yes/no

| Scenario | Sanitized Input Or Command | Expected Result | Actual Result | Status | Evidence | Cleanup Result | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Validate success |  |  |  | not-run |  | not applicable |  |
| Validate failure |  |  |  | not-run |  | not applicable |  |
| Provision success |  |  |  | not-run |  |  |  |
| Provision failure |  |  |  | not-run |  |  |  |
| Unprovision with `removeData=false` |  |  |  | not-run |  |  |  |
| Unprovision with `removeData=true` |  |  |  | not-run |  |  |  |
| Reverse provisioning success |  |  |  | not-run |  |  |  |
| Reverse provisioning failure |  |  |  | not-run |  |  |  |
| Reverse provisioning unauthorized or ambiguous match |  |  |  | not-run |  | not applicable |  |
| Reverse provisioning returns valid sanitized updates without mutation |  |  |  | not-run |  | not applicable |  |
| Async acceptance and terminal status |  |  |  | not-run |  | not applicable |  |
| Unknown or expired task |  |  |  | not-run |  | not applicable |  |
| Duplicate or concurrent request |  |  |  | not-run |  |  |  |
| Retry exhaustion |  |  |  | not-run |  |  |  |
| Partial failure and recovery |  |  |  | not-run |  |  |  |
| Restart or multi-replica recovery |  |  |  | not-run |  |  |  |
| Workload artifact integrity failure |  |  |  | not-run |  |  |  |
| ACL scaffolding |  |  |  | not-run |  |  |  |
| ACL full-snapshot reconciliation |  |  |  | not-run |  |  |  |
| ACL removal and protected grant preservation |  |  |  | not-run |  |  |  |
| Correlation and diagnostics |  |  |  | not-run |  | not applicable |  |
| Witboost-visible failure and remediation |  |  |  | not-run |  | not applicable |  |
| Secret and token redaction |  |  |  | not-run |  | not applicable |  |
