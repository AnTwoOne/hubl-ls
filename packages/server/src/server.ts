import { ast, parse, tokenize } from "@hubl-ls/language"
import * as fs from "fs"
import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import { createConnection } from "vscode-languageserver/node"
import { URI } from "vscode-uri"
import { getCodeAction } from "./codeAction"
import { getCompletion } from "./completion"
import { readFile, registerCustomCommands } from "./customRequests"
import { getDefinition } from "./definition"
import { getDiagnostics } from "./diagnostics"
import { getDocumentLinks } from "./documentLinks"
import { getDocumentFormatting, getDocumentRangeFormatting } from "./formatting"
import { getHover } from "./hover"
import { processLSCommand } from "./lsCommands"
import {
  fieldsToModuleTypeInfo,
  getFieldsJsonPath,
  isModuleTemplate,
  parseFieldsJson,
} from "./moduleFields"
import { getReferences } from "./references"
import { getSemanticTokens, legend } from "./semantic"
import { getSignatureHelp } from "./signatureHelp"
import {
  configuration,
  documentASTs,
  documentFieldsJsonContent,
  documentFieldsJsonMap,
  documentImports,
  documentModuleFields,
  documents,
  documentSymbols,
  documentTypedefLocations,
  documentTypedefs,
  rootURIs,
} from "./state"
import { collectSymbols, findImport, SymbolInfo } from "./symbols"
import { walk } from "./utilities"

// Best-effort file logging for server crashes.
// The client sets HUBL_LS_LOG_FILE via fork env in [`serverOptions`](packages/client/src/extension.ts:1).
const SERVER_LOG_FILE = process.env.HUBL_LS_LOG_FILE
const serverLog = (msg: string) => {
  if (!SERVER_LOG_FILE) {
    return
  }
  try {
    fs.appendFileSync(
      SERVER_LOG_FILE,
      `${new Date().toISOString()} ${msg}\n`,
      "utf8",
    )
  } catch {
    // Ignore logging failures.
  }
}

serverLog(
  `server start pid=${process.pid} node=${process.version} argv=${JSON.stringify(process.argv)}`,
)

process.on("uncaughtException", (err) => {
  serverLog(`uncaughtException: ${String((err as Error)?.stack ?? err)}`)
})

process.on("unhandledRejection", (reason) => {
  serverLog(`unhandledRejection: ${String(reason)}`)
})

const connection = createConnection(lsp.ProposedFeatures.all)
const lspDocuments = new lsp.TextDocuments(TextDocument)

const getDocumentAST = (contents: string) => {
  try {
    const [tokens, lexerErrors] = tokenize(contents, {}, true)
    const [program, tokenNodes, parserErrors] = parse(tokens, true)
    return { program, lexerErrors, parserErrors, tokens: tokenNodes }
  } catch (e) {
    console.log(e)
    serverLog(`getDocumentAST threw: ${String((e as Error)?.stack ?? e)}`)
  }
  return {}
}

export const protectOnThrow = <T>(fn: () => T) => {
  try {
    const result = fn()

    // If the handler is async, make sure we also catch promise rejections.
    if (
      result !== null &&
      result !== undefined &&
      typeof (result as unknown as { then?: unknown }).then === "function"
    ) {
      return (result as unknown as Promise<unknown>).catch((e) => {
        console.log(e)
        serverLog(
          `protectOnThrow async rejection: ${String((e as Error)?.stack ?? e)}`,
        )
        return undefined
      }) as T
    }

    return result
  } catch (e) {
    console.log(e)
    serverLog(`protectOnThrow caught: ${String((e as Error)?.stack ?? e)}`)
  }
}

connection.onInitialize((params) => {
  for (const folder of params.workspaceFolders ?? []) {
    rootURIs.push(URI.parse(folder.uri))
  }

  return {
    capabilities: {
      textDocumentSync: lsp.TextDocumentSyncKind.Incremental,
      semanticTokensProvider: {
        legend,
        documentSelector: [
          // HubL (HubSpot extension language ids)
          { scheme: "file", language: "hubl" },
          { scheme: "file", language: "hubl-html" },
          { scheme: "file", language: "hubl-css" },
          { scheme: "file", language: "hubl-js" },
          { scheme: "file", language: "hubl-json" },
          { scheme: "file", language: "hubl-xml" },
          { scheme: "file", language: "hubl-yaml" },
          { scheme: "file", language: "hubl-md" },

          // Alternative HubSpot ids: <host>-hubl (e.g. html-hubl)
          { scheme: "file", language: "html-hubl" },
          { scheme: "file", language: "css-hubl" },
          { scheme: "file", language: "js-hubl" },
          { scheme: "file", language: "json-hubl" },
          { scheme: "file", language: "xml-hubl" },
          { scheme: "file", language: "yaml-hubl" },
          { scheme: "file", language: "md-hubl" },
        ],
        full: true,
      },
      hoverProvider: true,
      definitionProvider: true,
      signatureHelpProvider: {
        triggerCharacters: ["(", ",", "="],
        retriggerCharacters: [")"],
      },
      completionProvider: {
        triggerCharacters: [".", " ", '"', "/"],
      },
      codeActionProvider: true,
      documentLinkProvider: {
        resolveProvider: false,
      },
      documentFormattingProvider: true,
      documentRangeFormattingProvider: true,
      referencesProvider: true,
    },
  } satisfies lsp.InitializeResult
})

