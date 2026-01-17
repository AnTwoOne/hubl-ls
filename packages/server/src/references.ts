import { ast } from "@hubl-ls/language"
import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import {
  documentASTs,
  documentImports,
  documents,
  documentSymbols,
} from "./state"
import { findSymbol, isInScope, SymbolInfo } from "./symbols"
import { parentOfType, tokenAt, walk } from "./utilities"

/**
 * Information about a symbol at a specific position
 */
interface SymbolAtPosition {
  name: string
  type: "Macro" | "Block" | "Variable"
  node: ast.Node
  definitionSymbol?: SymbolInfo
  definitionDocument?: TextDocument
}

/**
 * Identifies the symbol at the given position in the document.
 * Returns symbol information needed for finding references.
 */
function getSymbolAtPosition(
  document: TextDocument,
  position: lsp.Position,
): SymbolAtPosition | null {
  const tokens = documentASTs.get(document.uri)?.tokens
  if (!tokens) {
    return null
  }

  const offset = document.offsetAt(position)
  const token = tokenAt(tokens, offset)
  if (!token) {
    return null
  }

  const imports = documentImports.get(document.uri)

  // Check for namespaced macro call (e.g., lib.macro())
  const callExpression = parentOfType(token, "CallExpression") as
    | ast.CallExpression
    | undefined

  if (
    callExpression?.callee instanceof ast.MemberExpression &&
    callExpression.callee.object instanceof ast.Identifier &&
    callExpression.callee.property instanceof ast.Identifier &&
    imports
  ) {
    const namespaceName = callExpression.callee.object.value
    const macroName = callExpression.callee.property.value

    // Find the import statement
    const importEntry = imports.find(
      ([i]) => i instanceof ast.Import && i.name.value === namespaceName,
    )
    const importedUri = importEntry?.[1]
    if (importedUri) {
      const importedDocument = documents.get(importedUri)
      const importedSymbols = documentSymbols.get(importedUri)
      const importedProgram = documentASTs.get(importedUri)?.program

      if (importedDocument && importedSymbols && importedProgram) {
        const [symbol] = findSymbol(
          importedDocument,
          importedProgram,
          macroName,
          "Macro",
        )

        if (symbol) {
          return {
            name: macroName,
            type: "Macro",
            node: callExpression,
            definitionSymbol: symbol,
            definitionDocument: importedDocument,
          }
        }
      }
    }
  }

  // Check for regular macro call
  if (
    callExpression?.callee instanceof ast.Identifier &&
    token.parent === callExpression.callee
  ) {
    const name = callExpression.callee.value
    const [symbol, symbolDocument] = findSymbol(
      document,
      callExpression,
      name,
      "Macro",
    )

    return {
      name,
      type: "Macro",
      node: callExpression,
      definitionSymbol: symbol,
      definitionDocument: symbolDocument,
    }
  }

  // Check for block statement
  const blockStatement = parentOfType(token, "Block") as ast.Block | undefined

  if (blockStatement?.name === token.parent) {
    const [symbol, symbolDocument] = findSymbol(
      document,
      blockStatement,
      blockStatement.name.value,
      "Block",
      { checkCurrent: true, importTypes: ["Extends"] },
    )

    return {
      name: blockStatement.name.value,
      type: "Block",
      node: blockStatement,
      definitionSymbol: symbol,
      definitionDocument: symbolDocument,
    }
  }

  // Check for variable/identifier
  if (token.parent instanceof ast.Identifier) {
    const identifier = token.parent
    const [symbol, symbolDocument] = findSymbol(
      document,
      identifier,
      identifier.value,
      "Variable",
    )

    return {
      name: identifier.value,
      type: "Variable",
      node: identifier,
      definitionSymbol: symbol,
      definitionDocument: symbolDocument,
    }
  }

  return null
}

/**
 * Checks if a node is a reference to the given symbol.
 * Does NOT include definitions - only actual usages.
 */
