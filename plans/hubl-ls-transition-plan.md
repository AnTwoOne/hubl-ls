# HubL Language Server Transition Plan

This document outlines the complete plan for transitioning from the forked Jinja language server to a HubL-first implementation.

## Overview

The project is being renamed and rebranded from a Jinja-focused language server to a HubL-first one. This involves:

1. Renaming internal packages and namespaces
2. Updating all user-facing identifiers
3. Cleaning up legacy Jinja references
4. Expanding HubL built-in support

## Breaking Changes

> **Warning**: This transition introduces breaking changes. Users will need to update their VS Code settings from `jinjaLS.*` to `hublLS.*`.

---

## Phase 1: Package and Namespace Renaming

### 1.1 Internal Package Rename

**File: `packages/language/package.json`**

- Change `"name": "@jinja-ls/language"` → `"name": "@hubl-ls/language"`

**Files importing the package:**

- `packages/server/src/server.ts` - Line 1
- `packages/server/src/semantic.ts` - Line 1
- `packages/server/src/customRequests.ts` - imports
- `packages/server/src/completion.ts` - Line 1
- `packages/server/src/types.ts` - Line 1
- `packages/server/src/diagnostics.ts` - Line 1
- `packages/server/src/symbols.ts` - Line 1
- `packages/server/src/signatureHelp.ts` - Line 1
- `packages/server/src/utilities.ts` - Line 1
- `packages/server/src/definition.ts` - Line 1
- `packages/server/src/hover.ts` - Line 1
- `packages/server/src/state.ts` - Line 1

### 1.2 Configuration Namespace Rename

**File: `package.json`** - Configuration properties

```
jinjaLS.extraFileExtensions → hublLS.extraFileExtensions
jinjaLS.importPaths → hublLS.importPaths
jinjaLS.importURIs → hublLS.importURIs
jinjaLS.extraGlobals → hublLS.extraGlobals
jinjaLS.extraTests → hublLS.extraTests
jinjaLS.extraFilters → hublLS.extraFilters
```

**File: `packages/server/src/server.ts`** - Line 229

```typescript
.getConfiguration({ section: "jinjaLS" })
→
.getConfiguration({ section: "hublLS" })
```

### 1.3 VS Code Command IDs

**File: `package.json`** - Commands section

```
jinjaLS.restart → hublLS.restart
jinjaLS.setGlobalsFromFile → hublLS.setGlobalsFromFile
```

**File: `packages/client/src/extension.ts`** - Command registrations

- Line 262: `jinjaLS.restart` → `hublLS.restart`
- Line 263: `jinjaLS.setGlobalsFromFile` → `hublLS.setGlobalsFromFile`
- Line 328: `jinjaLS.setGlobals` → `hublLS.setGlobals`

**File: `package.json`** - Activation events

```
onCommand:jinjaLS.restart → onCommand:hublLS.restart
onCommand:jinjaLS.setGlobalsFromFile → onCommand:hublLS.setGlobalsFromFile
onCommand:jinjaLS.setGlobals → onCommand:hublLS.setGlobals
```

### 1.4 LSP Request Types

**File: `packages/client/src/extension.ts`**

- Line 66: `"jinja/setGlobals"` → `"hubl/setGlobals"`
- Line 211: `"jinja/readFile"` → `"hubl/readFile"`
- Line 223: `"jinja/listDirectories"` → `"hubl/listDirectories"`

**File: `packages/server/src/customRequests.ts`**

- Line 10: `"jinja/readFile"` → `"hubl/readFile"`
- Line 16: `"jinja/listDirectories"` → `"hubl/listDirectories"`
- Line 57: `"jinja/setGlobals"` → `"hubl/setGlobals"`

### 1.5 LS Commands (inline comments)

**File: `packages/server/src/symbols.ts`** - Line 454-456

```typescript
statement.value.trim().startsWith("jinja-ls:")
→
statement.value.trim().startsWith("hubl-ls:")
```

Also update the slice length accordingly.

---

## Phase 2: User-Facing Strings and Messages

### 2.1 Error Messages

**File: `packages/server/src/diagnostics.ts`** - Line 51

```typescript
"Couldn't find '${i.source.value}', maybe add to Jinja LS import paths?"
→
"Couldn't find '${i.source.value}', maybe add to HubL LS import paths?"
```

**File: `packages/client/test/diagnostics.test.ts`** - Lines 78, 83
Update test expectations to match new error message.

### 2.2 Hover Language Identifiers

**File: `packages/server/src/hover.ts`** - Lines 114, 158

```typescript
{ language: "jinja", value: ... }
→
{ language: "hubl", value: ... }
```

---

## Phase 3: Code Comments and Documentation

### 3.1 Comments to Update

**File: `packages/language/src/index.ts`** - Lines 1-5
Update the file header comment from Jinja to HubL.

**File: `packages/language/src/lexer.ts`**

- Line 5: `// The text between Jinja statements or expressions`
- Line 252: `// First, consume all text that is outside of a Jinja statement or expression`
- Line 269: `// Keep going until we hit the next Jinja statement or expression`
- Line 358: `// Consume and ignore all whitespace inside Jinja statements or expressions`

**File: `packages/language/src/parser.ts`**

- Line 132-134: Function names `parseJinjaStatement`, `parseJinjaExpression`
- Line 288: Comment about Jinja strict behavior
- Line 434: Comment about Jinja control structures
- Line 446: Comment about core Jinja syntax

**File: `packages/language/src/runtime.ts`**

