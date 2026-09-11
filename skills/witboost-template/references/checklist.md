# Pre-Delivery Checklist

Validate every template against this checklist before delivery.

## template.yaml

- [ ] `apiVersion` is exactly `scaffolder.backstage.io/v1beta3`
- [ ] `kind` is exactly `Template`
- [ ] `metadata.name` is unique, lowercase, matches `^[a-z0-9][a-z0-9._-]*$`
- [ ] `metadata.title` and `metadata.description` are present and meaningful
- [ ] `metadata.mesh.icon` is a valid URL to an image
- [ ] `spec.generates` matches the entity type being created (e.g., `componenttype:default/outputport` for output ports)
- [ ] `spec.type` aligns with `spec.generates` (the type name after the last `/`)
- [ ] `spec.owner` is set
- [ ] `spec.parameters` has at least one wizard page with a `title`
- [ ] Every field in `required` arrays exists in the corresponding `properties`
- [ ] Field types are valid JSON Schema types (`string`, `number`, `integer`, `boolean`, `array`, `object`)
- [ ] Fields with known value sets use `enum` or `default`
- [ ] Computed/hidden fields use `ui:widget: hidden`

## template.yaml — Steps

- [ ] First step is `fetch:template` with `url: ./skeleton`
- [ ] `fetch:template` `input.values` maps all parameters needed by the skeleton
- [ ] `input.values` includes `useCaseTemplateId`, `infrastructureTemplateId`, `useCaseTemplateVersion`
- [ ] Publish step uses the correct action for the target Git provider:
  - GitLab: `witboostMeshComponent:publish:gitlab`
  - GitHub: `witboostMeshComponent:publish:github`
  - Azure DevOps: `witboostMeshComponent:publish:azure`
  - Bitbucket Server: `witboostMeshComponent:publish:bitbucketServer`
- [ ] Publish step has valid `repoUrl` format for the provider
- [ ] Register step uses `catalog:register` with correct `catalogInfoPath`
- [ ] Step output references are correct: `${{ steps.{stepId}.output.{field} }}`
- [ ] `output.links` section includes repository URL and catalog entity link

## skeleton/catalog-info.yaml

- [ ] `%SKELETON` is the literal first line of the file — nothing precedes it (no blank lines, no `{# comment #}`, no `{% set %}`)
- [ ] `apiVersion` is exactly `backstage.io/v1alpha1`
- [ ] `kind` is `System` (for system templates) or `Component` (for component templates)
- [ ] `kind` matches what `spec.generates` in template.yaml produces
- [ ] `metadata.name` uses a Nunjucks expression (typically `${{ values.identifier }}`)
- [ ] Every Nunjucks variable (`${{ values.* }}`) exists in the `fetch:template` step's `input.values`
- [ ] No undefined or misspelled variable references
- [ ] `spec.type` matches the template's `spec.type`
- [ ] `spec.owner`, `spec.system` (for components), `spec.domain` are set via Nunjucks expressions

## skeleton/catalog-info.yaml — spec.mesh

- [ ] `spec.mesh.name` is set
- [ ] `spec.mesh.description` is set (for components)
- [ ] `spec.mesh.kind` matches `spec.type` (for components)
- [ ] `spec.mesh.version` is set
- [ ] `spec.mesh.useCaseTemplateId` matches the URN in the template step values
- [ ] `spec.mesh.infrastructureTemplateId` matches the registered tech adapter URN
- [ ] `spec.mesh.dependsOn` handles both empty and non-empty arrays correctly
- [ ] URN format: `urn:dmb:utm:[a-zA-Z0-9_-]+:\d+(\.\d+\.\d+)?` (use case) or `urn:dmb:itm:...` (infrastructure)

## Tech Adapter Alignment

- [ ] The `infrastructureTemplateId` in catalog-info.yaml matches a real, registered tech adapter URN
- [ ] `spec.mesh.specific` contains **all fields expected by the target tech adapter**
- [ ] `spec.mesh.specific` field names and types match the tech adapter's documentation/README
- [ ] The template wizard collects all values needed to populate `spec.mesh.specific`
- [ ] Values flow correctly: template parameter → step values → skeleton `spec.mesh.specific`

