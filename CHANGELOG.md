# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Find All References support - Navigate to all usages of a symbol (variable, macro, block) across all files in the workspace
- HubL-specific expression tests: `string_containing`, `string_startingwith`, `truthy`, `containing`, `containingall`, `within`
- HubL standard includes functions: `standard_header_includes`, `standard_footer_includes`
- HubL date/time filters: `format_currency_value`, `minus_time`, `plus_time`, `strtodate`
- HubL numeric filters: `add`, `multiply`

### Fixed

- Parser now correctly handles HubL-specific expression tests like `is string_containing("text")`

## [0.1.0] - 2026-01-17

### Breaking Changes

- Configuration namespace renamed from `jinjaLS.*` to `hublLS.*`
  - `jinjaLS.extraFileExtensions` → `hublLS.extraFileExtensions`
  - `jinjaLS.importPaths` → `hublLS.importPaths`
  - `jinjaLS.importURIs` → `hublLS.importURIs`
  - `jinjaLS.extraGlobals` → `hublLS.extraGlobals`
  - `jinjaLS.extraTests` → `hublLS.extraTests`
  - `jinjaLS.extraFilters` → `hublLS.extraFilters`
- VS Code commands renamed from `jinjaLS.*` to `hublLS.*`
  - `jinjaLS.restart` → `hublLS.restart`
  - `jinjaLS.setGlobalsFromFile` → `hublLS.setGlobalsFromFile`
  - `jinjaLS.setGlobals` → `hublLS.setGlobals`
- Inline LS commands renamed from `jinja-ls:` to `hubl-ls:`
  - Example: `{#- jinja-ls: globals ./file.json -#}` → `{#- hubl-ls: globals ./file.json -#}`

### Changed

- Internal package renamed from `@jinja-ls/language` to `@hubl-ls/language`
- LSP request types renamed from `jinja/*` to `hubl/*`
- Environment variable renamed from `JINJA_LS_LOG_FILE` to `HUBL_LS_LOG_FILE`
- Error messages now reference "HubL LS" instead of "Jinja LS"
- Code comments updated to reference "HubL" instead of "Jinja" throughout the codebase
- Parser function names changed from `parseJinjaStatement/Expression` to `parseHublStatement/Expression`
- Exported `format` function from language package for programmatic use

### Added

- Document formatting support (Format Document and Format Selection commands)
- Added `.hubl` file extension support for path completions
- Created comprehensive documentation for missing HubL built-ins (HUBL_BUILTINS_TODO.md)

## [0.0.12] - 2025-11-02

### Added

- The extension can now be installed on older VSCode versions.
- Import for from import expression now works.
- Extra globals can now be specified in the configuration.

## [0.0.11] - 2025-10-28

### Added

- The setGlobalsFromFile command which can add global from file (allowing JSON/YAML/TOML).
- Autocompletion now suggests symbols in "from ... import " statements.
- Import paths is now also supported in the configuration, simplifying usage on Windows.

### Fixed

- Autocompletion now ignores additional places where it is irrelevant.

## [0.0.10] - 2025-10-22

### Changed

- The `jinja-ls.setGlobals` command has been renamed to `jinjaLS.setGlobals`.

### Fixed

- Definition analysis has been fixed for identifiers in set/with statements.
- The LaTeX language configuration is now included.

## [0.0.9] - 2025-10-21

### Added

- Path-based completion for imports is now available!

### Changed

- Imports are now shown as document links rather than go-to-definition.

### Fixed

- A bug that would cause an infinite loop in `x = x` expressions.
- A bug that would crash the language server with invalid import statements.

## [0.0.8] - 2025-10-19

### Added

- Typing for the cycler builtin is now available.
- Typing for the ternary expression, the select expression and the slice expression is now available.
- Symbols from call statements and block set statements are now available.

## [0.0.7] - 2025-10-18

### Added

- Code action to add missing nodes.
- You can now add custom tests and filters in the configuration.
- Lists, dicts and tuples now have richer type information.
- You can add documentation to macros and variables.

### Changed

- The extension now contains modified code instead of depending on jinjahtml-vscode.
- Imports are now searched in the workspace root(s) as well.
- The importPaths configuration has been renamed to importURIs.

### Fixed

- Built-in types (mostly from Python) are now more accurate.
- Symbol resolution is now correctly according to the definition order.
- Signature help is now shown only inside the function call itself.

## [0.0.6] - 2025-10-06

### Added

- You can now add globals from JSON/TOML/YAML files using LS commands, e.g. `{#- jinja-ls: globals ./example.json -#}`

## [0.0.5] - 2025-10-06

### Added

- Types are now resolved for unary, binary, test and filter expressions.
- Completion now supports block names as well.
- Tests and filters now support signature info, arguments are more accurate.

## [0.0.4] - 2025-10-05

### Added

- Additional import paths can now be added in the extension's configuration.

## [0.0.3] - 2025-10-05

### Added

- Globals can now be set with the `jinja-ls.addGlobals` command.
- Type inference for iteration of arrays and tuples is now supported.

### Changed

- The extension now depends on jinjahtml-vscode for language definitions.

### Fixed

- Show hover information for tuple items.

## [0.0.2] - 2025-10-04

### Added

- Tests using call expressions like `ge(3)` are now parsed and show hover information.

### Fixed

- Completion for filters and tests now works when the filter/test identifier name is missing.
- The scoping of macro arguments is now fixed to prevent them from auto-completing themselves.

## [0.0.1] - 2025-10-02

### Added

- Error tolerant lexer & parser.
- Hover for variables and macros.
- Go to definition for blocks, macros and variables.
- Signature help for macros and globals.
- Relative import resolving.
- Type tracking for variables.
- Autocomplete for built-in tests, built-in filters and variables