const analyzeDocument = async (document: TextDocument) => {
  documents.set(document.uri, document)
  const ast = getDocumentAST(document.getText())
  const symbols = new Map<string, SymbolInfo[]>()
  const imports: (ast.Include | ast.Import | ast.FromImport | ast.Extends)[] =
    []
  const lsCommands: string[] = []
  const typedefs = new Map<string, import("./types").TypeInfo>()
  const typedefLocations = new Map<string, ast.Comment>()

  if (ast.program) {
    walk(ast.program, (statement) => {
      collectSymbols(
        statement,
        symbols,
        imports,
        lsCommands,
        typedefs,
        typedefLocations,
      )
    })

    // Update initial analysis before going async
    documentASTs.set(document.uri, ast)
    documentSymbols.set(document.uri, symbols)
    documentTypedefs.set(document.uri, typedefs)
    documentTypedefLocations.set(document.uri, typedefLocations)
    const previousImports = documentImports.get(document.uri) ?? []
    documentImports.set(
      document.uri,
      imports.map((i) => [
        i,
        (previousImports.find(
          (x) =>
            (x[0].source as ast.StringLiteral | undefined)?.value ===
            (i.source as ast.StringLiteral | undefined)?.value,
        ) ?? [])[1],
      ]),
    )
    // Load module fields from fields.json for module.html files
    try {
      const parsedUri = URI.parse(document.uri)
      const fsPath = parsedUri.fsPath
      if (isModuleTemplate(fsPath)) {
        const fieldsJsonPath = getFieldsJsonPath(fsPath)
        const fieldsJsonUri = URI.file(fieldsJsonPath).toString()
        try {
          const fieldsContent = await readFile(connection, fieldsJsonUri)
          if (fieldsContent) {
            const fields = parseFieldsJson(fieldsContent)
            if (fields && Array.isArray(fields)) {
              const moduleTypeInfo = fieldsToModuleTypeInfo(fields)
              documentModuleFields.set(document.uri, moduleTypeInfo)
              documentFieldsJsonMap.set(document.uri, fieldsJsonUri)
              // Store raw content for go-to-definition support
              documentFieldsJsonContent.set(document.uri, fieldsContent)
            }
          }
        } catch {
          documentModuleFields.delete(document.uri)
          documentFieldsJsonMap.delete(document.uri)
        }
      }
    } catch {
      // Ignore module fields errors
    }

    const documentsToAnalyze: [string, string][] = []
    const resolvedImports: [
      ast.Include | ast.Import | ast.FromImport | ast.Extends,
      string,
    ][] = []
    for (const i of imports) {
      const [uri, contents] = await findImport(i, document.uri, (uri) =>
        readFile(connection, uri),
      )
      documentsToAnalyze.push([uri, contents])
      resolvedImports.push([i, uri])
    }

    documentImports.set(document.uri, resolvedImports)

    const promises: Promise<void>[] = []
    for (const [uri, contents] of documentsToAnalyze) {
      if (contents !== documents.get(uri)?.getText()) {
        promises.push(
          analyzeDocument(
            TextDocument.create(
              uri,
              document.languageId,
              document.version,
              contents,
            ),
          ),
        )
      }
    }

    for (const command of lsCommands) {
      await processLSCommand(connection, document, command)
    }

    await Promise.all(promises)
    const diagnostics = protectOnThrow(() => getDiagnostics(document.uri).items)
    if (diagnostics !== undefined) {
      connection.sendDiagnostics({
        uri: document.uri,
        diagnostics,
      })
    }
  }
}

const loadConfiguration = async () => {
  const currentConfiguration = await connection.workspace.getConfiguration({
    section: "hublLS",
  })
  for (const key in currentConfiguration) {
    configuration[key] = currentConfiguration[key]
  }
  configuration.initialized = true
}

const handleDocument = async (document: TextDocument) => {
  if (!configuration.initialized) {
    await loadConfiguration()
  }
  analyzeDocument(document)
}

// Reload configuration when settings change
connection.onDidChangeConfiguration(async () => {
  await loadConfiguration()
  // Re-analyze all open documents with new configuration
  for (const document of documents.values()) {
    analyzeDocument(document)
  }
})

// Ensure we analyze documents on open as well as on change.
// (Some clients/tests open a document and immediately request hover/completions
// without making an edit; relying only on onDidChangeContent can be flaky.)
lspDocuments.onDidOpen((event) => {
  handleDocument(event.document)
})

lspDocuments.onDidChangeContent((event) => {
  handleDocument(event.document)
})

connection.languages.semanticTokens.on(async (params) =>
  protectOnThrow(() => getSemanticTokens(params.textDocument.uri)),
)

connection.onHover(async (params) =>
  protectOnThrow(() => getHover(params.textDocument.uri, params.position)),
)

connection.onDefinition(async (params) =>
  protectOnThrow(() => getDefinition(params.textDocument.uri, params.position)),
)

connection.onSignatureHelp(async (params) =>
  protectOnThrow(() =>
    getSignatureHelp(params.textDocument.uri, params.position),
  ),
)

connection.onCompletion(
  async (params) =>
    await protectOnThrow(() =>
      getCompletion(
        connection,
        params.textDocument.uri,
        params.position,
        params.context.triggerCharacter,
      ),
    ),
)

connection.onCodeAction(async (params) =>
  protectOnThrow(() =>
    getCodeAction(params.textDocument.uri, params.context.diagnostics),
  ),
)

connection.onDocumentLinks(async (params) =>
  protectOnThrow(() => getDocumentLinks(params.textDocument.uri)),
)

connection.onDocumentFormatting(async (params) =>
  protectOnThrow(() => getDocumentFormatting(params)),
)

connection.onDocumentRangeFormatting(async (params) =>
  protectOnThrow(() => getDocumentRangeFormatting(params)),
)

connection.onReferences(async (params) =>
  protectOnThrow(() =>
    getReferences(
      params.textDocument.uri,
      params.position,
      params.context.includeDeclaration,
    ),
  ),
)

registerCustomCommands(connection)
lspDocuments.listen(connection)
connection.listen()
