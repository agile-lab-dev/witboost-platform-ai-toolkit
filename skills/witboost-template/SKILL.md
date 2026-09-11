---
name: witboost-template
description: 'Create or modify Witboost templates (creation templates, edit templates, catalog-info skeletons) and use case Blueprints. Use when: creating a new Witboost template, scaffolding a template.yaml, generating skeleton/catalog-info.yaml, building an edit-template.yaml, designing a Witboost wizard form, adding or removing a field in an existing template or edit template, connecting a template to a tech adapter, creating a Blueprint that bundles a data product template with its component templates into a use case, adding a template to an existing Blueprint. Covers all component types: output port, workload, storage, data product, system, and custom Practice Shaper types.'
argument-hint: 'Describe what kind of template or blueprint you need (e.g., "Snowflake output port template for Azure DevOps", "add a retention field to my output port template", "a blueprint for our BigQuery use case")'
---

# Create Witboost Templates and Blueprints

## When to Use

- User wants to create a new Witboost creation template (`template.yaml`)
- User wants to create or update an edit template (`edit-template.yaml`)
- User wants to add or remove a field in an existing template or edit template
- User wants to generate a skeleton `catalog-info.yaml` for a component
- User wants to connect a template to a specific tech adapter
- User asks about Witboost template structure, schema, or conventions
- User wants to create a Blueprint — a collection of templates representing a use case
- User wants to add a template to an existing Blueprint

## Knowledge Base

Read these files before generating any template:

- [Overview](./references/overview.md) — what templates are, wizard + skeleton, descriptor assembly
- [Template Anatomy](./references/template-anatomy.md) — folder structure, Practice Shaper variability, tech adapter contract, monorepo/multi-repo, Nunjucks templating, edit templates
- [Form Fields and Widgets](./references/template-fields.md) — field types, validation, objects, arrays, conditionals, layouts, UI directives, YAML substitution
- [Custom Pickers Reference](./references/pickers.json) — every Witboost custom picker (`ui:field`) exposed by the wizard engine: purpose, `ui:options`, other `ui:*` directives, field-level config, validation, and example usage. Consult this whenever a field needs a `ui:field` beyond a plain widget.
- [Manifest Schema Reference](./references/manifest-schema.md) — how the 4 JSON schemas relate, descriptor assembly flow
- [Conventions](./references/conventions.md) — URN format, naming rules, versioning, git provider publish variants, UX principles, standard fields, repo naming
- [Field Changes](./references/field-changes.md) — adding or removing a single field in an existing template: the wiring chain, picker selection, descriptor placement, dependency scan before removal
- [Blueprints](./references/blueprint.md) — field contract, template discovery, dependency inference, mandatory preview, create and add-to-existing flows
- [Checklist](./references/checklist.md) — pre-delivery validation checklist

### JSON Schemas

- [template.schema.json](./references/schemas/template.schema.json) — creation template structure
- [edit-template.schema.json](./references/schemas/edit-template.schema.json) — edit template structure
- [catalog-info.schema.json](./references/schemas/catalog-info.schema.json) — skeleton catalog-info structure
- [parameters.schema.json](./references/schemas/parameters.schema.json) — skeleton parameters structure
- [blueprint.schema.json](./references/schemas/blueprint.schema.json) — blueprint catalog-info structure

### Examples - Gold standards

Complete working examples for each component type:

- [Project (e.g. a Data Product)](./references/examples/example-project-template/) - complete working example for a generic project template. then customer may add project-specific files in `skeleton/` as needed.
- [Component (e.g. an Output Port or a Storage Area or a Workload)](./references/examples/example-component-template/) — complete working example for a generic component template. then customer may add component-specific files in `skeleton/` as needed. 
- [Blueprint (a use case bundling one project template and its component templates)](./references/examples/example-blueprint/) — complete working example of a `kind: Blueprint` catalog-info, with the dependency graph between component templates.

### Reusable Snippets

