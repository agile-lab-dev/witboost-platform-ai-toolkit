# Conventions

## URN Format

Witboost uses URNs (Uniform Resource Names) to uniquely identify templates and tech adapters.

### Use Case Template URN

```
urn:dmb:utm:{name}:{version}
```

- `{name}`: alphanumeric, dashes, underscores only (`[a-zA-Z0-9_-]+`)
- `{version}`: single number (`1`) or three-dot semver (`1.0.0`)
- Examples: `urn:dmb:utm:snowflake-outputport-template:0.0.0`, `urn:dmb:utm:s3-storage-template:1`

### Infrastructure Template (Tech Adapter) URN

```
urn:dmb:itm:{name}:{version}
```

- Same naming rules as use case template URN
- Examples: `urn:dmb:itm:snowflake-outputport-provisioner:0`, `urn:dmb:itm:s3-storage-provisioner:1`

## Naming Rules

### Template `metadata.name`

- Unique across all templates in the Witboost instance
- Lowercase, alphanumeric, dashes, dots, underscores: `^[a-z0-9][a-z0-9._-]*$`
- Convention: `{technology}-{component-type}-template` followed by optional version suffix
- Examples: `snowflake-outputport-template.1`, `s3-storage-template.1`, `dataproduct-template`

### Entity Identifier

Format: `{domain}.{system}.{version}.{component-name}`

- Generated automatically by `ComponentIdentifierPicker`
- Not editable after creation
- Components within a system share the same `{domain}.{system}.{version}` prefix

### `spec.type` Alignment

`spec.type` in the template must match the entity type from `spec.generates`:

| `spec.generates` | `spec.type` |
|---|---|
| `componenttype:default/outputport` | `outputport` |
| `componenttype:default/workload` | `workload` |
| `componenttype:default/storage` | `storage` |
| `systemtype:default/dataproduct` | `dataproduct` |

Custom Practice Shaper types use the same pattern: the type name after the last `/` in `generates`.

## Version Format

Two valid formats:

- **Single number**: `1`, `0`, `13` — used for infrastructure templates (tech adapters)
- **Three-dot semver**: `1.0.0`, `0.0.0`, `1.11.16` — used for use case templates

Recommendation: use `0.0.0` for initial template versions, increment as the template evolves.

## Git Provider Publish Variants

Templates must use the correct publish action for the target Git provider. The three main providers:

### GitLab

```yaml
- id: publish
  name: Publish
  action: witboostMeshComponent:publish:gitlab
  input:
    allowedHosts:
      - gitlab.com
    description: ${{ parameters.description }}
    repoUrl: gitlab.com?owner=my-group&repo=my-repo
    rootDirectory: ${{ parameters.rootDirectory }}
    dataproduct: ${{ parameters.dataproduct }}
```

### GitHub

```yaml
- id: publish
  name: Publish
  action: witboostMeshComponent:publish:github
  input:
    allowedHosts:
      - github.com
    description: ${{ parameters.description }}
    repoUrl: github.com?owner=my-org&repo=my-repo
    rootDirectory: ${{ parameters.rootDirectory }}
    parentRef: ${{ parameters.dataproduct }}
    deleteBranchOnMerge: true
    allowSquashMerge: true
```

### Azure DevOps

```yaml
- id: publish
  name: Publish
  action: witboostMeshComponent:publish:azure
  input:
    allowedHosts:
      - dev.azure.com
    description: ${{ parameters.description }}
    repoUrl: dev.azure.com?organization=my-org&owner=my-project&repo=my-repo
    rootDirectory: ${{ parameters.rootDirectory }}
    dataproduct: ${{ parameters.dataproduct }}
    defaultBranch: dev
```

### Register Step (Same for All Providers)

```yaml
- id: register
  name: Register
  action: catalog:register
  input:
    repoContentsUrl: ${{ steps.publish.output.repoContentsUrl }}
    catalogInfoPath: /catalog-info.yaml
```

### Output Section (Same for All Providers)

```yaml
output:
  links:
    - title: Repository
      url: ${{ steps.publish.output.remoteUrl }}
    - title: Open in catalog
      icon: catalog
      entityRef: ${{ steps.register.output.entityRef }}
```

