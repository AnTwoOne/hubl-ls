import { expect } from "expect"
import * as vscode from "vscode"
import { activate, getDocUri } from "./helper"

suite("Should provide go to definition", () => {
  const libUri = getDocUri("lib.html")
  const importedMacroUri = getDocUri("imported-macro.html")

  test("Returns definitions for imported namespace macro calls", async () => {
    // `{{ lib.example() }}` should jump to the macro definition in lib.html
    expect(
      await getDefinition(importedMacroUri, new vscode.Position(2, 9)),
    ).toEqual({
      uri: libUri.toString(),
      range: { start: 9, end: 16 },
    })
  })
})

export const getDefinition = async (
  uri: vscode.Uri,
  position: vscode.Position,
) => {
  await activate(uri)
  const locations: (vscode.Location | vscode.LocationLink)[] =
    await vscode.commands.executeCommand(
      "vscode.executeDefinitionProvider",
      uri,
      position,
    )
  expect(locations.length).toEqual(1)
  const location = locations[0]
  if (location instanceof vscode.Location) {
    const document = await vscode.workspace.openTextDocument(location.uri)
    return {
      uri: location.uri.toString(),
      range: {
        start: document.offsetAt(location.range.start),
        end: document.offsetAt(location.range.end),
      },
    }
  } else {
    const document = await vscode.workspace.openTextDocument(location.targetUri)
    return {
      uri: location.targetUri.toString(),
      range: {
        start: document.offsetAt(location.targetRange.start),
        end: document.offsetAt(location.targetRange.end),
      },
    }
  }
}
