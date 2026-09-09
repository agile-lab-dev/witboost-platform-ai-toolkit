# Form Fields and Widgets

The `spec.parameters` section in `template.yaml` defines the wizard form using JSON Schema. Each element in the array is one wizard page. Within each page, `properties` contains the field definitions. The form engine renders fields automatically based on their JSON Schema type, with UI customization available via `ui:*` directives.

In addition to standard widgets, Witboost provides custom pickers (`ui:field`) for entity selection, identifier generation, and more. Custom pickers are documented separately — this file covers the standard field types, layouts, conditionals, and UI directives.

## Field Types and Default Rendering

### String Fields

```yaml
# Simple text input (default)
name:
  title: Name
  type: string

# Textarea (multi-line)
description:
  title: Description
  type: string
  ui:widget: textarea

# Password field
secret:
  title: Secret
  type: string
  ui:widget: password

# Color picker
color:
  title: Color
  type: string
  ui:widget: color

# Multiline text area with row count
notes:
  title: Notes
  type: string
  ui:options:
    multiline: true
    rows: 5

# Disabled (read-only) field
fixedValue:
  title: Fixed Value
  type: string
  default: Non-editable value
  ui:disabled: true

# Custom styling
command:
  title: Command
  type: string
  ui:options:
    multiline: true
    rows: 3
  ui:style:
    font-family: Consolas
    color: "#0f0"
    background: "#111"
```

### String Formats

The `format` keyword changes the rendered widget automatically:

```yaml
email:
  title: Email
  type: string
  format: email       # renders email input

website:
  title: Website
  type: string
  format: uri         # renders URL input

startDate:
  title: Start Date
  type: string
  format: date        # renders date picker

timestamp:
  title: Timestamp
  type: string
  format: date-time   # renders datetime picker

startTime:
  title: Start Time
  type: string
  format: time        # renders time picker
```

### Number and Integer Fields

```yaml
# Default number input
age:
  title: Age
  type: integer

# With validation constraints
score:
  title: Score
  type: number
  minimum: 0
  maximum: 100

# Updown spinner
quantity:
  title: Quantity
  type: integer
  ui:widget: updown

# Range slider
percentage:
  title: Percentage
  type: integer
  minimum: 0
  maximum: 100
  ui:widget: range

# Radio buttons (only with enum)
priority:
  title: Priority
  type: integer
  enum: [1, 2, 3]
  ui:widget: radio
```

### Boolean Fields

```yaml
# Checkbox (default)
enabled:
  title: Enabled
  type: boolean

# Radio buttons
confirmed:
  title: Confirmed
  type: boolean
  ui:widget: radio

# Dropdown select
active:
  title: Active
  type: boolean
  ui:widget: select

# Boolean with custom labels
status:
  type: boolean
  oneOf:
    - const: true
      title: Active
    - const: false
      title: Inactive
  ui:widget: radio
```

### Enum (Dropdown)

Any field with an `enum` array renders as a dropdown by default:

```yaml
environment:
  title: Environment
  type: string
  enum:
    - development
    - staging
    - production
  default: development
```

#### Enum with Display Labels

Use `enumNames` to decouple the displayed label from the stored value:

```yaml
region:
  title: Region
  type: string
  enum:
    - "eu-west-1"
    - "us-east-1"
    - "ap-southeast-1"
  enumNames:
    - Europe (Ireland)
    - US East (Virginia)
    - Asia Pacific (Singapore)
```

### Hidden Fields

Fields that need to be present in form data but not shown to the user:

```yaml
hiddenValue:
  type: string
  default: some-computed-value
  ui:widget: hidden
```

## Validation

### String Validation

```yaml
name:
  title: Name
  type: string
  minLength: 3
  maxLength: 50
  pattern: "^[a-zA-Z][a-zA-Z0-9_-]*$"
```

You can also use `ui:options` for length constraints:

```yaml
code:
  title: Code
  type: string
  ui:options:
    minLength: 3
    maxLength: 10
```

### Number Validation

```yaml
score:
  title: Score
  type: number
  minimum: 0
  maximum: 100
```

## Objects (Nested Fields)

Fields can be grouped into objects, which render as collapsible sections:

```yaml
contact:
  title: Contact Info
  type: object
  properties:
    name:
      title: Name
      type: string
    email:
      title: Email
      type: string
      format: email
  required:
    - name
```

