# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

HubL Language Server (`hubl-ls`) is a VS Code extension providing LSP features (diagnostics, completion, hover, go-to-definition, etc.) for HubSpot CMS HubL templates. It operates in "companion mode" alongside HubSpot's HubL extension.

## Development Commands

```bash
# Install dependencies
bun install

# Build (compiles TypeScript via Rollup)
bun run compile

# Watch mode for development
bun watch

# Run language package unit tests (vitest)
bun run test-language

# Run a single language test file
bunx vitest run packages/language/test/format.test.ts

# Run e2e tests (requires VS Code test environment)
bun run test-e2e

# Lint
bun run lint

# Format check
bun run prettier --check .

# Package extension
bun run package
```

## Development Workflow

Open in VS Code, run `bun watch`, then press F5 to launch the Extension Development Host with the extension running. Restart the debugged window after code changes.

## Architecture

This is a monorepo with three packages under `packages/`:

### `packages/language`

Core HubL/Jinja parsing engine (lexer, parser, AST, interpreter, formatter). No LSP dependencies.

Key files:

- `lexer.ts` - Tokenizer for HubL syntax
- `parser.ts` - Builds AST from tokens
- `ast.ts` - AST node definitions
- `runtime.ts` - Template interpreter and environment
- `format.ts` - Code formatter

### `packages/server`

LSP server implementation. Runs as a separate Node process communicating via IPC.

Key files:

- `server.ts` - Main entry point, registers LSP handlers
- `completion.ts` - Autocomplete logic
- `hover.ts` - Hover information
- `definition.ts` - Go-to-definition
- `symbols.ts` - Symbol collection from AST
- `hublBuiltins.ts` - HubL-specific builtins (tags, filters, globals)
- `constants.ts` - Jinja/HubL tag and filter definitions
- `semantic.ts` - Semantic token highlighting

### `packages/client`

VS Code extension client. Launches the server and manages the LSP connection.

- `extension.ts` - Extension activation, creates `LanguageClient`
- `test/` - E2E tests using `@vscode/test-electron`

## Build Output

Rollup bundles to `dist/`:

- `dist/server.js` - Language server
- `dist/extension.js` - VS Code extension entry point

## Testing

- **Unit tests**: `packages/language/test/*.test.ts` run via vitest
- **E2E tests**: `packages/client/test/*.test.ts` run in VS Code test harness with the HubSpot HubL extension installed

## Key Concepts

- **Companion mode**: The extension attaches to HubL language IDs provided by HubSpot's extension (e.g., `html-hubl`, `hubl-html`) rather than contributing its own grammars
- **Document analysis**: On document open/change, the server tokenizes, parses, collects symbols, resolves imports, and sends diagnostics
- **Import resolution**: `include`/`import`/`extends` statements are resolved relative to document or configured `importPaths`