## edit-template.yaml

- [ ] `apiVersion` is exactly `witboost.com/v2`
- [ ] `kind` is exactly `EditTemplate`
- [ ] `spec.useCaseTemplateId` is an array containing the creation template's URN(s)
- [ ] The URN(s) in `useCaseTemplateId` match the creation template exactly
- [ ] Locked fields have `ui:disabled: true`:
  - Name
  - Domain
  - Parent system
  - Identifier
  - Development Group
- [ ] Non-editable field descriptions mention "Not editable after creation" or similar
- [ ] First wizard page is informational (explains what can/cannot be edited)
- [ ] All editable fields from the creation template are present
- [ ] No `steps` section (v2 edit templates don't have steps)

## catalog-info.yaml (Blueprint)

- [ ] The document validates against [blueprint.schema.json](./schemas/blueprint.schema.json)
- [ ] `apiVersion` is exactly `agilelab.it/v1alpha1`
- [ ] `kind` is exactly `Blueprint`
- [ ] The file is at the root of the blueprint repository
- [ ] `metadata.name` uses only `[a-z0-9+#]` separated by `-`; same rule for every value in `tags`
- [ ] `metadata.description` describes the use case, not a single technology
- [ ] `metadata.annotations."backstage.io/techdocs-ref"` is set and `mkdocs.yml` + `docs/` exist
- [ ] `spec.mainTemplateId` references a project (system) template, in `template:default/{name}` form
- [ ] `spec.templates[].id` reference component templates only — no system template in the list
- [ ] Every referenced template exists; the user has been reminded to register the ones that aren't yet
- [ ] `dependencies` only reference ids present in the same `spec.templates` list
- [ ] The dependency graph is acyclic, minimal, and never includes `mainTemplateId`
- [ ] `spec.owner` uses the entity-ref form `group:<name>`
- [ ] `spec.domain` is present only when the whole use case belongs to a single domain
- [ ] `spec.parentRefField` is omitted unless the component templates use a non-default picker name
- [ ] No `parameters`, `steps` or `skeleton` are present
- [ ] The packaging preview was shown and explicitly confirmed by the user before writing any file

## Field Changes (adding or removing a single field)

See [Field Changes](./field-changes.md) for the full playbook.

- [ ] The user confirmed the target: creation template, edit template, or both
- [ ] The field type / `ui:field` was derived from the data description, not asked for
- [ ] The descriptor placement under `spec.mesh` was proposed as YAML and confirmed
- [ ] Parameter name, `fetch:template` `values` key and Nunjucks variable are identical
- [ ] **Add**: the field exists in `parameters`, in `input.values`, and in the skeleton descriptor
- [ ] **Add**: arrays handle the empty case and optional values are guarded by `{% if %}`
- [ ] **Add**: creation and edit definitions match where the field exists in both
- [ ] **Add**: edit-only fields have a default in `skeleton/catalog-info.yaml`
- [ ] **Remove**: a dependency scan was run and reported before any edit
- [ ] **Remove**: every dependency (conditionals, `ui:fieldName`, pickers, step inputs, docs) has an approved resolution
- [ ] **Remove**: no dangling `${{ values.* }}` or `${{ parameters.* }}` reference remains
- [ ] **Remove**: no empty wizard page, `required` array or `specific` block is left behind
- [ ] Impact on already-created components and on the tech adapter was reported
- [ ] A version bump was considered if the descriptor contract changed

## General

- [ ] All YAML files are valid YAML (no syntax errors)
- [ ] No hardcoded customer-specific values (org names, URLs) — use parameters or YAML anchors
- [ ] Nunjucks arrays handle the empty case: `{% if values.arr | length > 0 %}...{% else %}[]{% endif %}`
- [ ] `copyWithoutRender` lists any files with conflicting template syntax (CI/CD files, binaries)
- [ ] Template documentation (`docs/index.md`) describes usage and parameters