- [snippets-component-metadata.yaml](./references/examples/snippets/snippets-component-metadata.yaml) — standard component metadata wizard page (name, domain, dataproduct, identifier, owner, dependsOn, tags)
- [snippets-basic-fields.yaml](./references/examples/snippets/snippets-basic-fields.yaml) — catalog of all basic field types (string, number, boolean, date, array)
- [snippets-conditional-fields.yaml](./references/examples/snippets/snippets-conditional-fields.yaml) — conditional field patterns (boolean toggle, enum-based, array contains, dependencies+oneOf)
- [snippets-table-schema.yaml](./references/examples/snippets/snippets-table-schema.yaml) — table schema layout with nested conditionals per data type
- [snippets-layouts.yaml](./references/examples/snippets/snippets-layouts.yaml) — object, horizontal, and table layout examples
- [snippets-dynamic-select.yaml](./references/examples/snippets/snippets-dynamic-select.yaml) — DescriptorPicker for dynamic selects from local fields and catalog entities
- [snippets-retrieve-data.yaml](./references/examples/snippets/snippets-retrieve-data.yaml) — EntitySelectionPicker patterns for retrieving data from catalog entities

## Procedure

### Step 0: Identify the Artifact

Determine what the user is asking for before anything else:

- **A new template** (`template.yaml` + `skeleton/`, or `edit-template.yaml`) → follow **Procedure A**
- **Blueprint** (`catalog-info.yaml` with `kind: Blueprint`), either new or to be extended → follow **Procedure B**
- **A field change on an existing template** (add or remove one field) → follow **Procedure C**

Signals for a Field Change: "add a field", "remove a field", "add a parameter to the wizard", "I also
need to ask the user for X", "drop this property from the descriptor", "this field is no longer needed".
Do NOT regenerate the whole template for a field change — make a surgical edit.

Signals for a Blueprint: "use case", "bundle of templates", "always create these components together",
"pre-defined data product shape", "add this template to the blueprint", "check existing data products
for compliance". A Blueprint does not generate code and cannot exist before the templates it references.

Signals for a Template: "create a template", "scaffold a template.yaml", "generate skeleton/catalog-info.yaml", "build an edit-template.yaml", "design a wizard form", "connect to a tech adapter"

If they ask for multiple templates in the same request, design them one by one following the procedure A, then ask if they want to create a Blueprint that bundles them together, following procedure B.

## Procedure A — Create a Template

### Step 1: Gather Requirements

Ask the user these questions before generating anything. Do NOT skip this step.

When an interactive question tool is available, use it instead of plain text: present each question with predefined selectable options (plus free-text input) so the user can click rather than type. Batch related questions into a single round instead of asking one at a time.

**Always ask first (these save many follow-up questions):**
1. Do you already have other templates? If yes, point me to the folder — I'll read them to understand your conventions, repo structure, naming patterns, and Practice Shaper configuration.
2. Do you have the tech adapter codebase or README that will provision this component? If yes, point me to it — I'll read it to extract the fields it expects in `spec.mesh.specific` and any validation rules.
3. Do you have an existing example project which we can use as a reference for this template? If yes, point me to it — I'll read it to understand the structure, conventions, and any specific patterns it follows. 

If the user provides existing templates or a tech adapter codebase, read them FIRST. Infer Practice Shaper terminology, monorepo/multi-repo strategy, Git provider, URN conventions, repo naming convention, and `spec.mesh.specific` fields from them instead of asking redundant questions.

**Then ask (skip what was already inferred):**

**Template scope:**
4. What type of component does this template create? (output port, workload, storage, system, or custom type)
5. What technology does it target? (Snowflake, S3, Databricks, Spark, etc.)

**Tech adapter contract** (skip if inferred from tech adapter codebase):
6. What tech adapter will provision this component? Is it a real tech adapter or a **mock tech adapter**?
    - If the user says things like "no deployment", "mock tech adapter", "deployment is mocked", "no infrastructure changes", "metadata-only component" → the component uses a mock tech adapter (always returns success, no real provisioning).
    - If it's a real tech adapter: what fields does it expect in `spec.mesh.specific`?
    - If it's a mock: `spec.mesh.specific` can be empty or contain only metadata fields.

**URNs:**
7. Every template needs two identifiers (URNs). Explain them to the user:
    - **`useCaseTemplateId`**: uniquely identifies this template. Format: `urn:dmb:utm:{name}:{version}`. Example: `urn:dmb:utm:snowflake-outputport-template:0.0.0`
    - **`infrastructureTemplateId`**: links the component/system to the tech adapter microservice that will be invoked when deploying. Format: `urn:dmb:itm:{name}:{version}`. Example: `urn:dmb:itm:snowflake-outputport-provisioner:0`
    - Ask: "Do you want me to generate these based on the template name and tech adapter, or do you want to specify them yourself?"
    - If auto-generating: derive from template name and tech adapter name (e.g., template "Snowflake Output Port" → `urn:dmb:utm:snowflake-outputport-template:0.0.0`)
    - Always tell the user what URNs you generated.

