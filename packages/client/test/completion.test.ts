import { expect } from "expect"
import * as vscode from "vscode"
import { activate, getDocUri } from "./helper"

suite("Should provide completions", () => {
  const hublUri = getDocUri("hubl-completions.html")

  test("Returns HubL completions (tags, globals, filters)", async () => {
    // Tag-name completion while editing an unknown TagStatement name.
    // `{% modu %}` should suggest `{% module %}`.
    expect(
      await getCompletions(hublUri, new vscode.Position(0, 5), "mo"),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "module", kind: "Keyword" }),
      ]),
    )

    // Prefix completion for dnd_* tags.
    expect(
      await getCompletions(hublUri, new vscode.Position(1, 6), "dnd"),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "dnd_area", kind: "Keyword" }),
        expect.objectContaining({ label: "dnd_section", kind: "Keyword" }),
        expect.objectContaining({ label: "dnd_column", kind: "Keyword" }),
      ]),
    )

    // Global completion: `content` should be available.
    expect(
      await getCompletions(hublUri, new vscode.Position(3, 5), "con"),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "content", kind: "Variable" }),
      ]),
    )

    // Member completion: `content.id` is a known property.
    expect(await getCompletions(hublUri, new vscode.Position(4, 11))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "id", kind: "Property" }),
      ]),
    )

    // Filter completion: `escapejs` should be suggested.
    expect(
      await getCompletions(hublUri, new vscode.Position(5, 9), "esc"),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "escapejs", kind: "Function" }),
      ]),
    )
  })
})

export const getCompletions = async (
  uri: vscode.Uri,
  position: vscode.Position,
  startingWith: string = "",
) => {
  await activate(uri)
  const completions: vscode.CompletionList =
    await vscode.commands.executeCommand(
      "vscode.executeCompletionItemProvider",
      uri,
      position,
    )
  return completions.items
    .map((item) => JSON.parse(JSON.stringify(item)))
    .filter((item) =>
      (item.label?.label ?? item.label).startsWith(startingWith),
    )
}