function isReference(
  node: ast.Node,
  symbolName: string,
  symbolType: "Macro" | "Block" | "Variable",
  definitionNode: ast.Node | undefined,
): boolean {
  // Macro references
  if (symbolType === "Macro") {
    // Direct macro call: {{ macroName() }}
    if (
      node instanceof ast.CallExpression &&
      node.callee instanceof ast.Identifier &&
      node.callee.value === symbolName
    ) {
      // Don't include the definition itself
      if (definitionNode && node === definitionNode) {
        return false
      }
      return true
    }

    // Namespaced macro call: {{ lib.macroName() }}
    // We check this in the caller by looking at property.value
    if (
      node instanceof ast.MemberExpression &&
      node.property instanceof ast.Identifier &&
      node.property.value === symbolName
    ) {
      return true
    }
  }

  // Block references
  if (symbolType === "Block") {
    if (
      node instanceof ast.Block &&
      node.name.value === symbolName &&
      node !== definitionNode
    ) {
      return true
    }
  }

  // Variable references
  if (symbolType === "Variable") {
    if (node instanceof ast.Identifier && node.value === symbolName) {
      // Exclude definitions
      if (definitionNode && node === definitionNode) {
        return false
      }

      // Exclude macro definitions (macro name is both a macro and a variable)
      if (
        node.parent instanceof ast.Macro &&
        node.parent.name === node &&
        node.parent === definitionNode
      ) {
        return false
      }

      // Exclude set statement assignees
      if (
        node.parent instanceof ast.SetStatement &&
        node.parent.assignee === node
      ) {
        return false
      }

      // Exclude for loop variables
      if (node.parent instanceof ast.For && node.parent.loopvar === node) {
        return false
      }

      return true
    }
  }

  return false
}

/**
 * Finds all references to a symbol within a single document.
 */
function findReferencesInDocument(
  document: TextDocument,
  symbolName: string,
  symbolType: "Macro" | "Block" | "Variable",
  definitionNode: ast.Node | undefined,
  includeDeclaration: boolean,
): lsp.Location[] {
  const locations: lsp.Location[] = []
  const astData = documentASTs.get(document.uri)
  const program = astData?.program

  if (!program) {
    return locations
  }

  // If includeDeclaration is true and this is the document with the definition
  if (includeDeclaration && definitionNode) {
    const symbols = documentSymbols.get(document.uri)
    if (symbols) {
      const symbolList = symbols.get(symbolName)
      if (symbolList) {
        for (const symbol of symbolList) {
          if (symbol.type === symbolType && symbol.node === definitionNode) {
            // Add the definition location
            let defNode: ast.Node | undefined
            if (symbolType === "Macro" && symbol.node instanceof ast.Macro) {
              defNode = symbol.node.name
            } else if (
              symbolType === "Block" &&
              symbol.node instanceof ast.Block
            ) {
              defNode = symbol.node.name
            } else if (
              symbolType === "Variable" &&
              "identifierNode" in symbol &&
              symbol.identifierNode
            ) {
              defNode = symbol.identifierNode
            }

            if (defNode) {
              const start = defNode.getStart()
              const end = defNode.getEnd()
              if (start !== undefined && end !== undefined) {
                locations.push(
                  lsp.Location.create(
                    document.uri,
                    lsp.Range.create(
                      document.positionAt(start),
                      document.positionAt(end),
                    ),
                  ),
                )
              }
            }
            break
          }
        }
      }
    }
  }

  // Walk the AST to find all references
  walk(program, (node) => {
    if (isReference(node, symbolName, symbolType, definitionNode)) {
      // For variables, check scope
      if (symbolType === "Variable") {
        if (definitionNode && !isInScope(definitionNode, node, program)) {
          return
        }
      }

      // Get the node's position
      let targetNode: ast.Node = node

      // For call expressions, highlight the identifier part
      if (
        node instanceof ast.CallExpression &&
        node.callee instanceof ast.Identifier
      ) {
        targetNode = node.callee
      }

      // For member expressions, highlight the property
      if (
        node instanceof ast.MemberExpression &&
        node.property instanceof ast.Identifier
      ) {
        targetNode = node.property
      }

      const start = targetNode.getStart()
      const end = targetNode.getEnd()

      if (start !== undefined && end !== undefined) {
        locations.push(
          lsp.Location.create(
            document.uri,
            lsp.Range.create(
              document.positionAt(start),
              document.positionAt(end),
            ),
          ),
        )
      }
    }
  })

  return locations
}

/**
 * Main entry point for the Find All References feature.
 * Searches all documents in the workspace for references to the symbol at the given position.
 */
export function getReferences(
  uri: string,
  position: lsp.Position,
  includeDeclaration: boolean = false,
): lsp.Location[] | null {
  const document = documents.get(uri)
  if (!document) {
    return null
  }

  // Step 1: Identify the symbol at the cursor position
  const symbolInfo = getSymbolAtPosition(document, position)
  if (!symbolInfo) {
    return null
  }

  // Step 2: If we couldn't find the definition, we can't find references reliably
  if (!symbolInfo.definitionSymbol || !symbolInfo.definitionDocument) {
    return null
  }

  const allLocations: lsp.Location[] = []

  // Step 3: Search all documents for references
  for (const [docUri, doc] of documents) {
    const locations = findReferencesInDocument(
      doc,
      symbolInfo.name,
      symbolInfo.type,
      symbolInfo.definitionSymbol.node,
      includeDeclaration && docUri === symbolInfo.definitionDocument.uri,
    )
    allLocations.push(...locations)
  }

  return allLocations.length > 0 ? allLocations : null
}
