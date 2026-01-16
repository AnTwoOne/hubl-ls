import * as path from "path"
import * as vscode from "vscode"

export let doc: vscode.TextDocument
export let editor: vscode.TextEditor
export let documentEol: string
export let platformEol: string

/**
 * Activates the vscode.lsp-sample extension
 */
export async function activate(docUri: vscode.Uri) {
  // The extensionId is `publisher.name` from package.json
  const ext = vscode.extensions.getExtension("AnTwoOne.hubl-ls")!
  await ext.activate()
  try {
    doc = await vscode.workspace.openTextDocument(docUri)

    // Force HubSpot CMS language id so tests exercise the companion-mode path.
    // The HubSpot extension contributes these ids; we install it in the test runner.
    const desiredLanguageId = "html-hubl"

    // Ensure HubSpot extension is activated and its language ids are registered.
    const hubspotExt = vscode.extensions.getExtension("hubspot.hubl")
    if (hubspotExt && !hubspotExt.isActive) {
      try {
        await hubspotExt.activate()
      } catch {
        // Ignore activation failures.
      }
    }

    // `vscode.languages.getLanguages()` can be temporarily incomplete in e2e runs.
    // Prefer a retry loop around `setTextDocumentLanguage()`.
    for (let i = 0; i < 20; i++) {
      try {
        const next = await vscode.languages.setTextDocumentLanguage(
          doc,
          desiredLanguageId,
        )
        if (next.languageId === desiredLanguageId) {
          doc = next
          break
        }
      } catch {
        // Retry.
      }
      await sleep(250)
    }

    if (
      !vscode.window.visibleTextEditors.some(
        (editor) => editor.document === doc,
      )
    ) {
      editor = await vscode.window.showTextDocument(doc, { preview: false })
    }

    // Wait for the language server to process the document.
    // This avoids flaky tests where hover/completions run before the LSP responses are ready.
    // NOTE: HubL support adds more analysis work; keep this a bit generous.
    // Keep this generous: the extension host may need time to spin up the LSP.
    await sleep(8000)
  } catch (e) {
    console.error(e)
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const getDocPath = (p: string) => {
  return path.resolve(__dirname, "..", "..", "packages", "client", "fixture", p)
}

export const getDocUri = (p: string) => {
  return vscode.Uri.file(getDocPath(p))
}

export const rangeToJson = (range: vscode.Range) => {
  return [positionToJson(range.start), positionToJson(range.end)]
}

export const positionToJson = (position: vscode.Position) => {
  return { line: position.line, character: position.character }
}
