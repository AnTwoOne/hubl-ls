import { ast } from "@hubl-ls/language"
import * as lsp from "vscode-languageserver"
import { MarkupKind } from "vscode-languageserver"
import { HOVER_LITERAL_MAX_LENGTH } from "./constants"
import { HUBL_PROGRAM_SYMBOLS, HUBL_TAG_TYPES } from "./hublBuiltins"
import { documentASTs, documents } from "./state"
import { findSymbol, resolveTypeReference } from "./symbols"
import { getType, resolveType, stringifySignatureInfo } from "./types"
import { parentOfType, tokenAt } from "./utilities"

/**
 * Create a MarkupContent hover with proper markdown rendering.
 */
const createMarkdownHover = (
  signature: string,
  documentation?: string,
): lsp.Hover => {
  const parts: string[] = []
  parts.push("```python\n" + signature + "\n```")
  if (documentation) {
    parts.push(documentation)
  }
  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: parts.join("\n\n"),
    },
  }
}

/**
 * Check if position is inside a comment and extract the word at that position.
 */
const getWordInComment = (
  document: lsp.TextDocument,
  tokens: ast.TokenNode[],
  offset: number,
): { word: string; token: ast.TokenNode } | undefined => {
  // Find comment token containing this offset
  for (const token of tokens) {
    if (
      token.type === "Comment" &&
      token.start <= offset &&
      token.end >= offset
    ) {
      const text = document.getText()
      const commentText = text.slice(token.start, token.end)
      const relativeOffset = offset - token.start

      // Find word boundaries around the cursor
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
        return { word, token }
      }
    }
  }
  return undefined
}

