# Example Blueprint Documentation

This document provides an overview and detailed explanation of the Example Blueprint used within Witboost.
It covers the purpose, structure, and usage of a Blueprint to help users understand how to encode a
complete use case as a reusable collection of templates.

## Purpose

The purpose of the Example Blueprint is to speed up and standardise the creation of a well-known use case.
Rather than creating a Data Product from a project template and then remembering, one by one, which
components must be added to it, the Blueprint declares the full set upfront: the main Data Product
template plus the component templates that belong to the use case, together with the order in which they
should be built. This guarantees that every Data Product created for that use case looks the same, and it
allows existing Data Products to be checked against the Blueprint to spot missing components.

## Structure

A Blueprint is described entirely by a `catalog-info.yaml` at the root of its repository:

- `metadata` carries the identity of the Blueprint: `name` (lowercase, dash-separated), `title`,
  a use-case oriented `description`, `tags`, the card `icon` and the TechDocs annotation.
- `spec.mainTemplateId` references the project (system) template that creates the Data Product.
- `spec.templates` lists the component templates offered by the Blueprint. Each entry has an `id` and a
  `dependencies` array pointing at other entries of the same list.
- `spec.parentRefField` optionally renames the picker field that is auto-populated with the parent system;
  it defaults to `dataproduct`.

No parameters, steps or skeleton exist in a Blueprint: all the user-facing form fields come from the
referenced templates.

## The dependency graph

`dependencies` expresses the build order of the use case. A component template is greyed out in the wizard
until every template it depends on has been instantiated. In this example the BigQuery output port depends
on the dbt workload, because the port exposes the tables that dbt produces, while the Composer and dbt
workloads have no dependencies and can be added immediately after the Data Product exists.

Keep the graph acyclic and reference only ids that appear in the same `spec.templates` list. The main
template is always implicitly required before anything else, so it must never appear as a dependency.

## Key Differences from Project and Component Templates

- Blueprints use `apiVersion: agilelab.it/v1alpha1` and `kind: Blueprint`, not `scaffolder.backstage.io/v1beta3`
- Blueprints have no `parameters`, no `steps` and no `skeleton` folder
- Blueprints do not create repositories or files; they orchestrate other templates
- `spec.mainTemplateId` must reference a system template; `spec.templates` must reference only component templates
- Template references use the `template:default/{name}` form, not the `urn:dmb:utm:{name}:{version}` form
- The Blueprint is registered from `Administration > Templates > Register Template`, pointing at the
  `catalog-info.yaml` on a specific branch whose name contains no slashes
