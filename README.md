<h1 align="center">
  HubL Language Server
  <br />
  <code>hubl-ls</code>
  <br />
  <img src="https://img.shields.io/badge/license-MIT-blue.svg">
</h1>

<p align="center">
  <b>Language Server Protocol (LSP) implementation for HubSpot CMS HubL templates.</b>
</p>

This project is evolving from a Jinja-focused language server into a HubL-first one.

## What this extension is

`hubl-ls` provides IDE features (diagnostics, completion, hover, go-to-definition, etc.) for HubL inside HubSpot CMS themes/modules.

It is designed to run in <b>companion mode</b>:

- If you already have a HubSpot HubL VS Code extension that contributes HubL language IDs (e.g. `html-hubl`), `hubl-ls` attaches to those documents and provides LSP features.
- If you don't, it can still attach by file pattern (e.g. `**/*.html`, `**/*.css`, `**/*.js`) so HubL editing still works.

## Features

- Diagnostics (lexer + parser)
- Semantic highlighting
- Hover for HubL tags, globals, macros, and variables
- Go to definition for macros, blocks, and variables
- Signature help for macros and selected globals
- Import/include/extends resolution + symbol collection across files
- Completion for:
  - HubL tags
  - globals, tests, filters
  - member expressions (`content.id`, etc.)
  - macro parameter properties via JSDoc-like docs (`@property`)

## Demo

Errors are shown using the [Error Lens](https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens) extension.

![autocomplete globals demo](./images/demo-autocomplete-globals.png)
![autocomplete diagnostics demo](./images/demo-diagnostics.png)
![macro signature demo](./images/demo-macro-signature.png)

## Usage

### Configuration

Settings are currently still under the historical `jinjaLS.*` namespace.

- Add additional import search roots via `jinjaLS.importPaths`.
- Add extra file extensions for import path completion via `jinjaLS.extraFileExtensions`.
- Define environment-specific globals/tests/filters via `jinjaLS.extraGlobals` / `jinjaLS.extraTests` / `jinjaLS.extraFilters`.

### Documenting macros (recommended)

`hubl-ls` can use JSDoc-like comments to improve hover/signature/completion.

```hubl
{#
@param {object} data - Input dictionary
@property {string} data.section_id - Section id
@property {object} data.section_styles - Nested style object
@property {string} data.section_styles.background_color - Background color
#}
{% macro SectionWrapper(data) %}
  {{ data.section_id }}
  {{ data. }}
{% endmacro %}
```

### LS commands (inline)

You can drive some behavior via special comments:

```hubl
{#- jinja-ls: globals ./globals.json -#}
```

This loads globals from a JSON file (relative to the current document) for analysis.

### Programmatic globals (from other extensions)

Other extensions can push extra globals into the server using [`jinjaLS.setGlobals`](package.json:58).

```ts
vscode.commands.executeCommand("jinjaLS.setGlobals", {
  content: { id: 123 },
})
```

## Credits / provenance

This repository is derived from the upstream Jinja language server by Noam Zaks.

- Original upstream: https://github.com/noamzaks/jinja-ls
- The HubL-oriented changes in this fork focus on HubSpot template syntax and companion-mode integration.

## Acknowledgements

- The language package was originally based on `@huggingface/jinja` (MIT).
- The client structure was originally based on `jinjahtml-vscode` (MIT).
- The overall layout and some samples were inspired by Microsoft's `lsp-sample` (MIT).