To control display of the object title:

```yaml
contact:
  type: object
  ui:options:
    displayTitle: false     # hide the object title
  properties:
    # ...
```

## Arrays

### Array of Simple Values

```yaml
tags:
  title: Tags
  type: array
  default: []
  items:
    type: string
```

### Array of Objects

```yaml
columns:
  title: Columns
  type: array
  default: []
  items:
    type: object
    required:
      - name
      - dataType
    properties:
      name:
        title: Name
        type: string
      dataType:
        title: Data Type
        type: string
        enum:
          - TEXT
          - NUMBER
          - DATE
          - BOOLEAN
```

### Array as Table Layout

For arrays of objects, use the table template for compact rendering:

```yaml
schemaColumns:
  title: Column Definitions
  type: array
  ui:ArrayFieldTemplate: ArrayTableTemplate
  default: []
  items:
    type: object
    ui:ObjectFieldTemplate: TableRowTemplate
    required:
      - name
      - dataType
    properties:
      name:
        type: string
        title: Name
      dataType:
        type: string
        title: Data Type
        enum:
          - TEXT
          - NUMBER
          - DATE
```

### Multiple Choice (Checkboxes)

An array with `enum` items and `uniqueItems: true` renders as a multi-select. Use `ui:widget: checkboxes` for checkbox rendering:

```yaml
features:
  title: Features
  type: array
  items:
    type: string
    enum:
      - logging
      - monitoring
      - alerting
      - backup
  uniqueItems: true
  ui:widget: checkboxes
```

### Array Constraints

```yaml
items:
  type: array
  minItems: 1     # at least one item required
  maxItems: 10    # at most 10 items
  items:
    type: string
```

## Conditional Fields

### if / then / else (Recommended)

Use `allOf` with `if`/`then`/`else` to show/hide fields based on other field values.

The `allOf` property must be declared either at the root `properties` level or inside any `object` field where `properties` is declared.

The `required` inside `then` is needed to prevent conditional fields from rendering when the dependent field has no value.

```yaml
properties:
  storageType:
    title: Storage Type
    type: string
    enum:
      - s3
      - gcs
      - azure-blob

allOf:
  - if:
      properties:
        storageType:
          const: s3
    then:
      properties:
        bucketName:
          title: S3 Bucket Name
          type: string
        region:
          title: AWS Region
          type: string
      required:
        - bucketName
  - if:
      properties:
        storageType:
          const: gcs
    then:
      properties:
        gcsBucket:
          title: GCS Bucket
          type: string
        project:
          title: GCP Project
          type: string
      required:
        - gcsBucket
```

#### Conditional on Boolean

```yaml
scheduling:
  type: object
  properties:
    enableScheduling:
      type: boolean
      title: Enable scheduling
      default: false
  allOf:
    - if:
        properties:
          enableScheduling:
            const: true
      then:
        properties:
          cronExpression:
            title: Cron expression
            type: string
          startDate:
            title: Start Date
            type: string
            format: date-time
          endDate:
            title: End Date
            type: string
            format: date-time
        required:
          - cronExpression
          - startDate
          - endDate
```

#### Conditional on Array Content (contains)

Use `contains` to check if an array includes a specific value:

```yaml
businessDomains:
  type: object
  properties:
    domains:
      title: Business Domains
      type: array
      uniqueItems: true
      default: []
      items:
        type: string
        enum:
          - Finance
          - Marketing
          - IT
          - Other
  allOf:
    - if:
        properties:
          domains:
            contains:
              const: Other
      then:
        properties:
          otherDomain:
            title: Other Business Domain
            type: string
        required:
          - otherDomain
```

#### Nested Conditionals Inside Table Rows

Conditionals can be nested inside array items (table rows). This is common for schema definitions where different data types require different sub-fields:

