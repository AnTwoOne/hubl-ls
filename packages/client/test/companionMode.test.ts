import { expect } from "expect"
import * as vscode from "vscode"

import { activate, doc, getDocUri } from "./helper"

suite("Companion mode (HubSpot language ids)", () => {
  test("Provides LSP features when document language is html-hubl (if available)", async function () {
    const available = await vscode.languages.getLanguages()
    if (!available.includes("html-hubl")) {
      // The VS Code e2e harness does not install third-party extensions by default.
      // This test is intended to run in environments where the HubSpot extension is present.
      this.skip()
    }

    // Activate extension.
    const ext = vscode.extensions.getExtension("noamzaks.jinja-ls")!
    await ext.activate()

    const uri = getDocUri("hubl-valid.html")

    // Use the shared test harness so we consistently open the document under the
    // HubSpot language id and wait for the language server to process it.
    await activate(uri)
    expect(doc.languageId).toEqual("html-hubl")

    // Completion sanity: `content` should be a known global.
    const completions: vscode.CompletionList =
      await vscode.commands.executeCommand(
        "vscode.executeCompletionItemProvider",
        uri,
        new vscode.Position(2, 6),
      )
    const labels = completions.items.map((i) =>
      typeof i.label === "string" ? i.label : i.label.label,
    )
    expect(labels).toContain("content")
  })
})