**Repository strategy:**
8. Monorepo or multi-repo?
    - **Monorepo**: all components live in the same Git repo as the parent system.
    - **Multi-repo**: each component gets its own dedicated Git repo.
9. Which Git provider? (GitLab, GitHub, Azure DevOps, Bitbucket Server)
10. Do you have a specific repo naming convention? If not, I'll use: `wit-dp-<system-name>` for systems and `wit-cmp-<component-name>` for components (multi-repo). Clearly communicate the convention to the user.

**Additional wizard fields:**
11. The creation wizard will automatically include the standard Witboost fields (name, description, domain, data product, identifier, owner, dependencies, tags). These are required by the platform.
    - Do you need any **additional** fields beyond the standard ones? For example: schema columns, connection strings, schedule, SLA terms, data contract fields, environment-specific config, etc.
    - Remember: keep the creation wizard minimal. Ask only what's strictly necessary for the first deployment. Complex or optional fields can go in the edit template.

**Ask if not obvious:**

**Practice Shaper context** (skip if inferred from existing templates):
12. What practice/data landscape is configured in Witboost? (Data Mesh, Data Lake, BI, ML, custom?)
13. What terminology does your organization use? (e.g., is it "Data Product" or something else?)

**Starting point:**
14. Do you want to start from one of the [Witboost Starter Kit](https://github.com/agile-lab-dev/witboost-starter-kit) templates instead of building from scratch? Always ask this unless the user already brought up the starter kit themselves.
    - If yes: ask the user to give you the GitHub URL of the specific starter kit template repository they want to use (the starter kit index links to 50+ separate repos — don't guess which one matches their technology). Fetch and read that repo before generating anything, and use it as the base.
    - If no, or they don't have one: follow the structure in this skill from scratch.

**Edit template:**
15. Do you also need an edit template? (Recommended — it allows users to modify the component after creation without editing YAML files directly. The edit template typically has more fields than the creation template.)

If the user provides an existing template or tech adapter README, read it first and infer answers from it instead of asking redundant questions.

### Step 2: Read Knowledge Base

Read the relevant files from the knowledge base:

1. Read [Overview](./references/overview.md) first for the overall concept
2. Read [Template Anatomy](./references/template-anatomy.md) for the overall structure
3. Read [Conventions](./references/conventions.md) for URN format and git provider variants
4. Read the JSON schema for the file you're generating:
   - Creating `template.yaml` → read [template.schema.json](./references/schemas/template.schema.json)
   - Creating `edit-template.yaml` → read [edit-template.schema.json](./references/schemas/edit-template.schema.json)
   - Creating `skeleton/catalog-info.yaml` → read [catalog-info.schema.json](./references/schemas/catalog-info.schema.json)
5. Read the examples folder starting with [how-to-use.md](./references/examples/how-to-use.md), then read the matching example for the component type being built

### Step 3: Generate Files

Generate files in this order. **After generating, clearly summarize to the user what values were auto-generated** (URNs, repo names, field defaults) so they can verify.

1. **`template.yaml`** — the creation wizard
   - Use `apiVersion: scaffolder.backstage.io/v1beta3` and `kind: Template`
   - Set `spec.generates` based on Practice Shaper entity types
   - **Creation wizard = minimal.** Include the standard Witboost fields (name, description, domain, dataproduct/parentRef, identifier, owner, dependsOn, tags) plus only the additional fields the user explicitly requested. Provide sensible defaults for everything possible. Complex or optional fields belong in the edit template, not the creation wizard.
   - **Never use `RepoUrlPicker`** unless the user explicitly asks for it. Auto-generate the repo URL using a naming convention (default: `wit-dp-<name>` for systems, `wit-cmp-<name>` for components, or the user's convention).
   - Map all parameters to step values in the `fetch:template` step
   - Include `useCaseTemplateId`, `infrastructureTemplateId`, `useCaseTemplateVersion` in step values
   - Use the correct publish action for the chosen Git provider
   - Add the `catalog:register` step
   - **Monorepo component templates**: add hidden fields to auto-read the parent system's repo name and root directory via `EntitySelectionPicker` with `ui:property: metadata.annotations["<provider>.repo-name"]`. Build `repoUrl` from the parent's repo info. Set `targetPath` to a subdirectory like `./components/${{ parameters.name | lower }}`.
   - **Monorepo system templates**: the system creates the repo. No need to read repo info from a parent.
   - **Multi-repo templates**: auto-generate `repoUrl` from the naming convention. Do NOT use `RepoUrlPicker`.

2. **`skeleton/catalog-info.yaml`** — the entity descriptor
   - Use `apiVersion: backstage.io/v1alpha1`
   - Set `kind: System` or `kind: Component` matching `spec.generates`
   - Fill `spec.mesh` with all required fields (name, description, kind, version, URNs, dependsOn)
   - Fill `spec.mesh.specific` with the fields expected by the tech adapter
   - Use Nunjucks expressions referencing `values.*` — every variable must exist in the `fetch:template` step's `input.values`
   - Handle empty arrays: `{% if values.arr | length > 0 %}...{% else %}[]{% endif %}`
   - **Monorepo system templates**: inject the repo name and root directory into `metadata.annotations` so child component templates can discover them

3. **`edit-template.yaml`** (if requested)
   - Use `apiVersion: witboost.com/v2` and `kind: EditTemplate`
   - Set `spec.useCaseTemplateId` to an array containing the creation template's URN
   - **The edit template is where complexity lives.** Include all fields from the creation template plus additional fields that were too complex or unnecessary for first-time creation (schema definitions, SLA details, quality rules, environment configs, etc.)
   - Mark non-editable fields with `ui:disabled: true`: name, domain, parent system, identifier, development group
   - First page should be informational (explain what can/cannot be edited)
   - **Suggest to the user** that for very complex configurations (e.g., advanced data quality expectations, complex data contracts), it may be better to edit the YAML file directly in the repository rather than building an overly complex wizard. Templates accelerate work, they don't replace an IDE.

4. Remaining skeleton files: `skeleton/README.md`, `skeleton/mkdocs.yml`, `skeleton/docs/index.md`, and any other project files from the example reference project (if any)
   - Include documentation, configuration files, and any other resources needed for the template to function correctly.
   - For example: if the template is a DBT project, include the `dbt_project.yml` file and any necessary SQL models or macros in the `skeleton` folder. As a nice-to-have create them with Nunjucks placeholders for dynamic values. 

### Step 4: Validate

Run through the [Checklist](./references/checklist.md):

- [ ] `apiVersion` and `kind` are correct for each file
- [ ] `spec.generates` matches `catalog-info.yaml` `kind`
- [ ] `spec.type` aligns with `spec.generates`
- [ ] Every Nunjucks variable is traced end to end: skeleton → `fetch:template` step values → `parameters.yaml`
- [ ] URNs follow the format `urn:dmb:utm:...:version` / `urn:dmb:itm:...:version`
- [ ] `spec.mesh.specific` contains the fields expected by the tech adapter
- [ ] `infrastructureTemplateId` matches the registered tech adapter URN
- [ ] Publish step uses the correct action for the Git provider
- [ ] Edit template has `ui:disabled: true` on locked fields
- [ ] Empty arrays are handled in Nunjucks conditionals

## Procedure B — Create or Update a Blueprint

A Blueprint bundles one project (system) template with the component templates of a use case. It has no
`parameters`, no `steps`, no `skeleton` and no URNs. Read [Blueprints](./references/blueprint.md) for the
full playbook and [blueprint.schema.json](./references/schemas/blueprint.schema.json) for the contract.

**Step B0 — Determine the flow.** Creating a new blueprint, or adding a template to an existing one?

**Step B1 — Ask the minimum, and nothing else.**

- *New blueprint*: which templates to include — a list of paths or a single folder containing them all —
  and whether the user already knows of dependencies between them.
- *Adding a template*: the only question is whether the user has preferences on the new template's
  dependencies. Offer the dependencies you inferred as the default option so they can just confirm.

Everything else — name, title, description, tags, icon, owner, lifecycle, domain, `mainTemplateId`,
target path — is derived from the templates and proposed in the preview. Never ask for it upfront.

**Step B2 — Discover, classify, infer.** Read every indicated template: `metadata.name` gives the
`template:default/{name}` reference, the skeleton's `kind` tells System from Component, and
`spec.mesh.specific`, `dependsOn` defaults and the READMEs give the evidence for the dependency graph.
If more than one system template is found, **stop and ask which one is the main template**.

**Step B3 — Show the preview and stop.** Present the proposed metadata, the main template, the component
table with the evidence behind each dependency, a Mermaid graph, the files that will be written and any
warnings. For the add-to-existing flow, show the full resulting blueprint plus a diff of the added lines.
**Never write a file before the user confirms.**

**Step B4 — Generate or patch.** New blueprint: `catalog-info.yaml` at the repository root, `mkdocs.yml`
and `docs/index.md`. Existing blueprint: insert the entry preserving order, comments and formatting, and
update `docs/index.md` if it enumerates the components.

**Step B5 — Validate.** Check the result against `blueprint.schema.json` and the Blueprint section of the
[Checklist](./references/checklist.md), then explain registration and remind the user to register any
referenced template that is not yet in Witboost.

## Procedure C — Add or Remove a Field

Read [Field Changes](./references/field-changes.md) for the full playbook, plus
[Custom Pickers Reference](./references/pickers.json) when choosing a `ui:field`. Always read the
existing `template.yaml`, `edit-template.yaml` and `skeleton/catalog-info.yaml` first — the change must
follow the conventions already in the template, not this skill's defaults.

A field lives in three places in a creation template and two in an edit template:
`parameters` → `fetch:template` `input.values` → `skeleton/catalog-info.yaml` (creation), and
`parameters` → the component's `catalog-info.yaml` (edit, no steps). Every hop must be kept in sync.

### Adding a field

**Step C1 — Ask three questions in a single round** (use the interactive question tool with options):

1. **Creation template, edit template, or both?**
2. **What kind of data does the field collect?** Ask about the *data*, never about the widget —
   you choose the field type and picker. Also capture: required or optional, default, and any
   condition that should gate its visibility.
3. **Where should the value land in the descriptor** (which property under `spec.mesh` in
   `catalog-info.yaml`)? Users rarely know — **propose a placement and ask for confirmation**
   instead of asking an open question.

**Step C2 — Choose the picker.** Map the data description onto a type/`ui:field` using the decision
table in [Field Changes](./references/field-changes.md) and the authoritative
[pickers.json](./references/pickers.json). Prefer a plain typed field over an ill-fitting picker.

**Step C3 — Propose the descriptor placement.** Default: tech-adapter configuration goes to
`spec.mesh.specific.<field>`; platform-standard concepts reuse the existing `spec.mesh.*` property;
pure wizard controls stay parameters only. Show the resulting `spec.mesh` fragment as YAML.

**Step C4 — Wire it.** Keep the parameter name, the `values` key and the Nunjucks variable identical.

- Creation template: add to `parameters`, add `<field>: ${{ parameters.<field> }}` to the
  `fetch:template` step values (**most commonly forgotten hop**), add to `skeleton/catalog-info.yaml`.
- Edit template: add to `parameters` (`ui:disabled: true` if locked). Ensure the property also exists
  in the skeleton, with a default when the field is edit-only.
- Handle empty arrays and optional values with Nunjucks guards.

**Step C5 — Report.** List the files changed, the picker chosen and why, the descriptor path, and
remind the user that the tech adapter must handle any new `spec.mesh.specific` field.

### Removing a field

**Step C6 — Scan for dependencies before editing anything.** Search the template folder for the field
name and its descriptor property name: `ui:fieldName` / `ui:filter` on other fields, `dependencies` /
`if-then` / `oneOf` conditionals, `DescriptorPicker` `source`/`optionsAt`, `required` arrays, step
inputs, `targetPath`/`repoUrl`, skeleton files and docs, and whether the tech adapter consumes it.

**Step C7 — If anything depends on it, stop.** Present a resolution plan — each dependency, its
location, the proposed fix, and the risk — and **get explicit confirmation before touching any file**.
If the scan is clean, say so and proceed.

**Step C8 — Remove bottom-up:** skeleton files → step values → `template.yaml` parameters and
`required` → `edit-template.yaml` → dependent fields per the approved plan → docs. Clean up leftovers
(empty wizard pages, empty `required`, empty `specific`).

**Step C9 — Report the impact.** Already-created components keep the orphaned property; if the tech
adapter still reads it, removal breaks deployments. Recommend a version bump when the descriptor
contract changed.

**Step C10 — Validate** against the Field Changes section of the [Checklist](./references/checklist.md).

## Important Rules

- **Never assume terminology.** "Data Product", "Output Port", etc. are the Data Mesh defaults. Always confirm what the customer calls these entities.
- **`spec.mesh.specific` has no fixed schema.** The tech adapter defines it. Always ask what fields are expected.
- **Standard fields are not optional.** Every template must include the standard Witboost fields (name, description, domain, dataproduct, identifier, owner, dependsOn, tags). Don't ask the user to choose these — they're always there. Only ask if the user needs additional fields.
- **Creation wizard = minimal, edit template = detailed.** Keep the creation wizard as simple as possible with sensible defaults. Shift complexity to the edit template. The user can always come back and edit later.
- **Templates are not IDEs.** Don't try to replicate a full editor experience in the wizard. For complex configurations (advanced data quality rules, detailed data contracts, complex transformations), suggest the user edit the YAML file directly in the repository. Communicate this as a recommendation, not a limitation.
- **Never use `RepoUrlPicker`** unless explicitly requested. Auto-generate repo names using a convention (default: `wit-dp-<name>` for systems, `wit-cmp-<name>` for components) and communicate the convention to the user.
- **A field change is a surgical edit, not a regeneration.** When asked to add or remove one field, never rewrite the whole template. Read the existing files and follow their conventions.
- **Ask for the data, choose the widget yourself.** Users describe what they need to collect; picking the field type and `ui:field` is your job.
- **Propose the descriptor placement, don't ask for it.** Users rarely know where a value should sit under `spec.mesh`. Offer a concrete YAML fragment to confirm.
- **Never remove a field before scanning for dependencies.** If anything references it, present a resolution plan and get explicit confirmation first.
- **Never hardcode sample data in `skeleton/parameters.yaml`.** This file is auto-generated by Witboost. The template developer only provides Nunjucks expressions: `readonly` section for components (`__system__`, `__version__`), `values` section for systems (tech-adapter config). Witboost fills the rest from the wizard and `fetch:template` step.
- **Explain and offer to auto-generate URNs.** Users often don't know what URNs are. Explain their purpose, offer to generate them automatically, and always tell the user what was generated.
- **Be transparent about assumptions.** Whenever you auto-generate a value (URN, repo name, field default), clearly state what you generated and why. The user must know what's automatic and what requires their input.
- **Always ask monorepo vs multi-repo.** This fundamentally changes how `repoUrl` is constructed and whether the system template needs repo annotations.
- **Start from starter kit when possible.** Don't reinvent the wheel — proactively ask if the user wants to start from a [Witboost Starter Kit](https://github.com/agile-lab-dev/witboost-starter-kit) template, unless they already brought it up. If yes, ask them for the GitHub URL of the specific starter kit repo (there's no fixed URL per technology — the user must point you to it) and read it before generating anything.
- **Every Nunjucks variable must be traced end to end.** If `${{ values.foo }}` appears in the skeleton, then `foo: ${{ parameters.foo }}` must appear in the `fetch:template` step's `input.values`, and any reference to it in `skeleton/parameters.yaml` must resolve back to the same source.
- **A Blueprint is not a template.** No `parameters`, no `steps`, no `skeleton`, no URNs. It never generates code; it orchestrates templates that already exist.
- **Blueprints reference templates by `template:default/{metadata.name}`**, never by `urn:dmb:utm:...`. A dangling id breaks the blueprint card.
- **Never put a system template in `spec.templates`.** The system template goes in `mainTemplateId` and is always implicitly created or selected first.
- **Never write a blueprint without an approved preview** — this applies to creation and to adding a template to an existing blueprint.
- **Infer blueprint dependencies from the templates.** Read them and derive the graph from evidence; ask only for confirmation, never for the raw list.
- **More than one system template among the indicated templates? Stop and ask** which one is the main template. Do not pick one, and do not emit several blueprints.
- **Validate against the checklist.** Go through every item before presenting the result to the user.