## Practice Shaper Conventions

The `spec.generates` values depend on the Practice Shaper configuration. Default Data Mesh values:

- `componenttype:default/outputport`
- `componenttype:default/workload`
- `componenttype:default/storage`
- `systemtype:default/dataproduct`

Custom practices can define any type. Ask the user what types are configured in their Practice Shaper before using default values.

## Best Practices

### UX Principles

- **Creation wizard = minimal.** Ask only what's strictly necessary for the first deployment. The goal is to get the user to a working component as fast as possible with the least amount of input.
- **Edit template = detailed.** This is where complexity lives. Include all the fields the user might want to customize after creation (schema, SLA, quality rules, environment configs, etc.).
- **Provide sensible defaults** for every field that can have one. The user should be able to click through the wizard with minimal input and get a valid, deployable component.
- **Templates are not IDEs.** Don't try to replicate a full editor in the wizard. For complex configurations (advanced data quality expectations, detailed data contracts, complex transformations), suggest the user edit the YAML file directly in the repository. Templates accelerate work — they don't replace development tools.
- **Communicate all assumptions.** Whenever a value is auto-generated (URN, repo name, field default), clearly state what was generated and why. The user must always know what's automatic and what requires their input.

### Standard Fields

Every component template must include these standard fields — they are required by Witboost:

- `name` — display name (use `EntityNamePicker`)
- `description` — component description
- `domain` — domain selection (use `EntityPicker` with `allowedKinds: [Domain]`)
- `dataproduct` / `parentRef` — parent system (use `EntityPicker` with `allowedKinds: [System]` and domain filter)
- `identifier` — auto-generated unique identifier (use `ComponentIdentifierPicker`)
- `owner` / `developmentGroup` — auto-read from parent system (use `EntitySelectionPicker`)
- `dependsOn` — component dependencies (use `EntityRelationsPicker` or `EntityComponentsPicker`)
- `tags` — classification tags (string array)

These are always present. Don't ask the user whether to include them — only ask if they need **additional** fields.

### Repository Naming

- **Never use `RepoUrlPicker`** unless the user explicitly requests it
- Auto-generate repo names using a naming convention:
  - Systems: `wit-dp-<system-name-normalized>` (or the user's convention)
  - Components (multi-repo): `wit-cmp-<component-name-normalized>` (or the user's convention)
- Normalization: lowercase, spaces replaced with dashes, special characters removed
- Always communicate the naming convention to the user

### URNs

- **`useCaseTemplateId`**: uniquely identifies the template. Auto-generate from template name: `urn:dmb:utm:<name-normalized>:<version>` (e.g., `urn:dmb:utm:snowflake-outputport-template:0.0.0`)
- **`infrastructureTemplateId`**: links to the tech adapter microservice. Must match a registered tech adapter URN — ask the user or auto-generate: `urn:dmb:itm:<adapter-name-normalized>:<version>`
- Always explain what URNs are and offer to auto-generate them

### Wizard Design

- **Use dropdowns** (`enum`) instead of free text when the set of values is known
- **Split the wizard** into logical pages (metadata, tech-specific config, schema, SLA)
- **Use consistent terminology** matching the customer's glossary and Practice Shaper config
- **Add meaningful descriptions** to every field — users should never have to guess
- **Hide computed fields** with `ui:widget: hidden` (e.g., `domainName`, `dataproductName`)
- **Field validation**: use regex pickers or constraints to prevent invalid input — don't let users enter garbage only to fail at deployment

### Template Structure

- **One template per tech adapter per component type** (e.g., one for Snowflake Output Port, another for Snowflake Storage Area)
- **Align `spec.mesh.specific`** with the tech adapter's expected fields — read the tech adapter's documentation first
- **Use YAML anchors** (`&anchor` / `*anchor`) to avoid duplicating values like `repoUrl` across steps
- **Keep skeleton files minimal** — only include files that are genuinely needed
- **Use `copyWithoutRender`** for CI/CD files or binary files that use conflicting template syntax

### Naming

- Template names should describe the technology and component type, not just "Template"
- Use icons (`metadata.mesh.icon`) to make templates easy to identify in the catalog
- Tag templates with relevant technology and component type tags