export const getHover = async (uri: string, position: lsp.Position) => {
  const document = documents.get(uri)
  const tokens = documentASTs.get(uri)?.tokens

  if (tokens === undefined || document === undefined) {
    return
  }

  const offset = document.offsetAt(position)

  // Check if we're hovering over a type reference in a comment
  const commentWord = getWordInComment(document, tokens, offset)
  if (commentWord) {
    const { word } = commentWord
    // Try to resolve as a typedef
    const typeInfo = resolveTypeReference(word, uri)
    if (typeInfo) {
      const parts: string[] = []
      parts.push(`### ${word}`)
      if (typeInfo.documentation) {
        parts.push(typeInfo.documentation)
      }
      if (typeInfo.properties) {
        const propLines = Object.entries(typeInfo.properties)
          .filter(
            ([, v]) =>
              typeof v !== "object" ||
              !("signature" in v && v.signature !== undefined),
          )
          .map(([name, value]) => {
            let type = "Any"
            let desc = ""
            if (typeof value === "string") {
              type = value
            } else if (value && typeof value === "object") {
              if ("type" in value && typeof value.type === "string") {
                type = value.type
              } else if ("name" in value && typeof value.name === "string") {
                type = value.name
              }
              if (
                "documentation" in value &&
                typeof value.documentation === "string"
              ) {
                desc = ` \u2014 ${value.documentation}`
              }
            }
            return `- \`${name}\` \`${type}\`${desc}`
          })
        if (propLines.length > 0) {
          parts.push("**Properties**\n" + propLines.join("\n"))
        }
      }
      return {
        contents: {
          kind: MarkupKind.Markdown,
          value: parts.join("\n\n"),
        },
      } satisfies lsp.Hover
    }
  }

  const token = tokenAt(tokens, offset)
  if (!token) {
    return
  }

  const callExpression = parentOfType(token, "CallExpression") as
    | ast.CallExpression
    | undefined

  // HubL tag hover: prefer TagStatement, but be robust even if the AST node
  // isn't TagStatement (e.g. older ASTs / differing parsers).
  if (token.type === "Identifier") {
    const tag = HUBL_TAG_TYPES[token.value]

    const looksLikeTagName =
      (token.parent instanceof ast.TagStatement &&
        token.parent.identifier === token) ||
      token.getPreviousSibling()?.type === "OpenStatement"

    if (looksLikeTagName && tag?.signature) {
      return createMarkdownHover(
        `${token.value}${stringifySignatureInfo(tag.signature)}`,
        tag.signature.documentation,
      )
    }
  }

  // Function
  if (
    token.parent instanceof ast.Identifier &&
    callExpression !== undefined &&
    (callExpression.callee === token.parent ||
      (callExpression.callee instanceof ast.MemberExpression &&
        callExpression.callee.property === token.parent))
  ) {
    // Expression with known function type
    const callee = callExpression.callee
    const resolvedType = resolveType(getType(callee, document))
    if (resolvedType?.signature !== undefined) {
      return createMarkdownHover(
        stringifySignatureInfo(resolvedType.signature),
        resolvedType.signature.documentation,
      )
    }

    // Fallback: if type inference didn't resolve a signature, still provide hover
    // for well-known HubL globals/functions.
    const builtin = HUBL_PROGRAM_SYMBOLS[token.value]
    if (
      builtin !== null &&
      typeof builtin === "object" &&
      "signature" in builtin &&
      builtin.signature
    ) {
      return createMarkdownHover(
        stringifySignatureInfo(builtin.signature),
        builtin.signature.documentation,
      )
    }

    const [symbol, symbolDocument] = findSymbol(
      document,
      token,
      token.value,
      "Macro",
    )
    if (
      symbol !== undefined &&
      symbolDocument !== undefined &&
      symbol.node.openToken !== undefined &&
      symbol.node.closeToken !== undefined
    ) {
      const macroSource = symbolDocument.getText(
        lsp.Range.create(
          symbolDocument.positionAt(symbol.node.openToken.start),
          symbolDocument.positionAt(symbol.node.closeToken.end),
        ),
      )
      // Get the macro's type info which includes formatted documentation
      const macroType = resolveType(getType(token.parent, document))
      const parts: string[] = []
      parts.push("```hubl\n" + macroSource + "\n```")
      if (macroType?.signature?.documentation) {
        parts.push(macroType.signature.documentation)
      }
      return {
        contents: {
          kind: MarkupKind.Markdown,
          value: parts.join("\n\n"),
        },
      } satisfies lsp.Hover
    }
  }

  // Block
  if (
    token.parent instanceof ast.Identifier &&
    token.parent.parent instanceof ast.Block &&
    token.parent.parent.name === token.parent
  ) {
    const block = token.parent.parent
    const [blockSymbol, blockDocument] = findSymbol(
      document,
      block,
      block.name.value,
      "Block",
      { checkCurrent: false, importTypes: ["Extends"] },
    )
    const sourceBlock = blockSymbol?.node as ast.Block | undefined
    if (
      blockSymbol !== undefined &&
      blockDocument !== undefined &&
      sourceBlock?.openToken !== undefined &&
      sourceBlock?.closeToken !== undefined
    ) {
      const sourceText = blockDocument.getText(
        lsp.Range.create(
          blockDocument.positionAt(sourceBlock.openToken.start),
          blockDocument.positionAt(sourceBlock.closeToken.end),
        ),
      )
      return {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```hubl\n" + sourceText + "\n```",
        },
      } satisfies lsp.Hover
    }
  }

  if (token.parent instanceof ast.Identifier) {
    const identifier = token.parent
    const node =
      identifier.parent instanceof ast.MemberExpression &&
      identifier.parent.property === identifier
        ? identifier.parent
        : identifier
    const nodeType = getType(node, document)
    const resolvedType = resolveType(nodeType)

    if (nodeType !== undefined && resolvedType !== undefined) {
      let value: string
      if (resolvedType.signature !== undefined) {
        value = stringifySignatureInfo(resolvedType.signature)
      } else {
        value = identifier.value
        if (resolvedType?.name) {
          value += `: ${resolvedType.name}`
        }

        if (nodeType.literalValue !== undefined) {
          value += ` = ${nodeType.literalValue.length < HOVER_LITERAL_MAX_LENGTH ? nodeType.literalValue : "..."}`
        }
      }
      return createMarkdownHover(
        value,
        nodeType.documentation ?? resolvedType?.signature?.documentation,
      )
    }
  }
}
