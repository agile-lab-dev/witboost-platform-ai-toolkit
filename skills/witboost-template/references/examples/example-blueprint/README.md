# Example Blueprint

In this example, we provide a base **Blueprint** for a well-known use case within the Witboost platform.

A Blueprint is a *collection of templates that represents a use case*. It bundles one project (system)
template together with the component templates that are normally created alongside it, plus the
build order between them. Instead of asking users to remember "for a BigQuery data product you need
a Composer workload, a dbt workload and a BigQuery output port", the Blueprint drives them through
that exact sequence in a single wizard (`Builder > Blueprints`).

## What a Blueprint is (and is not)

- It **is** a Witboost custom entity (`apiVersion: agilelab.it/v1alpha1`, `kind: Blueprint`) defined by a
  single `catalog-info.yaml` at the **root** of its repository.
- It **is not** a scaffolder template: it has no `parameters`, no `steps`, no `skeleton`. It never
  generates code. It only references templates that already exist and are registered in Witboost.
- It **does not** duplicate the templates' fields: when the user adds a component from the blueprint
  wizard, the component's own creation template is rendered as usual.

## Repository layout

```
example-blueprint/
├── catalog-info.yaml   # the blueprint definition (must be at the repository root)
├── mkdocs.yml          # TechDocs configuration, referenced by backstage.io/techdocs-ref: dir:.
└── docs/
    └── index.md        # documentation of the use case this blueprint encodes
```

## Key fields

| Field | Meaning |
| --- | --- |
| `metadata.name` | Unique blueprint id. Only `[a-z0-9+#]` separated by `-`. Convention: `{use-case}-blueprint`. |
| `metadata.description` | Describes the **use case**, not a single technology. Shown on the blueprint card. |
| `spec.owner` | Group owning the blueprint, typically the platform team. Entity-ref form `group:<name>`. |
| `spec.domain` | Optional. Entity-ref form `domain:<name>`. Only when the whole use case belongs to one domain. |
| `spec.mainTemplateId` | The project (system) template. Format `template:default/{template metadata.name}`. |
| `spec.templates[].id` | A component template offered by the blueprint. System templates are **not** allowed here. |
| `spec.templates[].dependencies` | Ids of templates that must be instantiated first; the entry stays disabled in the UI until they are. |
| `spec.parentRefField` | Optional. Name of the picker field auto-filled with the parent system. Defaults to `dataproduct`. |

The formal contract is [blueprint.schema.json](../../schemas/blueprint.schema.json).

## How Witboost uses it at runtime

1. The user picks the blueprint in `Builder > Blueprints`.
2. They either create a new data product from `mainTemplateId`, or select an existing one. Only systems
   whose `spec.mesh.useCaseTemplateId` matches `mainTemplateId` are listed, so a blueprint can never be
   applied to an unrelated data product.
3. Each component template in `spec.templates` becomes selectable once all of its `dependencies` have
   been added. The picker field named by `parentRefField` (default `dataproduct`) is pre-filled with the
   data product chosen in step 2.
4. The same flow can be replayed on an existing data product to check compliance and add missing components.

## When creating a real blueprint

- Start from a real use case, not from a technology: "BigQuery data product", "Streaming ingestion", etc.
- Reference only templates that are already registered; a dangling id breaks the blueprint card.
- Encode the natural build order through `dependencies` and keep the dependency graph acyclic.
- Keep `mainTemplateId` aligned with the `useCaseTemplateId` used by the project template, otherwise
  existing data products will not be selectable.
- Update `docs/index.md` and `mkdocs.yml` to describe the use case; they are published as TechDocs.
- Optionally pair the blueprint with a policy that verifies that deployed data products contain all the
  components the blueprint prescribes.
