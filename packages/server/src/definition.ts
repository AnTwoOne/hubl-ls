import { ast } from "@jinja-ls/language"
import * as lsp from "vscode-languageserver"
import {
  documentASTs,
  documentImports,
  documents,
  documentSymbols,
} from "./state"
import { findSymbol, findSymbolInDocument } from "./symbols"
import { parentOfType, tokenAt } from "./utilities"

export const getDefinition = async (uri: string, position: lsp.Position) => {
  const document = documents.get(uri)
  const tokens = documentASTs.get(uri)?.tokens
  const imports = documentImports.get(uri)

  if (tokens === undefined || document === undefined) {
    return
  }

  const offset = document.offsetAt(position)
  const token = tokenAt(tokens, offset)
  if (!token) {
    return
  }

  const callExpression = parentOfType(token, "CallExpression") as
    | ast.CallExpression
    | undefined

  // Handle namespaced macro calls, e.g.
  // `{% import "lib.jinja" as lib %}` then `{{ lib.example() }}`.
  // In this case the call callee is a MemberExpression, not an Identifier.
  if (
    callExpression !== undefined &&
    callExpression.callee instanceof ast.MemberExpression &&
    callExpression.callee.object instanceof ast.Identifier &&
    callExpression.callee.property instanceof ast.Identifier &&
    imports !== undefined
  ) {
    const namespaceName = callExpression.callee.object.value
    const macroName = callExpression.callee.property.value

    // Find the matching `{% import ... as <namespaceName> %}`.
    const importEntry = imports.find(
      ([i]) => i instanceof ast.Import && i.name.value === namespaceName,
    )
    const importedUri = importEntry?.[1]
    if (importedUri) {
      const importedDocument = documents.get(importedUri)
      const importedSymbols = documentSymbols.get(importedUri)
      const importedProgram = documentASTs.get(importedUri)?.program

      if (importedDocument && importedSymbols && importedProgram) {
        const importedMacro = findSymbolInDocument(
          importedDocument,
          importedSymbols,
          macroName,
          "Macro",
          importedProgram,
        )

        if (importedMacro?.node?.name?.token) {
          return [
            lsp.Location.create(
              importedDocument.uri,
              lsp.Range.create(
                importedDocument.positionAt(
                  importedMacro.node.name.token.start,
                ),
                importedDocument.positionAt(importedMacro.node.name.token.end),
              ),
            ),
          ]
        }
      }
    }
  }

  if (
    callExpression !== undefined &&
    callExpression.callee instanceof ast.Identifier
  ) {
    const name = callExpression.callee.value
    const [symbol, symbolDocument] = findSymbol(
      document,
      callExpression,
      name,
      "Macro",
    )

    if (symbol !== undefined && symbolDocument !== undefined) {
      return lsp.Location.create(
        symbolDocument.uri,
        lsp.Range.create(
          symbolDocument.positionAt(symbol.node.name.token.start),
          symbolDocument.positionAt(symbol.node.name.token.end),
        ),
      )
    }
  }

  const blockStatement = parentOfType(token, "Block") as ast.Block | undefined

  if (
    blockStatement !== undefined &&
    blockStatement.name === token.parent &&
    imports !== undefined
  ) {
    const [sourceBlock, sourceBlockDocument] = findSymbol(
      document,
      blockStatement,
      blockStatement.name.value,
      "Block",
      { checkCurrent: false, importTypes: ["Extends"] },
    )

    if (sourceBlock !== undefined && sourceBlockDocument !== undefined) {
      return [
        lsp.Location.create(
          sourceBlockDocument.uri,
          lsp.Range.create(
            sourceBlockDocument.positionAt(sourceBlock.node.name.token.start),
            sourceBlockDocument.positionAt(sourceBlock.node.name.token.end),
          ),
        ),
      ]
    }
  }

  if (token.parent instanceof ast.Identifier) {
    const identifier = token.parent
    const [symbol, symbolDocument] = findSymbol(
      document,
      identifier,
      identifier.value,
      "Variable",
    )

    if (
      symbol !== undefined &&
      symbolDocument !== undefined &&
      symbol.identifierNode !== undefined
    ) {
      return [
        lsp.Location.create(
          symbolDocument.uri,
          lsp.Range.create(
            symbolDocument.positionAt(symbol.identifierNode.token.start),
            symbolDocument.positionAt(symbol.identifierNode.token.end),
          ),
        ),
      ]
    }
  }
}
