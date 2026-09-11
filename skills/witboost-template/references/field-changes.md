# Add or Remove a Field in an Existing Template

A field is never "just a field". Every wizard field is one link in a chain that ends in the deployed
descriptor. Adding or removing one means editing several files consistently, in the right order, and
checking that nothing else depends on it.

## The Wiring Chain

**Creation template** (`template.yaml`) — three hops, all mandatory:

```
spec.parameters[].properties.<field>     the wizard input
        ↓  ${{ parameters.<field> }}
steps[fetch:template].input.values.<key> the value handed to the renderer
        ↓  ${{ values.<key> }}
skeleton/catalog-info.yaml               the descriptor property (usually under spec.mesh)
```

Breaking any hop yields an empty or literal-Nunjucks value in the descriptor, and the wizard will not
warn you.

**Edit template** (`edit-template.yaml`) — two hops, no `steps` at all:

```
spec.parameters[].properties.<field>     the wizard input
        ↓  same property path
catalog-info.yaml of the existing component
```

The edit template writes straight into the component's `catalog-info.yaml`. The property path in the
edit template must match the descriptor path exactly, and the property **must already exist in the
skeleton** (with a default) or edit-only fields will appear as additions on components created before
the change.

## Adding a Field

### Step A1 — Ask three questions, in one round

Use the interactive question tool if available, with selectable options plus free text.

1. **Where should it live?** — creation template (`template.yaml`), edit template
   (`edit-template.yaml`), or both.
   - Default recommendation: **both**, unless the value must be frozen after creation (then
     creation-only, or edit template with `ui:disabled: true`), or it is complex/optional (then
     edit-only, and give the skeleton a sensible default).
2. **What data does it collect?** — Ask about the *data*, never about the widget. "A list of
   existing users", "a table schema", "one of three environments", "a cron expression". **You** map
   that answer onto a field type and picker (Step A2). Do not ask the user to name a `ui:field`.
   Also capture: required or optional, default value, and whether it should only appear under some
   condition (e.g. only when another field is `true`).
3. **Where should it land in the descriptor?** — i.e. which property under `spec.mesh` of
   `catalog-info.yaml`. Users usually do not know. **Propose a placement** (Step A3) and ask them to
   confirm or correct it, rather than asking an open question.

### Step A2 — Pick the field type and picker

Map the data to a field. Consult [Form Fields and Widgets](./template-fields.md) and
[Custom Pickers Reference](./pickers.json) — `pickers.json` is authoritative for `ui:field`,
`ui:options` and field-level config keys.

| The data is… | Use |
| --- | --- |
| Free text, short | `type: string` |
| Long text / description | `type: string` with `ui:widget: textarea` |
| A closed set of values known at authoring time | `type: string` + `enum` (+ `enumNames`) |
| A value chosen from another field's content, or from a catalog entity | `DescriptorPicker` |
| A property read from an already-selected entity (owner, repo name, …) | `EntitySelectionPicker` |
| A reference to a catalog entity | `EntityPicker` (`allowedKinds`) |
| A reference to a component of the same parent | `EntityComponentsPicker` |
| A user or a group | `WitboostUserPicker` / `WitboostGroupPicker` |
| A pattern-constrained string (cron, ARN, connection string) | `RegexPicker` with `validation` |
| A repeatable set of structured rows (e.g. schema columns) | `type: array` of `type: object`, table layout |
| A yes/no switch, often gating other fields | `type: boolean` |
| A value the user must never edit | the right picker + `ui:widget: hidden` or `ui:disabled: true` |

If no picker fits cleanly, prefer a plain typed field over an ill-fitting picker, and say so.

Placement inside the wizard: add the field to an existing page when it belongs to that page's topic;
create a new page only when it introduces a distinct topic. Keep the creation wizard minimal — see the
"Creation wizard = minimal" rule in the skill.

### Step A3 — Propose the descriptor placement

Propose, then confirm. Heuristics:

| The value is… | Proposed descriptor path |
| --- | --- |
| Technology/tech-adapter configuration (the common case) | `spec.mesh.specific.<field>` |
| Part of a coherent tech-adapter config group | `spec.mesh.specific.<group>.<field>` |
| Classification / discovery metadata | `spec.mesh.tags` |
| A platform-standard concept (name, description, owner, version, dependsOn, dataContract, …) | the existing standard `spec.mesh.*` property — never duplicate it under `specific` |
| Purely a wizard control (a toggle that only gates other fields) | nowhere in the descriptor — it stays a parameter only |
| Needed by Backstage/Witboost tooling, not by the tech adapter | `metadata.annotations."<namespace>/<key>"` |

Rules:

- `spec.mesh.specific` is the tech adapter's contract. If a tech adapter codebase or README is
  available, read it and place the field with the exact name and type it expects. If the tech adapter
  does not read the field, it does not belong in `specific`.
- Never invent a new top-level `spec.mesh.*` property to mirror something that already exists.
- Present the proposal as a concrete YAML snippet of the resulting `spec.mesh` fragment.

### Step A4 — Wire it

Keep one name across all hops: parameter name = `values` key = Nunjucks variable. Deviating is the
single most common source of silent breakage.

**Creation template:**

1. `template.yaml` → add the property under the chosen page's `properties`, and to that page's
   `required` array if mandatory.
2. `template.yaml` → add `<field>: ${{ parameters.<field> }}` to the `fetch:template` step's
   `input.values`. **This hop is the one most often forgotten.**
