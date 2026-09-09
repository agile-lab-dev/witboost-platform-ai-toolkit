# Example Component Template

In this example, we provide a base component template for creating new Components within the Witboost platform.

Looking at terminology within the Witboost platform, Witboost works with **Projects** and **Components**.
  - **Projects** are high-level organizational units that group related components together. A Witboost project typically represents a Data Product (system)
  - **Components** are individual pieces of functionality or services within a project. Common component types include Output Ports, Workloads, and Storage Areas

This example component template is generic and not tied to a specific component type or technology. It shows the standard structure and fields that every component template must include. When creating a real component template, you will:
  - Set `spec.generates` and `spec.type` to match the specific component type (e.g. `outputport`, `workload`, `storage`)
  - Fill `spec.mesh.specific` in the skeleton's `catalog-info.yaml` with the fields your tech adapter expects
  - Add technology-specific wizard steps in the creation and edit templates
