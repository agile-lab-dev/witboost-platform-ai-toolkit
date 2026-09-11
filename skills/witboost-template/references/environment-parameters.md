# Environment Parameters

Some values a template collects are not one value — they are one value **per target environment**.
Region, storage account, workspace URL, cluster size, secret name: the user must supply them for
`development`, `qa`, `production`, … and Witboost must inject the right one when the component is
deployed to that environment.

Getting this wrong is the single most common template design mistake: asking `region` once produces a
component that can only ever be deployed correctly to one environment.

## The Principle

```
Wizard collects: region for dev, region for qa, region for prod
        ↓
parameters.yaml stores all of them
        ↓
Witboost renders catalog-info.yaml FOR the selected deploy environment
        ↓
Tech adapter receives a descriptor where spec.mesh.specific.region is a plain scalar
```

**The tech adapter contract does not change.** It never sees a per-environment map — it sees the
already-resolved value for the environment being deployed. Never push a `{dev: …, prod: …}` object
into `spec.mesh.specific` and let the adapter pick: that leaks a platform concern into the adapter and
breaks every other adapter that reads the same property.

## The Rendering Context

When Witboost renders a skeleton **for a specific environment**, Nunjucks receives:

| Variable | Meaning |
| --- | --- |
| `environment` | Object describing the current environment; always has at least `environment.id` (e.g. `development`, `production`) |
| `environmentParameters[<env>].<key>` | The `environmentParameters` block of `parameters.yaml` |
| `env.<key>` | Alias for `environmentParameters[environment.id].<key>` |

**`environment` and `env` are `null` outside an environment rendering context.** Witboost renders the
catalog-info in other contexts too (catalog display, entity refresh, previews). Every expression that
touches them must be guarded, or the rendered YAML breaks:

```yaml
{% if environment %}
size: ${{ env.clusterSize }}
{% else %}
size: null
{% endif %}
```

## Which Fields Are Environment-Dependent?

Ask this for **every** additional field, before choosing its type or descriptor placement.

| Usually per-environment | Usually not |
| --- | --- |
| Region / location / zone | Component name, description, fully qualified name |
| Account, subscription, project, tenant, workspace id | Owner, development group, domain |
| Endpoints, hostnames, connection URLs | Tags, classification, maturity |
| Storage account, container, bucket, root path | Data contract, schema, column definitions |
| Catalog / database / schema names | SLA and business terms |
| Cluster size, node count, SKU, capacity, autoscaling | `dependsOn`, `readsFrom` |
| Secret names, key vault paths, service principals / client ids | Scheduling semantics (the cron *meaning*, not the target cluster) |
| Network config, private endpoints, VPC/subnet | |

When unsure, ask the user directly: *"does this value differ between dev and prod?"*

**Never assume the environment list.** Ask which environments are registered in the customer's
Witboost instance. `development` / `production` is a common default but not a given — `qa`,
`staging`, `preproduction`, `acceptance`, `sandbox` all appear in real installations.

## Two Valid Patterns

Both are legitimate. They differ in who owns the list of environments and how much flexibility you get.

### Pattern A — Native `environmentParameters`

Mark one wizard page with `environmentParameters: true`. Witboost renders **one form section per
registered environment** automatically and stores the answers under `environmentParameters.<env>` in
`parameters.yaml`, preloading them when the wizard is reopened.

`edit-template.yaml`:

```yaml
apiVersion: witboost.com/v2
kind: EditTemplate
spec:
  useCaseTemplateId:
    - urn:dmb:utm:s3-storage-template:0.0.0
  parameters:
    - title: Environment Configuration
      description: These values are asked once per target environment.
      environmentParameters: true
      properties:
        region:
          title: AWS Region
          type: string
          enum: [eu-west-1, eu-central-1, us-east-1]
        bucketPrefix:
          title: Bucket Prefix
          type: string
```

Resulting `parameters.yaml`:

```yaml
environmentParameters:
  development:
    region: eu-west-1
    bucketPrefix: dev-analytics
  production:
    region: eu-central-1
    bucketPrefix: prod-analytics
```

`skeleton/catalog-info.yaml`:

```yaml
%SKELETON
apiVersion: backstage.io/v1alpha1
kind: Component
spec:
  mesh:
    specific:
      {% if environment %}
      region: ${{ env.region }}
      bucketName: ${{ env.bucketPrefix }}-${{ values.identifier }}
      {% else %}
      region: null
      bucketName: null
      {% endif %}
```

**Constraints:**

- At most **one** environment-parameters section per template.
- Pickers inside that section cannot be referenced by other pickers — not even by pickers in the same
  section. Rules out `DescriptorPicker`/`EntitySelectionPicker` chains and cross-field filtering.
- Documented and supported on `edit-template.yaml`. For the creation wizard, prefer Pattern B and let
  the edit template own the environment-parameters page.