```yaml
schemaColumns:
  title: Column Definitions
  type: array
  ui:ArrayFieldTemplate: ArrayTableTemplate
  items:
    type: object
    ui:ObjectFieldTemplate: TableRowTemplate
    required:
      - name
      - dataType
    properties:
      name:
        type: string
        title: Name
      dataType:
        type: string
        title: Data Type
        enum:
          - INT
          - STRING
          - VARCHAR
          - DECIMAL
          - ARRAY
    allOf:
      - if:
          properties:
            dataType:
              oneOf:
                - const: VARCHAR
                - const: STRING
        then:
          properties:
            dataLength:
              title: Column Length
              type: integer
              default: 65535
          required:
            - dataLength
      - if:
          properties:
            dataType:
              const: DECIMAL
        then:
          properties:
            precision:
              title: Precision
              type: integer
              minimum: 1
              maximum: 38
              default: 38
            scale:
              title: Scale
              type: integer
              minimum: 0
              maximum: 37
              default: 0
          required:
            - precision
            - scale
      - if:
          properties:
            dataType:
              const: ARRAY
        then:
          required:
            - arrayDataType
          properties:
            arrayDataType:
              title: Array Data Type
              type: string
              enum:
                - INT
                - STRING
                - BOOLEAN
      - if: true
        then:
          properties:
            businessTerms:
              title: Business Terms
              type: array
              uniqueItems: true
              items:
                type: string
                enum:
                  - Raw
                  - Derived
                  - Metadata
```

Note `if: true` is used to always show a field alongside conditionals.

### dependencies (Property Dependencies)

Make a field required when another field is filled:

```yaml
properties:
  useProxy:
    title: Use Proxy
    type: boolean
  proxyUrl:
    title: Proxy URL
    type: string

dependencies:
  useProxy:
    - proxyUrl      # proxyUrl becomes required when useProxy is present
```

### dependencies (Schema Dependencies — Dynamic Fields)

Show different fields based on the value of another field using `oneOf`:

```yaml
properties:
  authType:
    title: Authentication Type
    type: string
    enum:
      - basic
      - oauth
      - none
    default: none

dependencies:
  authType:
    oneOf:
      - properties:
          authType:
            enum: [none]
      - properties:
          authType:
            enum: [basic]
          username:
            title: Username
            type: string
          password:
            title: Password
            type: string
        required:
          - username
          - password
      - properties:
          authType:
            enum: [oauth]
          clientId:
            title: Client ID
            type: string
          clientSecret:
            title: Client Secret
            type: string
        required:
          - clientId
```

## Layouts

### Horizontal Layout

Group fields horizontally instead of vertically:

```yaml
connectionDetails:
  type: object
  ui:ObjectFieldTemplate: HorizontalTemplate
  ui:options:
    elementsPerRow: 3
    minElementWidth: 150
    displayTitle: false
  properties:
    host:
      title: Host
      type: string
    port:
      title: Port
      type: integer
    database:
      title: Database
      type: string
```

## UI Directives Reference

| Directive | Purpose | Example |
|-----------|---------|---------|
| `ui:widget` | Override the default widget | `ui:widget: textarea` |
| `ui:field` | Use a custom Witboost picker | `ui:field: EntityPicker` |
| `ui:options` | Pass options to the widget/picker | `ui:options: { allowArbitraryValues: false }` |
| `ui:disabled` | Disable the field (read-only) | `ui:disabled: true` |
| `ui:widget: hidden` | Hide the field from the form | `ui:widget: hidden` |
| `ui:ObjectFieldTemplate` | Custom object layout | `ui:ObjectFieldTemplate: HorizontalTemplate` |
| `ui:ArrayFieldTemplate` | Custom array layout | `ui:ArrayFieldTemplate: ArrayTableTemplate` |
| `ui:order` | Specify field rendering order | `ui:order: [name, description, '*']` |
| `ui:style` | Custom CSS styles | `ui:style: { minWidth: "200px" }` |

## Dividing Templates into Files (YAML Substitution)

For large or reusable template sections, split the definition into separate files:

```yaml
# template.yaml
spec:
  parameters:
    - title: Data Contract Schema
      required:
        - schemaDefinition
      properties:
        $yaml: ./data_contract_schema.yaml
```

Supported substitution directives:
- `$yaml: ./file.yaml` — embed YAML content
- `$json: ./file.json` — embed JSON content
- `$text: ./file.txt` — embed raw text

Paths can be relative (from the template directory) or absolute URLs. The substitution is resolved when the template is registered in Witboost — the source files remain separate in the repository.

This is useful for:
- Reusing snippets (e.g., table schema definitions) across multiple templates
- Keeping large template files manageable
- Separating concerns (metadata vs. domain-specific fields)
