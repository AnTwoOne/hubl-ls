import { ast } from "@hubl-ls/language"
import * as lsp from "vscode-languageserver"
import { MarkupKind } from "vscode-languageserver"
import { HOVER_LITERAL_MAX_LENGTH } from "./constants"
import { HUBL_PROGRAM_SYMBOLS, HUBL_TAG_TYPES } from "./hublBuiltins"
import { documentASTs, documents } from "./state"
import { findSymbol, resolveTypeReference } from "./symbols"
import { getType, resolveType, stringifySignatureInfo } from "./types"
import { parentOfType, tokenAt } from "./utilities"

/** Maximum depth for expanding typedef references in hover */
const MAX_TYPEDEF_EXPANSION_DEPTH = 5

/** Primitive types that should not be expanded */
const PRIMITIVE_TYPES = new Set([
  "string", "str", "number", "int", "integer", "float",
  "bool", "boolean", "any", "object", "dict", "list",
  "array", "tuple", "null", "undefined",
])

/**
 * Format a property line with optional nested typedef expansion for hover display.
 */
const formatPropertyLineForHover = (
  name: string,
  type: string,
  description: string | undefined,
  indent: number,
  uri: string,
  depth: number,
  expandedTypes: Set<string>,
): string => {
  const indentStr = "    ".repeat(indent)
  const desc = description ? ` — *${description}*` : ""
  let line = `${indentStr}- \`${name}\` \`${type}\`${desc}`

  // Check if type is a typedef reference that should be expanded
  if (
    depth < MAX_TYPEDEF_EXPANSION_DEPTH &&
    !PRIMITIVE_TYPES.has(type.toLowerCase()) &&
    !expandedTypes.has(type)
  ) {
    const typedef = resolveTypeReference(type, uri)
    if (typedef?.properties) {
      // Track this type to prevent infinite recursion
      const newExpandedTypes = new Set(expandedTypes)
      newExpandedTypes.add(type)

      // Expand the typedef's properties as nested items
      const nestedLines: string[] = []
      for (const [propName, propValue] of Object.entries(typedef.properties)) {
        // Skip methods (have signature)
        if (
          typeof propValue === "object" &&
          propValue !== null &&
          "signature" in propValue
        ) {
          continue
        }

        let propType = "Any"
        let propDesc: string | undefined
        if (typeof propValue === "string") {
          propType = propValue
        } else if (propValue && typeof propValue === "object") {
          const pv = propValue as unknown as Record<string, unknown>
          if ("type" in pv && typeof pv.type === "string" && pv.type.length > 0) {
            propType = pv.type
          } else if ("name" in pv && typeof pv.name === "string") {
            propType =
              "alias" in pv && typeof pv.alias === "string"
                ? pv.alias
                : pv.name
          }
          if ("documentation" in pv && typeof pv.documentation === "string") {
            propDesc = pv.documentation
          }
        }

        nestedLines.push(
          formatPropertyLineForHover(
            propName,
            propType,
            propDesc,
            indent + 1,
            uri,
            depth + 1,
            newExpandedTypes,
          ),
        )
      }
      if (nestedLines.length > 0) {
        line += "\n" + nestedLines.join("\n")
      }
    }
  }

  return line
}

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
        const propLines: string[] = []
        for (const [name, value] of Object.entries(typeInfo.properties)) {
          // Skip methods (have signature)
          if (
            typeof value === "object" &&
            value !== null &&
            "signature" in value
          ) {
            continue
          }

          let type = "Any"
          let desc: string | undefined
          if (typeof value === "string") {
            type = value
          } else if (value && typeof value === "object") {
            const valueObj = value as unknown as Record<string, unknown>
            if (
              "type" in valueObj &&
              typeof valueObj.type === "string" &&
              valueObj.type.length > 0
            ) {
              type = valueObj.type
            } else if ("name" in valueObj && typeof valueObj.name === "string") {
              type =
                "alias" in valueObj && typeof valueObj.alias === "string"
                  ? valueObj.alias
                  : valueObj.name
            }
            if (
              "documentation" in valueObj &&
              typeof valueObj.documentation === "string"
            ) {
              desc = valueObj.documentation
            }
          }

          // Use the recursive formatter for nested expansion
          propLines.push(
            formatPropertyLineForHover(name, type, desc, 0, uri, 0, new Set([word])),
          )
        }
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
