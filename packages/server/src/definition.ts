import { ast } from "@hubl-ls/language"
import * as lsp from "vscode-languageserver"
import { findFieldPosition } from "./moduleFields"
import {
  documentASTs,
  documentFieldsJsonContent,
  documentFieldsJsonMap,
  documentImports,
  documents,
  documentSymbols,
} from "./state"
import {
  findSymbol,
  findSymbolInDocument,
  findTypedefLocation,
  resolveTypeReference,
} from "./symbols"
import { getType, TypeInfo } from "./types"
import { parentOfType, tokenAt } from "./utilities"

/**
 * Check if position is inside a comment and extract the word at that position.
 */
const getWordInComment = (
  document: lsp.TextDocument,
  tokens: ast.TokenNode[],
  offset: number,
): { word: string; start: number; end: number } | undefined => {
  for (const token of tokens) {
    if (
      token.type === "Comment" &&
      token.start <= offset &&
      token.end >= offset
    ) {
      const text = document.getText()
      const commentText = text.slice(token.start, token.end)
      const relativeOffset = offset - token.start

      let start = relativeOffset
      let end = relativeOffset

      while (start > 0 && /[A-Za-z0-9_]/.test(commentText[start - 1])) {
        start--
      }
      while (
        end < commentText.length &&
        /[A-Za-z0-9_]/.test(commentText[end])
      ) {
        end++
      }

      if (start < end) {
        const word = commentText.slice(start, end)
        return {
          word,
          start: token.start + start,
          end: token.start + end,
        }
      }
    }
  }
  return undefined
}

export const getDefinition = async (uri: string, position: lsp.Position) => {
  const document = documents.get(uri)
  const tokens = documentASTs.get(uri)?.tokens
  const imports = documentImports.get(uri)

  if (tokens === undefined || document === undefined) {
    return
  }

  const offset = document.offsetAt(position)

  // Check if we're in a comment - handle typedef references
  const commentWord = getWordInComment(document, tokens, offset)
  if (commentWord) {
    const { word } = commentWord
    // Try to find typedef definition
    const typeInfo = resolveTypeReference(word, uri)
    if (typeInfo) {
      const location = findTypedefLocation(word, uri)
      if (location) {
        const targetDoc = documents.get(location.uri)
        const commentStart = location.comment.getStart()
        const commentEnd = location.comment.getEnd()
        if (
          targetDoc &&
          commentStart !== undefined &&
          commentEnd !== undefined
        ) {
          return [
            lsp.Location.create(
              location.uri,
              lsp.Range.create(
                targetDoc.positionAt(commentStart),
                targetDoc.positionAt(commentEnd),
              ),
            ),
          ]
        }
      }
    }
  }

  const token = tokenAt(tokens, offset)
  if (!token) {
    return
  }

  // Handle module field definitions using fieldPath from TypeInfo
  // This works for both direct module.field access AND loop variable properties
  // (e.g., `item.title` where `item` comes from `{% for item in module.items %}`)
  // This mirrors the hover implementation in hover.ts
  if (token.parent instanceof ast.Identifier) {
    const identifier = token.parent

    // Determine the expression to get the type for (same logic as hover.ts)
    const node =
      identifier.parent instanceof ast.MemberExpression &&
      identifier.parent.property === identifier
        ? identifier.parent
        : identifier

    const nodeType = getType(node, document)

    // Check for fieldPath in the type info
    const fieldPath = (nodeType as TypeInfo)?.fieldPath

    if (fieldPath && fieldPath.length > 0) {
      const fieldsJsonUri = documentFieldsJsonMap.get(uri)
      const fieldsContent = documentFieldsJsonContent.get(uri)

      if (fieldsJsonUri && fieldsContent) {
        const fieldPosition = findFieldPosition(fieldsContent, fieldPath)

        if (fieldPosition) {
          const startPos = offsetToPosition(fieldsContent, fieldPosition.start)
          const endPos = offsetToPosition(fieldsContent, fieldPosition.end)

          return [
            lsp.Location.create(
              fieldsJsonUri,
              lsp.Range.create(startPos, endPos),
            ),
          ]
        }
      }
    }
  }

  const callExpression = parentOfType(token, "CallExpression") as
    | ast.CallExpression
    | undefined

  // Handle namespaced macro calls, e.g.
  // `{% import "lib.html" as lib %}` then `{{ lib.example() }}`.
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

/**
 * Convert a byte offset to a line/character position in a string.
 */
const offsetToPosition = (content: string, offset: number): lsp.Position => {
  let line = 0
  let character = 0

  for (let i = 0; i < offset && i < content.length; i++) {
    if (content[i] === "\n") {
      line++
      character = 0
    } else {
      character++
    }
  }

  return { line, character }
}
