import { format } from "@hubl-ls/language"
import * as lsp from "vscode-languageserver"
import { documentASTs } from "./state"

export function getDocumentFormatting(
  params: lsp.DocumentFormattingParams,
): lsp.TextEdit[] | null {
  const astData = documentASTs.get(params.textDocument.uri)
  if (!astData?.program) {
    return null
  }

  try {
    // Use tab size from formatting options, defaulting to 2 spaces
    const indent = params.options.insertSpaces ? params.options.tabSize : "\t"

    const formatted = format(astData.program, indent)

    // Return a single text edit that replaces the entire document
    return [
      lsp.TextEdit.replace(
        lsp.Range.create(
          lsp.Position.create(0, 0),
          lsp.Position.create(Number.MAX_SAFE_INTEGER, 0),
        ),
        formatted,
      ),
    ]
  } catch {
    // If formatting fails, return null to indicate no changes
    return null
  }
}

export function getDocumentRangeFormatting(
  params: lsp.DocumentRangeFormattingParams,
): lsp.TextEdit[] | null {
  // For now, range formatting just formats the entire document
  // A proper implementation would parse/format only the selected range
  return getDocumentFormatting(params)
}