3. `skeleton/catalog-info.yaml` → add the property at the agreed path, referencing
   `${{ values.<field> }}`.
   - Strings: quote when the value may contain `:` or start with a special character.
   - Arrays: handle the empty case —
     `{% if values.arr | length > 0 %}...{% else %}[]{% endif %}`.
   - Objects/arrays of objects: iterate explicitly; do not dump the raw value.
   - Optional fields: wrap in `{% if values.<field> %}` so the descriptor stays clean when unset.
4. If the field must also reach a step other than `fetch:template` (publish inputs, `targetPath`),
   wire it there too.
5. Any other skeleton file that consumes the value (SQL, `dbt_project.yml`, README, docs) gets the
   same Nunjucks variable.

**Edit template:**

1. `edit-template.yaml` → add the property to the appropriate page, using the same widget/picker.
2. Lock it with `ui:disabled: true` if it is not editable after creation.
3. Make sure the descriptor property exists in `skeleton/catalog-info.yaml` too — with a default if
   the field is edit-only — so newly created components already carry the property.

**Both:** apply the two blocks above and keep the field definitions identical (same title,
description, type, picker, validation). Divergence between creation and edit wizards confuses users.

### Step A5 — Verify and report

- Trace the chain end to end in both directions: skeleton variable → step values → parameter, and back.
- Re-run the relevant items of the [Checklist](./checklist.md).
- Tell the user: which files changed, the picker you chose and why, the descriptor path, and the
  resulting `spec.mesh` fragment.
- If the field went into `spec.mesh.specific`, remind the user the tech adapter must handle it.

## Removing a Field

Removal is mechanically simple and semantically risky. Never delete first and check later.

### Step R1 — Scan for dependencies

Search the whole template folder for the field name (and its descriptor property name, if different)
before editing anything. Cover:

- `template.yaml`
  - the `properties` definition and any `required` array containing it
  - `ui:fieldName` / `ui:filter[].fieldName` on other fields that read from it
  - `dependencies`, `allOf` / `if` / `then`, `oneOf` branches keyed on its value
  - `DescriptorPicker` fields whose `source` / `optionsAt` point at it
  - `steps[].input.values`, publish step inputs, `targetPath` / `rootDirectory` and YAML anchors
- `edit-template.yaml` — same checks
- `skeleton/catalog-info.yaml` — the property itself, plus any other expression that reads it
  (interpolation into a name, a conditional, a computed URN, a concatenated string)
- every other file under `skeleton/` (code, config, docs), plus `mkdocs.yml` and `docs/`
- `skeleton/parameters.yaml`, if it references the value
- the tech adapter contract: is the property consumed downstream?

### Step R2 — Classify and plan

| Dependency found | Resolution options |
| --- | --- |
| Other field's `ui:fieldName` / `ui:filter` points at it | repoint to another field, or remove the dependent field too |
| Conditional (`dependencies` / `if-then` / `oneOf`) keyed on it | collapse the conditional to the branch that stays, or remove the whole conditional group |
| It is in a `required` array | drop it from `required` |
| `DescriptorPicker` sources from it | repoint `source`/`optionsAt`, or convert the picker to a static `enum` |
| Its value is interpolated into another descriptor property | replace with a constant, another field, or remove the derived property |
| It feeds `targetPath` / `repoUrl` / publish input | **high risk** — changes repo layout or naming; flag explicitly |
| The tech adapter reads it from `spec.mesh.specific` | **breaking** — must be removed from the tech adapter first, or kept |
| It appears only in docs/README | update the prose |

If the scan finds **any** dependency, produce a written resolution plan — the dependency, its
location, the proposed resolution, and the risk — and **ask the user to confirm before touching a
single file**. If the scan finds nothing, say so and proceed.

### Step R3 — Remove, bottom-up

Delete in reverse order of the wiring chain so intermediate states never reference a missing input:

1. `skeleton/catalog-info.yaml` and any other skeleton file that consumes it
2. `steps[fetch:template].input.values` (and any other step input)
3. `template.yaml` `properties` + `required`
4. `edit-template.yaml` `properties` + `required`
5. Dependent fields/conditionals per the approved plan
6. Docs, README, `docs/index.md`

Delete empty leftovers: a wizard page with no remaining properties, an orphaned `required: []`, a
`specific` block that became empty.

### Step R4 — Report the impact on existing components

Removing a descriptor property is a change to the template's contract:

- Components already created keep the property in their `catalog-info.yaml`; it becomes orphaned. Say
  whether it is harmless or must be cleaned up.
- If the tech adapter still reads the property, removal **breaks deployments**. Flag this before
  proceeding.
- Recommend bumping `useCaseTemplateVersion` (and the `useCaseTemplateId` version segment plus
  `metadata.name` suffix, per [Conventions](./conventions.md)) when the change alters the descriptor
  contract.

## Field-Change Checklist

- [ ] The user confirmed the target: creation template, edit template, or both
- [ ] The field type / `ui:field` was chosen from the data description, not asked for
- [ ] The descriptor placement was proposed as a YAML snippet and confirmed
- [ ] Parameter name, `values` key and Nunjucks variable are identical
- [ ] **Add**: the field exists in `parameters`, in `fetch:template` `input.values`, and in the skeleton
- [ ] **Add**: arrays handle the empty case; optional fields are guarded by `{% if %}`
- [ ] **Add**: creation and edit definitions match where the field exists in both
- [ ] **Add**: edit-only fields have a default in the skeleton descriptor
- [ ] **Remove**: a full dependency scan was run before any edit
- [ ] **Remove**: every dependency has an approved resolution
- [ ] **Remove**: no dangling `${{ values.* }}` / `${{ parameters.* }}` reference remains
- [ ] **Remove**: no empty wizard page, `required` array or `specific` block is left behind
- [ ] Impact on already-created components and on the tech adapter was reported
- [ ] Version bump considered if the descriptor contract changed