- Nunjucks expressions inside `environmentParameters` in `parameters.yaml` are resolved only for
  **top-level keys** of each environment block — not inside nested objects or arrays.

### Pattern B — Explicit per-environment fields + Nunjucks branching

Define one nested object per environment in the wizard (`devSpecific`, `prodSpecific`, …) and branch
on `environment.id` in the skeleton. This is a plain wizard page, so everything works: pickers,
conditionals, arrays, cross-field references, custom layouts.

`template.yaml`:

```yaml
    - title: Source Configuration
      properties:
        sources:
          type: array
          title: Sources
          items:
            type: object
            required: [table]
            properties:
              table:
                title: Source Table
                type: string
              devSpecific:
                type: object
                title: Development Environment
                properties:
                  storageAccount: { title: Storage Account, type: string }
                  format: { title: Format, type: string, enum: [delta, parquet, csv], default: delta }
              prodSpecific:
                type: object
                title: Production Environment
                properties:
                  storageAccount: { title: Storage Account, type: string }
                  format: { title: Format, type: string, enum: [delta, parquet, csv], default: delta }
```

`skeleton/catalog-info.yaml`:

```yaml
%SKELETON
apiVersion: backstage.io/v1alpha1
kind: Component
spec:
  mesh:
    specific:
      sourceInfo: {% if values.sources | length > 0 %}{% for source in values.sources %}
        - table: ${{ source.table }}
          {% if environment and environment.id == 'development' %}
          storageAccount: ${{ source.devSpecific.storageAccount }}
          format: ${{ source.devSpecific.format }}
          {% elif environment and environment.id == 'production' %}
          storageAccount: ${{ source.prodSpecific.storageAccount }}
          format: ${{ source.prodSpecific.format }}
          {% else %}
          storageAccount: null
          format: null
          {% endif %}
      {% endfor %}{% else %}[]{% endif %}
```

The `{% else %}` branch emitting explicit `null`s is **mandatory**, not defensive style: without it the
no-environment render produces a list item with no properties and invalid YAML.

**Cost:** environment ids are hardcoded in the skeleton. Adding an environment means editing the
template, the wizard fields and every branch — and re-editing every existing component.

### Choosing

**Default to Pattern B.** It is the more flexible of the two and the one that scales to real
requirements.

Use **Pattern A** when *all* of these hold:

- The environment-specific values are a **flat, small, fixed** set of keys.
- No picker in the set needs to reference another field.
- The list of environments should follow whatever is registered in Witboost, without touching the
  template when a new one is added.
- The values are collected in the **edit template**.

Use **Pattern B** when *any* of these hold:

- The values are **nested inside array items** (per-table, per-topic, per-dataset config) — Pattern A
  cannot express this.
- The wizard page needs **pickers, conditionals or cross-field logic**.
- The values must be collected in the **creation wizard**.
- You want a **better UX** than one identical form repeated per environment: grouped layouts, a
  "same as dev" default, an explicit `Development` / `Production` side-by-side page.

Mixing is allowed: nothing prevents a template from using Pattern B in the creation wizard and a
Pattern A page in the edit template for a different, flat set of keys.

## Pitfalls

- **Unguarded `environment` / `env`.** Always `{% if environment %}` before using either, and always
  provide an `{% else %}` fallback that still emits valid YAML.
- **Missing `{% else %}` inside a loop.** The item must keep its shape in every branch.
- **`===` instead of `==`.** Some existing templates use `===`; `==` is the standard Nunjucks
  comparison and the safe choice for new code.
- **Per-environment map leaking into the descriptor.** `spec.mesh.specific.region` must be a scalar
  after rendering. If the tech adapter has to pick an environment, the template is wrong.
- **Hardcoded environment ids in Pattern A.** Never write `environmentParameters.development.x` in the
  skeleton; use `env.x` so the same skeleton works for every registered environment.
- **Nunjucks inside nested `parameters.yaml` values.** Only top-level keys of each section are
  resolved.
- **Objects and arrays without `| dump`.** Use `${{ env.someObject | dump }}` when injecting a
  non-scalar.
- **Environment list assumed.** Confirm it with the user before writing branches.

## Verifying

- **Skeleton Rendering Preview**: `<witboost-url>/platform-settings/builder-tools/skeleton-rendering-preview`
  — render the skeleton against a `parameters.yaml` and check the output.
- **CLI**: `witboost builder build-descriptor --entity-path ./entity --environment production` —
  produces the descriptor exactly as the tech adapter will receive it.
- Render for **every** registered environment **and** with no environment, and confirm all four
  outputs are valid YAML.

## Related

- [Template Anatomy](./template-anatomy.md) — `parameters.yaml` sections and the `%SKELETON` directive
- [Field Changes](./field-changes.md) — adding a field that turns out to be environment-dependent
- [snippets-environment-parameters.yaml](./examples/snippets/snippets-environment-parameters.yaml) —
  copy-pasteable versions of both patterns
