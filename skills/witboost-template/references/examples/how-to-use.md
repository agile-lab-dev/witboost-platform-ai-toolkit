# How to use these examples

These examples demonstrate how to create and edit components using Witboost templates. Follow the instructions in each example to understand how to define component metadata, link to data products, and configure repositories.

## Example Templates

The gold standard for Project templates can be found in the `knowledge/examples/example-project-template` folder.
Similarly, the gold standard for Component templates can be found in the `knowledge/examples/example-component-template` folder.

Those templates include:

- `template.yaml` - the creation template definition, which declares all the fields needed to be presented to the user when creating a new project or component.
- `edit-template.yaml` - the edit template definition, which specifies how existing projects or components can be modified after creation.
- `README.md` - a markdown file providing an overview and instructions for the example templates. When you are creating a new template, the README should be updated to reflect the purpose and usage of your template.
- `skeleton` - a folder containing the initial file structure and placeholder files for the component or project being created. When the user creates a project or component using a template, his/her data will be populated into this folder structure using Nunjucks syntax.

And more.

Always refer to these examples when creating new templates to ensure consistency and adherence to best practices.

## Snippets

Use the snippets files, located in the `knowledge/examples/snippets` folder, to quickly insert commonly used template structures and configurations into your own templates.