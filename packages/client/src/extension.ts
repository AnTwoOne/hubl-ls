import * as path from "path"
import { parse as parseTOML } from "toml"
import * as vscode from "vscode"
import { parse as parseYAML } from "yaml"

import * as lsp from "vscode-languageclient/node"

let client: lsp.LanguageClient
let clientBecameRunning = false

const output = vscode.window.createOutputChannel("Jinja Language Server", {
  log: true,
})

const log = (msg: string) => {
  // Timestamped logs for debugging activation hangs.
  output.info(msg)
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

// HubSpot CMS / HubL language ids (provided by HubSpot extensions).
// We attach to these ids in "companion mode" so we don't need to contribute languages/grammars.
const HUBL_LANGUAGE_IDS = [
  // Common variants seen in HubSpot tooling / community setups
  "hubl",
  "hubl-html",
  "hubl-css",
  "hubl-js",
  "hubl-json",
  "hubl-xml",
  "hubl-yaml",
  "hubl-md",

  // HubSpot extension language ids often use <host>-hubl (e.g. html-hubl)
  "html-hubl",
  "css-hubl",
  "js-hubl",
  "json-hubl",
  "xml-hubl",
  "yaml-hubl",
  "md-hubl",
]

const toFileSelector = (language: string) => ({ scheme: "file", language })

const SetGlobalsRequest = new lsp.RequestType<
  { globals: Record<string, unknown>; uri: string | undefined; merge: boolean },
  { success: boolean },
  void
>("jinja/setGlobals")

export const activate = async (context: vscode.ExtensionContext) => {
  log("activate(): start")

  // Optional log file for the language server process (separate Node process).
  // Only enabled in development to avoid writing into extension installation dirs.
  let serverLogFile: string | undefined
  if (context.extensionMode === vscode.ExtensionMode.Development) {
    const logDir = vscode.Uri.joinPath(context.extensionUri, ".vscode")
    await vscode.workspace.fs.createDirectory(logDir)
    serverLogFile = vscode.Uri.joinPath(logDir, "jinja-ls-server.log").fsPath

    // Ensure the server process inherits the env var even if fork options are ignored.
    process.env.JINJA_LS_LOG_FILE = serverLogFile
    log(`activate(): server log file = ${serverLogFile}`)
  }
  const htmlExtension = vscode.extensions.getExtension(
    "vscode.html-language-features",
  )

  if (htmlExtension) {
    log(
      `activate(): activating dependency vscode.html-language-features (isActive=${htmlExtension.isActive})`,
    )

    // In some environments (notably Extension Development Host), the built-in HTML extension
    // can hang during activation. We only need it as a nice-to-have for HTML-ish editor behavior,
    // so we keep it best-effort and never block our own activation.
    void (async () => {
      const timeoutMs = 2000
      const activated = await Promise.race([
        htmlExtension.activate().then(
          () => true,
          (err) => {
            log(
              `activate(): vscode.html-language-features.activate() failed (continuing): ${String(err)}`,
            )
            return false
          },
        ),
        sleep(timeoutMs).then(() => false),
      ])

      if (activated) {
        log(
          `activate(): vscode.html-language-features activated (isActive=${htmlExtension.isActive})`,
        )
      } else {
        log(
          `activate(): vscode.html-language-features.activate() did not resolve within ${timeoutMs}ms; continuing without waiting`,
        )
      }
    })()
  } else {
    log(
      "activate(): dependency vscode.html-language-features not found (continuing without it)",
    )
  }

  const serverModule = context.asAbsolutePath(path.join("dist", "server.js"))
  log(`activate(): resolved serverModule=${serverModule}`)

  const serverOptions: lsp.ServerOptions = {
    run: {
      module: serverModule,
      transport: lsp.TransportKind.ipc,
      options: serverLogFile
        ? {
            env: {
              ...process.env,
              JINJA_LS_LOG_FILE: serverLogFile,
            },
          }
        : undefined,
    },
    debug: {
      module: serverModule,
      transport: lsp.TransportKind.ipc,
      options: serverLogFile
        ? {
            env: {
              ...process.env,
              JINJA_LS_LOG_FILE: serverLogFile,
            },
          }
        : undefined,
    },
  }

  // Companion-mode support:
  // - Attach to HubSpot CMS / HubL language ids when they exist.
  // - Do not contribute languages/grammars ourselves (avoid conflicts with HubSpot extension).
  log(
    "activate(): fetching available languages via vscode.languages.getLanguages()",
  )
  const t2 = setTimeout(() => {
    log(
      "activate(): still waiting for vscode.languages.getLanguages() after 5000ms",
    )
  }, 5000)
  const availableLanguageIds = new Set(await vscode.languages.getLanguages())
  clearTimeout(t2)
  log(
    `activate(): vscode.languages.getLanguages() returned ${availableLanguageIds.size} ids`,
  )
  const hublSelectors = HUBL_LANGUAGE_IDS.filter((id) =>
    availableLanguageIds.has(id),
  )
  log(
    `activate(): hubspot selectors enabled = ${JSON.stringify(hublSelectors)}`,
  )

  const documentSelector: lsp.DocumentSelector =
    hublSelectors.map(toFileSelector)
  log(
    `activate(): documentSelector language count = ${documentSelector.length}`,
  )

  const clientOptions: lsp.LanguageClientOptions = {
    documentSelector,
    outputChannel: output,
    traceOutputChannel: output,
    revealOutputChannelOn: lsp.RevealOutputChannelOn.Error,
    errorHandler: {
      error: (error, message, count) => {
        log(
          `LanguageClient error (count=${count}) message=${String(message)} error=${String(error)}`,
        )
        return { action: lsp.ErrorAction.Continue }
      },
      closed: () => {
        // During development/debugging, auto-restarting can hide the root cause by
        // spamming attach/detach cycles. Prefer surfacing the first failure.
        log("LanguageClient closed")
        return { action: lsp.CloseAction.DoNotRestart }
      },
    },
  }

  client = new lsp.LanguageClient(
    "jinja-ls",
    "Jinja Language Server",
    serverOptions,
    clientOptions,
  )

  client.onDidChangeState((e) => {
    log(
      `LanguageClient state changed: ${
        lsp.State[e.oldState]
      } -> ${lsp.State[e.newState]}`,
    )

    if (e.newState === lsp.State.Running) {
      clientBecameRunning = true
    }
  })

  client.onRequest("jinja/readFile", async ({ uri }: { uri: string }) => {
    try {
      const document = await vscode.workspace.openTextDocument(
        vscode.Uri.parse(uri).fsPath,
      )
      return { contents: document.getText() }
    } catch {
      return {}
    }
  })

  client.onRequest(
    "jinja/listDirectories",
    async ({ uris }: { uris: string[] }) => {
      try {
        const result = []
        for (const uri of uris) {
          const parsed = vscode.Uri.parse(uri)
          try {
            const items = await vscode.workspace.fs.readDirectory(parsed)
            for (const [item, itemKind] of items) {
              result.push(
                itemKind === vscode.FileType.Directory ? item + "/" : item,
              )
            }
          } catch {
            // Ignored
          }
        }
        return result
      } catch {
        return []
      }
    },
  )

  log("activate(): starting LanguageClient")
  client.start()
  log("activate(): client.start() called")

  // vscode-languageclient types used here don't expose `onReady()`, so we track readiness
  // via state changes.
  setTimeout(() => {
    if (!clientBecameRunning) {
      log(
        "LanguageClient did not reach Running within 15000ms (likely server start/handshake failure)",
      )
    }
  }, 15000)

  context.subscriptions.push(
    vscode.commands.registerCommand("jinjaLS.restart", () => client.restart()),
    vscode.commands.registerCommand("jinjaLS.setGlobalsFromFile", () => {
      if (!vscode.window.activeTextEditor) {
        return
      }

      const documentUri = vscode.window.activeTextEditor.document.uri

      vscode.window
        .showOpenDialog({
          title: "Choose JSON/YAML/TOML to add globals from",
          canSelectMany: true,
        })
        .then(async (chosenUris) => {
          let globals: Record<string, unknown> = {}

          for (const uriToAdd of chosenUris) {
            const contents = (
              await vscode.workspace.fs.readFile(uriToAdd)
            ).toString()
            let extension = uriToAdd.fsPath.split(".").at(-1)!
            if (
              !(
                extension.endsWith("json") ||
                extension.endsWith("yaml") ||
                extension.endsWith("yml") ||
                extension.endsWith("toml")
              )
            ) {
              extension = await vscode.window.showQuickPick(
                ["json", "yaml", "toml"],
                {
                  title: `Select file type for ${uriToAdd.toString(true)}`,
                },
              )
            }
            let globalsToAdd = {}
            if (extension === "json") {
              globalsToAdd = JSON.parse(contents)
            } else if (extension === "yaml" || extension === "yml") {
              globalsToAdd = parseYAML(contents)
            } else if (extension === "toml") {
              globalsToAdd = parseTOML(contents)
            }
            if (Object.keys(globalsToAdd).length !== 0) {
              const key = await vscode.window.showQuickPick(
                Object.keys(globalsToAdd).sort(),
                {
                  title: `Optionally select a key from which to add globals for ${uriToAdd.toString(true)}`,
                },
              )
              if (key) {
                globalsToAdd = globalsToAdd[key]
              }
              globals = { ...globals, ...globalsToAdd }
            }
          }

          client.sendRequest(SetGlobalsRequest, {
            globals,
            uri: documentUri.toString(),
            merge: false,
          })
        })
    }),
    vscode.commands.registerCommand(
      "jinjaLS.setGlobals",
      (globals: Record<string, unknown>, uri?: string, merge = true) =>
        client.sendRequest(SetGlobalsRequest, { globals, uri, merge }),
    ),
  )

  log("activate(): completed")
}

export const deactivate = async () => {
  if (!client) {
    return
  }

  return client.stop()
}