- Line 525: Jinja docs link
- Line 570-572: Jinja docs reference
- Line 784: Jinja docs link
- Line 1094: Jinja docs link
- Line 1169: Jinja docs link
- Line 1234: Comment about Jinja templates
- Line 1571: Jinja docs link

**File: `packages/language/src/format.ts`** - Line 374
Comment about Jinja conditional expression.

**File: `packages/language/src/ast.ts`**

- Line 132: Comment about Jinja statement list
- Line 218: Jinja docs link
- Line 593: Jinja GitHub link

**File: `packages/language/test/hubl.test.ts`** - Line 40
Test description mentioning Jinja.

**File: `packages/language/test/interpreter.test.ts`** - Line 8
Jinja docs link.

**File: `packages/server/src/hublBuiltins.ts`** - Line 195
Comment about Jinja filters.

**File: `packages/server/src/definition.ts`** - Line 32
Comment mentioning `.jinja` extension.

### 3.2 README Updates

**File: `README.md`**

- Line 50: Update `jinjaLS.*` namespace references to `hublLS.*`
- Line 79: Update `jinja-ls: globals` to `hubl-ls: globals`
- Line 85-91: Update `jinjaLS.setGlobals` to `hublLS.setGlobals`
- Lines 93-103: Update credits/provenance section

---

## Phase 4: Environment Variables and Logging

### 4.1 Server Log File

**File: `packages/server/src/server.ts`** - Line 30

```typescript
const SERVER_LOG_FILE = process.env.JINJA_LS_LOG_FILE
→
const SERVER_LOG_FILE = process.env.HUBL_LS_LOG_FILE
```

**File: `packages/client/src/extension.ts`** - Lines 77, 80, 137, 149
Update `JINJA_LS_LOG_FILE` → `HUBL_LS_LOG_FILE`

---

## Phase 5: File Extension Handling

### 5.1 Import Path Completions

**File: `packages/server/src/completion.ts`** - Lines 41-43
Consider whether to keep `.jinja`, `.jinja2`, `.j2` extensions or replace with HubL-specific ones like `.hubl`.

```typescript
item.endsWith(".j2") ||
item.endsWith(".jinja") ||
item.endsWith(".jinja2") ||
```

**Recommendation**: Keep these for backward compatibility but add `.hubl` if it becomes a convention.

---

## Phase 6: Testing

### 6.1 Update Test Fixtures

**Files in `packages/client/fixture/`**

- Rename any `.jinja` files to `.html` if they exist
- Update test expectations for new error messages

### 6.2 Run All Tests

```bash
npm run test-language   # Unit tests for language package
npm run test-e2e        # End-to-end VS Code tests
```

---

## Phase 7: Documentation and Changelog

### 7.1 CHANGELOG.md

Add a new version entry documenting:

- Breaking change: Configuration namespace renamed from `jinjaLS.*` to `hublLS.*`
- Breaking change: Commands renamed from `jinjaLS.*` to `hublLS.*`
- Breaking change: LS commands renamed from `jinja-ls:` to `hubl-ls:`
- Internal: Package renamed from `@jinja-ls/language` to `@hubl-ls/language`

### 7.2 README.md

- Update all configuration examples
- Update command examples
- Update LS command examples
- Clarify HubL-first focus

---

## Phase 8: Future Work - HubL Built-ins Expansion

After the namespace cleanup is complete, expand HubL built-ins using these HubSpot documentation sources:

### Functions

https://developers.hubspot.com/docs/cms/reference/hubl/functions

### Filters

https://developers.hubspot.com/docs/cms/reference/hubl/filters

### Standard Tags

https://developers.hubspot.com/docs/cms/reference/hubl/tags/standard-tags

### DnD Area Tags

https://developers.hubspot.com/docs/cms/reference/hubl/tags/dnd-areas

### Related Blog Posts Tags

https://developers.hubspot.com/docs/cms/reference/hubl/tags/related-blog-posts

---

## Implementation Order

1. **Package rename** - `@jinja-ls/language` → `@hubl-ls/language`
2. **Configuration namespace** - `jinjaLS.*` → `hublLS.*`
3. **Command IDs** - `jinjaLS.*` → `hublLS.*`
4. **LSP request types** - `jinja/*` → `hubl/*`
5. **LS commands** - `jinja-ls:` → `hubl-ls:`
6. **Environment variables** - `JINJA_LS_LOG_FILE` → `HUBL_LS_LOG_FILE`
7. **Error messages** - Update user-facing strings
8. **Code comments** - Clean up Jinja references
9. **Documentation** - README, CHANGELOG
10. **Tests** - Verify everything works
11. **HubL built-ins** - Expand from HubSpot docs

---

## Files Changed Summary

| Category       | Files                                                                                                                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package config | `package.json`, `packages/language/package.json`                                                                                                                                                                      |
| Client         | `packages/client/src/extension.ts`                                                                                                                                                                                    |
| Server         | `packages/server/src/server.ts`, `packages/server/src/customRequests.ts`, `packages/server/src/diagnostics.ts`, `packages/server/src/hover.ts`, `packages/server/src/symbols.ts`, `packages/server/src/completion.ts` |
| Language       | `packages/language/src/index.ts`, `packages/language/src/lexer.ts`, `packages/language/src/parser.ts`, `packages/language/src/runtime.ts`, `packages/language/src/format.ts`, `packages/language/src/ast.ts`          |
| Tests          | `packages/client/test/diagnostics.test.ts`, `packages/language/test/hubl.test.ts`, `packages/language/test/interpreter.test.ts`                                                                                       |
| Docs           | `README.md`, `CHANGELOG.md`                                                                                                                                                                                           |
