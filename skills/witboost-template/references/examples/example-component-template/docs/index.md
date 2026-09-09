# Example Component Template Documentation

This document provides an overview and detailed explanation of the Example Component Template used within Witboost. It covers the purpose, structure, and usage of the template to help users understand how to create new Components effectively.

## Purpose

The purpose of the Example Component Template is to streamline the creation of new Components within Witboost. It provides a standardized structure and predefined fields to ensure consistency and completeness when defining new components. By using this template, users can quickly set up new Components with all necessary metadata, ownership information, and dependency declarations, reducing manual effort and minimizing errors.

## Structure

The Example Component Template is structured to capture all essential information required for creating a new Component. It includes sections for specifying the component's name, domain, parent Data Product, unique identifier, description, owner (auto-selected), dependencies, and tags. Each field is designed to ensure that users provide complete and accurate information, facilitating the consistent creation and management of Components within Witboost.

## Key Differences from Project Templates

- Components use `ComponentIdentifierPicker` instead of `IdentifierPicker`
- Components have a `dataproduct` field that links them to their parent system
- The `owner` is auto-selected from the parent Data Product via `EntitySelectionPicker`
- Components support `dependsOn` to declare dependencies on sibling components
- Components are published into a subdirectory of the Data Product's monorepo
- The skeleton includes a `parameters.yaml` with `readonly` values (`__system__`, `__version__`)
- The skeleton's `catalog-info.yaml` uses `kind: Component` (not `System`) and includes `spec.mesh.specific` for tech-adapter-defined fields
